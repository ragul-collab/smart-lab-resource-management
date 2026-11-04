const Alert = require('../models/Alert');

// @desc    Get latest 50 alerts for current user
// @route   GET /api/alerts
// @access  Private (any logged-in user)
const getAlerts = async (req, res, next) => {
  try {
    const { unread } = req.query;

    const filter = {
      $or: [{ recipient: req.user._id }, { recipientRole: req.user.role }],
    };

    if (unread === 'true') {
      filter.readBy = { $ne: req.user._id };
    }

    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('equipment', 'name equipmentId')
      .populate('transaction', 'status');

    const userIdStr = req.user._id.toString();
    const formattedAlerts = alerts.map((alert) => {
      const alertObj = alert.toObject();
      alertObj.isRead = (alert.readBy || []).some(
        (id) => id.toString() === userIdStr
      );
      return alertObj;
    });

    return res.status(200).json({
      success: true,
      data: formattedAlerts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread alerts count for current user
// @route   GET /api/alerts/unread-count
// @access  Private (any logged-in user)
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Alert.countDocuments({
      $or: [{ recipient: req.user._id }, { recipientRole: req.user.role }],
      readBy: { $ne: req.user._id },
    });

    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all unread alerts for current user as read
// @route   PATCH /api/alerts/read-all
// @access  Private (any logged-in user)
const markAllRead = async (req, res, next) => {
  try {
    await Alert.updateMany(
      {
        $or: [{ recipient: req.user._id }, { recipientRole: req.user.role }],
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'All alerts marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a specific alert as read
// @route   PATCH /api/alerts/:id/read
// @access  Private (any logged-in user)
const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findOneAndUpdate(
      {
        _id: id,
        $or: [{ recipient: req.user._id }, { recipientRole: req.user.role }],
      },
      {
        $addToSet: { readBy: req.user._id },
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    const alertObj = alert.toObject();
    alertObj.isRead = true;

    return res.status(200).json({
      success: true,
      data: alertObj,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  getUnreadCount,
  markAllRead,
  markRead,
};
