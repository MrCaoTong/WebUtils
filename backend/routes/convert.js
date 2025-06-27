const express = require('express');
const multer = require('multer');
const path = require('path');
const { convertFile } = require('../services/fileService');
const mergeRouter = require('./merge');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 上传目录
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').pop();
    const timestamp = Date.now();
    cb(null, `${timestamp}_${uuidv4()}.${ext}`);
  }
});
const upload = multer({ storage });

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