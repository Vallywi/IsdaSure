const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const authRoute = require('./routes/auth');
const contributeRoute = require('./routes/contribute');
const triggerStormRoute = require('./routes/triggerStorm');
const groupsRoute = require('./routes/groups');
const { getStatus, getChainHistory } = require('./services/sorobanService');

const app = express();
const isVercelRuntime = Boolean(process.env.VERCEL);
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

if (!isVercelRuntime) {
  app.use(express.static(frontendDistPath));
}

app.get('/api/status', (_request, response) => {
  response.json({
    success: true,
    status: getStatus(),
  });
});

app.get('/api/chain/history', (request, response) => {
  response.json({
    success: true,
    history: getChainHistory(request.query.limit),
  });
});

app.use('/api/auth', authRoute);
app.use('/api/contribute', contributeRoute);
app.use('/api/trigger-storm', triggerStormRoute);
app.use('/api/groups', groupsRoute);

app.get('/api/health', (_request, response) => {
  response.json({ success: true, message: 'IsdaSure backend is running' });
});

app.use((error, _request, response, _next) => {
  response.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
  });
});

if (!isVercelRuntime) {
  app.get('*', (_request, response) => {
    response.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

module.exports = app;