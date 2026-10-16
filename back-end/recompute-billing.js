/**
 *  MIGRATION OF BILL COMPUTATION 
 * DATA WILL BE NOT MODIFY IF ITS CORRECT 
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

const money = (str) => parseFloat(String(str ?? '0').replace(/,/g, '')) || 0;
const moneyStr = (n) => Number(n || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});

const classifyTxn = (t) => {
  if (!t) return 'charge';
  const explicit = String(t.type || '').toLowerCase();
  if (explicit === 'charge' || explicit === 'payment' || explicit === 'refund') return explicit;

  const amt = money(t.amount);
  const desc = String(t.description || '').toLowerCase();
  const method = String(t.payment_method || '').toLowerCase();

  if (amt < 0 || desc.includes('refund')) return 'refund';
  if (method === 'penalty' || desc.includes('charge') || desc.includes('penalty') ||
      desc.includes('fee') || desc.includes('minibar') || desc.includes('f&b') ||
      desc.includes('room service') || desc.includes('laundry') || desc.includes('spa')) {
    return 'charge';
  }
  return 'payment';
};

const computeBilling = (booking) => {
  const txns = (booking.transactions || []).filter(
    t => String(t.status || '').toUpperCase() !== 'VOIDED'
  );
  let charges = 0, payments = 0, refunds = 0;
  for (const t of txns) {
    const kind = classifyTxn(t);
    const amt = Math.abs(money(t.amount));
    if (kind === 'charge')       charges  += amt;
    else if (kind === 'payment') payments += amt;
    else if (kind === 'refund')  refunds  += amt;
  }
  const storedExpected = money(booking.billing?.expected_total);
  const expectedTotal = Math.max(charges, storedExpected);
  const totalPaid = Math.max(0, payments - refunds);
  const balanceDue = Math.max(0, expectedTotal - totalPaid);
  return {
    expected_total: moneyStr(expectedTotal),
    total_paid: moneyStr(totalPaid),
    balance_due: moneyStr(balanceDue),
  };
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const bookings = await Booking.find({});

  let changed = 0, unchanged = 0;
  for (const b of bookings) {
    const next = computeBilling(b);
    const prev = {
      expected_total: b.billing?.expected_total,
      total_paid: b.billing?.total_paid,
      balance_due: b.billing?.balance_due,
    };
    const same =
      money(prev.expected_total) === money(next.expected_total) &&
      money(prev.total_paid)     === money(next.total_paid) &&
      money(prev.balance_due)    === money(next.balance_due);

    if (same) { unchanged++; continue; }

    await Booking.updateOne(
      { _id: b._id },
      { $set: {
        'billing.expected_total': next.expected_total,
        'billing.total_paid': next.total_paid,
        'billing.balance_due': next.balance_due,
      } }
    );
    changed++;
    console.log(
      `${b.booking_id || b._id}: paid ${prev.total_paid ?? '—'}→${next.total_paid}, ` +
      `balance ${prev.balance_due ?? '—'}→${next.balance_due}`
    );
  }

  console.log(`\nDone. Recomputed ${changed} booking(s), ${unchanged} already correct.`);
  await mongoose.disconnect();
})().catch(err => { console.error(err); process.exit(1); });
