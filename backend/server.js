const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoute = require('./routes/auth');
const contributeRoute = require('./routes/contribute');
const triggerStormRoute = require('./routes/triggerStorm');
const { getStatus } = require('./services/sorobanService');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/status', (_request, response) => {
  response.json({
    success: true,
    status: getStatus(),
  });
});

app.use('/api/auth', authRoute);
app.use('/api/contribute', contributeRoute);
app.use('/api/trigger-storm', triggerStormRoute);

app.get('/api/health', (_request, response) => {
  response.json({ success: true, message: 'IsdaSure backend is running' });
});

app.use((error, _request, response, _next) => {
  response.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`IsdaSure backend listening on port ${port}`);
});