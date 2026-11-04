const Transaction = require('../models/Transaction');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const escapeRegex = require('../utils/escapeRegex');
const createAlert = require('../utils/createAlert');

// @desc    Student requests equipment
// @route   POST /api/transactions/request
// @access  Private/Student
const requestEquipment = async (req, res, next) => {
  try {
    const { equipmentId, quantity = 1, purpose, expectedReturnDate } = req.body;

    const parsedQuantity = parseInt(quantity, 10);
    if (!parsedQuantity || parsedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be an integer of at least 1',
      });
    }

    if (!expectedReturnDate) {
      return res.status(400).json({
        success: false,
        message: 'Expected return date is required',
      });
    }

    const returnDate = new Date(expectedReturnDate);
    const now = new Date();

    if (isNaN(returnDate.getTime()) || returnDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'Expected return date must be in the future',
      });
    }

    const maxAllowedDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (returnDate > maxAllowedDate) {
      return res.status(400).json({
        success: false,
        message: 'Expected return date cannot exceed 14 days from today',
      });
    }

    // Equipment must exist, isActive, status AVAILABLE, and availableQuantity >= quantity
    const equipment = await Equipment.findOne({ _id: equipmentId, isActive: true });
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    if (equipment.status !== 'AVAILABLE') {
      return res.status(409).json({
        success: false,
        message: `Equipment is currently ${equipment.status}`,
      });
    }

    if (equipment.availableQuantity < parsedQuantity) {
      return res.status(409).json({
        success: false,
        message: 'Insufficient available quantity for request',
      });
    }

    // Block if this student already has an open transaction (PENDING, ISSUED, RETURN_REQUESTED)
    const existingActive = await Transaction.findOne({
      student: req.user._id,
      equipment: equipmentId,
      status: { $in: ['PENDING', 'ISSUED', 'RETURN_REQUESTED'] },
    });

    if (existingActive) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active request or transaction for this equipment',
      });
    }

    // Create with status PENDING and dueDate = expectedReturnDate (stock unchanged)
    const transaction = await Transaction.create({
      student: req.user._id,
      equipment: equipmentId,
      quantity: parsedQuantity,
      purpose: purpose ? purpose.trim() : '',
      status: 'PENDING',
      requestedAt: now,
      dueDate: returnDate,
    });

    await transaction.populate('student', 'name registerNumber department');
    await transaction.populate('equipment', 'name equipmentId location');

    await createAlert({
      recipientRole: 'staff',
      type: 'NEW_REQUEST',
      message: `${transaction.student?.name || req.user.name} requested ${transaction.quantity} x ${transaction.equipment?.name || equipment.name}`,
      equipment: equipment._id,
      transaction: transaction._id,
    });

    return res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in student's transactions
