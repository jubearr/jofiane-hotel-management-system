const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  txn_id: String,            // e.g. "TXN-9021"
  type: String,              // "charge" | "payment" | "refund" (inferred if absent)
  datetime: String,          // e.g. "2026-08-10 09:14:00"
  description: String,
  amount: String,            // stored as string e.g. "14,700.00" ("-2,100.00" for refunds)
  payment_method: String,    // "Credit Card", "Cash", "Room Charge", etc.
  payment_details: String,   // e.g. "Visa ....4242"
  status: String,            // "COMPLETED", "PENDING", "VOIDED"
  deleted_at: { type: Date, default: null },
  deleted_by: { type: String, default: null },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  booking_id: String,        // e.g. "BKG-8001"
  room_number: String,       // e.g. "304"
  status: String,            // "Checked In", "Confirmed", "Checked Out", "No Show", "Cancelled"
  source: String,            // "Direct", "Booking.com", "Expedia", "Agoda", "Walk-in"

  dates: {
    check_in: String,        // "YYYY-MM-DD"
    check_out: String,       // "YYYY-MM-DD"
    nights: String,          // stored as string e.g. "3"
  },

  guest: {
    guest_id: String,
    full_name: String,
    email: String,
    phone: String,
  },

  billing: {
    expected_total: String,  // e.g. "25,500.00"
    total_paid: String,
    balance_due: String,
  },

  transactions: [transactionSchema],

  // Populated when a booking is cancelled by staff
  cancellation: {
    cancelled_by: String,    // e.g. "Ana Buenaflor" or "System"
    cancelled_at: String,    // ISO datetime string
    reason: String,          // "Guest request", "No-show", "OTA cancellation", etc.
    penalty_applied: Boolean,
    penalty_amount: String,  // e.g. "2,500.00" — stored as string like billing fields
  },
}, { timestamps: true });

bookingSchema.plugin(require('../lib/softDelete').softDelete, { identity: 'booking_id' });

// KEEP ARCHIVE DATA INTACT 
bookingSchema.set('toJSON', { transform(doc, ret) {
  if (ret.transactions) ret.transactions = ret.transactions.filter(t => !t.deleted_at);
  return ret;
} });
module.exports = mongoose.model('Booking', bookingSchema, 'bookings');
