const express = require('express');
const multer = require('multer');
const path = require('path');
const { convertFile } = require('../services/fileService');

const router = express.Router();

// 上传目录
const upload = multer({ dest: path.join(__dirname, '../../uploads') });

// 文件上传与转换接口
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { targetFormat } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: '未上传文件' });
    const outputPath = await convertFile(file.path, file.originalname, targetFormat);
    res.json({ success: true, output: outputPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 