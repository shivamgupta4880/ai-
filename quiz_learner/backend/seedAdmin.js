const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    await User.findOneAndDelete({ email: 'nitishkumarpandey05@gmail.com' });

    await User.create({
        name: 'Admin',
        email: 'nitishkumarpandey05@gmail.com',
        password: 'Ashish@123@',
        role: 'admin',
    });

    console.log('Admin created/updated successfully');
    process.exit(0);
};

seedAdmin().catch((err) => { console.error(err); process.exit(1); });
