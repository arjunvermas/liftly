const express = require("express");
const {authRoute} = require('./routes/auth.route.js');

const app = express();
app.use(express.json());

app.use('/api/auth', authRoute)
module.exports = app;