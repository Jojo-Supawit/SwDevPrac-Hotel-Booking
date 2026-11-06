const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    checkInDate: {
        type: Date,
        required: [true, 'Please add a check-in date']
    },
    checkOutDate: {
        type: Date
    },
    nights: {
        type: Number,
        required: [true, 'Please add the number of nights'],
        min: [1, 'A booking must be at least 1 night'],
        max: [3, 'A booking cannot exceed 3 nights'],
        validate: {
            validator: Number.isInteger,
            message: 'The number of nights must be an integer'
        }
    },
    status: {
        type: String,
        enum: ['Confirmed', 'Completed', 'Cancelled', 'No-Show'],
        default: 'Confirmed'
    },
    transactionRef: {
        type: String,
        unique: true,
        sparse: true
    },
    reminderEmailSent: {
        type: Boolean,
        default: false
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    hotel: {
        type: mongoose.Schema.ObjectId,
        ref: 'Hotel',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to calculate checkOutDate and assign unique transactionRef
BookingSchema.pre('save', function (next) {
    if (this.checkInDate && this.nights) {
        this.checkOutDate = new Date(new Date(this.checkInDate).getTime() + this.nights * 24 * 60 * 60 * 1000);
    }
    if (!this.transactionRef) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.transactionRef = `HB-TXN-${timestamp}-${rand}`;
    }
});

module.exports = mongoose.model('Booking', BookingSchema);
