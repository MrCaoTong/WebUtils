const express = require('express');
const multer = require('multer');
const path = require('path');
const { cropImage } = require('../services/imageCropService');
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

// 单张图片裁剪接口
router.post('/single', upload.single('file'), async (req, res) => {
  try {
    const { x, y, width, height, rotate, scaleX, scaleY, outputFormat, quality } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: '未上传图片' });
    const result = await cropImage({ file, x, y, width, height, rotate, scaleX, scaleY, outputFormat, quality });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 批量图片裁剪接口
router.post('/batch', upload.array('files', 20), async (req, res) => {
  try {
    const { crops, outputFormat, quality } = req.body;
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ error: '未上传图片' });
    // crops 为每张图片的裁剪参数数组
    const results = await Promise.all(files.map((file, i) => cropImage({
      file,
      ...(crops && crops[i] ? crops[i] : {}),
      outputFormat,
      quality
    })));
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 