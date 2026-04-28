const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');
const validateLoginRequest = require('../middleware/validate-login-request');

const router = express.Router();

router.post('/login', validateLoginRequest, authController.login);
router.get('/me', authMiddleware, authController.me);

module.exports = router;
