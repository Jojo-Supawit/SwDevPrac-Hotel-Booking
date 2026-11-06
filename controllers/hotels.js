const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');

//@desc     Get all hotels (optionally filtered by query or radius)
//@route    GET /api/v1/hotels
//@access   Public
exports.getHotels = async (req, res, next) => {
    let query;

    const reqQuery = { ...req.query };

    const removeFields = ['select', 'sort', 'page', 'limit', 'lat', 'lng', 'distance'];
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    const filterObj = JSON.parse(queryStr);

    // Support query params radius filtering (?lat=...&lng=...&distance=...)
    if (req.query.lat && req.query.lng && req.query.distance) {
        const latitude = parseFloat(req.query.lat);
        const longitude = parseFloat(req.query.lng);
        const dist = parseFloat(req.query.distance);

        if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(dist) && dist > 0) {
            const earthRadius = 6378.1;
            const radius = dist / earthRadius;
            filterObj.location = {
                $geoWithin: {
                    $centerSphere: [[longitude, latitude], radius]
                }
            };
        }
    }

    // Do NOT populate bookings publicly to keep user transactions confidential
    query = Hotel.find(filterObj);

    // Select fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }
    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Hotel.countDocuments(filterObj);

    query = query.skip(startIndex).limit(limit);
    try {
        const hotels = await query;

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({ success: true, count: hotels.length, pagination, data: hotels });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

//@desc     Get a hotel
//@route    GET /api/v1/hotels/:id
//@access   Public
exports.getHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({ success: false, message: `Hotel not found with id of ${req.params.id}` });
        }

        res.status(200).json({ success: true, data: hotel });
    } catch (err) {
        res.status(400).json({ success: false, message: `Hotel not found with id of ${req.params.id}` });
    }
};

//@desc     Get hotels within a specified radius (in km)
//@route    GET /api/v1/hotels/radius/:lat/:lng/:distance
//@access   Public
exports.getHotelsInRadius = async (req, res, next) => {
    const { lat, lng, distance } = req.params;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const dist = parseFloat(distance);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(dist) || dist <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Please provide valid latitude, longitude, and distance (> 0)'
        });
    }

    // Earth Radius = 6,378.1 km
    const earthRadius = 6378.1;
    const radius = dist / earthRadius;

    try {
        const hotels = await Hotel.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[longitude, latitude], radius]
                }
            }
        });

        res.status(200).json({
            success: true,
            count: hotels.length,
            data: hotels
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

//@desc     Create a hotel
//@route    POST /api/v1/hotels
//@access   Private (Admin)
exports.createHotel = async (req, res, next) => {
    try {
        // Construct GeoJSON Point if lat and lng provided
        const lat = req.body.lat !== undefined ? req.body.lat : req.body.latitude;
        const lng = req.body.lng !== undefined ? req.body.lng : req.body.longitude;
        if (lat !== undefined && lng !== undefined) {
            req.body.location = {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)],
                formattedAddress: req.body.address
            };
        }

        const hotel = await Hotel.create(req.body);
        res.status(201).json({ success: true, data: hotel });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

//@desc     Update a hotel
//@route    PUT /api/v1/hotels/:id
//@access   Private (Admin)
exports.updateHotel = async (req, res, next) => {
    try {
        // Construct GeoJSON Point if lat and lng provided
        const lat = req.body.lat !== undefined ? req.body.lat : req.body.latitude;
        const lng = req.body.lng !== undefined ? req.body.lng : req.body.longitude;
        if (lat !== undefined && lng !== undefined) {
            req.body.location = {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)],
                formattedAddress: req.body.address
            };
        }

        const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!hotel) {
            return res.status(404).json({ success: false, message: `Hotel not found with id of ${req.params.id}` });
        }

        res.status(200).json({ success: true, data: hotel });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

//@desc     Delete a hotel
//@route    DELETE /api/v1/hotels/:id
//@access   Private (Admin)
exports.deleteHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({ success: false, message: `Hotel not found with id of ${req.params.id}` });
        }

        await Booking.deleteMany({ hotel: req.params.id });
        await Hotel.deleteOne({ _id: req.params.id });

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