// @route   GET /api/transactions/my
// @access  Private/Student
const getMyTransactions = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;

    const filter = { student: req.user._id };
    if (status && status.trim()) {
      filter.status = status.trim();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, items] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .populate('student', 'name registerNumber department')
        .populate('equipment', 'name equipmentId location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const pages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student cancels own PENDING request
// @route   PATCH /api/transactions/:id/cancel
// @access  Private/Student
const cancelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({ _id: id, student: req.user._id });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(409).json({
        success: false,
        message: `Cannot cancel transaction with status ${transaction.status}. Only PENDING requests can be cancelled.`,
      });
    }

    transaction.status = 'CANCELLED';
    await transaction.save();

    await transaction.populate('student', 'name registerNumber department');
    await transaction.populate('equipment', 'name equipmentId location');

    await createAlert({
      recipientRole: 'staff',
      type: 'REQUEST_CANCELLED',
      message: `Request for ${transaction.equipment?.name || 'equipment'} was cancelled by ${transaction.student?.name || 'student'}`,
      equipment: transaction.equipment?._id || transaction.equipment,
      transaction: transaction._id,
    });

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student requests return for ISSUED transaction
// @route   PATCH /api/transactions/:id/return-request
// @access  Private/Student
const requestReturn = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({ _id: id, student: req.user._id });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    if (transaction.status !== 'ISSUED') {
      return res.status(409).json({
        success: false,
        message: `Cannot request return for transaction with status ${transaction.status}. Only ISSUED items can be returned.`,
      });
    }

    transaction.status = 'RETURN_REQUESTED';
    transaction.returnRequestedAt = new Date();
    await transaction.save();

    await transaction.populate('student', 'name registerNumber department');
    await transaction.populate('equipment', 'name equipmentId location');

    await createAlert({
      recipientRole: 'staff',
      type: 'RETURN_REQUESTED',
      message: `Return requested for ${transaction.equipment?.name || 'equipment'} by ${transaction.student?.name || 'student'}`,
      equipment: transaction.equipment?._id || transaction.equipment,
      transaction: transaction._id,
    });

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Staff gets all transactions with filters
// @route   GET /api/transactions
// @access  Private/Staff
const getAllTransactions = async (req, res, next) => {
  try {
    const { status, student, equipment, from, to, page, limit } = req.query;

    const filter = {};

    if (status && status.trim()) {
      filter.status = status.trim();
    }

    if (equipment && equipment.trim()) {
      filter.equipment = equipment.trim();
    }

    if (student && student.trim()) {
      const regex = new RegExp(escapeRegex(student.trim()), 'i');
      const matchedUsers = await User.find({
        $or: [{ name: regex }, { registerNumber: regex }],
      }).select('_id');
      const userIds = matchedUsers.map((u) => u._id);
      filter.student = { $in: userIds };
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) {
          filter.createdAt.$gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) {
          filter.createdAt.$lte = toDate;
        }
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, items] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .populate('student', 'name registerNumber department')
        .populate('equipment', 'name equipmentId location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const pages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Staff approves PENDING request
// @route   PATCH /api/transactions/:id/approve
// @access  Private/Staff
const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(409).json({
        success: false,
        message: `Cannot approve transaction with status ${transaction.status}. Only PENDING requests can be approved.`,
      });
    }

    // Atomically decrease stock
    const updatedEquipment = await Equipment.findOneAndUpdate(
      {
        _id: transaction.equipment,
        status: 'AVAILABLE',
        isActive: true,
        availableQuantity: { $gte: transaction.quantity },
      },
      {
        $inc: { availableQuantity: -transaction.quantity },
      },
      { new: true }
    );

    if (!updatedEquipment) {
      return res.status(409).json({
        success: false,
        message: 'Insufficient stock or equipment unavailable',
      });
    }

    // Update transaction; if save fails, revert stock
    try {
      transaction.status = 'ISSUED';
      transaction.issuedAt = new Date();
      transaction.approvedBy = req.user._id;
      await transaction.save();
    } catch (saveError) {
      await Equipment.updateOne(
        { _id: transaction.equipment },
        { $inc: { availableQuantity: transaction.quantity } }
      );
      throw saveError;
    }

    await transaction.populate('student', 'name registerNumber department');
    await transaction.populate('equipment', 'name equipmentId location');

    await createAlert({
      recipient: transaction.student?._id || transaction.student,
      type: 'REQUEST_APPROVED',
      message: `Your request for ${transaction.equipment?.name || 'equipment'} has been approved`,
      equipment: transaction.equipment?._id || transaction.equipment,
      transaction: transaction._id,
    });

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Staff rejects PENDING request
// @route   PATCH /api/transactions/:id/reject
// @access  Private/Staff
const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(409).json({
        success: false,
        message: `Cannot reject transaction with status ${transaction.status}. Only PENDING requests can be rejected.`,
      });
    }

    transaction.status = 'REJECTED';
    transaction.rejectionReason = reason ? reason.trim() : '';
    await transaction.save();

    await transaction.populate('student', 'name registerNumber department');
    await transaction.populate('equipment', 'name equipmentId location');

    const rejectReasonStr = transaction.rejectionReason ? `: ${transaction.rejectionReason}` : '';
    await createAlert({
      recipient: transaction.student?._id || transaction.student,
      type: 'REQUEST_REJECTED',
      message: `Your request for ${transaction.equipment?.name || 'equipment'} was rejected${rejectReasonStr}`,
      equipment: transaction.equipment?._id || transaction.equipment,
      transaction: transaction._id,
    });

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Staff confirms return
// @route   PATCH /api/transactions/:id/confirm-return
// @access  Private/Staff
const confirmReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { returnCondition, remarks } = req.body;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    if (transaction.status !== 'RETURN_REQUESTED') {
      return res.status(409).json({
        success: false,
        message: `Cannot confirm return for transaction with status ${transaction.status}. Only RETURN_REQUESTED transactions can be confirmed.`,
      });
    }

    // Increase stock capped at totalQuantity using an aggregation pipeline update
    await Equipment.updateOne(
      { _id: transaction.equipment },
      [
        {
          $set: {
            availableQuantity: {
              $min: [
                '$totalQuantity',
                { $add: ['$availableQuantity', transaction.quantity] },
              ],
            },
          },
        },
      ]
    );

    // If returnCondition is NEEDS_REPAIR also set equipment.condition to NEEDS_REPAIR
    if (returnCondition === 'NEEDS_REPAIR') {
      await Equipment.updateOne(
        { _id: transaction.equipment },
        { condition: 'NEEDS_REPAIR' }
      );
    }

    const returnedAt = new Date();
    transaction.status = 'RETURNED';
    transaction.returnedAt = returnedAt;
    transaction.receivedBy = req.user._id;
    transaction.returnCondition = returnCondition;
    transaction.returnRemarks = remarks ? remarks.trim() : '';
    transaction.isLate = Boolean(transaction.dueDate && returnedAt > new Date(transaction.dueDate));

    await transaction.save();

    await transaction.populate('student', 'name registerNumber department');
    await transaction.populate('equipment', 'name equipmentId location');

    await createAlert({
      recipient: transaction.student?._id || transaction.student,
      type: 'RETURN_CONFIRMED',
      message: `Return confirmed for ${transaction.equipment?.name || 'equipment'} (${transaction.returnCondition || 'GOOD'})`,
      equipment: transaction.equipment?._id || transaction.equipment,
      transaction: transaction._id,
    });

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestEquipment,
  getMyTransactions,
  cancelRequest,
  requestReturn,
  getAllTransactions,
  approveRequest,
  rejectRequest,
  confirmReturn,
};
