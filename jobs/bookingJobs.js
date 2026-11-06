const cron = require('node-cron');
const Booking = require('../models/Booking');
const sendEmail = require('../utils/sendEmail');

/**
 * Core function executed by Cron Job (can also be invoked manually)
 */
const runBookingCronTasks = async () => {
    const now = new Date();
    console.log(`[CRON JOB RUNNING] ${now.toISOString()}`);

    let transitionedCount = 0;
    let remindersSentCount = 0;

    try {
        // 1. Auto-transition booking statuses:
        // Transition confirmed bookings whose check-out date has passed to 'Completed'
        const expiredBookings = await Booking.find({
            status: 'Confirmed',
            checkOutDate: { $lte: now }
        });

        for (const booking of expiredBookings) {
            booking.status = 'Completed';
            await booking.save();
            transitionedCount++;
        }

        // 2. Send 24-hour check-in reminder emails:
        // Window: check-in date is between now and now + 24 hours
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const upcomingBookings = await Booking.find({
            status: 'Confirmed',
            reminderEmailSent: false,
            checkInDate: { $gte: now, $lte: next24Hours }
        }).populate({
            path: 'hotel',
            select: 'name address province tel'
        }).populate({
            path: 'user',
            select: 'name email tel'
        });

        for (const booking of upcomingBookings) {
            if (booking.user && booking.user.email) {
                const hotelName = booking.hotel ? booking.hotel.name : 'Your Booked Hotel';
                const hotelAddress = booking.hotel ? `${booking.hotel.address}, ${booking.hotel.province}` : '';
                const hotelTel = booking.hotel ? booking.hotel.tel : '';
                const checkInDateStr = new Date(booking.checkInDate).toISOString().split('T')[0];

                try {
                    await sendEmail({
                        email: booking.user.email,
                        subject: `Check-in Reminder: Your stay at ${hotelName}`,
                        message: `Dear ${booking.user.name},\n\nThis is a friendly reminder that your upcoming stay at ${hotelName} is scheduled for check-in on ${checkInDateStr}.\n\nBooking Details:\n- Booking Reference: ${booking.transactionRef}\n- Check-in Date: ${checkInDateStr}\n- Duration: ${booking.nights} night(s)\n- Hotel Address: ${hotelAddress}\n- Hotel Telephone: ${hotelTel}\n\nWe look forward to welcoming you!\n\nBest regards,\n${hotelName} Team`
                    });

                    booking.reminderEmailSent = true;
                    await booking.save();
                    remindersSentCount++;
                } catch (emailErr) {
                    console.error(`Failed to send reminder to ${booking.user.email}:`, emailErr.message);
                }
            }
        }

        console.log(`[CRON JOB FINISHED] Transitioned: ${transitionedCount} | Reminders sent: ${remindersSentCount}`);
        return {
            success: true,
            transitionedCount,
            remindersSentCount
        };
    } catch (err) {
        console.error('[CRON JOB ERROR]', err.message);
        return {
            success: false,
            error: err.message
        };
    }
};

/**
 * Initialize background cron scheduler
 */
const initCronJobs = (cronSchedule = process.env.CRON_SCHEDULE || '*/10 * * * *') => {
    console.log(`Cron scheduler initialized with schedule: "${cronSchedule}"`);
    cron.schedule(cronSchedule, () => {
        runBookingCronTasks();
    });
};

module.exports = {
    runBookingCronTasks,
    initCronJobs
};
