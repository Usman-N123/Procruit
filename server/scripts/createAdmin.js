const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../server/models/User');

dotenv.config();

if (!process.env.MONGO_URI) {
    // Fallback: try loading from parent directory if running from scripts/
    dotenv.config({ path: '../.env' });
}

if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI not found in .env file');
    process.exit(1);
}

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/procruit'); // Default if env missing
        console.log('MongoDB Connected');

        const email = process.argv[2]; // Get email from command line arg

        if (!email) {
            console.log('No email provided. Usage: node scripts/createAdmin.cjs <email>');
            console.log('--- Available Users ---');
            const users = await User.find().limit(5).select('name email role');
            if (users.length === 0) console.log('No users found in database.');
            users.forEach(u => console.log(`${u.email} (${u.name}) - ${u.role}`));
            process.exit(1);
        }

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = 'ADMIN';
        await user.save();

        console.log(`Success! User ${user.name} (${user.email}) is now a System Admin.`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createAdmin();
