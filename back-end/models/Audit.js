const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  audit_id: String,          // e.g. "AUD-001"
  datetime: String,          // e.g. "2026-08-10 22:05:00"
  action_type: String,       // e.g. "Day Close Executed"
  description: String,       // e.g. "End-of-day process completed. All folios posted."
  user_id: String,           // e.g. "System" or employee name/id
  status: String,            // "BALANCED", "VARIANCE", "APPROVED", "COMPLETED"
}, { timestamps: true });

auditSchema.plugin(require('../lib/softDelete').softDelete, { identity: 'audit_id' });
module.exports = mongoose.model('Audit', auditSchema, 'audits');
