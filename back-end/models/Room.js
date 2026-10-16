const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  room_number: Number,
  floor: Number,
  type_id: Number,
  status: String,            // "Occupied", "Vacant", "Maintenance"
  housekeeping: String,      // "Clean", "Dirty", "In Progress", "Inspected"
  room_type_name: String,    // e.g. "Standard", "Deluxe", "Suite"
  assigned_to: String,       // name of housekeeping staff assigned
  priority: Boolean,         // true = needs urgent attention
  notes: String,             // shift notes / special instructions
  last_cleaned: Date,        // timestamp of last clean
}, { timestamps: true });

roomSchema.plugin(require('../lib/softDelete').softDelete, { identity: 'room_number' });
module.exports = mongoose.model('Room', roomSchema, 'rooms');
