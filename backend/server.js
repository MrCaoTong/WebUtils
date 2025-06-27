const express = require('express');
const cors = require('cors');
const path = require('path');
const convertRouter = require('./routes/convert');
const formatConvertRouter = require('./routes/formatConvert');
const mergeRouter = require('./routes/merge');

const app = express();

app.use(cors());

// 解析JSON和表单
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（可选）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/outputs', express.static(path.join(__dirname, '../outputs')));

// 文件转换路由
app.use('/api/convert', convertRouter);
app.use('/api/format-convert', formatConvertRouter);
app.use('/api/merge', mergeRouter);

// 启动服务
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`后端服务已启动，端口: ${PORT}`);
}); 