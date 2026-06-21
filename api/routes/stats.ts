import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/monthly-sales', authMiddleware, roleMiddleware('merchant', 'admin'), (req: Request, res: Response): void => {
  try {
    const raw = db
      .prepare(
        `SELECT
          strftime('%Y-%m', createdAt) as month,
          COUNT(*) as orderCount,
          COALESCE(SUM(totalAmount), 0) as revenue
         FROM orders
         WHERE createdAt >= datetime('now', '-6 months')
         GROUP BY strftime('%Y-%m', createdAt)
         ORDER BY month ASC`,
      )
      .all() as { month: string; orderCount: number; revenue: number }[]

    const months = raw.map((r) => r.month)
    const orderCounts = raw.map((r) => r.orderCount)
    const revenues = raw.map((r) => r.revenue)

    res.json({ success: true, data: { months, orderCounts, revenues } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取月度销量失败' })
  }
})

router.get('/inventory-alert', authMiddleware, roleMiddleware('merchant', 'admin'), (req: Request, res: Response): void => {
  try {
    const rawProducts = db
      .prepare(
        `SELECT p.*, c.name as categoryName
         FROM products p
         LEFT JOIN categories c ON p.categoryId = c.id
         WHERE p.stock <= p.lowStockThreshold
         ORDER BY p.stock ASC`,
      )
      .all() as Record<string, unknown>[]

    const items = rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      threshold: p.lowStockThreshold,
      categoryName: p.categoryName,
      price: p.price,
      brand: p.brand,
    }))

    res.json({ success: true, data: { lowStockCount: items.length, items, products: items } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取库存预警失败' })
  }
})

router.get('/order-overview', authMiddleware, roleMiddleware('merchant', 'admin'), (req: Request, res: Response): void => {
  try {
    const statusRows = db
      .prepare(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`)
      .all() as { status: string; count: number }[]

    const totalOrdersRow = db.prepare(`SELECT COUNT(*) as total FROM orders`).get() as { total: number }
    const totalRevenueRow = db
      .prepare(`SELECT COALESCE(SUM(totalAmount), 0) as total FROM orders WHERE status != 'cancelled'`)
      .get() as { total: number }
    const totalUsersRow = db.prepare(`SELECT COUNT(*) as total FROM users`).get() as { total: number }
    const lowStockRow = db
      .prepare(`SELECT COUNT(*) as total FROM products WHERE stock <= lowStockThreshold`)
      .get() as { total: number }
    const todayOrdersRow = db
      .prepare(`SELECT COUNT(*) as total FROM orders WHERE date(createdAt) = date('now')`)
      .get() as { total: number }
    const pendingOrdersRow = db
      .prepare(`SELECT COUNT(*) as total FROM orders WHERE status = 'pending'`)
      .get() as { total: number }

    res.json({
      success: true,
      data: {
        totalUsers: totalUsersRow.total,
        totalOrders: totalOrdersRow.total,
        totalRevenue: totalRevenueRow.total,
        lowStockCount: lowStockRow.total,
        statusDist: statusRows,
        todayOrders: todayOrdersRow.total,
        pendingOrders: pendingOrdersRow.total,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单概览失败' })
  }
})

export default router
