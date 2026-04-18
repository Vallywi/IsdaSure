const express = require('express');
const { contributeToPool } = require('../services/sorobanService');

const router = express.Router();

router.post('/', (request, response, next) => {
  try {
    const status = contributeToPool(request.body);
    response.json({
      success: true,
      message: 'Contribution recorded',
      status,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;