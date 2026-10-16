const mongoose = require('mongoose');

const housekeepingLogSchema = new mongoose.Schema({
  log_id: Number,           // auto-incremented sequence
  room_number: String,      // e.g. "203"
  category: String,         // "Room Note", "Room Status", "Priority", "DND", "Maintenance", "Lost & Found", "Shift Handover"
  description: String,      // the note text
  employee: String,         // name of the staff who logged it
  datetime: Date,           // when the log was created
}, { timestamps: true });

housekeepingLogSchema.plugin(require('../lib/softDelete').softDelete, { identity: 'log_id' });
module.exports = mongoose.model('HousekeepingLog', housekeepingLogSchema, 'housekeeping_logs');
