const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

async function cropImage({ file, x, y, width, height, rotate, scaleX, scaleY, outputFormat, quality }) {
  const inputPath = file.path;
  const outputName = `${Date.now()}_${uuidv4()}.${outputFormat}`;
  const outputPath = path.join(__dirname, '../../outputs', outputName);
  let img = sharp(inputPath);
  if (rotate) img = img.rotate(Number(rotate));
  if (scaleX === '-1' || scaleX === -1) img = img.flop();
  if (scaleY === '-1' || scaleY === -1) img = img.flip();
  if (x && y && width && height) img = img.extract({ left: Math.round(Number(x)), top: Math.round(Number(y)), width: Math.round(Number(width)), height: Math.round(Number(height)) });
  if (outputFormat === 'jpeg' || outputFormat === 'jpg') img = img.jpeg({ quality: Number(quality) || 90 });
  else if (outputFormat === 'png') img = img.png({ quality: Number(quality) || 90 });
  else if (outputFormat === 'webp') img = img.webp({ quality: Number(quality) || 90 });
  else img = img.toFormat(outputFormat);
  await img.toFile(outputPath);
  return { url: `/outputs/${outputName}`, name: outputName };
}

module.exports = { cropImage }; 