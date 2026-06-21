import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const items = db
      .prepare(
        `SELECT ci.id, ci.productId, ci.quantity, ci.type, ci.createdAt,
                p.name, p.price, p.images, p.brand, p.stock,
                c.name as categoryName
         FROM cart_items ci
         JOIN products p ON ci.productId = p.id
         LEFT JOIN categories c ON p.categoryId = c.id
         WHERE ci.userId = ?
         ORDER BY ci.createdAt DESC`,
      )
      .all(req.user!.id) as Record<string, unknown>[]

    res.json({ success: true, data: { items } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取购物车失败' })
  }
})

router.post('/items', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { productId, quantity = 1, type = 'product' } = req.body

    if (!productId) {
      res.status(400).json({ success: false, error: '商品ID不能为空' })
      return
    }

    const product = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(productId) as
      | { id: number; stock: number }
      | undefined

    if (!product) {
      res.status(404).json({ success: false, error: '商品不存在' })
      return
    }

    const existing = db
      .prepare('SELECT id, quantity FROM cart_items WHERE userId = ? AND productId = ? AND type = ?')
      .get(req.user!.id, productId, type) as { id: number; quantity: number } | undefined

    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id)
      res.json({ success: true, data: { id: existing.id } })
    } else {
      const result = db
        .prepare('INSERT INTO cart_items (userId, productId, quantity, type) VALUES (?, ?, ?, ?)')
        .run(req.user!.id, productId, quantity, type)

      res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '添加购物车失败' })
  }
})

router.put('/items/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { quantity } = req.body

    if (!quantity || quantity < 1) {
      res.status(400).json({ success: false, error: '数量必须大于0' })
      return
    }

    const item = db
      .prepare('SELECT id FROM cart_items WHERE id = ? AND userId = ?')
      .get(req.params.id, req.user!.id) as { id: number } | undefined

    if (!item) {
      res.status(404).json({ success: false, error: '购物车项不存在' })
      return
    }

    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.id)
    res.json({ success: true, data: { id: Number(req.params.id), quantity } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新购物车失败' })
  }
})

router.delete('/items/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const result = db.prepare('DELETE FROM cart_items WHERE id = ? AND userId = ?').run(req.params.id, req.user!.id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: '购物车项不存在' })
      return
    }

    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除购物车项失败' })
  }
})

router.delete('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    db.prepare('DELETE FROM cart_items WHERE userId = ?').run(req.user!.id)
    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '清空购物车失败' })
  }
})

export default router
