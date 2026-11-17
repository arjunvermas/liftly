const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateUser,
  updateProfile,
  googleAuth
} = require("../controllers/auth.controller");
const { authMiddleWare } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
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
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               profile:
 *                 type: object
 *                 required:
 *                   - height_cm
 *                   - weight_kg
 *                   - fitness_goal
 *                 properties:
 *                   bio:
 *                     type: string
 *                     nullable: true
 *                   height_cm:
 *                     type: number
 *                   weight_kg:
 *                     type: number
 *                   fitness_goal:
 *                     type: string
 *                     enum:
 *                       - hypertrophy
 *                       - strength
 *                       - endurance
 *                       - weight_loss
 *                       - general_fitness
 *                   experience_level:
 *                     type: string
 *                     enum:
 *                       - beginner
 *                       - intermediate
 *                       - advanced
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Username or email already registered
 *       500:
 *         description: Registration failed
 */
router.post("/register", registerUser);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags:
 *       - Auth
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
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Login failed
 */
router.post("/login", loginUser);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", logoutUser);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch user data
 */
router.get("/me", authMiddleWare, getMe);

/**
 * @openapi
 * /api/auth/user:
 *   patch:
 *     summary: Update authenticated user account fields
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Username or email already taken
 *       500:
 *         description: Update failed
 */
router.patch("/user", authMiddleWare, updateUser);

/**
 * @openapi
 * /api/auth/profile:
 *   patch:
 *     summary: Update authenticated user profile
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatar_url:
 *                 type: string
 *                 format: uri
 *               bio:
 *                 type: string
 *               height_cm:
 *                 type: number
 *               weight_kg:
 *                 type: number
 *               fitness_goal:
 *                 type: string
 *                 enum:
 *                   - hypertrophy
 *                   - strength
 *                   - endurance
 *                   - weight_loss
 *                   - general_fitness
 *               experience_level:
 *                 type: string
 *                 enum:
 *                   - beginner
 *                   - intermediate
 *                   - advanced
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Update failed
 */
router.patch("/profile", authMiddleWare, updateProfile);
router.post("/google", googleAuth);
module.exports = { authRoute: router };