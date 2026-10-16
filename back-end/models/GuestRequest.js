const mongoose = require('mongoose');

const guestRequestSchema = new mongoose.Schema({
  request_id: Number,          // e.g. 1
  booking_id: String,          // references bookings.booking_id
  room_number: Number,         // references rooms.room_number
  employee_id: Number,         // references employees.employee_id
  request_type: String,        // e.g. "Extra Towels", "Extra Pillow"
  description: String,
  priority: String,            // "LOW", "NORMAL", "HIGH", "URGENT"
  status: String,              // "PENDING", "IN PROGRESS", "COMPLETED", "CANCELLED"
  requested_at: Date,
  completed_at: Date,
  notes: String
}, { timestamps: true });

guestRequestSchema.plugin(require('../lib/softDelete').softDelete, { identity: 'request_id' });
module.exports = mongoose.model('GuestRequest', guestRequestSchema, 'guest_requests');
