const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedStaff = async () => {
  try {
    const { SEED_STAFF_NAME, SEED_STAFF_EMAIL, SEED_STAFF_PASSWORD, MONGO_URI } = process.env;

    if (!MONGO_URI) {
      console.error('Error: MONGO_URI is not defined in .env');
      process.exit(1);
    }

    if (!SEED_STAFF_NAME || !SEED_STAFF_EMAIL || !SEED_STAFF_PASSWORD) {
      console.error('Error: SEED_STAFF_NAME, SEED_STAFF_EMAIL, and SEED_STAFF_PASSWORD must be defined in .env');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for seeding staff');

    const email = SEED_STAFF_EMAIL.toLowerCase().trim();
    const existingStaff = await User.findOne({ email });

    if (existingStaff) {
      console.log(`Staff user with email "${email}" already exists. Skipping.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(SEED_STAFF_PASSWORD, salt);

    const staffUser = await User.create({
      name: SEED_STAFF_NAME.trim(),
      email,
      password: hashedPassword,
      role: 'staff',
    });

    console.log(`Staff user created successfully: ${staffUser.email} (Role: ${staffUser.role})`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding staff user: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedStaff();
