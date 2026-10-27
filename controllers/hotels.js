const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');

//@desc     Get all hotels
//route     GET /api/v1/hotels
//access    Public
exports.getHotels = async (req,res,next)=>{
    let query

    const reqQuery = {...req.query};

    const removeFields = ['select', 'sort', 'page', 'limit'];

    removeFields.forEach(param=>delete reqQuery[param]);
    console.log(reqQuery);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match=>`$${match}`);

    query = Hotel.find(JSON.parse(queryStr)).populate('bookings');

    //Select fields
    if(req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }
    //Sort
    if(req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt')
    }
    //Pagination
    const page = parseInt(req.query.page, 10)||1;
    const limit = parseInt(req.query.limit, 10)||25;
    const startIndex = (page-1)*limit;
    const endIndex = page*limit;
    const total = await Hotel.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);
    try{
        const hotels = await query;

        //Pagination result;
        const pagination = {};

        if(endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            }
        }

        if(startIndex > 0) {
            pagination.prev = {
                page:page - 1,
                limit
            }
        }

        res.status(200).json({success:true, count:hotels.length, pagination, data:hotels});
    } catch(err) {
        res.status(400).json({success:false});
    }
    
}

//@desc     Get a hotel
//@route    GET /api/v1/hotels/:id
//@access   Public
exports.getHotel = async (req,res,next)=>{
    try{
        const hotel = await Hotel.findById(req.params.id);

        if(!hotel) {
            return res.status(400).json({success:false});
        }

        res.status(200).json({success:true, data:hotel});
    } catch(err) {
        res.status(400).json({success:false});
    }
}

//@desc     Create a hotel
//@route    POST /api/v1/hotels
//@access   Private
exports.createHotel = async (req,res,next)=>{
    const hotel = await Hotel.create(req.body);
    res.status(201).json({success:true, data:hotel});
}

//@desc     Update a hotel
//@route    PUT /api/v1/hotels/:id
//@access   Private
exports.updateHotel = async (req,res,next)=>{
    try{
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if(!hotel) {
            return res.status(400).json({success:false});
        }

        res.status(200).json({success:true, data:hotel});
    } catch(err) {
        res.status(400).json({success:false});
    }
}

//@desc     Delete a hotel
//route     DELETE /api/v1/hotels/:id
//access    Private
exports.deleteHotel = async (req,res,next)=>{
    try{
        const hotel = await Hotel.findById(req.params.id);

        if(!hotel) {
            return res.status(404).json({success:false, message:`Hotel not found with id of ${req.params.id}`});
        }

        await Booking.deleteMany({hotel: req.params.id});
        await Hotel.deleteOne({ _id: req.params.id});

        res.status(200).json({success:true, data: {}});
    } catch(err) {
        res.status(400).json({success:false});
    }
}