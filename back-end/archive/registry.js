const models = Object.fromEntries(['Booking', 'Employee', 'Room', 'RoomType', 'Shift', 'ShiftAssignment', 'GuestRequest', 'CleaningTask', 'LostAndFound', 'MaintenanceRequest', 'HousekeepingLog', 'Audit'].map(name => [name, require(`../models/${name}`)]));
const definitions = [
  ['bookings', 'Reservations', 'Booking', 'booking_id', 'status'],
  ['guests', 'Guests (reservation records)', 'Booking', 'booking_id', 'status', 'Guest details are embedded in reservations. Restoring or deleting here affects the entire reservation, including its ledger.'],
  ['transactions', 'Transactions (voided only)', 'Booking', 'txn_id', 'status', 'Only voided ledger entries can be archived. Restore the parent reservation first if it is archived.'],
  ['employees', 'Employees', 'Employee', 'employee_id', 'employment_details.status'],
  ['rooms', 'Rooms', 'Room', 'room_number', 'status'],
  ['room_types', 'Room types', 'RoomType', 'type_id'],
  ['shifts', 'Shifts', 'Shift', 'shift_id'],
  ['shift_assignments', 'Shift assignments', 'ShiftAssignment', 'assignment_id', 'status'],
  ['guest_requests', 'Guest requests', 'GuestRequest', 'request_id', 'status'],
  ['cleaning_tasks', 'Cleaning tasks', 'CleaningTask', 'task_id', 'status'],
  ['lost_and_found', 'Lost and found', 'LostAndFound', 'item_id', 'status'],
  ['maintenance_requests', 'Maintenance requests', 'MaintenanceRequest', 'maintenance_id', 'status'],
  ['housekeeping_logs', 'Housekeeping logs', 'HousekeepingLog', 'log_id'],
  ['front_desk_logs', 'Front desk logs', 'Audit', 'audit_id', 'status', 'Financial audit records and the archive security journal cannot be deleted here.'],
];
const excluded = new Set(['_id', '__v', 'deleted_at', 'deleted_by', 'archive_revision', 'auth_version', 'portal_access.password', 'photo']);
const registry = new Map(definitions.map(([key, label, name, identity, status, note]) => {
  const model = models[name];
  const schema = key === 'transactions' ? model.schema.path('transactions').schema : model.schema;
  const columns = Object.keys(schema.paths).filter(path => !excluded.has(path)).map(path => ({
    key: path, label: path.replace(/[._]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()),
    type: schema.path(path).instance,
  }));
  if (key === 'transactions') columns.unshift({ key: 'booking_id', label: 'Booking ID' }, { key: 'guest_name', label: 'Guest' }, { key: 'room_number', label: 'Room' });
  return [key, { key, label, model, identity, status, note: note || '', columns, scope: key === 'front_desk_logs' ? { audit_id: /^LOG-/ } : {} }];
}));
const aliases = { reservations: 'bookings', audits: 'front_desk_logs' };
function categoryFor(name) {
  const key = typeof name === 'string' ? name.replace(/-/g, '_') : '';
  return registry.get(Object.hasOwn(aliases, key) ? aliases[key] : key);
}
module.exports = { registry, models, categoryFor };
