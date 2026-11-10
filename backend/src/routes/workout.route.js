const express = require('express');
const workoutRoute = express.Router() ;
const {authMiddleWare} = require('../middlewares/auth.middleware.js');
const {Workouts, createExerciseController, deleteExerciseController} = require('../controllers/workout.controller.js')
const upload = require('../middlewares/upload.middleware.js');

/**
 * @openapi
 * /api/workouts:
 *   get:
 *     summary: List exercises
 *     description: Returns exercises ordered by name. All filters are optional; pagination defaults to page 1 with 50 results.
 *     tags:
 *       - Workouts
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Case-insensitive partial match on the exercise name
 *         example: press
 *       - in: query
 *         name: body_part
 *         schema:
 *           type: string
 *         description: Exact body-part match (case-insensitive)
 *         example: chest
 *       - in: query
 *         name: target_muscle
 *         schema:
 *           type: string
 *         description: Match exercises containing this target muscle (case-insensitive)
 *         example: pectorals
 *       - in: query
 *         name: equipment
 *         schema:
 *           type: string
 *         description: Exact equipment match (case-insensitive)
 *         example: dumbbell
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         example: 20
 *     responses:
 *       200:
 *         description: Exercises retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - total
 *                 - page
 *                 - limit
 *                 - data
 *               properties:
 *                 total:
 *                   type: integer
 *                   nullable: true
 *                   description: Total matching records
 *                   example: 42
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 50
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                         example: Dumbbell Bench Press
 *                       body_part:
 *                         type: string
 *                         example: chest
 *                       target_muscles:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: [pectorals, triceps]
 *                       equipment:
 *                         type: string
 *                         example: dumbbell
 *                       gif_url:
 *                         type: string
 *                         format: uri
 *                         nullable: true
 *                       image_url:
 *                         type: string
 *                         format: uri
 *                         nullable: true
 *       400:
 *         description: Invalid query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: object
 *                   example:
 *                     page: ["Too small: expected number to be >=1"]
 *       401:
 *         description: Missing or invalid authentication cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Failed to fetch exercises or internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to fetch exercises
 */
workoutRoute.get('/', authMiddleWare, Workouts);

/**
 * @openapi
 * /api/workouts:
 *   post:
 *     summary: Create an exercise
 *     description: Creates an exercise and optionally uploads an image and a video/GIF demo. Each uploaded file is limited to 25 MB.
 *     tags:
 *       - Workouts
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - body_part
 *               - target_muscles
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: Dumbbell Bench Press
 *               body_part:
 *                 type: string
 *                 example: chest
 *               equipment:
 *                 type: string
 *                 default: none
 *                 example: dumbbell
 *               target_muscles:
 *                 type: string
 *                 description: A JSON array encoded as a string, or comma-separated values
 *                 example: '["pectorals","triceps"]'
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional JPEG, PNG, WEBP, or GIF image
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Optional MP4, WEBM, MOV, or GIF demo
 *     responses:
 *       201:
 *         description: Exercise created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exercise created successfully
 *                 exercise:
 *                   type: object
 *                   description: The created exercise record
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                       example: Dumbbell Bench Press
 *                     body_part:
 *                       type: string
 *                       example: chest
 *                     target_muscles:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: [pectorals, triceps]
 *                     equipment:
 *                       type: string
 *                       example: dumbbell
 *                     gif_url:
 *                       type: string
 *                       format: uri
 *                       nullable: true
 *                     image_url:
 *                       type: string
 *                       format: uri
 *                       nullable: true
 *       400:
 *         description: Invalid exercise fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: object
 *                   example:
 *                     name: ["Name must be at least 2 characters"]
 *       401:
 *         description: Missing or invalid authentication cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Upload, database, or internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to save exercise in database
 */
workoutRoute.post("/", authMiddleWare,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
    createExerciseController
);

/**
 * @openapi
 * /api/workouts/{id}:
 *   delete:
 *     summary: Delete an exercise
 *     description: Deletes the exercise with the specified UUID.
 *     tags:
 *       - Workouts
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Exercise UUID
 *     responses:
 *       200:
 *         description: Exercise deleted successfully
 *       400:
 *         description: Invalid exercise UUID
 *       401:
 *         description: Missing or invalid authentication cookie
 *       404:
 *         description: Exercise not found
 *       500:
 *         description: Database or internal server error
 */
workoutRoute.delete("/:id", authMiddleWare, deleteExerciseController);

module.exports = {workoutRoute};