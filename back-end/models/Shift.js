const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  shift_id: Number,          // e.g. 1
  shift_name: String,        // e.g. "Morning Shift"
  schedule: String,          // e.g. "06:00 - 14:00"
}, { timestamps: true });

shiftSchema.plugin(require('../lib/softDelete').softDelete, { identity: 'shift_id' });
module.exports = mongoose.model('Shift', shiftSchema, 'shifts');
