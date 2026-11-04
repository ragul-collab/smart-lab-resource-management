const Equipment = require('../models/Equipment');
const Transaction = require('../models/Transaction');
const Maintenance = require('../models/Maintenance');

// @desc    Get dashboard statistics for current user role
// @route   GET /api/dashboard/stats
// @access  Private (any role)
const getStats = async (req, res, next) => {
  try {
    const now = new Date();

    if (req.user.role === 'staff') {
      const [
        totalEquipment,
        pendingRequests,
        returnRequests,
        overdue,
        inMaintenance,
        openMaintenance,
      ] = await Promise.all([
        Equipment.countDocuments({ isActive: true }),
        Transaction.countDocuments({ status: 'PENDING' }),
        Transaction.countDocuments({ status: 'RETURN_REQUESTED' }),
        Transaction.countDocuments({ status: 'ISSUED', dueDate: { $lt: now } }),
        Equipment.countDocuments({ isActive: true, status: 'IN_MAINTENANCE' }),
        Maintenance.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
      ]);

      const eqAgg = await Equipment.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalUnits: { $sum: '$totalQuantity' },
            availableUnits: { $sum: '$availableQuantity' },
          },
        },
      ]);

      const totalUnits = eqAgg.length > 0 ? eqAgg[0].totalUnits : 0;
      const availableUnits = eqAgg.length > 0 ? eqAgg[0].availableUnits : 0;

      const txAgg = await Transaction.aggregate([
        { $match: { status: { $in: ['ISSUED', 'RETURN_REQUESTED'] } } },
        {
          $group: {
            _id: null,
            issuedUnits: { $sum: '$quantity' },
          },
        },
      ]);

      const issuedUnits = txAgg.length > 0 ? txAgg[0].issuedUnits : 0;

      return res.status(200).json({
        success: true,
        data: {
          totalEquipment,
          totalUnits,
          availableUnits,
          issuedUnits,
          pendingRequests,
          returnRequests,
          overdue,
          inMaintenance,
          openMaintenance,
        },
      });
    }

    // Student role
    const [pending, issued, overdue, returned, rejected] = await Promise.all([
      Transaction.countDocuments({ student: req.user._id, status: 'PENDING' }),
      Transaction.countDocuments({
        student: req.user._id,
        status: { $in: ['ISSUED', 'RETURN_REQUESTED'] },
      }),
      Transaction.countDocuments({
        student: req.user._id,
        status: 'ISSUED',
        dueDate: { $lt: now },
      }),
      Transaction.countDocuments({ student: req.user._id, status: 'RETURNED' }),
      Transaction.countDocuments({ student: req.user._id, status: 'REJECTED' }),
    ]);

    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const dueSoonDocs = await Transaction.find({
      student: req.user._id,
      status: 'ISSUED',
      dueDate: { $gte: now, $lte: threeDaysFromNow },
    })
      .populate('equipment', 'name equipmentId')
      .sort({ dueDate: 1 });

    const dueSoon = dueSoonDocs.map((tx) => ({
      _id: tx._id,
      equipmentName: tx.equipment?.name || '—',
      equipmentId: tx.equipment?.equipmentId || '—',
      dueDate: tx.dueDate,
      quantity: tx.quantity,
    }));

    return res.status(200).json({
      success: true,
      data: {
        pending,
        issued,
        overdue,
        returned,
        rejected,
        dueSoon,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
};
