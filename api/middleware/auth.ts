import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import db from '../database.js'

const JWT_SECRET = process.env.JWT_SECRET || 'cybercraft_secret'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        username: string
        role: string
      }
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }

  try {
    const token = header.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string }

    const user = db.prepare('SELECT id, username, role, banned FROM users WHERE id = ?').get(decoded.id) as
      | { id: number; username: string; role: string; banned: number }
      | undefined

    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在' })
      return
    }

    if (user.banned) {
      res.status(403).json({ success: false, error: '账号已被封禁' })
      return
    }

    req.user = { id: user.id, username: user.username, role: user.role }
    next()
  } catch {
    res.status(401).json({ success: false, error: '令牌无效或已过期' })
  }
}

export function roleMiddleware(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: '未认证' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: '权限不足' })
      return
    }
    next()
  }
}
