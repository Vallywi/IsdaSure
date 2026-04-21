// Ensure the backend service exports a Node/Express app in multiple shapes
// so Vercel's serverless bundler can find a valid export.
const app = require('./server');

// CommonJS default export
module.exports = app;

// Some runtimes look for a named 'handler' export
module.exports.handler = app;

// Provide a 'default' property for safety
module.exports.default = app;
