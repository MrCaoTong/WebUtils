const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');
const { execSync } = require('child_process');
// 这里可引入 LibreOffice/unoconv/pdf-lib/mammoth 等

// 工具函数：获取文件扩展名
function getExt(filename) {
  return path.extname(filename).replace('.', '').toLowerCase();
}

// 主批量转换函数
async function batchConvertFiles(files, targetFormat) {
  const results = [];
  for (const file of files) {
    let url = '', name = '';
    try {
      if ([
        'pdf','doc','docx','ppt','pptx','xls','xlsx','txt','rtf','html','epub'
      ].includes(getExt(file.originalname))) {
        ({ url, name } = await convertDocument(file, targetFormat));
        console.log('输出文件名', name);
      } else {
        throw new Error('仅支持文档类型文件:pdf, doc, docx, ppt, pptx, xls, xlsx, txt, rtf, html, epub');
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
  const outputDir = path.join(__dirname, '../../outputs');
  // 使用 LibreOffice 进行格式转换
  execSync(`soffice --headless --convert-to ${targetFormat} --outdir "${outputDir}" "${file.path}"`);
  // 查找 outputs 目录下最新生成的目标文件
  const baseName = path.parse(file.originalname).name;
  // 兼容拼音/uuid命名，查找 outputs 目录下最新的目标格式文件
  const files = fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.' + targetFormat))
    .map(f => ({ name: f, time: fs.statSync(path.join(outputDir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);
  if (!files.length) throw new Error('转换失败，未生成目标文件');
  const outputName = files[0].name;
  return { url: `/outputs/${outputName}`, name: outputName };
}

module.exports = { batchConvertFiles }; 