const fs = require('fs');
const path = require('path');

function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = { deleteFile }; 