const mongoose = require('mongoose');

const cleaningTaskSchema = new mongoose.Schema({
  task_id: Number,             // e.g. 1
  room_number: Number,         // references rooms.room_number
  employee_id: Number,         // references employees.employee_id
  assigned_name: String,       // denormalized cleaner name for display
  task_type: String,           // e.g. "Checkout Cleaning", "Stayover Cleaning"
  priority: String,            // "LOW", "NORMAL", "HIGH", "URGENT"
  status: String,              // "PENDING", "IN PROGRESS", "COMPLETED"
  scheduled_date: Date,        // ISODate
  notes: String
}, { timestamps: true });

cleaningTaskSchema.plugin(require('../lib/softDelete').softDelete, { identity: 'task_id' });
module.exports = mongoose.model('CleaningTask', cleaningTaskSchema, 'cleaning_tasks');
