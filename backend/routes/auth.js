const express = require('express');
const { registerUser, loginUser, listUsers } = require('../services/authService');

const router = express.Router();

router.post('/register', (request, response, next) => {
  try {
    const user = registerUser(request.body);
    response.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

router.post('/login', (request, response, next) => {
  try {
    const user = loginUser(request.body);
    response.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

router.get('/users', (_request, response) => {
  response.json({ success: true, users: listUsers() });
});

module.exports = router;