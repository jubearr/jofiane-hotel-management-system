const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const service = require('../archive/service');
const { models, categoryFor } = require('../archive/registry');
const { containsArchiveFields, purgeQuery } = require('../lib/softDelete');

const id = '507f1f77bcf86cd799439011';
const patches = [];
function patch(object, key, value) { const original = object[key]; object[key] = value; patches.push(() => { object[key] = original; }); }
afterEach(() => { while (patches.length) patches.pop()(); });
const query = value => ({ session() { return this; }, withArchived() { return this; }, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });
const rejectsStatus = status => error => error.status === status;

test('categories are allowlisted; aliases work without arbitrary collection access', () => {
  assert.equal(categoryFor('reservations').key, 'bookings');
  assert.equal(categoryFor('shift-assignments').key, 'shift_assignments');
  for (const key of ['__proto__', 'constructor', 'archive_events', '$where', 'sessions']) assert.throws(() => service.getCategory(key), rejectsStatus(400));
});
test('IDs must be ObjectIds, with an explicit transaction reference for embedded rows', () => {
  assert.equal(service.recordKey(categoryFor('bookings'), id).parentId, id);
  assert.equal(service.recordKey(categoryFor('transactions'), `${id}:TXN-1`).txnId, 'TXN-1');
  for (const bad of ['x', '', {}, `${id}:`]) assert.throws(() => service.recordKey(categoryFor('transactions'), bad), rejectsStatus(400));
});
test('archive fields and token revocation counters cannot be submitted through generic writes', () => {
  for (const payload of [{ deleted_at: null }, { $unset: { 'guest.deleted_at': '' } }, { transactions: [{ deleted_by: 'x' }] }, { auth_version: 0 }, { $inc: { archive_revision: 5 } }]) assert.equal(containsArchiveFields(payload), true);
  assert.equal(containsArchiveFields({ description: 'deleted_at is mentioned as plain text' }), false);
});
test('filters use literal search, correct numeric matching, pagination limits, and Philippine calendar days', () => {
  const options = service.listOptions({ search: '304', from: '2026-10-01', to: '2026-10-04', page: '2' }, categoryFor('rooms'));
  assert.ok(options.filter.$or.some(filter => filter.room_number === 304));
  assert.ok(!options.filter.$or.some(filter => filter.room_number?.$regex));
  assert.equal(options.filter.deleted_at.$gte.toISOString(), '2026-09-30T16:00:00.000Z');
  assert.equal(options.filter.deleted_at.$lte.toISOString(), '2026-10-04T15:59:59.999Z');
  assert.equal(options.page, 2);
  assert.equal(service.listOptions({ search: '.*' }, categoryFor('bookings')).filter.$or[0].booking_id.$regex, '\\.\\*');
  for (const input of [{ page: '0' }, { limit: '101' }, { from: '2026-02-30' }, { from: '2026-10-04', to: '2026-10-01' }, { status: {} }, { search: ['x'] }]) assert.throws(() => service.listOptions(input, categoryFor('rooms')), rejectsStatus(400));
});
test('employee archive payload excludes credentials and internal counters', () => {
  const row = service.safeRow({ _id: id, full_name: 'Sample Staff', portal_access: { username: 'sample', password: 'SECRET' }, auth_version: 10, archive_revision: 5 }, categoryFor('employees'));
  assert.equal(row.full_name, 'Sample Staff');
  assert.equal(row['portal_access.username'], 'sample');
  assert.ok(!JSON.stringify(row).includes('SECRET'));
  assert.equal(row.auth_version, undefined);
});

