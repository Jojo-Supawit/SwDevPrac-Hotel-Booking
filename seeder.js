const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Load models
const Hotel = require('./models/Hotel');
const Booking = require('./models/Booking');
const User = require('./models/User');

// Connect to DB
mongoose.connect(process.env.MONGO_URI, { dbName: 'HotelBooking' });

// Mock Users
const users = [
    {
        name: 'John Doe',
        email: 'user@gmail.com',
        tel: '0812345678',
        role: 'user',
        password: 'password123'
    },
    {
        name: 'Jane Smith',
        email: 'jane@gmail.com',
        tel: '0823456789',
        role: 'user',
        password: 'password123'
    },
    {
        name: 'Admin Hotel',
        email: 'admin@gmail.com',
        tel: '0899999999',
        role: 'admin',
        password: 'password123'
    }
];

// Mock Hotels
const hotels = [
    {
        name: 'The Grand Palace Hotel Bangkok',
        address: '123 Sukhumvit Road',
        district: 'Khlong Toei',
        province: 'Bangkok',
        postalcode: '10110',
        tel: '02-1234567',
        region: 'Bangkok'
    },
    {
        name: 'Mandarin Oriental Bangkok',
        address: '48 Oriental Avenue',
        district: 'Bang Rak',
        province: 'Bangkok',
        postalcode: '10500',
        tel: '02-6599000',
        region: 'Bangkok'
    },
    {
        name: 'Hilton Sukhumvit Bangkok',
        address: '11 Sukhumvit Soi 24',
        district: 'Khlong Toei',
        province: 'Bangkok',
        postalcode: '10110',
        tel: '02-6206666',
        region: 'Bangkok'
    },
    {
        name: 'Centara Grand at CentralWorld',
        address: '999/99 Rama 1 Road',
        district: 'Pathum Wan',
        province: 'Bangkok',
        postalcode: '10330',
        tel: '02-1001234',
        region: 'Bangkok'
    },
    {
        name: 'Bangkok Marriott Marquis Queen\'s Park',
        address: '199 Sukhumvit Soi 22',
        district: 'Khlong Toei',
        province: 'Bangkok',
        postalcode: '10110',
        tel: '02-0595555',
        region: 'Bangkok'
    }
];

// Import into DB
const importData = async () => {
    try {
        // Clear existing data
        await Booking.deleteMany();
        await Hotel.deleteMany();
        await User.deleteMany();

        // Create Users (using create so pre('save') hashes password)
        const createdUsers = await User.create(users);
        console.log(`Created ${createdUsers.length} users.`);

        // Create Hotels
        const createdHotels = await Hotel.create(hotels);
        console.log(`Created ${createdHotels.length} hotels.`);

        // Create Sample Bookings linking created users & hotels
        const bookings = [
            {
                checkInDate: new Date('2026-11-15'),
                nights: 2,
                user: createdUsers[0]._id, // John Doe
                hotel: createdHotels[0]._id // The Grand Palace Hotel
            },
            {
                checkInDate: new Date('2026-12-01'),
                nights: 3,
                user: createdUsers[0]._id, // John Doe
                hotel: createdHotels[1]._id // Mandarin Oriental
            },
            {
                checkInDate: new Date('2026-11-20'),
                nights: 1,
                user: createdUsers[1]._id, // Jane Smith
                hotel: createdHotels[2]._id // Hilton Sukhumvit
            },
            {
                checkInDate: new Date('2026-12-10'),
                nights: 2,
                user: createdUsers[1]._id, // Jane Smith
                hotel: createdHotels[3]._id // Centara Grand
            }
        ];

        const createdBookings = await Booking.create(bookings);
        console.log(`Created ${createdBookings.length} bookings.`);

        console.log('\nData Imported Successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

// Delete data
const deleteData = async () => {
    try {
        await Booking.deleteMany();
        await Hotel.deleteMany();
        await User.deleteMany();

        console.log('Data Destroyed Successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

if (process.argv[2] === '-i') {
    importData();
} else if (process.argv[2] === '-d') {
    deleteData();
} else {
    console.log('Please run with -i to import data or -d to destroy data');
    process.exit();
}
