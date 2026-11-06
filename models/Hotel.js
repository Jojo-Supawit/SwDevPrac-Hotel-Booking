const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxLength: [50, 'Name can not be more than 50 characters']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    district: {
        type: String,
        required: [true, 'Please add a district']
    },
    province: {
        type: String,
        required: [true, 'Please add a province']
    },
    postalcode: {
        type: String,
        required: [true, 'Please add a postalcode'],
        maxLength: [5, 'Postal Code can not be more than 5 digits']
    },
    tel: {
        type: String,
        required: [true, 'Please add a telephone number'],
        trim: true
    },
    region: {
        type: String,
        required: [true, 'Please add a region']
    },
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number] // [longitude, latitude]
        },
        formattedAddress: String
    },
    pricePerNight: {
        type: Number,
        default: 1500
    },
    taxId: {
        type: String,
        default: '0105559876543'
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// Create 2dsphere index for geospatial queries
HotelSchema.index({ location: '2dsphere' });

// Reverse populate with virtuals
HotelSchema.virtual('bookings', {
    ref: 'Booking',
    localField: '_id',
    foreignField: 'hotel',
    justOne: false
});

module.exports = mongoose.model('Hotel', HotelSchema);
