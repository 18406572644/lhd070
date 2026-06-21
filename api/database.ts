import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import bcryptjs from 'bcryptjs'

const dbPath = path.resolve(process.cwd(), 'data', 'cybercraft.db')
const dbDir = path.dirname(dbPath)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','merchant','admin')),
    avatar TEXT DEFAULT '',
    banned INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    categoryId INTEGER NOT NULL REFERENCES categories(id),
    brand TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    lowStockThreshold INTEGER NOT NULL DEFAULT 10,
    params TEXT DEFAULT '{}',
    images TEXT DEFAULT '[]',
    merchantId INTEGER REFERENCES users(id),
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id),
    productId INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    type TEXT NOT NULL DEFAULT 'product',
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS schemes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    userId INTEGER NOT NULL REFERENCES users(id),
    switchId INTEGER REFERENCES products(id),
    keycapId INTEGER REFERENCES products(id),
    caseId INTEGER REFERENCES products(id),
    cableId INTEGER REFERENCES products(id),
    favoriteCount INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id),
    schemeId INTEGER NOT NULL REFERENCES schemes(id),
    createdAt TEXT DEFAULT (datetime('now')),
    UNIQUE(userId, schemeId)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderNo TEXT NOT NULL UNIQUE,
    userId INTEGER NOT NULL REFERENCES users(id),
    totalAmount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','processing','completed','cancelled')),
    shippingName TEXT NOT NULL DEFAULT '',
    shippingPhone TEXT NOT NULL DEFAULT '',
    shippingAddress TEXT NOT NULL DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER NOT NULL REFERENCES orders(id),
    productId INTEGER REFERENCES products(id),
    productName TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    type TEXT NOT NULL DEFAULT 'product',
    schemeId INTEGER REFERENCES schemes(id)
  );

  CREATE TABLE IF NOT EXISTS order_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER NOT NULL REFERENCES orders(id),
    step TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    note TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_products_category ON products(categoryId);
  CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchantId);
  CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(userId);
  CREATE INDEX IF NOT EXISTS idx_schemes_user ON schemes(userId);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(userId);
  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(userId);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(orderId);
  CREATE INDEX IF NOT EXISTS idx_order_progress_order ON order_progress(orderId);
