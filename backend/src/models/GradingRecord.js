const mongoose = require('mongoose');

const gradingRecordSchema = new mongoose.Schema({
  fruitType: { type: String, required: true },
  grade: { type: String, enum: ['damaged', 'old', 'ripe', 'unripe'], required: true },
  confidence: { type: Number, min: 0, max: 1 },
  modelUsed: { type: String, default: 'default' },
  timestamp: { type: Date, default: Date.now },
});

gradingRecordSchema.index({ timestamp: -1 });
gradingRecordSchema.index({ grade: 1 });

module.exports = mongoose.model('GradingRecord', gradingRecordSchema);
