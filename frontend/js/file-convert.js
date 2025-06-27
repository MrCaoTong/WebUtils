document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('convertForm');
  const fileInput = document.getElementById('fileInput');
  const targetFormat = document.getElementById('targetFormat');
  const progressArea = document.getElementById('progressArea');
  const resultArea = document.getElementById('resultArea');
  const uploadArea = document.getElementById('uploadArea');
  const fileList = document.getElementById('fileList');

  // 允许的文档类型
  const allowedExts = ['pdf','doc','docx','ppt','pptx','xls','xlsx','txt','rtf','html','epub'];

  // 文件池，支持多次选择/拖拽累加
  let selectedFiles = [];
  let lastPdfResults = [];

  // 工具函数：文件去重（按name+size+lastModified）
  function isDuplicate(file) {
    return selectedFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified);
  }

  // 文件列表显示
  function updateFileList() {
    let html = '';
    selectedFiles.forEach((file, idx) => {
      html += `<span>${file.name} <a href="#" data-idx="${idx}" class="remove-file" title="移除">×</a></span>`;
    });
    fileList.innerHTML = html;
    // 绑定删除事件
    fileList.querySelectorAll('.remove-file').forEach(a => {
      a.onclick = function(e) {
        e.preventDefault();
        const idx = parseInt(this.dataset.idx);
        selectedFiles.splice(idx, 1);
        updateFileList();
      };
    });
  }

  // 处理新文件（选择或拖拽）
  function addFiles(fileListInput) {
    const arr = Array.from(fileListInput);
    let valid = false;
    arr.forEach(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        alert('仅支持文档类型文件：pdf, doc, docx, ppt, pptx, xls, xlsx, txt, rtf, html, epub');
        return;
      }
      if (!isDuplicate(file)) {
        selectedFiles.push(file);
        valid = true;
      }
    });
    updateFileList();
    if (valid) fileInput.value = '';
  }

  // 拖拽上传样式
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
    addFiles(e.dataTransfer.files);
  });

  // 文件选择
  fileInput.addEventListener('change', () => {
    addFiles(fileInput.files);
    fileInput.value = '';
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    resultArea.innerHTML = '';
    progressArea.style.display = 'block';
    progressArea.textContent = '正在上传并转换文件...';

    if (!selectedFiles.length) {
      progressArea.textContent = '请先选择文件';
      return;
    }
    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }
    formData.append('targetFormat', targetFormat.value);

    try {
      const res = await fetch('http://localhost:3001/api/format-convert', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      progressArea.style.display = 'none';
      if (data.success) {
        let html = '<b>转换完成，点击下载：</b><br>';
        lastPdfResults = [];
        data.results.forEach(item => {
          const backendBase = 'http://localhost:3001';
          html += `<a class="download-link" href="${backendBase}${item.url}" download="${item.name}">${item.name}</a>`;
          if (item.url.endsWith('.pdf')) lastPdfResults.push({name: item.name, url: item.url});
        });
        if (targetFormat.value === 'pdf' && lastPdfResults.length > 1) {
          html += `<br><button id="mergePdfBtn" class="btn-primary" style="width:auto;margin-top:16px;">合并下载PDF</button>`;
        }
        resultArea.innerHTML = html;
        selectedFiles = [];
        updateFileList();
        // 合并按钮事件
        setTimeout(() => {
          const mergeBtn = document.getElementById('mergePdfBtn');
          if (mergeBtn) {
            mergeBtn.onclick = async function() {
              mergeBtn.disabled = true;
              mergeBtn.textContent = '正在合并...';
              try {
                const res = await fetch('http://localhost:3001/api/merge', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ files: lastPdfResults.map(f => f.name) })
                });
                const mergeData = await res.json();
                if (mergeData.url) {
                  const backendBase = 'http://localhost:3001';
                  mergeBtn.outerHTML = `<a class='download-link' href='${backendBase}${mergeData.url}' download='合并后的PDF.pdf'>合并后的PDF下载</a>`;
                } else {
                  mergeBtn.disabled = false;
                  mergeBtn.textContent = '合并下载PDF';
                  alert(mergeData.error || '合并失败');
                }
              } catch (err) {
                mergeBtn.disabled = false;
                mergeBtn.textContent = '合并下载PDF';
                alert('网络错误或服务器异常');
              }
            };
          }
        }, 0);
      } else {
        resultArea.innerHTML = `<span style="color:red;">${data.error || '转换失败'}</span>`;
      }
    } catch (err) {
      progressArea.style.display = 'none';
      resultArea.innerHTML = `<span style="color:red;">网络错误或服务器异常</span>`;
    }
  });
}); 