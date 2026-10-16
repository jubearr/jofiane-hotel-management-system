const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const { registry, models, categoryFor } = require('./registry');
const ArchiveEvent = require('../models/ArchiveEvent');
const { purgeQuery } = require('../lib/softDelete');

function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
const literal = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const valueAt = (row, path) => path.split('.').reduce((value, key) => value?.[key], row);
const staffArchiveScope = {
  frontdesk: ['guest_requests', 'front_desk_logs', 'lost_and_found'],
  housekeeping: ['guest_requests', 'cleaning_tasks', 'housekeeping_logs', 'lost_and_found', 'maintenance_requests'],
  maintenance: ['maintenance_requests', 'housekeeping_logs'],
};
function getCategory(name) { const category = categoryFor(name); if (!category) fail(400, 'Unknown archive category'); return category; }
function recordKey(category, id) {
  if (typeof id !== 'string' || id.length > 200) fail(400, 'Invalid record ID');
  const [parentId, ...parts] = category.key === 'transactions' ? id.split(':') : [id];
  if (!/^[a-f\d]{24}$/i.test(parentId) || (category.key === 'transactions' && !parts.join(':'))) fail(400, 'Invalid record ID');
  return { parentId, txnId: parts.join(':') };
}

function listOptions(query, category) {
  const read = (key, max = 120) => {
    const value = query[key];
    if (value == null || value === '') return '';
    if (typeof value !== 'string' || value.length > max) fail(400, `Invalid ${key}`);
    return value.trim();
  };
  const page = Number(read('page') || 1), limit = Number(read('limit') || 25);
  if (!Number.isInteger(page) || page < 1 || page > 10000 || !Number.isInteger(limit) || limit < 1 || limit > 100) fail(400, 'Invalid pagination');
  const filter = { deleted_at: { $ne: null } };
  const from = read('from'), to = read('to');
  for (const date of [from, to].filter(Boolean)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) fail(400, 'Invalid deletion date');
  }
  if (from && to && from > to) fail(400, 'Start date must not be after end date');
  // The dashboard uses hotel-local calendar days, not the API host timezone.
  if (from) filter.deleted_at.$gte = new Date(`${from}T00:00:00+08:00`);
  if (to) filter.deleted_at.$lte = new Date(`${to}T23:59:59.999+08:00`);
  const status = read('status');
  if (status && category.status) filter[category.status] = new RegExp(`^${literal(status)}$`, 'i');
  const search = read('search');
  if (search) {
    const fields = category.columns.filter(column => column.type === 'String' || (!column.type && ['booking_id', 'guest_name', 'room_number'].includes(column.key)));
    filter.$or = fields.map(column => ({ [column.key]: { $regex: literal(search), $options: 'i' } }));
    category.columns.filter(column => column.type === 'Number' && Number.isFinite(Number(search))).forEach(column => filter.$or.push({ [column.key]: Number(search) }));
  }
  return { filter, page, limit };
}

function safeRow(row, category) {
  const result = { _id: String(row._id), deleted_at: row.deleted_at, deleted_by: row.deleted_by };
  for (const column of category.columns) {
    let value = valueAt(row, column.key);
    if (column.key === 'transactions') value = (value || []).map(({ deleted_by, ...transaction }) => transaction);
    result[column.key] = value ?? null;
  }
  return result;
}

