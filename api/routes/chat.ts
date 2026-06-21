import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

function checkOrderAccess(userId: number, userRole: string, orderId: string | number): boolean {
  const order = db.prepare('SELECT userId FROM orders WHERE id = ?').get(orderId) as
    | { userId: number }
    | undefined
  if (!order) return false
  if (userRole === 'admin' || userRole === 'merchant') return true
  return order.userId === userId
}

function formatMessage(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    orderId: row.orderId,
    senderId: row.senderId,
    senderName: row.senderName,
    senderRole: row.senderRole,
    senderAvatar: row.senderAvatar,
    type: row.type,
    content: row.content,
    readBy: JSON.parse((row.readBy as string) || '[]'),
    createdAt: row.createdAt,
  }
}

router.get('/orders/:id/messages', authMiddleware, (req: Request, res: Response): void => {
  try {
    const orderId = req.params.id

    if (!checkOrderAccess(req.user!.id, req.user!.role, orderId)) {
      res.status(403).json({ success: false, error: '无权查看此订单消息' })
      return
    }

    const { before, limit = '50' } = req.query
    const limitNum = Math.max(1, Math.min(100, Number(limit)))

    let sql = `
      SELECT m.*, u.username AS senderName, u.role AS senderRole, u.avatar AS senderAvatar
      FROM order_messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.orderId = ?
    `
    const params: unknown[] = [orderId]

    if (before) {
      sql += ' AND m.id < ?'
      params.push(before)
    }

    sql += ' ORDER BY m.id DESC LIMIT ?'
    params.push(limitNum)

    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
    const messages = rows.map(formatMessage).reverse()

    res.json({ success: true, data: { messages } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取消息失败' })
  }
})

router.post('/orders/:id/messages', authMiddleware, (req: Request, res: Response): void => {
  try {
    const orderId = req.params.id
    const { type = 'text', content } = req.body

    if (!checkOrderAccess(req.user!.id, req.user!.role, orderId)) {
      res.status(403).json({ success: false, error: '无权在此订单发送消息' })
      return
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ success: false, error: '消息内容不能为空' })
      return
    }

    if (!['text', 'image'].includes(type)) {
      res.status(400).json({ success: false, error: '无效的消息类型' })
      return
    }

    const readBy = JSON.stringify([req.user!.id])

    const result = db
      .prepare(
        'INSERT INTO order_messages (orderId, senderId, type, content, readBy) VALUES (?, ?, ?, ?, ?)',
      )
      .run(orderId, req.user!.id, type, content.trim(), readBy)

    const row = db
      .prepare(
        `SELECT m.*, u.username AS senderName, u.role AS senderRole, u.avatar AS senderAvatar
         FROM order_messages m JOIN users u ON m.senderId = u.id WHERE m.id = ?`,
      )
      .get(result.lastInsertRowid) as Record<string, unknown>

    const message = formatMessage(row)

    res.status(201).json({ success: true, data: { message } })
  } catch (error) {
    res.status(500).json({ success: false, error: '发送消息失败' })
  }
})

router.post('/orders/:id/messages/read', authMiddleware, (req: Request, res: Response): void => {
  try {
    const orderId = req.params.id

    if (!checkOrderAccess(req.user!.id, req.user!.role, orderId)) {
      res.status(403).json({ success: false, error: '无权操作' })
      return
    }

    const userId = req.user!.id
    const rows = db
      .prepare('SELECT id, readBy FROM order_messages WHERE orderId = ? AND senderId != ?')
      .all(orderId, userId) as { id: number; readBy: string }[]

    const updateStmt = db.prepare('UPDATE order_messages SET readBy = ? WHERE id = ?')

    const updateAll = db.transaction(() => {
      for (const row of rows) {
        const readBy = JSON.parse(row.readBy || '[]') as number[]
        if (!readBy.includes(userId)) {
          readBy.push(userId)
          updateStmt.run(JSON.stringify(readBy), row.id)
        }
      }
    })

    updateAll()

    res.json({ success: true, data: { marked: rows.length } })
  } catch (error) {
    res.status(500).json({ success: false, error: '标记已读失败' })
  }
})

router.get('/messages/unread', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = req.user!.id
    const userRole = req.user!.role

    let sql: string
    const params: unknown[] = []

    if (userRole === 'user') {
      sql = `
        SELECT m.orderId, COUNT(*) as count
        FROM order_messages m
        JOIN orders o ON m.orderId = o.id
        WHERE o.userId = ? AND m.senderId != ?
      `
      params.push(userId, userId)
    } else {
      sql = `
        SELECT m.orderId, COUNT(*) as count
        FROM order_messages m
        WHERE m.senderId != ?
      `
      params.push(userId)
    }

    sql += ' GROUP BY m.orderId'

    const rows = db.prepare(sql).all(...params) as { orderId: number; count: number }[]

    const result: Record<number, number> = {}
    let total = 0
    for (const row of rows) {
      const messages = db
        .prepare('SELECT readBy FROM order_messages WHERE orderId = ? AND senderId != ?')
        .all(row.orderId, userId) as { readBy: string }[]

      let unread = 0
      for (const m of messages) {
        const readBy = JSON.parse(m.readBy || '[]') as number[]
        if (!readBy.includes(userId)) {
          unread++
        }
      }
      if (unread > 0) {
        result[row.orderId] = unread
        total += unread
      }
    }

    res.json({ success: true, data: { unread: result, total } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取未读消息失败' })
  }
})

export default router
