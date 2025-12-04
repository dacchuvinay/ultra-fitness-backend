const express = require('express');
const {
    memberLogin,
    getMemberProfile,
    updateMemberProfile,
    changePassword,
    getMemberAttendance,
    getMemberPayments,
    subscribePushNotification,
} = require('../controllers/memberController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/member/login:
 *   post:
 *     summary: Member login
 *     tags: [Member]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *               - password
 *             properties:
 *               memberId:
 *                 type: string
 *                 example: U001
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', memberLogin);

// Protected routes (require member authentication)

/**
 * @swagger
 * /api/member/me:
 *   get:
 *     summary: Get member profile
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member profile
 *       401:
 *         description: Not authenticated
 */
router.get('/me', protect, getMemberProfile);

/**
 * @swagger
 * /api/member/profile:
 *   put:
 *     summary: Update member profile
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', protect, updateMemberProfile);

/**
 * @swagger
 * /api/member/change-password:
 *   put:
 *     summary: Change password
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put('/change-password', protect, changePassword);

/**
 * @swagger
 * /api/member/attendance:
 *   get:
 *     summary: Get member attendance history
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: Attendance records
 */
router.get('/attendance', protect, getMemberAttendance);

/**
 * @swagger
 * /api/member/payments:
 *   get:
 *     summary: Get member payment history
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: Payment records
 */
router.get('/payments', protect, getMemberPayments);

/**
 * @swagger
 * /api/member/subscribe-push:
 *   post:
 *     summary: Subscribe to push notifications
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription
 *             properties:
 *               subscription:
 *                 type: object
 *     responses:
 *       200:
 *         description: Subscription successful
 */
router.post('/subscribe-push', protect, subscribePushNotification);

module.exports = router;
