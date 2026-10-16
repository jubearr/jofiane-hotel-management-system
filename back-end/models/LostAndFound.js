const mongoose = require('mongoose');

const lostAndFoundSchema = new mongoose.Schema({
  item_id: Number,             // e.g. 1
  item_name: String,           // e.g. "Black Wallet"
  description: String,
  room_number: Number,         // references rooms.room_number
  location_found: String,      // e.g. "Room 304", "Hotel Lobby"
  employee_id: Number,         // references employees.employee_id
  found_date: Date,
  status: String,              // "UNCLAIMED", "CLAIMED", "RETURNED", "DISPOSED"
  claimed_by: String,
  claimed_date: Date,
  notes: String
}, { timestamps: true });

lostAndFoundSchema.plugin(require('../lib/softDelete').softDelete, { identity: 'item_id' });
module.exports = mongoose.model('LostAndFound', lostAndFoundSchema, 'lost_and_found');
