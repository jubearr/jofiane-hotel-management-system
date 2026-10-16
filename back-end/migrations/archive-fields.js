
// FOR OLD DEV DOCUMENTS
require('dotenv').config();
const mongoose = require('mongoose');
const { registry } = require('../archive/registry');
async function run() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  const apply = process.argv.includes('--apply');
  const models = new Set([...registry.values()].map(item => item.model));
  let conflicts = 0;
 

  // PREFLIGHT UNIQUE INDEXES 
  for (const model of models) {
    for (const [fields, options] of model.schema.indexes().filter(([, opts]) => opts.unique)) {
      const id = Object.fromEntries(Object.keys(fields).map(field => [field.replace(/\./g, '_'), `$${field}`]));
      const collisions = await model.collection.aggregate([
        { $match: options.partialFilterExpression || {} },
        { $group: { _id: id, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }, { $count: 'groups' },
      ], { ...(options.collation ? { collation: options.collation } : {}) }).toArray();
      const count = collisions[0]?.groups || 0;
      console.log(`${model.collection.collectionName}/${options.name}: ${count} conflicting identifier groups`);
      conflicts += count;
    }
  }
  if (conflicts) throw new Error('Resolve duplicate active identifiers before migration. No migration changes were made.');
  if (apply) {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (!hello.setName && hello.msg !== 'isdbgrid') throw new Error('Configure a replica set before enabling archive operations.');
  }
  for (const model of models) {
    const missing = { deleted_at: { $exists: false } };
    const count = await model.collection.countDocuments(missing);
    console.log(`${model.collection.collectionName}: ${count} records without archive metadata (${apply ? 'apply' : 'dry run'})`);
    if (apply) {
      await model.collection.updateMany(missing, { $set: { deleted_at: null } });
      await model.collection.updateMany({ deleted_by: { $exists: false } }, { $set: { deleted_by: null } });
      await model.collection.createIndex({ deleted_at: 1, _id: 1 });
      await model.createIndexes(); 
    }
  }
  
}
run().catch(error => { console.error(error.name === 'MongoServerSelectionError' ? 'Database connection failed.' : error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
