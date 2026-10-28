const express = require('express');
const { register, login, getMe, logout } = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - tel
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: User full name
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         tel:
 *           type: string
 *           description: User telephone number
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *           description: User role
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           description: User password
 *       example:
 *         name: John Doe
 *         email: john@gmail.com
 *         tel: '0812345678'
 *         password: password123
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication API
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Successfully registered and returned JWT token
 *       400:
 *         description: Validation error or duplicate email
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in and returned JWT token
 *       400:
 *         description: Missing email/password or invalid credentials
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get currently logged in user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Log out user and clear cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successfully logged out
 */

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);

module.exports = router;
