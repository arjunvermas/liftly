const express = require("express");
const {
  logWorkoutSession,
  getWorkoutHistory,
  getWorkoutSessionById,
  deleteWorkoutSession,
} = require("../controllers/session.controller");
const { authMiddleWare } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @openapi
 * /api/sessions:
 *   post:
 *     summary: Log a completed workout session
 *     tags:
 *       - Sessions
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sets
 *             properties:
 *               program_day_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               title:
 *                 type: string
 *                 maxLength: 120
 *               duration_minutes:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 600
 *                 nullable: true
 *               notes:
 *                 type: string
 *                 nullable: true
 *               sets:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - exercise_id
 *                     - set_number
 *                     - reps
 *                   properties:
 *                     exercise_id:
 *                       type: string
 *                     set_number:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 50
 *                     reps:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 500
 *                     weight_kg:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1000
 *                       default: 0
 *                     rpe:
 *                       type: number
 *                       minimum: 1
 *                       maximum: 10
 *                       nullable: true
 *     responses:
 *       201:
 *         description: Workout session logged successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to log workout session
 */
router.post("/", authMiddleWare, logWorkoutSession);

/**
 * @openapi
 * /api/sessions:
 *   get:
 *     summary: Get workout history for the current user
 *     tags:
 *       - Sessions
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Workout history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch workout history
 */
router.get("/", authMiddleWare, getWorkoutHistory);

/**
 * @openapi
 * /api/sessions/{id}:
 *   get:
 *     summary: Get a workout session by ID
 *     tags:
 *       - Sessions
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Workout session ID
 *     responses:
 *       200:
 *         description: Workout session retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Workout session not found
 *       500:
 *         description: Failed to fetch workout session
 */
router.get("/:id", authMiddleWare, getWorkoutSessionById);

/**
 * @openapi
 * /api/sessions/{id}:
 *   delete:
 *     summary: Delete a workout session
 *     tags:
 *       - Sessions
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Workout session ID
 *     responses:
 *       200:
 *         description: Workout session deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Workout session not found
 *       500:
 *         description: Failed to delete workout session
 */
router.delete("/:id", authMiddleWare, deleteWorkoutSession);

module.exports = router;