for (const method of ['find', 'findOne', 'countDocuments', 'distinct', 'updateOne', 'updateMany', 'findOneAndUpdate']) {
  test(`real mongoose ${method} middleware applies active-only scope`, async () => {
    let seen;
    const result = method === 'find' ? { toArray: async () => [] } : method === 'countDocuments' ? 0 : method === 'distinct' ? [] : method.startsWith('update') ? { matchedCount: 1 } : null;
    patch(models.Room.collection, method, async filter => { seen = filter; return result; });
    if (method === 'distinct') {
      patch(models.Room.collection, method, async (field, filter) => { seen = filter; return []; });
      await models.Room.distinct('status', {});
    } else if (method.includes('Update') || method.startsWith('update')) await models.Room[method]({}, { $set: { notes: 'Test' } });
    else await models.Room[method]({});
    assert.equal(seen.deleted_at, null);
  });
}
test('only explicit internal queries can retrieve archived data', async () => {
  let seen;
  patch(models.Room.collection, 'find', async filter => { seen = filter; return { toArray: async () => [] }; });
  await models.Room.find({ deleted_at: { $ne: null } }).withArchived();
  assert.deepEqual(seen.deleted_at, { $ne: null });
});
test('aggregation excludes archived parents before grouping', async () => {
  let pipeline;
  patch(models.Booking.collection, 'aggregate', value => { pipeline = value; return { toArray: async () => [] }; });
  await models.Booking.aggregate([{ $group: { _id: '$status' } }]);
  assert.deepEqual(pipeline[0], { $match: { deleted_at: null } });
});
test('missed legacy destructive operations fail closed', async () => {
  for (const method of ['deleteOne', 'deleteMany', 'findOneAndDelete']) await assert.rejects(models.Room[method]({ _id: id }).exec(), /restricted to the archive/);
  await assert.rejects(new models.Room({ _id: id }).deleteOne(), /restricted to the archive/);
  await assert.rejects(models.Room.bulkWrite([{ deleteOne: { filter: { _id: id } } }]), /restricted to the archive/);
});
test('only the archive service capability permits a physical delete', async () => {
  let seen;
  patch(models.Room.collection, 'deleteOne', async filter => { seen = filter; return { deletedCount: 1 }; });
  await purgeQuery(models.Room.deleteOne({ _id: id, deleted_at: { $ne: null } }));
  assert.deepEqual(seen.deleted_at, { $ne: null });
});
test('standard booking JSON hides archived transactions without removing stored ledger entries', () => {
  const booking = new models.Booking({ transactions: [{ txn_id: 'live' }, { txn_id: 'archived', deleted_at: new Date() }] });
  assert.equal(booking.toJSON().transactions.length, 1);
  assert.equal(booking.toObject().transactions.length, 2);
});
test('financial history can be archived when settled, but cannot be purged or archived while unpaid', async () => {
  patch(models.GuestRequest, 'exists', () => query(null));
  const row = { _id: id, booking_id: 'BKG-1', status: 'Checked Out', billing: { balance_due: '0.00' }, transactions: [{ status: 'COMPLETED' }] };
  await service.guard(categoryFor('bookings'), row, 'archive', {}, null);
  await assert.rejects(service.guard(categoryFor('bookings'), row, 'purge', {}, null), rejectsStatus(409));
  await assert.rejects(service.guard(categoryFor('bookings'), { ...row, billing: { balance_due: '20.00' } }, 'archive', {}, null), rejectsStatus(409));
  await assert.rejects(service.guard(categoryFor('bookings'), { ...row, status: 'Checked In' }, 'archive', {}, null), rejectsStatus(409));
});
test('self archive and removal of the last administrator are blocked', async () => {
  const row = { _id: id, employment_details: { department: 'Admin' } };
  await assert.rejects(service.guard(categoryFor('employees'), row, 'archive', { sub: id }, null), rejectsStatus(409));
  patch(models.Employee, 'exists', () => query(null));
  await assert.rejects(service.guard(categoryFor('employees'), row, 'archive', { sub: 'different' }, null), rejectsStatus(409));
});
test('restore detects identifier conflicts and missing parent records', async () => {
  const category = categoryFor('shift_assignments');
  const row = { assignment_id: 5, employee_id: 7, shift_id: 2 };
  patch(models.ShiftAssignment, 'exists', () => query({ _id: id }));
  await assert.rejects(service.guard(category, row, 'restore', {}, null), rejectsStatus(409));
  patch(models.ShiftAssignment, 'exists', () => query(null));
  patch(models.Employee, 'updateOne', () => query({ matchedCount: 0 }));
  await assert.rejects(service.guard(category, row, 'restore', {}, null), /related Employee/);
});
test('permanent deletion checks archived references too', async () => {
  let included = false;
  patch(models.ShiftAssignment, 'exists', () => ({ session() { return this; }, withArchived() { included = true; return this; }, then(resolve) { resolve({ _id: id }); } }));
  await assert.rejects(service.guard(categoryFor('employees'), { employee_id: 5 }, 'purge', {}, null), rejectsStatus(409));
  assert.equal(included, true);
});


function mutationHarness(row) {
  const writes = [];
  patch(mongoose.connection, 'transaction', async callback => callback(null));
  patch(models.Employee, 'findById', () => query({ _id: '507f1f77bcf86cd799439099', portal_access: { has_access: true }, employment_details: { department: 'Admin', status: 'ACTIVE' } }));
  patch(models.Employee, 'updateOne', () => query({ matchedCount: 1 }));
  patch(models.HousekeepingLog, 'findOne', () => query(row));
  patch(models.HousekeepingLog, 'updateOne', (filter, update) => { writes.push({ filter, update }); return query({ matchedCount: 1 }); });
  patch(models.HousekeepingLog.collection, 'indexes', async () => [{ name: 'active_log_id_unique', unique: true }]);
  patch(require('../models/ArchiveEvent'), 'create', async entries => { writes.push({ journal: entries[0] }); });
  patch(models.Audit, 'create', async () => {});
  return writes;
}
test('soft deletion updates metadata and journals the action, never deletes the record', async () => {
  const writes = mutationHarness({ _id: id, log_id: 1, deleted_at: null });
  await service.mutate('housekeeping_logs', id, 'archive', { sub: '507f1f77bcf86cd799439099', role: 'admin' });
  assert.ok(writes[0].update.$set.deleted_at instanceof Date);
  assert.equal(writes[1].journal.action, 'archive');
});
test('restore clears archive metadata and journals the action', async () => {
  const writes = mutationHarness({ _id: id, log_id: 1, deleted_at: new Date() });
  patch(models.HousekeepingLog, 'exists', () => query(null));
  await service.mutate('housekeeping_logs', id, 'restore', { sub: '507f1f77bcf86cd799439099', role: 'admin' });
  assert.equal(writes[0].update.$set.deleted_at, null);
  assert.equal(writes[1].journal.action, 'restore');
});
test('purge of an active record is rejected before a physical delete', async () => {
  mutationHarness({ _id: id, deleted_at: null });
  await assert.rejects(service.mutate('housekeeping_logs', id, 'purge', { sub: '507f1f77bcf86cd799439099', role: 'admin' }), /not archived/);
});