async function list(name, query = {}) {
  const category = getCategory(name);
  const { filter, page, limit } = listOptions(query, category);
  let records, total;
  if (category.key === 'transactions') {
    const aggregate = models.Booking.aggregate([
      { $unwind: '$transactions' },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$transactions', {
        _id: { $concat: [{ $toString: '$_id' }, ':', '$transactions.txn_id'] },
        booking_id: '$booking_id', guest_name: '$guest.full_name', room_number: '$room_number',
      }] } } },
      { $match: filter },
      { $facet: { records: [{ $sort: { deleted_at: -1, _id: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }], count: [{ $count: 'total' }] } },
    ]);
    aggregate._withArchived = true;
    const [result] = await aggregate;
    records = result.records; total = result.count[0]?.total || 0;
  } else {
    const scoped = { ...filter, ...category.scope };
    [records, total] = await Promise.all([
      category.model.find(scoped).withArchived().select('-portal_access.password -photo').sort({ deleted_at: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      category.model.countDocuments(scoped).withArchived(),
    ]);
  }
  return { records: records.map(row => safeRow(row, category)), total, page, limit, columns: category.columns, note: category.note };
}

// Prevent dangling references both in live data and in records that might later
// be restored. Purges check archived dependencies as well.
const dependencies = {
  Employee: [['ShiftAssignment', 'employee_id', 'employee_id'], ['GuestRequest', 'employee_id', 'employee_id'], ['CleaningTask', 'employee_id', 'employee_id'], ['LostAndFound', 'employee_id', 'employee_id'], ['MaintenanceRequest', 'assigned_to', 'employee_id'], ['MaintenanceRequest', 'reported_by', 'employee_id']],
  Room: [['Booking', 'room_number', 'room_number'], ['CleaningTask', 'room_number', 'room_number'], ['GuestRequest', 'room_number', 'room_number'], ['LostAndFound', 'room_number', 'room_number'], ['MaintenanceRequest', 'room_number', 'room_number'], ['HousekeepingLog', 'room_number', 'room_number']],
  RoomType: [['Room', 'type_id', 'type_id']],
  Shift: [['ShiftAssignment', 'shift_id', 'shift_id']],
  Booking: [['GuestRequest', 'booking_id', 'booking_id']],
};
const references = {
  ShiftAssignment: [['Employee', 'employee_id', 'employee_id'], ['Shift', 'shift_id', 'shift_id']],
  Room: [['RoomType', 'type_id', 'type_id']],
  Booking: [['Room', 'room_number', 'room_number']],
  GuestRequest: [['Booking', 'booking_id', 'booking_id'], ['Room', 'room_number', 'room_number'], ['Employee', 'employee_id', 'employee_id']],
  CleaningTask: [['Room', 'room_number', 'room_number'], ['Employee', 'employee_id', 'employee_id']],
  LostAndFound: [['Room', 'room_number', 'room_number'], ['Employee', 'employee_id', 'employee_id']],
  MaintenanceRequest: [['Room', 'room_number', 'room_number'], ['Employee', 'assigned_to', 'employee_id'], ['Employee', 'reported_by', 'employee_id']],
  HousekeepingLog: [['Room', 'room_number', 'room_number']],
};

async function guard(category, row, action, actor, session) {
  const name = category.model.modelName;
  if (name === 'Booking') {
    if (!['Checked Out', 'Cancelled', 'No Show'].includes(row.status)) fail(409, 'Cancel or check out the reservation before archiving it.');
    if (action === 'archive' && Number(String(row.billing?.balance_due || '0').replace(/,/g, '')) !== 0) fail(409, 'Settle the outstanding reservation balance before archiving it.');
    if (action === 'purge' && (row.transactions || []).some(txn => String(txn.status).toUpperCase() !== 'VOIDED')) fail(409, 'This reservation contains financial history and cannot be permanently deleted. Keep it archived or restore it.');
  }
  if (name === 'Employee' && action === 'archive') {
    if (String(row._id) === String(actor.sub)) fail(409, 'You cannot archive your own account.');
    if (/admin/i.test(row.employment_details?.department || '')) {
      const other = await models.Employee.exists({ _id: { $ne: row._id }, 'employment_details.department': /admin/i, 'employment_details.status': 'ACTIVE', 'portal_access.has_access': true }).session(session);
      if (!other) fail(409, 'The last active administrator cannot be archived.');
    }
  }
  if (action !== 'restore') {
    for (const [model, field, own] of dependencies[name] || []) {
      if (row[own] == null) continue;
      let query = models[model].exists({ [field]: row[own] }).session(session);
      if (action === 'purge') query = query.withArchived();
      if (await query) fail(409, `This record is referenced by ${model} records. Resolve those dependencies first.`);
    }
  } else {
    const identity = valueAt(row, category.identity);
    if (identity != null && await category.model.exists({ [category.identity]: identity, _id: { $ne: row._id } }).session(session)) fail(409, 'An active record already uses this identifier.');
    if (name === 'Employee') {
      for (const field of ['portal_access.username', 'contact.email']) {
        const value = valueAt(row, field);
        if (value && await models.Employee.exists({ [field]: new RegExp(`^${literal(value)}$`, 'i'), _id: { $ne: row._id } }).session(session)) fail(409, 'An active employee already uses this username or email.');
      }
    }
    if (name === 'ShiftAssignment' && await models.ShiftAssignment.exists({ _id: { $ne: row._id }, employee_id: row.employee_id, shift_date: row.shift_date }).session(session)) fail(409, 'This employee already has an assignment on that date.');
    for (const [model, own, field] of references[name] || []) {
      if (row[own] == null || row[own] === '') continue;
      // Touch the parent inside this transaction. Concurrent parent archival
      // then conflicts rather than committing a restored child with no parent.
      const parent = await models[model].updateOne({ [field]: row[own] }, { $inc: { archive_revision: 1 } }).session(session);
      if (!parent.matchedCount) fail(409, `Restore the related ${model} record first.`);
    }
  }
}

async function mutate(name, id, action, actor, reason = '') {
  const category = getCategory(name);
  const { parentId, txnId } = recordKey(category, id);
  if (!['archive', 'restore', 'purge'].includes(action)) fail(400, 'Invalid archive action');
  if (action === 'restore') {
    const required = category.model.schema.indexes().filter(([, options]) => options.unique).map(([, options]) => options.name);
    const installed = await category.model.collection.indexes().catch(() => []);
    if (required.some(name => !installed.some(index => index.name === name && index.unique))) fail(503, 'The archive index migration must be applied before records can be restored.');
  }
  //  AUDIT COMMIT WRITE AND STATE CHANGE
  await mongoose.connection.transaction(async session => {
    const liveActor = await models.Employee.findById(actor.sub).session(session);
    if (!liveActor?.portal_access?.has_access || (liveActor.auth_version || 0) !== (actor.auth_version || 0) || ['INACTIVE', 'TERMINATED'].includes(String(liveActor.employment_details?.status).toUpperCase())) fail(401, 'Your account no longer has access. Sign in again.');
    const liveAdmin = /admin/i.test(liveActor.employment_details?.department || '');
    if ((action !== 'archive' || actor.role === 'admin') && !liveAdmin) fail(403, 'Administrator access is required.');
    if (!liveAdmin) {
      const dept = String(liveActor.employment_details?.department || '').toLowerCase();
      const module = dept.includes('housekeeping') ? 'housekeeping' : dept.includes('maintenance') ? 'maintenance' : 'frontdesk';
      if (!staffArchiveScope[module].includes(category.key)) fail(403, 'Your department cannot archive this category.');
    }
    // CONCURRENT REVOKE FOR ARCHIVE
    await models.Employee.updateOne({ _id: liveActor._id }, { $inc: { archive_revision: 1 } }).session(session);
    const row = await category.model.findOne({ _id: parentId, ...category.scope }).withArchived().session(session);
    if (!row) fail(404, 'Record not found');
    if (category.key === 'transactions') {
      if (row.deleted_at) fail(409, 'Restore the parent reservation before changing its transactions.');
      const matches = row.transactions.filter(t => t.txn_id === txnId);
      if (matches.length !== 1) fail(matches.length ? 409 : 404, 'Transaction must have a unique reference within its reservation.');
      const txn = matches[0];
      if (String(txn.status).toUpperCase() !== 'VOIDED') fail(409, 'Only voided transactions may be archived, restored, or purged.');
      if ((action === 'archive') === Boolean(txn.deleted_at)) fail(409, action === 'archive' ? 'Already archived' : 'Record is not archived');
      if (action === 'purge') row.transactions = row.transactions.filter(t => t.txn_id !== txnId);
      else { txn.deleted_at = action === 'archive' ? new Date() : null; txn.deleted_by = action === 'archive' ? actor.sub : null; }
      await row.save({ session });
    } else {
      if ((action === 'archive') === Boolean(row.deleted_at)) fail(409, action === 'archive' ? 'Already archived' : 'Record is not archived');
      await guard(category, row, action, actor, session);
      const filter = { _id: row._id, deleted_at: row.deleted_at || null };
      let result;
      if (action === 'purge') result = await purgeQuery(category.model.deleteOne(filter).session(session));
      else result = await category.model.updateOne(filter, { $set: {
        deleted_at: action === 'archive' ? new Date() : null,
        deleted_by: action === 'archive' ? actor.sub : null,
      }, ...(category.model.modelName === 'Employee' && action === 'archive' ? { $inc: { auth_version: 1 } } : {}) }).withArchived().session(session);
      if (!(action === 'purge' ? result.deletedCount : result.matchedCount)) fail(409, 'The record changed. Refresh the archive and try again.');
    }
    await ArchiveEvent.create([{ category: category.key === 'guests' ? 'bookings' : category.key, record_id: id, action, actor_id: actor.sub, reason }], { session });
   
    await models.Audit.create([{ audit_id: `ARC-${randomUUID()}`, datetime: new Date().toISOString(), action_type: `Archive ${action}`, description: `${category.label}: ${id}`, user_id: actor.sub, status: 'COMPLETED' }], { session });
  });
  return { success: true, action, id };
}

module.exports = { list, mutate, getCategory, listOptions, recordKey, safeRow, guard, registry, fail };
