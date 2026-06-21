import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  try {
    const categories = db.prepare('SELECT id, name, slug FROM categories ORDER BY id ASC').all() as
      | { id: number; name: string; slug: string }[]
      | []
    res.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取分类列表失败' })
  }
})

export default router
