import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'cybercraft_secret'

function generateToken(user: { id: number; username: string; role: string }): string {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, role } = req.body

    if (!username || !email || !password) {
      res.status(400).json({ success: false, error: '用户名、邮箱和密码不能为空' })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email) as
      | { id: number }
      | undefined

    if (existing) {
      res.status(409).json({ success: false, error: '用户名或邮箱已存在' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const userRole = role && ['user', 'merchant'].includes(role) ? role : 'user'

    const result = db
      .prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)')
      .run(username, email, hashedPassword, userRole)

    const user = { id: result.lastInsertRowid as number, username, role: userRole }
    const token = generateToken(user)

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, username, email, role: userRole },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' })
      return
    }

    const user = db
      .prepare('SELECT id, username, email, password, role, banned FROM users WHERE username = ?')
      .get(username) as
      | { id: number; username: string; email: string; password: string; role: string; banned: number }
      | undefined

    if (!user) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    if (user.banned) {
      res.status(403).json({ success: false, error: '账号已被封禁' })
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role })

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = db
      .prepare('SELECT id, username, email, role, avatar, createdAt FROM users WHERE id = ?')
      .get(req.user!.id) as
      | { id: number; username: string; email: string; role: string; avatar: string; createdAt: string }
      | undefined

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    res.json({ success: true, data: { user } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

export default router
