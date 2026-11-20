const express = require('express');
const {
  getAllPrograms,
  getProgramById,
  createProgram,
  activateProgram,
  getActiveProgram,
} = require('../controllers/program.controller');
const { authMiddleWare } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/programs:
 *   get:
 *     summary: Get default workout programs
 *     tags:
 *       - Programs
 *     responses:
 *       200:
 *         description: Default programs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       days_per_week:
 *                         type: integer
 *                       is_default:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Failed to fetch workout programs
 */
router.get('/', getAllPrograms);

/**
 * @openapi
 * /api/programs/active:
 *   get:
 *     summary: Get the logged-in user's active program
 *     tags:
 *       - Programs
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Active program retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No active program found
 *       500:
 *         description: Failed to fetch active program
 */
router.get('/active', authMiddleWare, getActiveProgram);

/**
 * @openapi
 * /api/programs/{id}:
 *   get:
 *     summary: Get a workout program by ID
 *     tags:
 *       - Programs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Workout program ID
 *     responses:
 *       200:
 *         description: Program details retrieved successfully
 *       404:
 *         description: Program not found
 *       500:
 *         description: Failed to fetch program details
 */
router.get('/:id', getProgramById);

/**
 * @openapi
 * /api/programs:
 *   post:
 *     summary: Create a custom workout program
 *     tags:
 *       - Programs
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - days_per_week
 *               - days
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 500
 *               days_per_week:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 7
 *               days:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 7
 *                 items:
 *                   type: object
 *                   required:
 *                     - day_number
 *                     - day_name
 *                     - focus
 *                     - exercises
 *                   properties:
 *                     day_number:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 7
 *                     day_name:
 *                       type: string
 *                     focus:
 *                       type: string
 *                     exercises:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required:
 *                           - exercise_id
 *                           - order_index
 *                           - target_sets
 *                           - target_reps
 *                         properties:
 *                           exercise_id:
 *                             type: string
 *                           order_index:
 *                             type: integer
 *                           target_sets:
 *                             type: integer
 *                           target_reps:
 *                             type: string
 *                           rest_seconds:
 *                             type: integer
 *                             default: 90
 *                           notes:
 *                             type: string
 *                             nullable: true
 *     responses:
 *       201:
 *         description: Workout program created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create workout program
 */
router.post('/', authMiddleWare, createProgram);

/**
 * @openapi
 * /api/programs/{id}/activate:
 *   post:
 *     summary: Activate a workout program for the current user
 *     tags:
 *       - Programs
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Program ID to activate
 *     responses:
 *       200:
 *         description: Program activated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Program not found
 *       500:
 *         description: Failed to activate program
 */
router.post('/:id/activate', authMiddleWare, activateProgram);

module.exports = router;