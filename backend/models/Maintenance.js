const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true,
    },
    type: {
      type: String,
      enum: ['REPAIR', 'CALIBRATION', 'SERVICE'],
      required: true,
    },
    issue: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED'],
      default: 'OPEN',
    },
    markedUnavailable: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    dueNotified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

maintenanceSchema.index({ equipment: 1, status: 1 });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
