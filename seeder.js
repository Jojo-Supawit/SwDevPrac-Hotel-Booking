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

// Mock Hotels (5 in Bangkok, 1 in Pattaya to test spatial radius boundaries)
const hotels = [
    {
        name: 'The Grand Palace Hotel Bangkok',
        address: '123 Sukhumvit Road',
        district: 'Khlong Toei',
        province: 'Bangkok',
        postalcode: '10110',
        tel: '02-1234567',
        region: 'Bangkok',
        location: {
            type: 'Point',
            coordinates: [100.560417, 13.736717], // [lng, lat]
            formattedAddress: '123 Sukhumvit Road, Bangkok'
        },
        pricePerNight: 1800,
        taxId: '0105559876543'
    },
    {
        name: 'Mandarin Oriental Bangkok',
        address: '48 Oriental Avenue',
        district: 'Bang Rak',
        province: 'Bangkok',
        postalcode: '10500',
        tel: '02-6599000',
        region: 'Bangkok',
        location: {
            type: 'Point',
            coordinates: [100.514700, 13.723700],
            formattedAddress: '48 Oriental Avenue, Bang Rak, Bangkok'
        },
        pricePerNight: 3500,
        taxId: '0105559876544'
    },
    {
        name: 'Hilton Sukhumvit Bangkok',
        address: '11 Sukhumvit Soi 24',
        district: 'Khlong Toei',
        province: 'Bangkok',
        postalcode: '10110',
        tel: '02-6206666',
        region: 'Bangkok',
        location: {
            type: 'Point',
            coordinates: [100.569400, 13.729700],
            formattedAddress: '11 Sukhumvit Soi 24, Bangkok'
        },
        pricePerNight: 2200,
        taxId: '0105559876545'
    },
    {
        name: 'Centara Grand at CentralWorld',
        address: '999/99 Rama 1 Road',
        district: 'Pathum Wan',
        province: 'Bangkok',
        postalcode: '10330',
        tel: '02-1001234',
        region: 'Bangkok',
        location: {
            type: 'Point',
            coordinates: [100.538900, 13.748300],
            formattedAddress: '999/99 Rama 1 Road, Pathum Wan, Bangkok'
        },
        pricePerNight: 2500,
        taxId: '0105559876546'
    },
    {
        name: 'Bangkok Marriott Marquis Queen\'s Park',
        address: '199 Sukhumvit Soi 22',
        district: 'Khlong Toei',
        province: 'Bangkok',
        postalcode: '10110',
        tel: '02-0595555',
        region: 'Bangkok',
        location: {
            type: 'Point',
            coordinates: [100.564500, 13.731700],
            formattedAddress: '199 Sukhumvit Soi 22, Bangkok'
        },
        pricePerNight: 2800,
        taxId: '0105559876547'
    },
    {
        name: 'Hilton Pattaya Resort',
        address: '333/101 Moo 9',
        district: 'Bang Lamung',
        province: 'Chonburi',
        postalcode: '20260',
        tel: '038-253000',
        region: 'Eastern',
        location: {
            type: 'Point',
            coordinates: [100.884200, 12.936000], // Pattaya, ~100 km away from Bangkok
            formattedAddress: '333/101 Moo 9, Pattaya, Chonburi'
        },
        pricePerNight: 3200,
        taxId: '0105559876548'
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

        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        // Sample Bookings across various lifecycle states:
        // 1. Completed booking (ready for immediate PDF invoice download)
        // 2. Upcoming stay within 24h (ready for reminder email check)
        // 3. Future booking (> 24h away)
        // 4. Past checkout booking with 'Confirmed' status (ready to transition to 'Completed' via Cron)
        const bookings = [
            {
                checkInDate: new Date(now - 5 * oneDay),
                checkOutDate: new Date(now - 3 * oneDay),
                nights: 2,
                status: 'Completed',
                transactionRef: 'HB-TXN-COMPLETED-001',
                reminderEmailSent: true,
                user: createdUsers[0]._id, // John Doe
                hotel: createdHotels[0]._id // The Grand Palace Hotel
            },
            {
                checkInDate: new Date(now + 12 * 60 * 60 * 1000), // 12 hours from now (<24h)
                checkOutDate: new Date(now + 12 * 60 * 60 * 1000 + 3 * oneDay),
                nights: 3,
                status: 'Confirmed',
                transactionRef: 'HB-TXN-REMINDER-002',
                reminderEmailSent: false,
                user: createdUsers[0]._id, // John Doe
                hotel: createdHotels[1]._id // Mandarin Oriental
            },
            {
                checkInDate: new Date(now + 10 * oneDay), // 10 days from now
                checkOutDate: new Date(now + 11 * oneDay),
                nights: 1,
                status: 'Confirmed',
                transactionRef: 'HB-TXN-FUTURE-003',
                reminderEmailSent: false,
                user: createdUsers[1]._id, // Jane Smith
                hotel: createdHotels[2]._id // Hilton Sukhumvit
            },
            {
                checkInDate: new Date(now - 3 * oneDay),
                checkOutDate: new Date(now - 1 * oneDay), // Ended yesterday
                nights: 2,
                status: 'Confirmed', // Will auto-transition to 'Completed' via Cron job
                transactionRef: 'HB-TXN-EXPIRED-004',
                reminderEmailSent: true,
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
