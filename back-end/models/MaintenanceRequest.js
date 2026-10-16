const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  maintenance_id: Number,      // e.g. 1
  room_number: Number,         // references rooms.room_number
  reported_by: Number,         // references employees.employee_id
  assigned_to: Number,         // references employees.employee_id
  assigned_to_name: String,    // denormalized name for display
  issue_type: String,          // e.g. "Plumbing", "Electrical", "Air Conditioning"
  description: String,
  priority: String,            // "LOW", "NORMAL", "HIGH", "URGENT"
  status: String,              // "PENDING", "IN PROGRESS", "COMPLETED"
  room_out_of_order: Boolean,  // true = room removed from available inventory
  reported_at: Date,
  completed_at: Date,
  notes: String,
  history: [{                  // audit trail of status changes
    date:   String,
    action: String,
    by:     String,
  }],
}, { timestamps: true });

maintenanceRequestSchema.plugin(require('../lib/softDelete').softDelete, { identity: 'maintenance_id' });
module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema, 'maintenance_requests');
