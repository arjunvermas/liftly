const express = require('express');
const authRoute = express.Router();
const authController = require('../controllers/auth.controller')

authRoute.post('/registerUser', authController.registerUser);
module.exports = {authRoute};