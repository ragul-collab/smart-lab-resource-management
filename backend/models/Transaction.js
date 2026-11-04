const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    purpose: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ISSUED', 'RETURN_REQUESTED', 'RETURNED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    issuedAt: {
      type: Date,
    },
    returnRequestedAt: {
      type: Date,
    },
    returnedAt: {
      type: Date,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    returnCondition: {
      type: String,
      trim: true,
    },
    returnRemarks: {
      type: String,
      trim: true,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    isOverdue: {
      type: Boolean,
      default: false,
    },
    overdueNotified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ student: 1, status: 1 });
transactionSchema.index({ status: 1, dueDate: 1 });
transactionSchema.index({ equipment: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
