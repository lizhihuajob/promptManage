const jwt = require('jsonwebtoken');
const { sqliteDb } = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }
    
    sqliteDb.get(`SELECT * FROM users WHERE id = ?`, [user.id], (dbErr, row) => {
      if (dbErr || !row) {
        return res.status(403).json({ error: '用户不存在' });
      }
      req.user = row;
      next();
    });
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };
