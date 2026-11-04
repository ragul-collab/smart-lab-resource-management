const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createMaintenance,
  getMaintenance,
  updateStatus,
  completeMaintenance,
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All maintenance routes are staff-only and protected
router.use(protect);
router.use(authorize('staff'));

const createValidation = [
  body('equipment').isMongoId().withMessage('Valid equipment ID is required'),
  body('type')
    .isIn(['REPAIR', 'CALIBRATION', 'SERVICE'])
    .withMessage('Type must be REPAIR, CALIBRATION, or SERVICE'),
  body('issue').trim().notEmpty().withMessage('Issue is required'),
  body('scheduledDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('Invalid scheduled date'),
  body('markUnavailable')
    .optional()
    .isBoolean()
    .withMessage('markUnavailable must be a boolean'),
  validate,
];

const getValidation = [
  query('status')
    .optional()
    .isIn(['OPEN', 'IN_PROGRESS', 'COMPLETED'])
    .withMessage('Invalid status filter'),
  query('equipment').optional().isMongoId().withMessage('Invalid equipment ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
  validate,
];

const updateStatusValidation = [
  param('id').isMongoId().withMessage('Invalid maintenance ID'),
  body('status').equals('IN_PROGRESS').withMessage('Status must be IN_PROGRESS'),
  validate,
];

const completeValidation = [
  param('id').isMongoId().withMessage('Invalid maintenance ID'),
  body('condition')
    .isIn(['GOOD', 'FAIR', 'NEEDS_REPAIR'])
    .withMessage('Condition must be GOOD, FAIR, or NEEDS_REPAIR'),
  body('remarks').optional().trim(),
  validate,
];

router.post('/', createValidation, createMaintenance);
router.get('/', getValidation, getMaintenance);
router.patch('/:id/status', updateStatusValidation, updateStatus);
router.patch('/:id/complete', completeValidation, completeMaintenance);

module.exports = router;
