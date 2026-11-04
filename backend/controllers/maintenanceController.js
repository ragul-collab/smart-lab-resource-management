const Maintenance = require('../models/Maintenance');
const Equipment = require('../models/Equipment');
const createAlert = require('../utils/createAlert');

// @desc    Create new maintenance record
// @route   POST /api/maintenance
// @access  Private/Staff
const createMaintenance = async (req, res, next) => {
  try {
    const { equipment, type, issue, scheduledDate, markUnavailable } = req.body;

    const equipmentDoc = await Equipment.findOne({ _id: equipment, isActive: true });
    if (!equipmentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found or inactive',
      });
    }

    const existingRecord = await Maintenance.findOne({
      equipment,
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
    });

    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: 'Equipment already has an active maintenance record',
      });
    }

    const isMarkedUnavailable = Boolean(markUnavailable);

    if (isMarkedUnavailable) {
      equipmentDoc.status = 'IN_MAINTENANCE';
      await equipmentDoc.save();
    }

    const maintenance = await Maintenance.create({
      equipment,
      type,
      issue: issue.trim(),
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      status: 'OPEN',
      markedUnavailable: isMarkedUnavailable,
      createdBy: req.user._id,
    });

    await maintenance.populate('equipment', 'name equipmentId');

    await createAlert({
      recipientRole: 'staff',
      type: 'MAINTENANCE_CREATED',
      message: `Maintenance scheduled for ${maintenance.equipment?.name || equipmentDoc.name} (${maintenance.type})`,
      equipment: maintenance.equipment?._id || maintenance.equipment,
    });

    return res.status(201).json({
      success: true,
      data: maintenance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get maintenance records with filters and pagination
// @route   GET /api/maintenance
// @access  Private/Staff
const getMaintenance = async (req, res, next) => {
  try {
    const { status, equipment, page, limit } = req.query;

    const filter = {};

    if (status && status.trim()) {
      filter.status = status.trim();
    }

    if (equipment && equipment.trim()) {
      filter.equipment = equipment.trim();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, items] = await Promise.all([
      Maintenance.countDocuments(filter),
      Maintenance.find(filter)
        .populate('equipment', 'name equipmentId')
        .populate('createdBy', 'name')
        .populate('completedBy', 'name')
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

// @desc    Update maintenance record status to IN_PROGRESS
// @route   PATCH /api/maintenance/:id/status
// @access  Private/Staff
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const record = await Maintenance.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found',
      });
    }

    if (status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Status can only be updated to IN_PROGRESS',
      });
    }

    if (record.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        message: 'Status can only be updated to IN_PROGRESS from OPEN',
      });
    }

    record.status = 'IN_PROGRESS';
    await record.save();

    await record.populate('equipment', 'name equipmentId');

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete maintenance record
// @route   PATCH /api/maintenance/:id/complete
// @access  Private/Staff
const completeMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks, condition } = req.body;

    const record = await Maintenance.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found',
      });
    }

    if (!['OPEN', 'IN_PROGRESS'].includes(record.status)) {
      return res.status(409).json({
        success: false,
        message: 'Record must be OPEN or IN_PROGRESS to complete',
      });
    }

    record.status = 'COMPLETED';
    record.completedAt = new Date();
    record.completedBy = req.user._id;
    if (remarks !== undefined) {
      record.remarks = remarks ? remarks.trim() : '';
    }
    await record.save();

    const equipmentDoc = await Equipment.findById(record.equipment);
    if (equipmentDoc) {
      if (condition) {
        equipmentDoc.condition = condition;
      }
      if (equipmentDoc.status === 'IN_MAINTENANCE') {
        equipmentDoc.status = 'AVAILABLE';
      }
      await equipmentDoc.save();
    }

    await record.populate('equipment', 'name equipmentId');

    await createAlert({
      recipientRole: 'staff',
      type: 'MAINTENANCE_COMPLETED',
      message: `Maintenance completed for ${record.equipment?.name || equipmentDoc?.name || 'equipment'} (${record.remarks || condition || 'COMPLETED'})`,
      equipment: record.equipment?._id || record.equipment,
    });

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMaintenance,
  getMaintenance,
  updateStatus,
  completeMaintenance,
};
