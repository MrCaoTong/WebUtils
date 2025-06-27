const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
// 这里可引入 LibreOffice/unoconv/pdf-lib/mammoth 等

// 工具函数：获取文件扩展名
function getExt(filename) {
  return path.extname(filename).replace('.', '').toLowerCase();
}

// 主批量转换函数
async function batchConvertFiles(files, targetFormat) {
  const results = [];
  for (const file of files) {
    const ext = getExt(file.originalname);
    let url = '', name = '';
    try {
      if ([
        'pdf','doc','docx','ppt','pptx','xls','xlsx','txt','rtf','html','epub'
      ].includes(ext)) {
        ({ url, name } = await convertDocument(file, targetFormat));
      } else {
        throw new Error('仅支持文档类型文件：pdf, doc, docx, ppt, pptx, xls, xlsx, txt, rtf, html, epub');
      }
      results.push({ url, name });
    } catch (e) {
      results.push({ url: '', name: file.originalname, error: e.message });
    }
  }
  return results;
}

// 图片格式转换
async function convertImage(file, targetFormat) {
  const baseName = path.parse(file.originalname).name;
  const outputName = `${baseName}_converted.${targetFormat}`;
  const outputPath = path.join(__dirname, '../../outputs', outputName);
  await sharp(file.path).toFormat(targetFormat).toFile(outputPath);
  return { url: `/outputs/${outputName}`, name: outputName };
}

// 音视频格式转换（简单示例）
function convertMedia(file, targetFormat) {
  return new Promise((resolve, reject) => {
    const baseName = path.parse(file.originalname).name;
    const outputName = `${baseName}_converted.${targetFormat}`;
    const outputPath = path.join(__dirname, '../../outputs', outputName);
    ffmpeg(file.path)
      .output(outputPath)
      .on('end', () => resolve({ url: `/outputs/${outputName}`, name: outputName }))
      .on('error', err => reject(err))
      .run();
  });
}

// 文档格式转换（这里只做文件复制示例，实际应集成LibreOffice等）
async function convertDocument(file, targetFormat) {
  const baseName = path.parse(file.originalname).name;
  const outputName = `${baseName}_converted.${targetFormat}`;
  const outputPath = path.join(__dirname, '../../outputs', outputName);
  fs.copyFileSync(file.path, outputPath);
  return { url: `/outputs/${outputName}`, name: outputName };
}

module.exports = { batchConvertFiles }; 