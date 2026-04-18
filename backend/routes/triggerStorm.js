const express = require('express');
const { triggerStormDay } = require('../services/sorobanService');

const router = express.Router();

router.post('/', (request, response, next) => {
  try {
    const status = triggerStormDay(request.body);
    response.json({
      success: true,
      message: 'Storm day triggered',
      status,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;