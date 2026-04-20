const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const mongoose = require('mongoose');

const dbPath = path.join(__dirname, '../../data/prompt.db');

const sqliteDb = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('SQLite 数据库连接失败:', err.message);
  } else {
    console.log('SQLite 数据库连接成功');
  }
});

sqliteDb.serialize(() => {
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const bcrypt = require('bcryptjs');
  const defaultAdminPassword = bcrypt.hashSync('admin123', 10);
  
  sqliteDb.get(`SELECT * FROM users WHERE username = 'admin'`, (err, row) => {
    if (!row) {
      sqliteDb.run(
        `INSERT INTO users (username, password, role) VALUES ('admin', ?, 'admin')`,
        [defaultAdminPassword],
        (err) => {
          if (err) {
            console.error('创建默认管理员失败:', err.message);
          } else {
            console.log('默认管理员账号已创建: admin / admin123');
          }
        }
      );
    }
  });
});

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 连接成功');
  } catch (err) {
    console.error('MongoDB 连接失败:', err.message);
    process.exit(1);
  }
};

module.exports = { sqliteDb, connectMongoDB, mongoose };
