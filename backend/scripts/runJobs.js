const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('../models/User');
require('../models/Equipment');
require('../models/Transaction');
require('../models/Maintenance');
require('../models/Alert');
const mongoose = require('mongoose');
const { runJobsOnce } = require('../jobs/overdueJob');

async function main() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-lab';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for running jobs once.');

    const result = await runJobsOnce();
    console.log(`Jobs completed successfully: ${result.overdueCount} overdue alerts sent, ${result.maintenanceCount} maintenance due alerts sent.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error running jobs:', err.message || err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

main();
