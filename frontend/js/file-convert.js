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
    fileInput.files = e.dataTransfer.files;
  });

  // 文件列表显示
  function updateFileList() {
    const files = fileInput.files;
    let html = '';
    let validCount = 0;
    for (let i = 0; i < files.length; i++) {
      const ext = files[i].name.split('.').pop().toLowerCase();
      if (allowedExts.includes(ext)) {
        html += `<span>${files[i].name}</span>`;
        validCount++;
      } else {
        alert('仅支持文档类型文件：pdf, doc, docx, ppt, pptx, xls, xlsx, txt, rtf, html, epub');
      }
    }
    fileList.innerHTML = html;
    // 如果全部无效，清空input
    if (validCount === 0) fileInput.value = '';
  }
  fileInput.addEventListener('change', updateFileList);
  uploadArea.addEventListener('drop', updateFileList);

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    resultArea.innerHTML = '';
    progressArea.style.display = 'block';
    progressArea.textContent = '正在上传并转换文件...';

    const files = fileInput.files;
    if (!files.length) {
      progressArea.textContent = '请先选择文件';
      return;
    }
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
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
        data.results.forEach(item => {
          html += `<a class="download-link" href="${item.url}" download>${item.name}</a>`;
        });
        resultArea.innerHTML = html;
      } else {
        resultArea.innerHTML = `<span style="color:red;">${data.error || '转换失败'}</span>`;
      }
    } catch (err) {
      progressArea.style.display = 'none';
      resultArea.innerHTML = `<span style="color:red;">网络错误或服务器异常</span>`;
    }
  });
}); 