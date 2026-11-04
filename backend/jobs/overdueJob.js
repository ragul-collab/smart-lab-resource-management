const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const Maintenance = require('../models/Maintenance');
const createAlert = require('../utils/createAlert');

/**
 * Runs overdue transactions check and upcoming maintenance check once.
 */
async function runJobsOnce() {
  const now = new Date();

  // 1. Find overdue transactions
  const overdueTransactions = await Transaction.find({
    status: 'ISSUED',
    dueDate: { $lt: now },
    overdueNotified: false,
  })
    .populate('student', 'name')
    .populate('equipment', 'name equipmentId');

  for (const tx of overdueTransactions) {
    tx.isOverdue = true;
    tx.overdueNotified = true;
    await tx.save();

    const eqName = tx.equipment?.name || 'equipment';
    const studentName = tx.student?.name || 'student';

    // Alert to student
    await createAlert({
      recipient: tx.student?._id || tx.student,
      type: 'OVERDUE',
      message: `Your borrowed equipment ${eqName} is overdue`,
      equipment: tx.equipment?._id || tx.equipment,
      transaction: tx._id,
    });

    // Alert to staff
    await createAlert({
      recipientRole: 'staff',
      type: 'OVERDUE',
      message: `Equipment ${eqName} issued to ${studentName} is overdue`,
      equipment: tx.equipment?._id || tx.equipment,
      transaction: tx._id,
    });
  }

  // 2. Find maintenance records with status OPEN and scheduledDate on or before tomorrow
  const tomorrowEnd = new Date();
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const dueMaintenanceRecords = await Maintenance.find({
    status: 'OPEN',
    scheduledDate: { $lte: tomorrowEnd },
    dueNotified: false,
  }).populate('equipment', 'name equipmentId');

  for (const record of dueMaintenanceRecords) {
    record.dueNotified = true;
    await record.save();

    const eqName = record.equipment?.name || 'equipment';
    await createAlert({
      recipientRole: 'staff',
      type: 'MAINTENANCE_DUE',
      message: `Maintenance is due for ${eqName} (${record.type})`,
      equipment: record.equipment?._id || record.equipment,
    });
  }

  return {
    overdueCount: overdueTransactions.length,
    maintenanceCount: dueMaintenanceRecords.length,
  };
}

/**
 * Starts cron schedules.
 */
function startJobs() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Running daily overdue & maintenance checks (08:00 AM)...');
    try {
      const result = await runJobsOnce();
      console.log(`[CRON] Completed: ${result.overdueCount} overdue transactions, ${result.maintenanceCount} maintenance alerts.`);
    } catch (err) {
      console.error('[CRON] Error during daily check:', err.message || err);
    }
  });
  console.log('[CRON] Overdue & maintenance jobs scheduled for 08:00 AM daily.');
}

module.exports = {
  startJobs,
  runJobsOnce,
};
