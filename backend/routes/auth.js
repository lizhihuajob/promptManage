const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const db = getDb();
  if (!db) {
    return res.status(500).json({ error: '数据库未初始化' });
  }

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
    if (err) {
      console.error('登录查询错误:', err);
      return res.status(500).json({ error: '数据库错误' });
    }

    if (!row) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    bcrypt.compare(password, row.password, (bcryptErr, isMatch) => {
      if (bcryptErr) {
        console.error('密码比对错误:', bcryptErr);
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      if (!isMatch) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      const token = jwt.sign(
        { id: row.id, username: row.username, role: row.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: row.id,
          username: row.username,
          role: row.role
        }
      });
    });
  });
});

router.put('/password', authenticateToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '旧密码和新密码不能为空' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度不能少于6位' });
  }

  const db = getDb();
  if (!db) {
    return res.status(500).json({ error: '数据库未初始化' });
  }

  db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }

    bcrypt.compare(oldPassword, row.password, (bcryptErr, isMatch) => {
      if (bcryptErr || !isMatch) {
        return res.status(400).json({ error: '旧密码错误' });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      db.run(
        `UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [hashedPassword, userId],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ error: '更新密码失败' });
          }
          res.json({ message: '密码修改成功' });
        }
      );
    });
  });
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    role: req.user.role
  });
});

module.exports = router;
