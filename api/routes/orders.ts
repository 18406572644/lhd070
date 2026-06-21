import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

function generateOrderNo(): string {
  const now = new Date()
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `CC${ts}${rand}`
}

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { items, shippingInfo } = req.body

    if (!items || !items.length) {
      res.status(400).json({ success: false, error: '订单项不能为空' })
      return
    }

    const orderNo = generateOrderNo()
    let totalAmount = 0
    const orderItems: { productId: number; productName: string; price: number; quantity: number; type: string; schemeId: number | null }[] = []

    const checkAndDeduct = db.transaction(() => {
      for (const item of items) {
        const product = db.prepare('SELECT id, name, price, stock FROM products WHERE id = ?').get(item.productId) as
          | { id: number; name: string; price: number; stock: number }
          | undefined

        if (!product) throw new Error(`商品 ${item.productId} 不存在`)
        if (product.stock < (item.quantity || 1)) throw new Error(`商品 ${product.name} 库存不足`)

        db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity || 1, product.id)

        const price = product.price
        totalAmount += price * (item.quantity || 1)

        orderItems.push({
          productId: product.id,
          productName: product.name,
          price,
          quantity: item.quantity || 1,
          type: item.type || 'product',
          schemeId: item.schemeId || null,
        })
      }

      const orderResult = db
        .prepare(
          `INSERT INTO orders (orderNo, userId, totalAmount, status, shippingName, shippingPhone, shippingAddress)
           VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
        )
        .run(
          orderNo,
          req.user!.id,
          totalAmount,
          shippingInfo?.name || '',
          shippingInfo?.phone || '',
          shippingInfo?.address || '',
        )

      const orderId = orderResult.lastInsertRowid

      const insertItem = db.prepare(
        `INSERT INTO order_items (orderId, productId, productName, price, quantity, type, schemeId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )

      for (const oi of orderItems) {
        insertItem.run(orderId, oi.productId, oi.productName, oi.price, oi.quantity, oi.type, oi.schemeId)
      }

      db.prepare('DELETE FROM cart_items WHERE userId = ?').run(req.user!.id)

      return orderId
    })

    const orderId = checkAndDeduct()

    res.status(201).json({
      success: true,
      data: { id: orderId, orderNo, totalAmount },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : '创建订单失败'
    const status = msg.includes('库存不足') || msg.includes('不存在') ? 400 : 500
    res.status(status).json({ success: false, error: msg })
  }
})

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '20', status } = req.query
    const pageNum = Math.max(1, Number(page))
    const limit = Math.max(1, Math.min(100, Number(pageSize)))
    const offset = (pageNum - 1) * limit

    let whereSql = ''
    const params: unknown[] = []

    if (req.user!.role === 'admin') {
      // Admin sees all
    } else if (req.user!.role === 'merchant') {
      // Merchant sees all orders too (in this setup)
    } else {
      whereSql = ' WHERE o.userId = ?'
      params.push(req.user!.id)
    }

    if (status) {
      whereSql += whereSql ? ' AND' : ' WHERE'
      whereSql += ` o.status = ?`
      params.push(status)
    }

    const countSql = `SELECT COUNT(*) as total FROM orders o${whereSql}`
    const countRow = db.prepare(countSql).get(...params) as { total: number }
    const total = countRow.total

    let orders: Record<string, unknown>[]
    if (req.user!.role === 'admin' || req.user!.role === 'merchant') {
      orders = db
        .prepare(
          `SELECT o.*, u.username as customerName
           FROM orders o
           JOIN users u ON o.userId = u.id
           ${whereSql}
           ORDER BY o.createdAt DESC
           LIMIT ? OFFSET ?`,
        )
        .all(...params, limit, offset) as Record<string, unknown>[]
    } else {
      orders = db
        .prepare(
          `SELECT o.* FROM orders o
           ${whereSql}
           ORDER BY o.createdAt DESC
           LIMIT ? OFFSET ?`,
        )
        .all(...params, limit, offset) as Record<string, unknown>[]
    }

    const orderIds = orders.map((o) => o.id)
    let allItems: Record<string, unknown>[] = []
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',')
      allItems = db
        .prepare(
          `SELECT * FROM order_items WHERE orderId IN (${placeholders}) ORDER BY id ASC`,
        )
        .all(...orderIds) as Record<string, unknown>[]
    }

    const itemsByOrder: Record<string, Record<string, unknown>[]> = {}
    for (const item of allItems) {
      const oid = String(item.orderId)
      if (!itemsByOrder[oid]) itemsByOrder[oid] = []
      itemsByOrder[oid].push(item)
    }

    for (const o of orders) {
      const oid = String(o.id)
      o.items = itemsByOrder[oid] || []
      o.itemCount = (itemsByOrder[oid] || []).length
    }

    res.json({
      success: true,
      data: {
        orders,
        total,
        pagination: {
          page: pageNum,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单列表失败' })
  }
})

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as
      | Record<string, unknown>
      | undefined

    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    if (req.user!.role !== 'admin' && req.user!.role !== 'merchant' && (order.userId as number) !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权查看此订单' })
      return
    }

    const items = db
      .prepare('SELECT * FROM order_items WHERE orderId = ?')
      .all(req.params.id) as Record<string, unknown>[]

    const progress = db
      .prepare('SELECT * FROM order_progress WHERE orderId = ? ORDER BY createdAt ASC')
      .all(req.params.id) as Record<string, unknown>[]

    res.json({ success: true, data: { order, items, progress } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单详情失败' })
  }
})

router.put('/:id/status', authMiddleware, roleMiddleware('merchant', 'admin'), (req: Request, res: Response): void => {
  try {
    const { status } = req.body

    const validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: '无效的订单状态' })
      return
    }

    const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id) as
      | { id: number }
      | undefined

    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id)

    res.json({ success: true, data: { id: Number(req.params.id), status } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新订单状态失败' })
  }
})

router.post(
  '/:id/progress',
  authMiddleware,
  roleMiddleware('merchant', 'admin'),
  (req: Request, res: Response): void => {
    try {
      const { step, title, status, note, description } = req.body

      const progressStep = step || title || ''
      if (!progressStep) {
        res.status(400).json({ success: false, error: '进度标题不能为空' })
        return
      }

      const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id) as
        | { id: number }
        | undefined

      if (!order) {
        res.status(404).json({ success: false, error: '订单不存在' })
        return
      }

      const progressNote = note || description || ''

      const result = db
        .prepare('INSERT INTO order_progress (orderId, step, status, note) VALUES (?, ?, ?, ?)')
        .run(req.params.id, progressStep, status || 'pending', progressNote)

      res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
    } catch (error) {
      res.status(500).json({ success: false, error: '添加进度失败' })
    }
  },
)

export default router
