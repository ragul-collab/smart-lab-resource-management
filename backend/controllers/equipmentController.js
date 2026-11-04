const QRCode = require('qrcode');
const Equipment = require('../models/Equipment');
const Transaction = require('../models/Transaction');
const escapeRegex = require('../utils/escapeRegex');

// @desc    Create new equipment
// @route   POST /api/equipment
// @access  Private/Staff
const createEquipment = async (req, res, next) => {
  try {
    const {
      equipmentId,
      name,
      category,
      description,
      location,
      totalQuantity,
      condition,
      status,
    } = req.body;

    const formattedId = equipmentId.trim().toUpperCase();

    const existing = await Equipment.findOne({ equipmentId: formattedId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Equipment ID already exists',
      });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const qrPayload = `${clientUrl}/equipment/${formattedId}`;

    const equipment = await Equipment.create({
      equipmentId: formattedId,
      name: name.trim(),
      category: category.trim(),
      description: description ? description.trim() : '',
      location: location.trim(),
      totalQuantity: parseInt(totalQuantity, 10),
      availableQuantity: parseInt(totalQuantity, 10),
      condition: condition || 'GOOD',
      status: status || 'AVAILABLE',
      qrPayload,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get equipment list with filters, search, pagination
// @route   GET /api/equipment
// @access  Private (any logged-in user)
const getEquipmentList = async (req, res, next) => {
  try {
    const { search, category, condition, availability, page, limit } = req.query;

    const filter = { isActive: true };

    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ name: regex }, { equipmentId: regex }];
    }

    if (category && category.trim()) {
      filter.category = category.trim();
    }

    if (condition && condition.trim()) {
      filter.condition = condition.trim();
    }

    if (availability === 'available') {
      filter.availableQuantity = { $gt: 0 };
      filter.status = 'AVAILABLE';
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);
    const skip = (pageNum - 1) * limitNum;

    const [total, items] = await Promise.all([
      Equipment.countDocuments(filter),
      Equipment.find(filter)
        .sort({ name: 1 })
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

// @desc    Get distinct list of categories
// @route   GET /api/equipment/categories
// @access  Private (any logged-in user)
const getCategories = async (req, res, next) => {
  try {
    const categories = await Equipment.distinct('category', { isActive: true });
    categories.sort((a, b) => a.localeCompare(b));

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get equipment by equipmentId (case-insensitive)
// @route   GET /api/equipment/code/:equipmentId
// @access  Private (any logged-in user)
const getEquipmentByEquipmentId = async (req, res, next) => {
  try {
    const { equipmentId } = req.params;

    const regex = new RegExp(`^${escapeRegex(equipmentId.trim())}$`, 'i');
    const equipment = await Equipment.findOne({ equipmentId: regex, isActive: true });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update equipment (by _id)
// @route   PUT /api/equipment/:id
// @access  Private/Staff
const updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const equipment = await Equipment.findOne({ _id: id, isActive: true });
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    const { name, category, description, location, condition, totalQuantity } = req.body;

    if (totalQuantity !== undefined) {
      const newTotal = parseInt(totalQuantity, 10);
      const diff = newTotal - equipment.totalQuantity;
      const newAvailable = equipment.availableQuantity + diff;

      if (newAvailable < 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot reduce below issued quantity',
        });
      }

      equipment.totalQuantity = newTotal;
      equipment.availableQuantity = newAvailable;
    }

    if (name !== undefined) equipment.name = name.trim();
    if (category !== undefined) equipment.category = category.trim();
    if (description !== undefined) equipment.description = description.trim();
    if (location !== undefined) equipment.location = location.trim();
    if (condition !== undefined) equipment.condition = condition;

    await equipment.save();

    return res.status(200).json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete equipment (soft delete)
// @route   DELETE /api/equipment/:id
// @access  Private/Staff
const deleteEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const equipment = await Equipment.findOne({ _id: id, isActive: true });
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    const hasActiveTransactions = await Transaction.exists({
      equipment: id,
      status: { $in: ['PENDING', 'ISSUED', 'RETURN_REQUESTED'] },
    });

    if (hasActiveTransactions) {
      return res.status(409).json({
        success: false,
        message: 'Equipment has active transactions',
      });
    }

    equipment.isActive = false;
    equipment.status = 'RETIRED';
    await equipment.save();

    return res.status(200).json({
      success: true,
      data: {
        message: 'Equipment retired successfully',
        id: equipment._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get equipment QR code data URL
// @route   GET /api/equipment/:id/qr
// @access  Private/Staff
const getEquipmentQr = async (req, res, next) => {
  try {
    const { id } = req.params;

    const equipment = await Equipment.findOne({ _id: id, isActive: true });
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    const payload = equipment.qrPayload || `${process.env.CLIENT_URL || 'http://localhost:5173'}/equipment/${equipment.equipmentId}`;
    const qrDataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 2 });

    return res.status(200).json({
      success: true,
      data: {
        qrDataUrl,
        payload,
        equipmentId: equipment.equipmentId,
        name: equipment.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEquipment,
  getEquipmentList,
  getCategories,
  getEquipmentByEquipmentId,
  updateEquipment,
  deleteEquipment,
  getEquipmentQr,
};
