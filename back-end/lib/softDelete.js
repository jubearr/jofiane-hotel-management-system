
// QUERY FROM HTTP 
function softDelete(schema, { identity } = {}) {
  schema.add({
    deleted_at: { type: Date, default: null },
    deleted_by: { type: String, default: null },
    archive_revision: { type: Number, default: 0, select: false },
  });
  schema.index({ deleted_at: 1, _id: 1 });
  if (identity) schema.index({ [identity]: 1 }, {
    unique: true, name: `active_${identity}_unique`,
    partialFilterExpression: { deleted_at: null, [identity]: { $type: schema.path(identity).instance === 'Number' ? 'number' : 'string' } },
  });
  schema.query.withArchived = function () { this._withArchived = true; return this; };
  const scope = function () {
    if (!this._withArchived) this.where({ deleted_at: null }); // also matches legacy missing fields
  };
  ['find', 'findOne', 'countDocuments', 'distinct', 'updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'findOneAndReplace'].forEach(op => schema.pre(op, scope));
  schema.pre('aggregate', function () {
    if (this._withArchived) return;
    const pipeline = this.pipeline();
    const match = { $match: { deleted_at: null } };
   
    pipeline.splice(pipeline[0]?.$geoNear || pipeline[0]?.$search ? 1 : 0, 0, match);
  });
 
  ['deleteOne', 'deleteMany', 'findOneAndDelete'].forEach(op => schema.pre(op, function () {
    if (!this._archivePurge) throw new Error('Hard deletion is restricted to the archive service');
  }));
  schema.pre('deleteOne', { document: true, query: false }, function () {
    throw new Error('Hard deletion is restricted to the archive service');
  });
  schema.pre('bulkWrite', function (operations) {
    for (const operation of operations) {
      if (operation.deleteOne || operation.deleteMany) throw new Error('Hard deletion is restricted to the archive service');
      for (const name of ['updateOne', 'updateMany', 'replaceOne']) {
        if (operation[name]) operation[name].filter = { $and: [operation[name].filter || {}, { deleted_at: null }] };
      }
    }
  });
}

function purgeQuery(query) {
  query._archivePurge = true;
  return query;
}


function containsArchiveFields(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) =>
    key.split('.').some(part => ['deleted_at', 'deleted_by', 'archive_revision', 'auth_version'].includes(part)) || containsArchiveFields(child));
}

module.exports = { softDelete, purgeQuery, containsArchiveFields };
