const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const { generateInvoicePDF } = require('../utils/pdfInvoice');
const { runBookingCronTasks } = require('../jobs/bookingJobs');

//@desc     Get all bookings
//@route    GET /api/v1/bookings
//@route    GET /api/v1/hotels/:hotelId/bookings
//@access   Private
exports.getBookings = async (req, res, next) => {
    let query;

    if (req.user.role !== 'admin') {
        const filter = { user: req.user.id };
        if (req.params.hotelId) {
            filter.hotel = req.params.hotelId;
        }
        query = Booking.find(filter).populate({
            path: 'hotel',
            select: 'name address province tel pricePerNight taxId'
        });
    } else {
        const filter = {};
        if (req.params.hotelId) {
            filter.hotel = req.params.hotelId;
        }
        query = Booking.find(filter).populate({
            path: 'hotel',
            select: 'name address province tel pricePerNight taxId'
        }).populate({
            path: 'user',
            select: 'name email tel'
        });
    }

    try {
        const bookings = await query;

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot find Booking" });
    }
};

//@desc     Get single booking
//@route    GET /api/v1/bookings/:id
//@access   Private
exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path: 'hotel',
            select: 'name address province tel pricePerNight taxId'
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to view this booking` });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }
        return res.status(500).json({ success: false, message: "Cannot find Booking" });
    }
};

//@desc     Add booking
//@route    POST /api/v1/hotels/:hotelId/bookings
//@route    POST /api/v1/bookings
//@access   Private
exports.addBooking = async (req, res, next) => {
    try {
        // Support both nested route (/hotels/:hotelId/bookings) and direct route (/bookings)
        if (req.params.hotelId) {
            req.body.hotel = req.params.hotelId;
        }

        if (!req.body.hotel) {
            return res.status(400).json({ success: false, message: 'Please provide a hotel ID' });
        }

        const hotel = await Hotel.findById(req.body.hotel);
        if (!hotel) {
            return res.status(404).json({ success: false, message: `No hotel with the id of ${req.body.hotel}` });
        }

        // Support checkInDate aliases
        req.body.checkInDate = req.body.checkInDate || req.body.bookingDate || req.body.date;
        if (!req.body.checkInDate) {
            return res.status(400).json({ success: false, message: 'Please provide a check-in date' });
        }

        // Validate nights: max 3 nights per booking (as required in Slide 5)
        const nightBookings = Number(req.body.nights);
        if (!req.body.nights || !Number.isInteger(nightBookings) || nightBookings < 1 || nightBookings > 3) {
            return res.status(400).json({
                success: false,
                message: 'The number of nights must be an integer between 1 and 3'
            });
        }
        req.body.nights = nightBookings;

        req.body.user = req.user.id;

        const booking = await Booking.create(req.body);

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: "Cannot create Booking" });
    }
};

//@desc     Update booking
//@route    PUT /api/v1/bookings/:id
//@access   Private
exports.updateBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this booking` });
        }

        // If nights is being updated, validate 1 to 3 nights
        if (req.body.nights !== undefined) {
            const nightBookings = Number(req.body.nights);
            if (!Number.isInteger(nightBookings) || nightBookings < 1 || nightBookings > 3) {
                return res.status(400).json({
                    success: false,
                    message: 'The number of nights must be an integer between 1 and 3'
                });
            }
            req.body.nights = nightBookings;
        }

        if (req.body.bookingDate || req.body.date) {
            req.body.checkInDate = req.body.checkInDate || req.body.bookingDate || req.body.date;
        }

        // Recalculate checkOutDate if checkInDate or nights changed
        if (req.body.checkInDate || req.body.nights !== undefined) {
            const checkIn = req.body.checkInDate ? new Date(req.body.checkInDate) : booking.checkInDate;
            const n = req.body.nights !== undefined ? req.body.nights : booking.nights;
            req.body.checkOutDate = new Date(checkIn.getTime() + n * 24 * 60 * 60 * 1000);
        }

        // Prevent non-admin user from reassigning booking ownership
        if (req.user.role !== 'admin') {
            delete req.body.user;
        }

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: "Cannot update Booking" });
    }
};

//@desc     Delete booking
//@route    DELETE /api/v1/bookings/:id
//@access   Private
exports.deleteBookings = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to delete this booking` });
        }

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.log(error);
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }
        return res.status(500).json({ success: false, message: "Cannot delete Booking" });
    }
};

//@desc     Download PDF tax invoice for completed booking
//@route    GET /api/v1/bookings/:id/invoice
//@access   Private
exports.downloadInvoice = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'hotel',
                select: 'name address district province postalcode tel pricePerNight taxId'
            })
            .populate({
                path: 'user',
                select: 'name email tel'
            });

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        // Authorization check (must be booking owner or admin)
        if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to view this invoice`
            });
        }

        // Check if booking is completed
        if (booking.status !== 'Completed') {
            return res.status(400).json({
                success: false,
                message: `Invoice is only available for completed bookings. Current status is: ${booking.status}`
            });
        }

        const filename = `Invoice-${booking.transactionRef || booking._id}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        generateInvoicePDF(booking, res);
    } catch (error) {
        console.log(error);
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }
        return res.status(500).json({ success: false, message: "Cannot generate invoice" });
    }
};

//@desc     Trigger background cron job tasks manually (Admin only)
//@route    POST /api/v1/bookings/trigger-cron
//@access   Private (Admin)
exports.triggerCronJob = async (req, res, next) => {
    try {
        const result = await runBookingCronTasks();
        res.status(200).json({
            success: true,
            message: 'Cron job executed successfully',
            data: result
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Error triggering cron job" });
    }
};
