import React, { useMemo, useState } from 'react';
import { authFetch } from '../../utils/api';
import { Input, Select, Textarea, validationMessage } from '../common/FormControls';

const roomOptions = [
  { id: '102', type: 'Deluxe King', rate: 4200, floor: '1st Floor', feature: 'Garden view' },
  { id: '118', type: 'Veranda Suite', rate: 5800, floor: '1st Floor', feature: 'Private veranda' },
  { id: '205', type: 'Executive Twin', rate: 4900, floor: '2nd Floor', feature: 'Two queen beds' },
  { id: '304', type: 'Presidential Suite', rate: 9200, floor: '3rd Floor', feature: 'Living room & balcony' },
];

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

function WalkIn({ onViewBooking }) {
  const [step, setStep] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(roomOptions[0]);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [confirmedId, setConfirmedId] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', mobile: '', email: '', idType: 'Government ID',
    checkIn: today, checkOut: tomorrow, adults: '2', children: '0', payment: 'Credit Card', deposit: '2000', notes: ''
  });

  const nights = Math.max(1, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000) || 1);
  const total = useMemo(() => selectedRoom.rate * nights, [selectedRoom, nights]);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const validGuest = Boolean(form.firstName.trim() && form.lastName.trim()) && !validationMessage(form.mobile, { type: 'tel', required: true }) && !validationMessage(form.email, { type: 'email' });
  const validDates = Boolean(form.checkIn && form.checkOut && form.checkIn >= today && form.checkOut > form.checkIn);
  const validPayment = form.deposit !== '' && !validationMessage(form.deposit, { type: 'number', min: 0, max: total, step: .01 });
  const canContinue = step === 1 ? validGuest : step === 2 ? validDates : validGuest && validDates && validPayment;

  // Persist the walk-in as a real booking so it appears in Booking Management.
  const handleConfirm = async () => {
    setSaving(true);
    setSaveError(null);
    const fmtAmt = (n) => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const bookingId = `BKG-${Date.now()}`;
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const deposit = parseFloat(form.deposit) || 0;
    const now = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
    const txns = [];
    // Room cost is a CHARGE (what the guest owes for the stay).
    if (total > 0) {
      txns.push({
        txn_id: `TXN-${Date.now()}`,
        type: 'charge',
        datetime: now,
        description: `Room Charge (Rm ${selectedRoom.id})`,
        amount: fmtAmt(total),
        payment_method: 'Room Charge',
        payment_details: 'Front Desk',
        status: 'COMPLETED',
      });
    }
    // Deposit collected at check-in is a PAYMENT against that charge.
    if (deposit > 0) {
      txns.push({
        txn_id: `TXN-${Date.now() + 1}`,
        type: 'payment',
        datetime: now,
        description: `Walk-in Deposit (Rm ${selectedRoom.id})`,
        amount: fmtAmt(deposit),
        payment_method: form.payment || 'Cash',
        payment_details: 'Front Desk',
        status: 'COMPLETED',
      });
    }
    const payload = {
      booking_id: bookingId,
      room_number: selectedRoom.id,
      source: 'Walk-in',
      status: 'Confirmed',
      dates: { check_in: form.checkIn, check_out: form.checkOut, nights: String(nights) },
      guest: { guest_id: String(Date.now()), full_name: fullName, email: form.email || '', phone: form.mobile || '' },
      billing: { expected_total: fmtAmt(total), total_paid: '0.00', balance_due: fmtAmt(total) },
      transactions: txns,
    };
    try {
      const res = await authFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setConfirmedId(bookingId);
      setConfirmed(true);
    } catch (err) {
      console.error('Failed to save walk-in booking:', err);
      setSaveError('Could not save the booking. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-tab-content active employee-module walkin-module">
      <div className="page-header employee-page-header module-title-row">
        <div className="left">
          <span className="eyebrow">Reservations</span>
          <h2>New Walk-In Booking</h2>
          <p>Register a guest, assign an available room, and collect payment in one flow.</p>
        </div>
        <div className="walkin-availability"><span className="availability-dot" /> 14 rooms available tonight</div>
      </div>

      <div className="workflow-stepper" aria-label="Booking progress">
        {['Guest details', 'Room selection', 'Payment & confirm'].map((label, index) => (
          <button type="button" key={label} className={step === index + 1 ? 'active' : step > index + 1 ? 'complete' : ''} onClick={() => index + 1 < step && setStep(index + 1)}>
            <span>{step > index + 1 ? '✓' : index + 1}</span><strong>{label}</strong>
          </button>
        ))}
      </div>

      {confirmed ? (
        <div className="booking-success panel">
          <div className="success-icon">✓</div>
          <span className="eyebrow">Reservation confirmed</span>
          <h3>{form.firstName} {form.lastName} is ready for check-in</h3>
          <p>Booking <strong>{confirmedId}</strong> · Room {selectedRoom.id} · {nights} night{nights > 1 ? 's' : ''}</p>
          <div className="success-actions">
            <button className="btn" type="button" onClick={() => { setConfirmed(false); setStep(1); setConfirmedId(''); }}>Create another</button>
            <button className="btn btn-gold" type="button" onClick={onViewBooking}>View booking</button>
          </div>
        </div>
      ) : (
        <div className="walkin-layout">
          <div className="panel walkin-form-panel">
            {step === 1 && (
              <div>
                <div className="module-section-heading"><div><span className="eyebrow">Step 1 of 3</span><h3>Guest information</h3></div><span className="required-note">* Required fields</span></div>
                <div className="form-grid">
                  <label><span>First name *</span><Input required value={form.firstName} onChange={update('firstName')} placeholder="e.g. Sofia" autoFocus /></label>
                  <label><span>Last name *</span><Input required value={form.lastName} onChange={update('lastName')} placeholder="e.g. Navarro" /></label>
                  <label><span>Mobile number *</span><Input required type="tel" value={form.mobile} onChange={update('mobile')} placeholder="+63 9XX XXX XXXX" /></label>
                  <label><span>Email address</span><Input type="email" value={form.email} onChange={update('email')} placeholder="guest@email.com" /></label>
                  <label><span>ID type</span><Select value={form.idType} onChange={update('idType')}><option>Government ID</option><option>Passport</option><option>Driver's License</option></Select></label>
                  <label><span>ID number</span><Input placeholder="Enter ID number" /></label>
                  <label className="full-span"><span>Guest notes</span><Textarea value={form.notes} onChange={update('notes')} placeholder="Accessibility needs, preferences, or special requests" rows="3" /></label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="module-section-heading"><div><span className="eyebrow">Step 2 of 3</span><h3>Select an available room</h3></div></div>
                <div className="stay-fields form-grid">
                  <label><span>Check-in</span><Input required type="date" value={form.checkIn} min={today} onChange={update('checkIn')} /></label>
                  <label><span>Check-out</span><Input required type="date" value={form.checkOut} min={form.checkIn} validation={(value) => value <= form.checkIn ? 'Check-out must be after check-in.' : ''} onChange={update('checkOut')} /></label>
                  <label><span>Adults</span><Select value={form.adults} onChange={update('adults')}><option>1</option><option>2</option><option>3</option><option>4</option></Select></label>
                  <label><span>Children</span><Select value={form.children} onChange={update('children')}><option>0</option><option>1</option><option>2</option></Select></label>
                </div>
                <div className="available-room-grid">
                  {roomOptions.map((room) => (
                    <button type="button" key={room.id} className={`available-room-card ${selectedRoom.id === room.id ? 'selected' : ''}`} onClick={() => setSelectedRoom(room)}>
                      <span className="room-card-top"><strong>Room {room.id}</strong><span>{selectedRoom.id === room.id ? 'Selected' : 'Available'}</span></span>
                      <b>{room.type}</b><small>{room.floor} · {room.feature}</small><em>₱{room.rate.toLocaleString()} <small>/ night</small></em>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="module-section-heading"><div><span className="eyebrow">Step 3 of 3</span><h3>Payment details</h3></div><span className="secure-label">● Secure entry</span></div>
                <div className="payment-methods">
                  {['Credit Card', 'Cash', 'E-Wallet', 'Bank Transfer'].map((method) => <button type="button" className={form.payment === method ? 'selected' : ''} key={method} onClick={() => setForm((current) => ({ ...current, payment: method }))}>{method}</button>)}
                </div>
                <div className="form-grid">
                  <label><span>Deposit received</span><div className="money-input"><b>₱</b><Input required type="number" min="0" max={total} step="0.01" value={form.deposit} onChange={update('deposit')} /></div></label>
                  <label><span>Payment reference</span><Input placeholder="Optional reference number" /></label>
                </div>
                <label className="consent-row"><Input type="checkbox" defaultChecked /><span>Guest has reviewed the booking dates, rate, and hotel policies.</span></label>
              </div>
            )}

            {saveError && (
              <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '14px' }}>{saveError}</div>
            )}
            <div className="walkin-form-actions">
              <button className="btn" type="button" disabled={step === 1 || saving} onClick={() => setStep((current) => current - 1)}>Back</button>
              {step < 3
                ? <button className="btn btn-gold" type="button" disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>Continue</button>
                : <button className="btn btn-gold" type="button" disabled={saving || !canContinue} onClick={handleConfirm}>{saving ? 'Saving…' : 'Confirm booking'}</button>}
            </div>
          </div>

          <aside className="panel booking-summary-card">
            <span className="eyebrow">Booking summary</span><h3>{selectedRoom.type}</h3>
            <div className="summary-room"><span>Room</span><strong>{selectedRoom.id}</strong></div>
            <dl><div><dt>Stay</dt><dd>{nights} night{nights > 1 ? 's' : ''}</dd></div><div><dt>Guests</dt><dd>{form.adults} adult{form.adults !== '1' ? 's' : ''}{form.children !== '0' ? `, ${form.children} child` : ''}</dd></div><div><dt>Rate</dt><dd>₱{selectedRoom.rate.toLocaleString()} / night</dd></div><div><dt>Payment</dt><dd>{form.payment}</dd></div></dl>
            <div className="summary-total"><span>Estimated total</span><strong>₱{total.toLocaleString()}</strong><small>Taxes and incidentals may apply</small></div>
          </aside>
        </div>
      )}
    </section>
  );
}

export default WalkIn;
