const express = require('express');
const Prompt = require('../models/Prompt');
const Group = require('../models/Group');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { keyword, groupId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (keyword && keyword.trim() !== '') {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (groupId && groupId.trim() !== '') {
      query.groupId = groupId;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Prompt.countDocuments(query);
    const prompts = await Prompt.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      data: prompts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    res.status(500).json({ error: '获取提示词列表失败' });
  }
});

router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { keyword, groupId } = req.query;
    const query = {};

    if (keyword && keyword.trim() !== '') {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (groupId && groupId.trim() !== '') {
      query.groupId = groupId;
    }

    const prompts = await Prompt.find(query).sort({ updatedAt: -1 });
    res.json(prompts);
  } catch (err) {
    res.status(500).json({ error: '获取提示词列表失败' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: '提示词不存在' });
    }
    res.json(prompt);
  } catch (err) {
    res.status(500).json({ error: '获取提示词失败' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, groupId, content } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: '提示词名称不能为空' });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: '提示词内容不能为空' });
    }

    let groupName = '';
    if (groupId && groupId.trim() !== '') {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(400).json({ error: '分组不存在' });
      }
      groupName = group.name;
    }

    const prompt = new Prompt({
      name: name.trim(),
      groupId: groupId || null,
      groupName,
      content: content.trim()
    });

    const savedPrompt = await prompt.save();
    res.status(201).json(savedPrompt);
  } catch (err) {
    res.status(500).json({ error: '创建提示词失败' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, groupId, content } = req.body;
    const prompt = await Prompt.findById(req.params.id);

    if (!prompt) {
      return res.status(404).json({ error: '提示词不存在' });
    }

    if (name && name.trim() !== '') {
      prompt.name = name.trim();
    }

    if (groupId !== undefined) {
      if (groupId && groupId.trim() !== '') {
        const group = await Group.findById(groupId);
        if (!group) {
          return res.status(400).json({ error: '分组不存在' });
        }
        prompt.groupId = groupId;
        prompt.groupName = group.name;
      } else {
        prompt.groupId = null;
        prompt.groupName = '';
      }
    }

    if (content && content.trim() !== '') {
      prompt.content = content.trim();
    }

    const updatedPrompt = await prompt.save();
    res.json(updatedPrompt);
  } catch (err) {
    res.status(500).json({ error: '更新提示词失败' });
  }
});

router.post('/:id/use', authenticateToken, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: '提示词不存在' });
    }

    prompt.useCount += 1;
    const updatedPrompt = await prompt.save();
    res.json(updatedPrompt);
  } catch (err) {
    res.status(500).json({ error: '更新使用次数失败' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: '提示词不存在' });
    }

    await Prompt.findByIdAndDelete(req.params.id);
    res.json({ message: '提示词删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除提示词失败' });
  }
});

module.exports = router;
