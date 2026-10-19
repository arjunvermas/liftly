const express = require('express');
const workoutRoute = express.Router() ;
const {authMiddleWare} = require('../middlewares/auth.middleware.js');
const workoutController = require('../controllers/workout.controller.js')

workoutRoute.get('/', authMiddleWare, workoutController);
module.exports = {workoutRoute};