import { Router, type Request, type Response } from 'express'
import * as XLSX from 'xlsx'
import db from '../database.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

const statusLabel: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
}

const roleLabel: Record<string, string> = {
  admin: '管理员',
  merchant: '商家',
  user: '普通用户',
}

function sendWorkbook(
  res: Response,
  data: Record<string, unknown>[],
  headers: string[],
  filename: string,
  format: string,
): void {
  const wsData = [headers, ...data.map((row) => headers.map((h) => row[h]))]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(ws)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`)
    res.send('\uFEFF' + csv)
  } else {
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`)
    res.send(buf)
  }
}

function getFilename(base: string): string {
  const now = new Date()
  const ts =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0')
  return `${base}_${ts}`
}

router.get(
  '/orders',
  authMiddleware,
  roleMiddleware('merchant', 'admin'),
  (req: Request, res: Response): void => {
    try {
      const { status, startDate, endDate, format = 'xlsx' } = req.query

      let whereSql = ''
      const params: unknown[] = []

      if (status) {
        whereSql += ' WHERE o.status = ?'
        params.push(status)
      }
      if (startDate) {
        whereSql += whereSql ? ' AND' : ' WHERE'
        whereSql += ` date(o.createdAt) >= date(?)`
        params.push(startDate)
      }
      if (endDate) {
        whereSql += whereSql ? ' AND' : ' WHERE'
        whereSql += ` date(o.createdAt) <= date(?)`
        params.push(endDate)
      }

      const rawOrders = db
        .prepare(
          `SELECT o.*, u.username as customerName, u.email as customerEmail
           FROM orders o
           JOIN users u ON o.userId = u.id
           ${whereSql}
           ORDER BY o.createdAt DESC`,
        )
        .all(...params) as Record<string, unknown>[]

      const orderIds = rawOrders.map((o) => o.id as number)
      let orderItemsMap: Record<number, Record<string, unknown>[]> = {}
      if (orderIds.length > 0) {
        const placeholders = orderIds.map(() => '?').join(', ')
        const items = db
          .prepare(
            `SELECT * FROM order_items WHERE orderId IN (${placeholders})`,
          )
          .all(...orderIds) as Record<string, unknown>[]
        orderItemsMap = {}
        for (const item of items) {
          const oid = item.orderId as number
          if (!orderItemsMap[oid]) orderItemsMap[oid] = []
          orderItemsMap[oid].push(item)
        }
      }

      const exportData: Record<string, unknown>[] = []
      for (const o of rawOrders) {
        const items = orderItemsMap[o.id as number] || []
        const itemNames = items.map((i) => i.productName).join('、')
        const itemQuantities = items.map((i) => `${i.productName}x${i.quantity}`).join('、')
        exportData.push({
          订单号: o.orderNo,
          客户: o.customerName,
          客户邮箱: o.customerEmail,
          商品明细: itemQuantities,
          商品数量: items.reduce((sum, i) => sum + (i.quantity as number), 0),
          总金额: o.totalAmount,
          状态: statusLabel[o.status as string] || o.status,
          收货人: o.shippingName,
          联系电话: o.shippingPhone,
          收货地址: o.shippingAddress,
          创建时间: o.createdAt,
          更新时间: o.updatedAt,
        })
      }

      const headers = [
        '订单号',
        '客户',
        '客户邮箱',
        '商品明细',
        '商品数量',
        '总金额',
        '状态',
        '收货人',
        '联系电话',
        '收货地址',
        '创建时间',
        '更新时间',
      ]

      sendWorkbook(res, exportData, headers, getFilename('orders'), format as string)
    } catch (error) {
      res.status(500).json({ success: false, error: '导出订单失败' })
    }
  },
)

router.get(
  '/users',
  authMiddleware,
  roleMiddleware('admin'),
  (req: Request, res: Response): void => {
    try {
      const { role, banned, format = 'xlsx' } = req.query

      let whereSql = ''
      const params: unknown[] = []

      if (role) {
        whereSql += ' WHERE role = ?'
        params.push(role)
      }
      if (banned !== undefined && banned !== '') {
        whereSql += whereSql ? ' AND' : ' WHERE'
        whereSql += ` banned = ?`
        params.push(banned === 'true' || banned === '1' ? 1 : 0)
      }

      const rawUsers = db
        .prepare(
          `SELECT id, username, email, role, banned, createdAt FROM users
           ${whereSql}
           ORDER BY createdAt DESC`,
        )
        .all(...params) as Record<string, unknown>[]

      const exportData: Record<string, unknown>[] = rawUsers.map((u) => ({
        ID: u.id,
        用户名: u.username,
        邮箱: u.email,
        角色: roleLabel[u.role as string] || u.role,
        状态: u.banned ? '已封禁' : '正常',
        注册时间: u.createdAt,
      }))

      const headers = ['ID', '用户名', '邮箱', '角色', '状态', '注册时间']
      sendWorkbook(res, exportData, headers, getFilename('users'), format as string)
    } catch (error) {
      res.status(500).json({ success: false, error: '导出用户失败' })
    }
  },
)

router.get(
  '/inventory',
  authMiddleware,
  roleMiddleware('merchant', 'admin'),
  (req: Request, res: Response): void => {
    try {
      const { lowStock, category, format = 'xlsx' } = req.query

      let whereSql = ''
      const params: unknown[] = []

      if (lowStock === 'true' || lowStock === '1') {
        whereSql += ' WHERE p.stock <= p.lowStockThreshold'
      }
      if (category) {
        whereSql += whereSql ? ' AND' : ' WHERE'
        whereSql += ` c.slug = ?`
        params.push(category)
      }

      const rawProducts = db
        .prepare(
          `SELECT p.*, c.name as categoryName
           FROM products p
           LEFT JOIN categories c ON p.categoryId = c.id
           ${whereSql}
           ORDER BY p.stock ASC`,
        )
        .all(...params) as Record<string, unknown>[]

      function stockLabel(stock: number, threshold: number): string {
        if (stock === 0) return '缺货'
        if (stock <= threshold) return '库存不足'
        return '正常'
      }

      const exportData: Record<string, unknown>[] = rawProducts.map((p) => ({
        ID: p.id,
        商品名称: p.name,
        分类: p.categoryName || '',
        品牌: p.brand || '',
        价格: p.price,
        当前库存: p.stock,
        预警阈值: p.lowStockThreshold,
        库存状态: stockLabel(p.stock as number, p.lowStockThreshold as number),
      }))

      const headers = ['ID', '商品名称', '分类', '品牌', '价格', '当前库存', '预警阈值', '库存状态']
      sendWorkbook(res, exportData, headers, getFilename('inventory'), format as string)
    } catch (error) {
      res.status(500).json({ success: false, error: '导出库存失败' })
    }
  },
)

export default router
