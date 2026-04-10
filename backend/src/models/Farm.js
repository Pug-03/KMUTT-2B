const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, default: '' },
  contact: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

farmSchema.index({ name: 1 });

module.exports = mongoose.model('Farm', farmSchema);
