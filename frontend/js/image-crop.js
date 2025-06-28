// 伪代码结构，核心流程如下：
// 1. 图片上传、格式校验、预览
// 2. 裁剪区域选择（可用 Cropper.js 或自定义 Canvas）
// 3. 用户点击裁剪后，将原图、裁剪参数、输出格式、质量等通过 FormData 上传到后端
// 4. 后端返回裁剪后图片下载链接，前端展示和下载
// 5. 支持批量裁剪
// 6. 交互风格参考 UI 模仿图

// 依赖：建议引入 Cropper.js（可用CDN）
// <link  href="https://cdn.jsdelivr.net/npm/cropperjs@1.5.13/dist/cropper.min.css" rel="stylesheet"/>
// <script src="https://cdn.jsdelivr.net/npm/cropperjs@1.5.13/dist/cropper.min.js"></script>

// ... existing code ...
// 具体实现会包含：
// - 文件上传与格式校验
// - Cropper 实例初始化与参数同步
// - 点击裁剪时收集参数并上传
// - 后端返回下载链接后展示与下载
// - 批量裁剪循环处理
// ... existing code ... 

// 图片裁剪功能实现
document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const uploadArea = document.getElementById('uploadArea');
  const fileElem = document.getElementById('fileElem');
  const selectBtn = document.getElementById('selectBtn');
  const fileList = document.getElementById('fileList');
  const cropStep = document.getElementById('cropStep');
  const previewStep = document.getElementById('previewStep');
  const cropImage = document.getElementById('cropImage');
  const originPreview = document.getElementById('originPreview');
  const cropPreview = document.getElementById('cropPreview');
  const aspectRatio = document.getElementById('aspectRatio');
  const customRatioBox = document.getElementById('customRatioBox');
  const customW = document.getElementById('customW');
  const customH = document.getElementById('customH');
  const rotateBtn = document.getElementById('rotateBtn');
  const flipBtn = document.getElementById('flipBtn');
  const resetBtn = document.getElementById('resetBtn');
  const outputFormat = document.getElementById('outputFormat');
  const qualityRange = document.getElementById('qualityRange');
  const qualityValue = document.getElementById('qualityValue');
  const cropDownloadBtn = document.getElementById('cropDownloadBtn');
  const batchCropBtn = document.getElementById('batchCropBtn');
  const globalTip = document.getElementById('global-tip');

  // 全局变量
  let cropper = null;
  let currentFile = null;
  let uploadedFiles = [];
  let scaleX = 1;
  let scaleY = 1;
  let rotate = 0;

  // 文件选择按钮事件
  selectBtn.onclick = function(e) { 
    e.stopPropagation(); 
    fileElem.click(); 
  };

  // 上传区域点击事件
  uploadArea.addEventListener('click', function(e) {
    if (e.target === uploadArea || e.target.classList.contains('upload-label')) {
      fileElem.click();
    }
  });

  // 文件选择事件
  fileElem.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // 验证文件格式和大小
    const validFiles = files.filter(file => {
      const isValidFormat = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
      const isValidSize = file.size <= 20 * 1024 * 1024; // 20MB
      
      if (!isValidFormat) {
        showTip(`文件 ${file.name} 格式不支持`, 'error');
      }
      if (!isValidSize) {
        showTip(`文件 ${file.name} 超过20MB限制`, 'error');
      }
      
      return isValidFormat && isValidSize;
    });

    if (validFiles.length === 0) {
      showTip('没有有效的图片文件', 'error');
      return;
    }

    // 添加文件到列表
    uploadedFiles = validFiles;
    updateFileList();
    
    // 显示第一个文件进行裁剪
    if (validFiles.length > 0) {
      currentFile = validFiles[0];
      showCropStep(currentFile);
    }
  });

  // 更新文件列表显示
  function updateFileList() {
    fileList.innerHTML = '';
    uploadedFiles.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.innerHTML = `
        <span>${file.name}</span>
        <span>${(file.size / 1024 / 1024).toFixed(2)}MB</span>
        <button onclick="selectFile(${index})">选择</button>
      `;
      fileList.appendChild(fileItem);
    });
  }

  // 选择文件进行裁剪
  window.selectFile = function(index) {
    currentFile = uploadedFiles[index];
    showCropStep(currentFile);
  };

  // 显示裁剪步骤
  function showCropStep(file) {
    console.log('showCropStep called', file);
    cropStep.style.display = 'block';
    previewStep.style.display = 'none';
    
    // 显示原图预览
    const url = URL.createObjectURL(file);
    originPreview.src = url;
    cropImage.src = url;
    
    // 初始化 Cropper
    if (cropper) { 
      cropper.destroy(); 
      cropper = null; 
    }
    
    cropper = new Cropper(cropImage, {
      aspectRatio: NaN,
      viewMode: 1,
      autoCropArea: 0.8,
      movable: true,
      zoomable: true,
      scalable: true,
      rotatable: true,
      cropBoxResizable: true,
      ready() {
        scaleX = 1; 
        scaleY = 1; 
        rotate = 0;
        console.log('Cropper ready', cropper);
      }
    });
  }

  // 裁剪比例变化
  aspectRatio.addEventListener('change', function() {
    if (!cropper) return;
    
    const value = this.value;
    if (value === 'custom') {
      customRatioBox.style.display = 'inline-block';
    } else {
      customRatioBox.style.display = 'none';
      const ratio = value === 'free' ? NaN : parseFloat(value);
      cropper.setAspectRatio(ratio);
    }
  });

  // 自定义比例
  customW.addEventListener('input', function() {
    if (!cropper || aspectRatio.value !== 'custom') return;
    const w = parseInt(this.value) || 1;
    const h = parseInt(customH.value) || 1;
    cropper.setAspectRatio(w / h);
  });

  customH.addEventListener('input', function() {
    if (!cropper || aspectRatio.value !== 'custom') return;
    const w = parseInt(customW.value) || 1;
    const h = parseInt(this.value) || 1;
    cropper.setAspectRatio(w / h);
  });

  // 旋转按钮
  rotateBtn.addEventListener('click', function() {
    if (!cropper) return;
    cropper.rotate(90);
  });

  // 翻转按钮
  flipBtn.addEventListener('click', function() {
    if (!cropper) return;
    if (scaleX === 1) {
      cropper.scaleX(-1);
      scaleX = -1;
    } else {
      cropper.scaleX(1);
      scaleX = 1;
    }
  });

  // 重置按钮
  resetBtn.addEventListener('click', function() {
    if (!cropper) return;
    cropper.reset();
    scaleX = 1;
    scaleY = 1;
    rotate = 0;
  });

  // 质量滑块
  qualityRange.addEventListener('input', function() {
    qualityValue.textContent = this.value + '%';
  });

  // 裁剪并预览
  function cropAndPreview() {
    if (!cropper || !currentFile) {
      showTip('请先选择图片', 'error');
      return;
    }

    const canvas = cropper.getCroppedCanvas();
    if (!canvas) {
      showTip('裁剪失败，请重试', 'error');
      return;
    }

    // 显示预览
    cropPreview.src = canvas.toDataURL();
    previewStep.style.display = 'block';
  }

  // 下载裁剪图片
  cropDownloadBtn.addEventListener('click', function() {
    if (!cropper || !currentFile) {
      showTip('请先选择图片', 'error');
      return;
    }

    const canvas = cropper.getCroppedCanvas();
    if (!canvas) {
      showTip('裁剪失败，请重试', 'error');
      return;
    }

    // 创建下载链接
    const format = outputFormat.value;
    const quality = qualityRange.value / 100;
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                    format === 'png' ? 'image/png' : 'image/webp';
    
    canvas.toBlob(function(blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cropped_${currentFile.name.replace(/\.[^/.]+$/, '')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showTip('下载成功', 'success');
    }, mimeType, quality);
  });

  // 批量裁剪
  batchCropBtn.addEventListener('click', function() {
    if (uploadedFiles.length === 0) {
      showTip('请先上传图片', 'error');
      return;
    }

    showTip('批量裁剪功能开发中...', 'info');
  });

  // 拖拽上传
  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // 验证文件格式和大小
    const validFiles = files.filter(file => {
      const isValidFormat = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
      const isValidSize = file.size <= 20 * 1024 * 1024;
      return isValidFormat && isValidSize;
    });

    if (validFiles.length === 0) {
      showTip('没有有效的图片文件', 'error');
      return;
    }

    uploadedFiles = validFiles;
    updateFileList();
    
    if (validFiles.length > 0) {
      currentFile = validFiles[0];
      showCropStep(currentFile);
    }
  });

  // 显示提示信息
  function showTip(message, type = 'info') {
    globalTip.textContent = message;
    globalTip.className = `global-tip ${type}`;
    globalTip.style.display = 'block';
    
    setTimeout(() => {
      globalTip.style.display = 'none';
    }, 3000);
  }

  // 添加裁剪按钮到裁剪步骤
  const cropContainer = document.querySelector('.crop-container');
  const cropActionBtn = document.createElement('button');
  cropActionBtn.textContent = '裁剪并预览';
  cropActionBtn.className = 'crop-action-btn';
  cropActionBtn.addEventListener('click', cropAndPreview);
  cropContainer.appendChild(cropActionBtn);
}); 