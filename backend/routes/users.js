const express = require('express');
const bcrypt = require('bcryptjs');
const { sqliteDb } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, (req, res) => {
  sqliteDb.all(
    `SELECT id, username, role, created_at, updated_at FROM users`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json(rows);
    }
  );
});

router.get('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  sqliteDb.get(
    `SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      if (!row) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json(row);
    }
  );
});

router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于6位' });
  }

  const userRole = role === 'admin' ? 'admin' : 'user';
  const hashedPassword = bcrypt.hashSync(password, 10);

  sqliteDb.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
    [username, hashedPassword, userRole],
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: '用户名已存在' });
        }
        return res.status(500).json({ error: '创建用户失败' });
      }
      res.status(201).json({
        id: this.lastID,
        username,
        role: userRole
      });
    }
  );
});

router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  if (id === '1' && req.user.id !== 1) {
    return res.status(403).json({ error: '无法修改主管理员账号' });
  }

  let updates = [];
  let values = [];

  if (username) {
    updates.push('username = ?');
    values.push(username);
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于6位' });
    }
    updates.push('password = ?');
    values.push(bcrypt.hashSync(password, 10));
  }

  if (role) {
    if (id === '1' && role !== 'admin') {
      return res.status(400).json({ error: '主管理员角色不能修改' });
    }
    updates.push('role = ?');
    values.push(role === 'admin' ? 'admin' : 'user');
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: '没有需要更新的字段' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  sqliteDb.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: '用户名已存在' });
        }
        return res.status(500).json({ error: '更新用户失败' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json({ message: '用户更新成功' });
    }
  );
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  if (id === '1') {
    return res.status(400).json({ error: '主管理员账号不能删除' });
  }

  sqliteDb.run(`DELETE FROM users WHERE id = ?`, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: '删除用户失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ message: '用户删除成功' });
  });
});

module.exports = router;
