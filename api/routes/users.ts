import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const { page = '1', limit = '10' } = req.query
    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.max(1, Math.min(100, Number(limit)))
    const offset = (pageNum - 1) * limitNum

    const total = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count

    const users = db
      .prepare('SELECT id, username, email, role, avatar, banned, createdAt FROM users ORDER BY createdAt DESC LIMIT ? OFFSET ?')
      .all(limitNum, offset) as Record<string, unknown>[]

    res.json({
      success: true,
      data: {
        items: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户列表失败' })
  }
})

router.put('/:id/role', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const { role } = req.body

    const validRoles = ['user', 'merchant', 'admin']
    if (!validRoles.includes(role)) {
      res.status(400).json({ success: false, error: '无效的角色' })
      return
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id) as
      | { id: number }
      | undefined

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id)
    res.json({ success: true, data: { id: Number(req.params.id), role } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新角色失败' })
  }
})

router.put('/:id/ban', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const user = db.prepare('SELECT id, banned FROM users WHERE id = ?').get(req.params.id) as
      | { id: number; banned: number }
      | undefined

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    const newBanned = user.banned ? 0 : 1
    db.prepare('UPDATE users SET banned = ? WHERE id = ?').run(newBanned, req.params.id)
    res.json({ success: true, data: { id: Number(req.params.id), banned: !!newBanned } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新封禁状态失败' })
  }
})

export default router
