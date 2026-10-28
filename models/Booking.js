const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    checkInDate: {
        type: Date,
        required: [true, 'Please add a check-in date']
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

module.exports = mongoose.model('Booking', BookingSchema);
