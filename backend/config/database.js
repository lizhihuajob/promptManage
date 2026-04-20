const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'prompt.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('数据目录已创建:', dataDir);
}

let sqliteDb = null;

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('SQLite 数据库连接失败:', err.message);
        reject(err);
        return;
      }
      console.log('SQLite 数据库连接成功:', dbPath);
      resolve(sqliteDb);
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('创建用户表失败:', err.message);
        reject(err);
        return;
      }
      console.log('用户表已就绪');
      resolve();
    });
  });
};

const createDefaultAdmin = () => {
  return new Promise((resolve, reject) => {
    sqliteDb.get(`SELECT * FROM users WHERE username = 'admin'`, (err, row) => {
      if (err) {
        console.error('检查管理员账号失败:', err.message);
        reject(err);
        return;
      }

      if (!row) {
        const defaultAdminPassword = bcrypt.hashSync('admin123', 10);
        sqliteDb.run(
          `INSERT INTO users (username, password, role) VALUES ('admin', ?, 'admin')`,
          [defaultAdminPassword],
          (insertErr) => {
            if (insertErr) {
              console.error('创建默认管理员失败:', insertErr.message);
              reject(insertErr);
              return;
            }
            console.log('默认管理员账号已创建: admin / admin123');
            resolve();
          }
        );
      } else {
        console.log('管理员账号已存在');
        resolve();
      }
    });
  });
};

const initializeSQLite = async () => {
  try {
    await initDatabase();
    await createTables();
    await createDefaultAdmin();
    console.log('SQLite 数据库初始化完成');
  } catch (err) {
    console.error('SQLite 初始化失败:', err.message);
    throw err;
  }
};

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 连接成功');
  } catch (err) {
    console.error('MongoDB 连接失败:', err.message);
    process.exit(1);
  }
};

module.exports = { 
  sqliteDb, 
  connectMongoDB, 
  mongoose,
  initializeSQLite,
  getDb: () => sqliteDb
};
