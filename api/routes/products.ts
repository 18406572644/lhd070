import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { category, brand, minPrice, maxPrice, sort, page = '1', limit = '10' } = req.query

    let sql = `
      SELECT p.*, c.name as categoryName
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (category) {
      sql += ' AND c.slug = ?'
      params.push(category)
    }
    if (brand) {
      const brandList = String(brand).split(',').filter((b) => b.trim())
      if (brandList.length > 0) {
        const placeholders = brandList.map(() => '?').join(', ')
        sql += ` AND p.brand IN (${placeholders})`
        brandList.forEach((b) => params.push(b.trim()))
      }
    }
    if (minPrice) {
      sql += ' AND p.price >= ?'
      params.push(Number(minPrice))
    }
    if (maxPrice) {
      sql += ' AND p.price <= ?'
      params.push(Number(maxPrice))
    }

    const sortMap: Record<string, string> = {
      'price-asc': 'p.price ASC',
      'price-desc': 'p.price DESC',
      'newest': 'p.createdAt DESC',
      'name': 'p.name ASC',
    }
    const orderBy = sortMap[sort as string] || 'p.createdAt DESC'
    sql += ` ORDER BY ${orderBy}`

    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.max(1, Math.min(100, Number(limit)))
    const offset = (pageNum - 1) * limitNum

    const countSql = sql.replace(/SELECT p\.\*, c\.name as categoryName/, 'SELECT COUNT(*) as total')
    const countRow = db.prepare(countSql).get(...params) as { total: number }
    const total = countRow.total

    sql += ' LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const products = db.prepare(sql).all(...params) as Record<string, unknown>[]

    res.json({
      success: true,
      data: {
        items: products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取配件列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const product = db
      .prepare(
        `SELECT p.*, c.name as categoryName, c.slug as categorySlug
         FROM products p
         LEFT JOIN categories c ON p.categoryId = c.id
         WHERE p.id = ?`,
      )
      .get(req.params.id) as Record<string, unknown> | undefined

    if (!product) {
      res.status(404).json({ success: false, error: '配件不存在' })
      return
    }

    res.json({ success: true, data: { product } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取配件详情失败' })
  }
})

router.post('/', authMiddleware, roleMiddleware('merchant', 'admin'), (req: Request, res: Response): void => {
  try {
    const { name, categoryId, brand, price, stock, lowStockThreshold, params: productParams, images } = req.body

    if (!name || !categoryId || price === undefined) {
      res.status(400).json({ success: false, error: '名称、分类和价格不能为空' })
      return
    }

    const result = db
      .prepare(
        `INSERT INTO products (name, categoryId, brand, price, stock, lowStockThreshold, params, images, merchantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        name,
        categoryId,
        brand || '',
        price,
        stock || 0,
        lowStockThreshold || 10,
        productParams ? JSON.stringify(productParams) : '{}',
        images ? JSON.stringify(images) : '[]',
        req.user!.id,
      )

    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, name, categoryId, brand, price },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建配件失败' })
  }
})

router.put('/:id', authMiddleware, roleMiddleware('merchant', 'admin'), (req: Request, res: Response): void => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as
      | Record<string, unknown>
      | undefined

    if (!product) {
      res.status(404).json({ success: false, error: '配件不存在' })
      return
    }

    const { name, categoryId, brand, price, stock, lowStockThreshold, params: productParams, images } = req.body

    db.prepare(
      `UPDATE products SET
        name = COALESCE(?, name),
        categoryId = COALESCE(?, categoryId),
        brand = COALESCE(?, brand),
        price = COALESCE(?, price),
        stock = COALESCE(?, stock),
        lowStockThreshold = COALESCE(?, lowStockThreshold),
        params = COALESCE(?, params),
        images = COALESCE(?, images)
       WHERE id = ?`,
    ).run(
      name ?? null,
      categoryId ?? null,
      brand ?? null,
      price ?? null,
      stock ?? null,
      lowStockThreshold ?? null,
      productParams ? JSON.stringify(productParams) : null,
      images ? JSON.stringify(images) : null,
      req.params.id,
    )

    res.json({ success: true, data: { id: Number(req.params.id) } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新配件失败' })
  }
})

router.delete('/:id', authMiddleware, roleMiddleware('merchant', 'admin'), (req: Request, res: Response): void => {
  try {
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: '配件不存在' })
      return
    }

    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除配件失败' })
  }
})

export default router
