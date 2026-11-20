const express = require("express");
const cookieParser = require('cookie-parser');
const { authRoute } = require('./routes/auth.route.js');
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger.js");
const { workoutRoute } = require('./routes/workout.route.js');
const programRoutes = require('./routes/program.route.js');
const sessionRoute = require("./routes/session.route.js");
const cors = require("cors");
const app = express();

app.use(
    cors({
        origin: ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean),
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => { res.send("Welcome to the Wannabelyfta API!"); });
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoute);
app.use('/api/workouts', workoutRoute);
app.use('/api/programs', programRoutes);
app.use('/api/sessions', sessionRoute);

module.exports = app;