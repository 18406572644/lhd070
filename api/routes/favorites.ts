import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const rows = db
      .prepare('SELECT schemeId FROM favorites WHERE userId = ?')
      .all(req.user!.id) as { schemeId: number }[]
    const ids = rows.map((r) => r.schemeId)
    res.json({ success: true, data: ids })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取收藏列表失败' })
  }
})

router.delete('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db
      .prepare('SELECT id FROM favorites WHERE userId = ? AND schemeId = ?')
      .get(req.user!.id, req.params.id) as { id: number } | undefined

    if (existing) {
      db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id)
      db.prepare('UPDATE schemes SET favoriteCount = favoriteCount - 1 WHERE id = ?').run(req.params.id)
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '取消收藏失败' })
  }
})

export default router
