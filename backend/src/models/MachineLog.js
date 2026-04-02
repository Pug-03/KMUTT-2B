const mongoose = require('mongoose');

const machineLogSchema = new mongoose.Schema({
  machineId: { type: String, required: true },
  action: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

machineLogSchema.index({ machineId: 1, timestamp: -1 });

module.exports = mongoose.model('MachineLog', machineLogSchema);