`)

const categoryCount = db.prepare('SELECT COUNT(*) AS count FROM categories').get() as { count: number }

if (categoryCount.count === 0) {
  const insertCategory = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)')

  const insertAll = db.transaction(() => {
    insertCategory.run('轴体', 'switch')
    insertCategory.run('键帽', 'keycap')
    insertCategory.run('外壳', 'case')
    insertCategory.run('线材', 'cable')
  })
  insertAll()
}

const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }

if (userCount.count === 0) {
  const insertUser = db.prepare(
    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
  )

  const adminHash = bcryptjs.hashSync('admin123', 10)
  const merchantHash = bcryptjs.hashSync('merchant123', 10)

  const insertAll = db.transaction(() => {
    insertUser.run('admin', 'admin@cybercraft.com', adminHash, 'admin')
    insertUser.run('merchant', 'merchant@cybercraft.com', merchantHash, 'merchant')
  })
  insertAll()
}

const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get() as { count: number }

if (productCount.count === 0) {
  const insertProduct = db.prepare(
    `INSERT INTO products (name, categoryId, brand, price, stock, lowStockThreshold, params, images, merchantId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const products = [
    {
      name: 'Cherry MX Red 线性轴体',
      categoryId: 1,
      brand: 'Cherry',
      price: 5.5,
      stock: 500,
      lowStockThreshold: 50,
      params: JSON.stringify({ type: '线性', 压力: '45g', 触发行程: '2mm', 总行程: '4mm', 轴心颜色: '红色', 润滑建议: '出厂润滑' }),
      images: JSON.stringify(['/uploads/products/cherry-mx-red-1.jpg', '/uploads/products/cherry-mx-red-2.jpg']),
      merchantId: 2,
    },
    {
      name: 'Gateron 黄轴 V2',
      categoryId: 1,
      brand: 'Gateron',
      price: 3.8,
      stock: 800,
      lowStockThreshold: 80,
      params: JSON.stringify({ type: '线性', 压力: '50g', 触发行程: '2mm', 总行程: '4mm', 轴心颜色: '黄色', 润滑建议: '建议自行润滑' }),
      images: JSON.stringify(['/uploads/products/gateron-yellow-1.jpg', '/uploads/products/gateron-yellow-2.jpg']),
      merchantId: 2,
    },
    {
      name: 'TTC 金粉轴 V2',
      categoryId: 1,
      brand: 'TTC',
      price: 4.2,
      stock: 300,
      lowStockThreshold: 30,
      params: JSON.stringify({ type: '线性', 压力: '37g', 触发行程: '2mm', 总行程: '3.5mm', 轴心颜色: '金色', 润滑建议: '出厂润滑', 早期导通: '是' }),
      images: JSON.stringify(['/uploads/products/ttc-gold-dust-1.jpg']),
      merchantId: 2,
    },
    {
      name: 'PBT 双月键帽 135键',
      categoryId: 2,
      brand: 'AKKO',
      price: 189,
      stock: 120,
      lowStockThreshold: 15,
      params: JSON.stringify({ 材质: 'PBT', 配列: '135键', 高度: 'OEM', 工艺: '双色注塑', 主题: '双月', 透光: '否' }),
      images: JSON.stringify(['/uploads/products/akko-dual-moon-1.jpg', '/uploads/products/akko-dual-moon-2.jpg']),
      merchantId: 2,
    },
    {
      name: '复古打字机键帽 131键',
      categoryId: 2,
      brand: 'Novelkeys',
      price: 259,
      stock: 60,
      lowStockThreshold: 10,
      params: JSON.stringify({ 材质: 'PBT', 配列: '131键', 高度: 'SA', 工艺: '热升华', 主题: '复古打字机', 透光: '否' }),
      images: JSON.stringify(['/uploads/products/novelkeys-typewriter-1.jpg', '/uploads/products/novelkeys-typewriter-2.jpg']),
      merchantId: 2,
    },
    {
      name: '赛博浅青主题键帽 142键',
      categoryId: 2,
      brand: 'CyberCraft',
      price: 299,
      stock: 40,
      lowStockThreshold: 8,
      params: JSON.stringify({ 材质: 'PBT', 配列: '142键', 高度: 'Cherry', 工艺: '热升华', 主题: '赛博浅青', 透光: '否', 兼容: '全配列' }),
      images: JSON.stringify(['/uploads/products/cybercraft-cyan-1.jpg', '/uploads/products/cybercraft-cyan-2.jpg']),
      merchantId: 2,
    },
    {
      name: '铝合金 CNC 外壳 65%',
      categoryId: 3,
      brand: 'KBDfans',
      price: 599,
      stock: 35,
      lowStockThreshold: 5,
      params: JSON.stringify({ 材质: '铝合金', 工艺: 'CNC', 配列: '65%', 颜色: '深空灰', 重量: '680g', 表面处理: '阳极氧化', 安装方式: 'Gasket' }),
      images: JSON.stringify(['/uploads/products/kbdfans-alu-65-1.jpg', '/uploads/products/kbdfans-alu-65-2.jpg']),
      merchantId: 2,
    },
    {
      name: '亚克力透明外壳 60%',
      categoryId: 3,
      brand: 'KBDfans',
      price: 269,
      stock: 55,
      lowStockThreshold: 10,
      params: JSON.stringify({ 材质: '亚克力', 工艺: '激光切割', 配列: '60%', 颜色: '透明', 重量: '320g', 表面处理: '抛光', 安装方式: 'Gasket' }),
      images: JSON.stringify(['/uploads/products/kbdfans-acrylic-60-1.jpg']),
      merchantId: 2,
    },
    {
      name: 'PC材质雾透外壳 75%',
      categoryId: 3,
      brand: 'Feker',
      price: 349,
      stock: 25,
      lowStockThreshold: 5,
      params: JSON.stringify({ 材质: 'PC', 工艺: '注塑', 配列: '75%', 颜色: '雾透', 重量: '450g', 表面处理: '磨砂', 安装方式: 'Top-mount' }),
      images: JSON.stringify(['/uploads/products/feker-pc-75-1.jpg', '/uploads/products/feker-pc-75-2.jpg']),
      merchantId: 2,
    },
    {
      name: 'USB-C 编织线材 1.5m',
      categoryId: 4,
      brand: '鲜外',
      price: 89,
      stock: 200,
      lowStockThreshold: 20,
      params: JSON.stringify({ 接口: 'USB-C to USB-C', 长度: '1.5m', 材质: '编织', 颜色: '浅青', 线芯: '镀银铜线', 支持协议: 'USB 3.1' }),
      images: JSON.stringify(['/uploads/products/xianwai-usbc-braided-1.jpg']),
      merchantId: 2,
    },
    {
      name: '航空插头线材 USB-C',
      categoryId: 4,
      brand: '鲜外',
      price: 139,
      stock: 150,
      lowStockThreshold: 15,
      params: JSON.stringify({ 接口: 'USB-C to 航空插头', 长度: '1.2m', 材质: 'PVC', 颜色: '银灰', 线芯: '无氧铜', 航空插头规格: 'GX12 4芯', 可拆卸: '是' }),
      images: JSON.stringify(['/uploads/products/xianwai-aviation-1.jpg', '/uploads/products/xianwai-aviation-2.jpg']),
      merchantId: 2,
    },
  ]

  const insertAll = db.transaction(() => {
    for (const p of products) {
      insertProduct.run(
        p.name,
        p.categoryId,
        p.brand,
        p.price,
        p.stock,
        p.lowStockThreshold,
        p.params,
        p.images,
        p.merchantId,
      )
    }
  })
  insertAll()
}

export default db
