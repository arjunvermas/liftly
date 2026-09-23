const express = require('express');
const authRoute = express.Router();
const authController = require('../controllers/auth.controller')

/**
 * @openapi
 * /api/auth/registerUser:
 *   post:
 *     summary: Register a new user
 *     description: Validates user input, hashes the password, creates a record in Supabase, and sets a 30-day HTTP-only session cookie.
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
 *             properties:
 *               name:
 *                 type: string
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
 *         description: Database or internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 */


/**
 * @openapi
 * /api/auth/loginUser:
 *   post:
 *     summary: Log in an existing user
 *     description: Authenticates credentials using either email or username with a password, then sets a 30-day HTTP-only session cookie.
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