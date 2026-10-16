/**
 * MIGRATION OF PASSWORDS 
 * HASHED PASSWORDS START $2
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./models/Employee');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const employees = await Employee.find({ 'portal_access.password': { $exists: true, $ne: '' } });

  let migrated = 0, skipped = 0;
  for (const emp of employees) {
    const pw = emp.portal_access.password || '';
    if (pw.startsWith('$2')) { skipped++; continue; }
    const hash = await bcrypt.hash(pw, 10);
    await Employee.updateOne(
      { _id: emp._id },
      { $set: { 'portal_access.password': hash } }
    );
    migrated++;
    console.log(`hashed: ${emp.portal_access.username || emp.full_name}`);
  }

  console.log(`\nDone. Migrated ${migrated}, already-hashed ${skipped}.`);
  await mongoose.disconnect();
})().catch(err => { console.error(err); process.exit(1); });
