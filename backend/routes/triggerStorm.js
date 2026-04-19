const express = require('express');
const { prepareStormTransaction, triggerStormDay } = require('../services/sorobanService');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });

router.post('/prepare', limiter, async (request, response, next) => {
  try {
    const prepared = await prepareStormTransaction(request.body);
    response.json({
      success: true,
      ...prepared,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', limiter, async (request, response, next) => {
  try {
    const result = await triggerStormDay(request.body);
    response.json({
      success: true,
      message: 'Storm day triggered',
      status: result.status,
      tx: result.tx,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;