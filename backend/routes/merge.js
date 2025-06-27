const express = require('express');
const PDFMerger = require('pdf-merger-js').default;
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.post('/', async (req, res) => {
  console.log('收到合并请求', req.body.files);
  const { files } = req.body;
  if (!Array.isArray(files) || files.length < 2) {
    return res.status(400).json({ error: '请至少选择两个PDF文件合并' });
  }
  const merger = new PDFMerger();
  try {
    const outputDir = path.join(__dirname, '../../outputs');
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      console.log('合并检查文件:', filePath, '文件名:', file, '存在:', fs.existsSync(filePath), '长度:', file.length);
      if (fs.existsSync(filePath)) {
        await merger.add(filePath);
      } else {
        return res.status(404).json({ error: `文件不存在: ${file}` });
      }
    }
    const mergedFileName = `merged_${Date.now()}.pdf`;
    const mergedFilePath = path.join(outputDir, mergedFileName);
    await merger.save(mergedFilePath);
    res.json({ url: `/outputs/${mergedFileName}` });
  } catch (err) {
    res.status(500).json({ error: 'PDF合并失败', detail: err.message });
  }
});

module.exports = router; 