const mongoose = require('mongoose');

const shiftAssignmentSchema = new mongoose.Schema({
  assignment_id: Number,     // e.g. 1
  employee_id: Number,       // references employees.employee_id
  shift_date: Date,          // ISODate e.g. 2026-08-24T00:00:00.000Z
  shift_id: Number,          // references shifts.shift_id
  status: String,            // "PUBLISHED", "DRAFT", "CANCELLED"
}, { timestamps: true });

shiftAssignmentSchema.plugin(require('../lib/softDelete').softDelete, { identity: 'assignment_id' });
shiftAssignmentSchema.index({ employee_id: 1, shift_date: 1 }, { name: 'active_employee_day_unique', unique: true, partialFilterExpression: { deleted_at: null, employee_id: { $type: 'number' }, shift_date: { $type: 'date' } } });
module.exports = mongoose.model('ShiftAssignment', shiftAssignmentSchema, 'shift_assignments');
