import { Router, type Request, type Response } from 'express'
import multer, { type MulterError } from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { authMiddleware } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, '..', '..', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 jpg/jpeg/png/gif/webp 格式'))
    }
  },
})

const router = Router()

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  const handler = upload.single('file')
  handler(req, res, (err: unknown) => {
    if (err) {
      if ((err as MulterError).code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ success: false, error: '文件大小不能超过 5MB' })
        return
      }
      const message = (err as Error).message || '上传失败'
      res.status(400).json({ success: false, error: message })
      return
    }
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: '请上传文件' })
        return
      }
      const url = `/uploads/${req.file.filename}`
      res.status(201).json({ success: true, data: { url } })
    } catch (_error) {
      res.status(500).json({ success: false, error: '上传失败' })
    }
  })
})

export default router
