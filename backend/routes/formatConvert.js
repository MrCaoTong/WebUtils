const express = require('express');
const multer = require('multer');
const path = require('path');
const { batchConvertFiles } = require('../services/formatConvertService');
const iconv = require('iconv-lite');
const pinyinModule = require('pinyin');
const pinyin = pinyinModule.pinyin || pinyinModule;
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
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

// 批量文件转换接口
router.post('/', upload.array('files', 20), async (req, res) => {
  try {
    const { targetFormat } = req.body;
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ error: '未上传文件' });
    const results = await batchConvertFiles(files, targetFormat);
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 