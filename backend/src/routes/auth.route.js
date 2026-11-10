const express = require('express');
const authRoute = express.Router();
const authController = require('../controllers/auth.controller')

/**
 * @openapi
 * /api/auth/registerUser:
 *   post:
 *     summary: Register a new user
 *     description: Validates user and profile details, hashes the password, creates both records in Supabase, and sets a 30-day HTTP-only session cookie.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - profile
 *             properties:
 *               name:
 *                 type: string
 *                 nullable: true
 *                 example: Alex Smith
 *                 maxLength: 100
 *               username:
 *                 type: string
 *                 example: alexsmith_01
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alex@example.com
 *                 maxLength: 255
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass@123!
 *                 minLength: 8
 *                 maxLength: 72
 *                 description: Must include uppercase and lowercase letters, a number, and a special character (@$!%*?&)
 *               profile:
 *                 type: object
 *                 required:
 *                   - height_cm
 *                   - weight_kg
 *                   - fitness_goal
 *                 properties:
 *                   bio:
 *                     type: string
 *                     maxLength: 300
 *                     default: ""
 *                     example: Building strength one workout at a time.
 *                   height_cm:
 *                     type: number
 *                     minimum: 50
 *                     maximum: 280
 *                     example: 175
 *                   weight_kg:
 *                     type: number
 *                     minimum: 20
 *                     maximum: 400
 *                     example: 72.5
 *                   fitness_goal:
 *                     type: string
 *                     enum:
 *                       - hypertrophy
 *                       - strength
 *                       - endurance
 *                       - weight_loss
 *                       - general_fitness
 *                     example: strength
 *                   experience_level:
 *                     type: string
 *                     enum:
 *                       - beginner
 *                       - intermediate
 *                       - advanced
 *                     default: beginner
 *                     example: beginner
 *     responses:
 *       201:
 *         description: Registered successfully
 *         headers:
 *           Set-Cookie:
 *             description: 30-day HTTP-only JWT token
 *             schema:
 *               type: string
 *               example: token=eyJhbGciOi...; Path=/; HttpOnly; SameSite=Lax
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: registered successfully
 *                 dataWithouthash:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 4a2b9f4e-28d1-41d6-b072-0ff2382e8d91
 *                     username:
 *                       type: string
 *                       example: alexsmith_01
 *                     email:
 *                       type: string
 *                       example: alex@example.com
 *                     name:
 *                       type: string
 *                       example: Alex Smith
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 profileData:
 *                   type: object
 *                   properties:
 *                     avatar_url:
 *                       type: string
 *                       format: uri
 *                       example: https://api.dicebear.com/7.x/initials/svg?seed=alexsmith_01
 *                     bio:
 *                       type: string
 *                       example: Building strength one workout at a time.
 *                     height_cm:
 *                       type: number
 *                       example: 175
 *                     weight_kg:
 *                       type: number
 *                       example: 72.5
 *                     fitness_goal:
 *                       type: string
 *                       example: strength
 *                     experience_level:
 *                       type: string
 *                       example: beginner
 *       400:
 *         description: Validation error or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: object
 *                   example:
 *                     email: ["Invalid email address"]
 *       409:
 *         description: Email or username already registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email or Username is already registered.
 *       500:
 *         description: Database or internal server error. Profile initialization failures roll back the user record.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to initialize profile. User registration rolled back.
 */


/**
 * @openapi
 * /api/auth/loginUser:
 *   post:
 *     summary: Log in an existing user
 *     description: Authenticates credentials using either email or username with a password, returns the user's profile, and sets a 30-day HTTP-only session cookie.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Can be either the username or email address
 *                 example: alexsmith_01
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass@123!
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         headers:
 *           Set-Cookie:
 *             description: 30-day HTTP-only JWT token
 *             schema:
 *               type: string
 *               example: token=eyJhbGciOi...; Path=/; HttpOnly; SameSite=Lax
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged in Successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 4a2b9f4e-28d1-41d6-b072-0ff2382e8d91
 *                     username:
 *                       type: string
 *                       example: alexsmith_01
 *                     email:
 *                       type: string
 *                       example: alex@example.com
 *                     name:
 *                       type: string
 *                       example: Alex Smith
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 profile:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     avatar_url:
 *                       type: string
 *                       format: uri
 *                     bio:
 *                       type: string
 *                     height_cm:
 *                       type: number
 *                     weight_kg:
 *                       type: number
 *                     fitness_goal:
 *                       type: string
 *                       enum:
 *                         - hypertrophy
 *                         - strength
 *                         - endurance
 *                         - weight_loss
 *                         - general_fitness
 *                     experience_level:
 *                       type: string
 *                       enum:
 *                         - beginner
 *                         - intermediate
 *                         - advanced
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: object
 *                   example:
 *                     identifier: ["Username or Email is required"]
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */


authRoute.post('/registerUser', authController.registerUser);
authRoute.post('/loginUser', authController.loginUser);
module.exports = {authRoute};