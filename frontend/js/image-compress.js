// 请确保在index.html中添加如下CDN：
// <script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>

const uploadArea = document.getElementById('uploadArea');
const fileElem = document.getElementById('fileElem');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const qualityPresets = document.querySelectorAll('.quality-presets button');
const outputFormat = document.getElementById('outputFormat');
const fileList = document.getElementById('file-list');
const previewList = document.getElementById('preview-list');
const compressAllBtn = document.getElementById('compressAllBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const globalTip = document.getElementById('global-tip');

let files = [];
let compressedResults = [];
let currentQuality = 80;
let currentFormat = 'image/jpeg';

// 拖拽上传
uploadArea.addEventListener('dragover', e => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', e => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
});
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});
fileElem.onchange = () => {
  handleFiles(fileElem.files);
  fileElem.value = '';
};

outputFormat.onchange = function() {
  currentFormat = this.value;
  resetCompressionState();
};

qualityRange.oninput = function() {
  currentQuality = parseInt(this.value);
  qualityValue.textContent = `${currentQuality}%`;
  qualityPresets.forEach(btn => btn.classList.remove('active'));
  let found = false;
  qualityPresets.forEach(btn => {
    if (parseInt(btn.dataset.q) === currentQuality) {
      btn.classList.add('active');
      found = true;
    }
  });
  resetCompressionState();
};
qualityPresets.forEach((btn) => {
  btn.onclick = () => {
    currentQuality = parseInt(btn.dataset.q);
    qualityRange.value = currentQuality;
    qualityValue.textContent = `${currentQuality}%`;
    qualityPresets.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    resetCompressionState();
  };
});

function handleFiles(fileListInput) {
  const arr = Array.from(fileListInput);
  let added = false;
  arr.forEach(file => {
    if (!/^image\/(jpeg|png|gif|webp|bmp)$/.test(file.type)) {
      showGlobalTip(`不支持的图片格式: ${file.name}`);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      showGlobalTip(`文件过大: ${file.name}`);
      return;
    }
    files.push(file);
    added = true;
  });
  if (added) {
    hideGlobalTip();
  }
  renderFileList();
  renderPreviewList();
  updateCompressBtn();
  resetCompressionState();
}

function renderFileList() {
  fileList.innerHTML = '';
  files.forEach(file => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.textContent = `${file.name} (${(file.size/1024).toFixed(1)} KB)`;
    fileList.appendChild(div);
  });
}

function renderPreviewList() {
  previewList.innerHTML = '';
  files.forEach((file, idx) => {
    const card = document.createElement('div');
    card.className = 'preview-card';
    // 删除按钮
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.title = '删除图片';
    delBtn.innerHTML = '&times;';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      files.splice(idx, 1);
      compressedResults.splice(idx, 1);
      renderFileList();
      renderPreviewList();
      updateCompressBtn();
      resetCompressionState();
    };
    card.appendChild(delBtn);

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => URL.revokeObjectURL(img.src);
    card.appendChild(img);

    const info = document.createElement('div');
    info.className = 'info';
    info.textContent = `原图: ${(file.size/1024).toFixed(1)} KB`;
    card.appendChild(info);

    const result = document.createElement('div');
    result.className = 'result';
    result.textContent = '未压缩';
    card.appendChild(result);

    const tip = document.createElement('div');
    tip.className = 'tip';
    tip.style.display = 'none';
    card.appendChild(tip);

    previewList.appendChild(card);
  });
}

function updateCompressBtn() {
  if (files.length <= 1) {
    compressAllBtn.textContent = '压缩';
    downloadAllBtn.textContent = '下载';
  } else {
    compressAllBtn.textContent = '批量压缩';
    downloadAllBtn.textContent = '批量下载';
  }
}

function resetCompressionState() {
  compressedResults = [];
  Array.from(previewList.children).forEach(card => {
    if (card.querySelector('.result')) card.querySelector('.result').textContent = '未压缩';
    if (card.querySelector('.tip')) card.querySelector('.tip').style.display = 'none';
  });
  downloadAllBtn.style.display = 'none';
}

compressAllBtn.onclick = async () => {
  if (files.length === 0) {
    showGlobalTip('请先选择图片');
    return;
  }
  compressAllBtn.disabled = true;
  downloadAllBtn.style.display = 'none';
  compressedResults = [];
  let anySuccess = false;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const card = previewList.children[i];
    const tip = card.querySelector('.tip');
    tip.style.display = 'none';
    try {
      const res = await compressImage(file, currentQuality/100, currentFormat);
      compressedResults.push(res);
      const ratio = res.size / file.size;
      if (ratio >= 0.98) {
        card.querySelector('.result').textContent = '压缩效果有限';
        tip.textContent = '压缩后文件未明显变小，建议尝试更低质量或更换输出格式';
        tip.style.display = '';
      } else {
        card.querySelector('.result').textContent = `压缩后: ${(res.size/1024).toFixed(1)} KB (节省${((1-res.size/file.size)*100).toFixed(0)}%)`;
        tip.style.display = 'none';
        anySuccess = true;
      }
      card.querySelector('img').src = res.url;
    } catch (e) {
      card.querySelector('.result').textContent = '压缩失败';
      tip.textContent = '压缩过程中发生错误';
      tip.style.display = '';
    }
  }
  if (anySuccess) {
    downloadAllBtn.style.display = '';
    hideGlobalTip();
  } else {
    downloadAllBtn.style.display = 'none';
    showGlobalTip('所有图片均未明显变小，建议尝试更低质量或更换输出格式');
  }
  compressAllBtn.disabled = false;
};

downloadAllBtn.onclick = () => {
  compressedResults.forEach((res, i) => {
    console.log('下载', res);
    if (res && res.size < files[i].size * 0.98 && res.blob) {
      saveAs(res.blob, res.name);
    }
  });
};

// 可选：页面关闭时统一释放 blob url
window.addEventListener('beforeunload', () => {
  compressedResults.forEach(res => {
    if (res && res.url) URL.revokeObjectURL(res.url);
  });
});

function compressImage(file, quality, format) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          let mime = format;
          if (mime === 'image/gif' || mime === 'image/bmp') mime = 'image/jpeg';
          let ext = 'jpg';
          if (mime === 'image/png') ext = 'png';
          if (mime === 'image/webp') ext = 'webp';
          if (mime === 'image/bmp') ext = 'bmp';
          canvas.toBlob(blob => {
            if (!blob || blob.size === 0) {
              alert('压缩失败，未生成有效图片');
              return reject(new Error('压缩失败，未生成有效图片'));
            }
            resolve({
              url: URL.createObjectURL(blob),
              size: blob.size,
              name: file.name.replace(/\.[^.]+$/, `_compressed.${ext}`),
              blob: blob // 保留blob对象
            });
          }, mime, quality);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = function() { reject(new Error('图片加载失败')); };
      img.src = e.target.result;
    };
    reader.onerror = function() { reject(new Error('文件读取失败')); };
    reader.readAsDataURL(file);
  });
}

function showGlobalTip(msg) {
  globalTip.textContent = msg;
  globalTip.style.display = '';
}
function hideGlobalTip() {
  globalTip.textContent = '';
  globalTip.style.display = 'none';
} 