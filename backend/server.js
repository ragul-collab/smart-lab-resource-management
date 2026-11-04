require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { startJobs } = require('./jobs/overdueJob');

const PORT = process.env.PORT || 5000;

// Connect to Database and start scheduled jobs
connectDB().then(() => {
  startJobs();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
