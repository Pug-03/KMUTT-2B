const mongoose = require('mongoose');

const farmBatchSchema = new mongoose.Schema({
  farmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
  dateFrom: { type: Date, required: true },
  dateTo: { type: Date, required: true },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

farmBatchSchema.index({ farmId: 1 });
farmBatchSchema.index({ dateFrom: 1, dateTo: 1 });

module.exports = mongoose.model('FarmBatch', farmBatchSchema);
