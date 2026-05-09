const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const projectDataDir = path.join(__dirname, '../../data');
const tmpDataDir = '/tmp/prompt-manage-data';

let dbPath = null;
let sqliteDb = null;
let isInitialized = false;

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('数据目录已创建:', dir);
  }
};

const testSqliteLocation = (testPath) => {
  return new Promise((resolve) => {
    if (fs.existsSync(testPath)) {
      try {
        fs.unlinkSync(testPath);
      } catch (e) {}
    }

    const db = new sqlite3.Database(testPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        resolve(false);
        return;
      }

      db.run(`CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)`, (tableErr) => {
        if (tableErr) {
          db.close();
          resolve(false);
          return;
        }

        db.close((closeErr) => {
          if (closeErr) {
            resolve(false);
          } else {
            try {
              fs.unlinkSync(testPath);
            } catch (e) {}
            resolve(true);
          }
        });
      });
    });

    db.on('error', () => {
      resolve(false);
    });
  });
};

const findBestDbPath = async () => {
  const projectDbPath = path.join(projectDataDir, 'prompt.db');
  const tmpDbPath = path.join(tmpDataDir, 'prompt.db');

  console.log('检查数据库存储位置...');
  
  const projectWorks = await testSqliteLocation(projectDbPath);
  if (projectWorks) {
    console.log('项目目录可正常使用 SQLite');
    ensureDir(projectDataDir);
    return projectDbPath;
  }

  console.log('项目目录 SQLite 有问题，尝试使用 /tmp 目录...');
  ensureDir(tmpDataDir);
  return tmpDbPath;
};

const initializeSQLite = () => {
  return new Promise(async (resolve, reject) => {
    if (isInitialized) {
      console.log('SQLite 已初始化');
      resolve();
      return;
    }

    if (!dbPath) {
      dbPath = await findBestDbPath();
    }
    
    console.log('正在初始化 SQLite 数据库...');
    console.log('数据库路径:', dbPath);

    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      if (stats.size === 0) {
        console.log('删除空的数据库文件...');
        try {
          fs.unlinkSync(dbPath);
        } catch (e) {
          console.warn('无法删除空数据库文件:', e.message);
        }
      }
    }

    sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('SQLite 数据库连接失败:', err.message);
        reject(err);
        return;
      }
      console.log('SQLite 数据库连接成功');

      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (tableErr) => {
        if (tableErr) {
          console.error('创建用户表失败:', tableErr.message);
          reject(tableErr);
          return;
        }
        console.log('用户表已就绪');

        sqliteDb.get(`SELECT * FROM users WHERE username = ?`, ['admin'], (selectErr, row) => {
          if (selectErr) {
            console.error('检查管理员账号失败:', selectErr.message);
            reject(selectErr);
            return;
          }

          if (!row) {
            console.log('正在创建默认管理员账号...');
            const defaultAdminPassword = bcrypt.hashSync('admin123', 10);

            sqliteDb.run(
              `INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')`,
              ['admin', defaultAdminPassword],
              (insertErr) => {
                if (insertErr) {
                  console.error('创建默认管理员失败:', insertErr.message);
                  reject(insertErr);
                  return;
                }
                console.log('默认管理员账号已创建: admin / admin123');
                console.log('SQLite 数据库初始化完成');
                isInitialized = true;
                resolve();
              }
            );
          } else {
            console.log('管理员账号已存在');
            console.log('SQLite 数据库初始化完成');
            isInitialized = true;
            resolve();
          }
        });
      });
    });

    sqliteDb.on('error', (err) => {
      console.error('SQLite 错误:', err.message);
    });
  });
};

const connectMongoDB = async () => {
  try {
    console.log('正在连接 MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 连接成功');
  } catch (err) {
    console.error('MongoDB 连接失败:', err.message);
    process.exit(1);
  }
};

const getDb = () => sqliteDb;

module.exports = { 
  sqliteDb, 
  connectMongoDB, 
  mongoose,
  initializeSQLite,
  getDb
};
