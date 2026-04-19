const express = require('express');
const { createRateLimiter } = require('../middleware/rateLimit');
const { createGroup, joinGroup, listGroups, getUserGroups } = require('../services/groupService');

const router = express.Router();
const limiter = createRateLimiter({ windowMs: 60_000, max: 40 });

router.get('/', limiter, (_request, response) => {
  response.json({
    success: true,
    groups: listGroups(),
  });
});

router.post('/create', limiter, (request, response, next) => {
  try {
    const group = createGroup(request.body);
    response.json({
      success: true,
      group,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/join', limiter, (request, response, next) => {
  try {
    const group = joinGroup(request.body);
    response.json({
      success: true,
      group,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/my', limiter, (request, response, next) => {
  try {
    const groups = getUserGroups(request.body);
    response.json({
      success: true,
      groups,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
