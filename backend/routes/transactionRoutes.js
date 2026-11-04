const express = require('express');
const { body, param } = require('express-validator');
const {
  requestEquipment,
  getMyTransactions,
  cancelRequest,
  requestReturn,
  getAllTransactions,
  approveRequest,
  rejectRequest,
  confirmReturn,
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All transaction routes require authentication
router.use(protect);

const requestValidation = [
  body('equipmentId').isMongoId().withMessage('Valid equipment ID is required'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be an integer of at least 1'),
  body('expectedReturnDate')
    .notEmpty()
    .withMessage('Expected return date is required')
    .isISO8601()
    .withMessage('Expected return date must be a valid date')
    .custom((value) => {
      const returnDate = new Date(value);
      const now = new Date();
      if (returnDate <= now) {
        throw new Error('Expected return date must be in the future');
      }
      const maxAllowed = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      if (returnDate > maxAllowed) {
        throw new Error('Expected return date cannot exceed 14 days from today');
      }
      return true;
    }),
  validate,
];

const rejectValidation = [
  param('id').isMongoId().withMessage('Invalid transaction ID'),
  body('reason').trim().notEmpty().withMessage('Rejection reason is required'),
  validate,
];

const confirmReturnValidation = [
  param('id').isMongoId().withMessage('Invalid transaction ID'),
  body('returnCondition')
    .isIn(['GOOD', 'FAIR', 'NEEDS_REPAIR'])
    .withMessage('Return condition must be GOOD, FAIR, or NEEDS_REPAIR'),
  validate,
];

const idParamValidation = [
  param('id').isMongoId().withMessage('Invalid transaction ID'),
  validate,
];

// Student routes (Put /request and /my before /:id routes)
router.post('/request', authorize('student'), requestValidation, requestEquipment);
router.get('/my', authorize('student'), getMyTransactions);
router.patch('/:id/cancel', authorize('student'), idParamValidation, cancelRequest);
router.patch('/:id/return-request', authorize('student'), idParamValidation, requestReturn);

// Staff routes
router.get('/', authorize('staff'), getAllTransactions);
router.patch('/:id/approve', authorize('staff'), idParamValidation, approveRequest);
router.patch('/:id/reject', authorize('staff'), rejectValidation, rejectRequest);
router.patch('/:id/confirm-return', authorize('staff'), confirmReturnValidation, confirmReturn);

module.exports = router;
