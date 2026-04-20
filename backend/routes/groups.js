const express = require('express');
const Group = require('../models/Group');
const Prompt = require('../models/Prompt');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: '获取分组列表失败' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: '分组不存在' });
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: '获取分组失败' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: '分组名称不能为空' });
    }

    const existingGroup = await Group.findOne({ name: name.trim() });
    if (existingGroup) {
      return res.status(400).json({ error: '分组名称已存在' });
    }

    const group = new Group({
      name: name.trim(),
      description: description || ''
    });

    const savedGroup = await group.save();
    res.status(201).json(savedGroup);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: '分组名称已存在' });
    } else {
      res.status(500).json({ error: '创建分组失败' });
    }
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: '分组不存在' });
    }

    if (name && name.trim() !== '') {
      if (name.trim() !== group.name) {
        const existingGroup = await Group.findOne({ name: name.trim() });
        if (existingGroup) {
          return res.status(400).json({ error: '分组名称已存在' });
        }
      }
      group.name = name.trim();
    }

    if (description !== undefined) {
      group.description = description;
    }

    const updatedGroup = await group.save();
    
    await Prompt.updateMany(
      { groupId: req.params.id },
      { groupName: updatedGroup.name }
    );

    res.json(updatedGroup);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: '分组名称已存在' });
    } else {
      res.status(500).json({ error: '更新分组失败' });
    }
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: '分组不存在' });
    }

    const promptCount = await Prompt.countDocuments({ groupId: req.params.id });
    if (promptCount > 0) {
      return res.status(400).json({ error: `该分组下有 ${promptCount} 个提示词，无法删除` });
    }

    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: '分组删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除分组失败' });
  }
});

module.exports = router;
