const express = require('express');
const { param, query } = require('express-validator');
const {
  getAlerts,
  getUnreadCount,
  markAllRead,
  markRead,
} = require('../controllers/alertController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All alert routes are protected
router.use(protect);

// Specific routes before :id
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);

// Alert list
router.get(
  '/',
  [
    query('unread').optional().isBoolean().withMessage('unread filter must be boolean'),
    validate,
  ],
  getAlerts
);

// Individual alert action
router.patch(
  '/:id/read',
  [param('id').isMongoId().withMessage('Invalid alert ID'), validate],
  markRead
);

module.exports = router;
