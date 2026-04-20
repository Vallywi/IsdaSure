const path = require('path');

function isVercelRuntime() {
  return Boolean(process.env.VERCEL);
}

function getDataDirectory() {
  if (isVercelRuntime()) {
    return path.join('/tmp', 'isdasure-data');
  }

  return path.join(__dirname, '..', 'data');
}

module.exports = {
  getDataDirectory,
  isVercelRuntime,
};