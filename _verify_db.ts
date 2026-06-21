import db from './api/database.js'

console.log('分类:', db.prepare('SELECT * FROM categories').all())
console.log('用户:', db.prepare('SELECT id,username,email,role FROM users').all())
console.log('商品数:', db.prepare('SELECT COUNT(*) as c FROM products').get())
console.log('商品:', db.prepare('SELECT id,name,categoryId,brand,price,stock FROM products').all())

process.exit(0)
