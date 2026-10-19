const express = require("express");
const cookieParser = require('cookie-parser');
const {authRoute} = require('./routes/auth.route.js');
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger.js");
const {workoutRoute} = require('./routes/workout.route.js');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoute)
app.use('/api/workouts', workoutRoute)
module.exports = app;