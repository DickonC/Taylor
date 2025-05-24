const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  garmentType: {
    type: String,
    required: true
  },
  measurements: {
    chestPitToPit: Number,
    chestAround: Number,
    shoulderToHem: Number,
    waist: Number,
    hip: Number
  },
  unit: {
    type: String,
    enum: ['cm', 'inches'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Measurement', measurementSchema);