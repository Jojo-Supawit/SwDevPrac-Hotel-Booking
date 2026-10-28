const express = require('express');
const { getBookings, getBooking, addBooking, updateBooking, deleteBookings } = require('../controllers/bookings');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - checkInDate
 *         - nights
 *         - hotel
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the booking
 *         checkInDate:
 *           type: string
 *           format: date
 *           description: Booking check-in date
 *         nights:
 *           type: integer
 *           minimum: 1
 *           maximum: 3
 *           description: Number of nights (1 to 3)
 *         user:
 *           type: string
 *           description: The user ID who booked
 *         hotel:
 *           type: string
 *           description: The hotel ID
 *       example:
 *         checkInDate: '2026-11-01'
 *         nights: 2
 *         hotel: 609bda561452242d88d36e37
 */

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: The bookings managing API
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings (user gets own bookings, admin gets all)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a booking (up to 3 nights)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Invalid input or nights exceed 3
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a single booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The booking details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *   put:
 *     summary: Update a booking (up to 3 nights)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *   delete:
 *     summary: Delete a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */

router.route('/')
    .get(protect, getBookings)
    .post(protect, authorize('admin', 'user'), addBooking);

router.route('/:id')
    .get(protect, getBooking)
    .put(protect, authorize('admin', 'user'), updateBooking)
    .delete(protect, authorize('admin', 'user'), deleteBookings);

module.exports = router;
