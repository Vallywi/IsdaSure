const express = require('express');
const { contributeToPool, prepareContributionTransaction } = require('../services/sorobanService');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const limiter = createRateLimiter({ windowMs: 60_000, max: 20 });

router.post('/prepare', limiter, async (request, response, next) => {
  try {
    const prepared = await prepareContributionTransaction(request.body);
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
    const result = await contributeToPool(request.body);
    response.json({
      success: true,
      message: 'Contribution recorded',
      status: result.status,
      tx: result.tx,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;