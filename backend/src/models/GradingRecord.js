const mongoose = require('mongoose');

const gradingRecordSchema = new mongoose.Schema({
  fruitType: { type: String, required: true },
  grade: { type: String, enum: ['gradeA', 'gradeB', 'gradeC', 'unripe', 'rotten', 'wilted'], required: true },
  confidence: { type: Number, min: 0, max: 1 },
  defect: { type: String, enum: ['crack', 'blackSpot', 'bruise', 'spoilage', null], default: null },
  modelUsed: { type: String, default: 'default' },
  farmOrigin: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
});

gradingRecordSchema.index({ timestamp: -1 });
gradingRecordSchema.index({ grade: 1 });

module.exports = mongoose.model('GradingRecord', gradingRecordSchema);
