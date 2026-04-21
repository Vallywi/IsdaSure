const fs = require('fs');
const path = require('path');

function isVercelRuntime() {
  return Boolean(process.env.VERCEL);
}

// Directory inside the deployed bundle (read-only on Vercel)
function getPackagedDataDirectory() {
  return path.join(__dirname, '..', 'data');
}

// Directory used for writes at runtime (writable on Vercel)
function getWritableDataDirectory() {
  return path.join('/tmp', 'isdasure-data');
}

// Returns the best directory to read initial data from.
// Prefer the packaged data directory if it exists (so deployed groups/users are visible),
// otherwise fall back to the writable runtime directory.
function getReadDataDirectory() {
  const packaged = getPackagedDataDirectory();
  try {
    if (fs.existsSync(path.join(packaged, 'groups.json'))) {
      return packaged;
    }
  } catch (e) {
    // ignore
  }
  return getWritableDataDirectory();
}

// Returns the directory used for writes. On hosted runtimes use /tmp, otherwise the project data folder.
function getDataDirectory() {
  if (isVercelRuntime()) {
    return getWritableDataDirectory();
  }
  return getPackagedDataDirectory();
}

module.exports = {
  getDataDirectory,
  getReadDataDirectory,
  isVercelRuntime,
};