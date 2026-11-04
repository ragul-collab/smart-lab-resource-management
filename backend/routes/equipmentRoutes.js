const express = require('express');
const { body, param } = require('express-validator');
const {
  createEquipment,
  getEquipmentList,
  getCategories,
  getEquipmentByEquipmentId,
  updateEquipment,
  deleteEquipment,
  getEquipmentQr,
} = require('../controllers/equipmentController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const createEquipmentValidation = [
  body('equipmentId').trim().notEmpty().withMessage('Equipment ID is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('totalQuantity').isInt({ min: 1 }).withMessage('Total quantity must be a positive integer'),
  body('condition')
    .optional()
    .isIn(['GOOD', 'FAIR', 'NEEDS_REPAIR'])
    .withMessage('Condition must be GOOD, FAIR, or NEEDS_REPAIR'),
  body('status')
    .optional()
    .isIn(['AVAILABLE', 'IN_MAINTENANCE', 'RETIRED'])
    .withMessage('Status must be AVAILABLE, IN_MAINTENANCE, or RETIRED'),
  validate,
];

const updateEquipmentValidation = [
  param('id').isMongoId().withMessage('Invalid equipment ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('totalQuantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total quantity must be a positive integer'),
  body('condition')
    .optional()
    .isIn(['GOOD', 'FAIR', 'NEEDS_REPAIR'])
    .withMessage('Condition must be GOOD, FAIR, or NEEDS_REPAIR'),
  body('status')
    .optional()
    .isIn(['AVAILABLE', 'IN_MAINTENANCE', 'RETIRED'])
    .withMessage('Status must be AVAILABLE, IN_MAINTENANCE, or RETIRED'),
  validate,
];

// All routes are protected
router.use(protect);

// Public to any logged-in user
router.get('/', getEquipmentList);
router.get('/categories', getCategories);
router.get('/code/:equipmentId', getEquipmentByEquipmentId);

// Staff-only management routes
router.get(
  '/:id/qr',
  authorize('staff'),
  [param('id').isMongoId().withMessage('Invalid equipment ID'), validate],
  getEquipmentQr
);
router.post('/', authorize('staff'), createEquipmentValidation, createEquipment);
router.put('/:id', authorize('staff'), updateEquipmentValidation, updateEquipment);
router.delete(
  '/:id',
  authorize('staff'),
  [param('id').isMongoId().withMessage('Invalid equipment ID'), validate],
  deleteEquipment
);

module.exports = router;
