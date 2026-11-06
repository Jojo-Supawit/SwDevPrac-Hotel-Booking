const express = require('express');
const { getHotels, getHotel, createHotel, updateHotel, deleteHotel, getHotelsInRadius } = require('../controllers/hotels');

const bookingRouter = require('./bookings');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Hotel:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - district
 *         - province
 *         - postalcode
 *         - tel
 *         - region
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the hotel
 *         name:
 *           type: string
 *           description: Hotel name
 *         address:
 *           type: string
 *           description: Street address
 *         district:
 *           type: string
 *           description: District
 *         province:
 *           type: string
 *           description: Province
 *         postalcode:
 *           type: string
 *           description: 5-digit postal code
 *         tel:
 *           type: string
 *           description: Telephone number
 *         region:
 *           type: string
 *           description: Region
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [Point]
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               description: "[longitude, latitude]"
 *         pricePerNight:
 *           type: number
 *           description: Price per night in THB
 *         taxId:
 *           type: string
 *           description: Business Tax ID
 *       example:
 *         name: The Grand Palace Hotel
 *         address: 123 Sukhumvit Road
 *         district: Khlong Toei
 *         province: Bangkok
 *         postalcode: 10110
 *         tel: 02-1234567
 *         region: Bangkok
 *         pricePerNight: 1500
 *         taxId: '0105559876543'
 */

/**
 * @swagger
 * tags:
 *   name: Hotels
 *   description: The hotels managing API
 */

/**
 * @swagger
 * /hotels:
 *   get:
 *     summary: Returns the list of all the hotels (can filter by ?lat=&lng=&distance=)
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: The list of the hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hotel'
 */

/**
 * @swagger
 * /hotels/radius/{lat}/{lng}/{distance}:
 *   get:
 *     summary: Find hotels within a specified radius (in kilometers)
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: path
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *       - in: path
 *         name: distance
 *         required: true
 *         schema:
 *           type: number
 *         description: Distance radius in kilometers
 *     responses:
 *       200:
 *         description: Hotels found within the radius
 *       400:
 *         description: Invalid coordinates or distance
 */

/**
 * @swagger
 * /hotels/{id}:
 *   get:
 *     summary: Get the hotel by id
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The hotel id
 *     responses:
 *       200:
 *         description: The hotel description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: The hotel was not found
 */

/**
 * @swagger
 * /hotels:
 *   post:
 *     summary: Create a new hotel (Admin only)
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       201:
 *         description: The hotel was successfully created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /hotels/{id}:
 *   put:
 *     summary: Update the hotel by id (Admin only)
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The hotel id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       200:
 *         description: The hotel was updated
 *       404:
 *         description: The hotel was not found
 */

/**
 * @swagger
 * /hotels/{id}:
 *   delete:
 *     summary: Remove the hotel by id (Admin only)
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The hotel id
 *     responses:
 *       200:
 *         description: The hotel was deleted
 *       404:
 *         description: The hotel was not found
 */

// Re-route into other resource routers
router.use('/:hotelId/bookings/', bookingRouter);

// Geospatial search route
router.route('/radius/:lat/:lng/:distance').get(getHotelsInRadius);

router.route('/')
    .get(getHotels)
    .post(protect, authorize('admin'), createHotel);

router.route('/:id')
    .get(getHotel)
    .put(protect, authorize('admin'), updateHotel)
    .delete(protect, authorize('admin'), deleteHotel);

module.exports = router;
