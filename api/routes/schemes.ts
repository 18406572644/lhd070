import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { name, switchId, keycapId, caseId, cableId } = req.body

    if (!name) {
      res.status(400).json({ success: false, error: '方案名称不能为空' })
      return
    }

    const result = db
      .prepare(
        `INSERT INTO schemes (name, userId, switchId, keycapId, caseId, cableId)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(name, req.user!.id, switchId || null, keycapId || null, caseId || null, cableId || null)

    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, name },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '保存方案失败' })
  }
})

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const schemes = db
      .prepare(
        `SELECT s.*, 
                sw.name as switchName, sw.price as switchPrice, sw.images as switchImage,
                kc.name as keycapName, kc.price as keycapPrice, kc.images as keycapImage,
                cs.name as caseName, cs.price as casePrice, cs.images as caseImage,
                cb.name as cableName, cb.price as cablePrice, cb.images as cableImage
         FROM schemes s
         LEFT JOIN products sw ON s.switchId = sw.id
         LEFT JOIN products kc ON s.keycapId = kc.id
         LEFT JOIN products cs ON s.caseId = cs.id
         LEFT JOIN products cb ON s.cableId = cb.id
         WHERE s.userId = ?
         ORDER BY s.createdAt DESC`,
      )
      .all(req.user!.id) as Record<string, unknown>[]

    res.json({ success: true, data: { schemes } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取方案列表失败' })
  }
})

router.get('/popular', (req: Request, res: Response): void => {
  try {
    const schemes = db
      .prepare(
        `SELECT s.*, u.username,
                sw.name as switchName, sw.price as switchPrice, sw.images as switchImage,
                kc.name as keycapName, kc.price as keycapPrice, kc.images as keycapImage,
                cs.name as caseName, cs.price as casePrice, cs.images as caseImage,
                cb.name as cableName, cb.price as cablePrice, cb.images as cableImage
         FROM schemes s
         JOIN users u ON s.userId = u.id
         LEFT JOIN products sw ON s.switchId = sw.id
         LEFT JOIN products kc ON s.keycapId = kc.id
         LEFT JOIN products cs ON s.caseId = cs.id
         LEFT JOIN products cb ON s.cableId = cb.id
         ORDER BY s.favoriteCount DESC
         LIMIT 20`,
      )
      .all() as Record<string, unknown>[]

    res.json({ success: true, data: { schemes } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取热门方案失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const scheme = db
      .prepare(
        `SELECT s.*, u.username,
                sw.name as switchName, sw.price as switchPrice, sw.images as switchImage, sw.brand as switchBrand,
                kc.name as keycapName, kc.price as keycapPrice, kc.images as keycapImage, kc.brand as keycapBrand,
                cs.name as caseName, cs.price as casePrice, cs.images as caseImage, cs.brand as caseBrand,
                cb.name as cableName, cb.price as cablePrice, cb.images as cableImage, cb.brand as cableBrand
         FROM schemes s
         JOIN users u ON s.userId = u.id
         LEFT JOIN products sw ON s.switchId = sw.id
         LEFT JOIN products kc ON s.keycapId = kc.id
         LEFT JOIN products cs ON s.caseId = cs.id
         LEFT JOIN products cb ON s.cableId = cb.id
         WHERE s.id = ?`,
      )
      .get(req.params.id) as Record<string, unknown> | undefined

    if (!scheme) {
      res.status(404).json({ success: false, error: '方案不存在' })
      return
    }

    res.json({ success: true, data: { scheme } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取方案详情失败' })
  }
})

router.post('/:id/favorite', authMiddleware, (req: Request, res: Response): void => {
  try {
    const scheme = db.prepare('SELECT id, favoriteCount FROM schemes WHERE id = ?').get(req.params.id) as
      | { id: number; favoriteCount: number }
      | undefined

    if (!scheme) {
      res.status(404).json({ success: false, error: '方案不存在' })
      return
    }

    const existing = db
      .prepare('SELECT id FROM favorites WHERE userId = ? AND schemeId = ?')
      .get(req.user!.id, req.params.id) as { id: number } | undefined

    if (existing) {
      db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id)
      db.prepare('UPDATE schemes SET favoriteCount = favoriteCount - 1 WHERE id = ?').run(req.params.id)
      res.json({ success: true, data: { favorited: false } })
    } else {
      db.prepare('INSERT INTO favorites (userId, schemeId) VALUES (?, ?)').run(req.user!.id, req.params.id)
      db.prepare('UPDATE schemes SET favoriteCount = favoriteCount + 1 WHERE id = ?').run(req.params.id)
      res.json({ success: true, data: { favorited: true } })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '收藏操作失败' })
  }
})

export default router
