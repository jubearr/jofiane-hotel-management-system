import React, { useState, useEffect } from 'react';


// Mock data 
const MOCK_INHOUSE = [
  { id: 102, guestName: 'John Smith', roomNumber: '304', roomType: 'Presidential Suite', checkIn: '2026-08-05', expectedDeparture: '2026-08-10', balance: 0.00, housekeeping: 'Clean' },
  { id: 105, guestName: 'Jane Doe', roomNumber: '101', roomType: 'Deluxe Room', checkIn: '2026-08-07', expectedDeparture: '2026-08-09', balance: 150.00, housekeeping: 'Dirty' }
];


function InHouseGuests() {
  // BACKEND-READY STATES
  const [guests, setGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // DATA FETCHING
  useEffect(() => {
    const fetchGuests = async () => {
      setIsLoading(true);
      try {
        // const res = await fetch('http://localhost:8080/api/guests/in-house');
        // const data = await res.json();
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate loading
        setGuests(MOCK_INHOUSE);
      } catch (error) {
        console.error("Failed to fetch");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGuests();
  }, []);

  // ASYNC CHECKOUT
  const handleCheckOut = async (id) => {
    setProcessingId(id);
    try {
      // await fetch(`http://localhost:8080/api/guests/${id}/checkout`, { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 1200)); 
      alert('Guest checked out successfully!');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="admin-tab-content active">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="left">
          <h2>In-House Guests</h2>
          <p>Manage currently occupied rooms, post charges, and process check-outs.</p>
        </div>
      </div>

      <div className="panel" style={{ borderRadius: '12px', border: '1px solid #eaeaea' }}>
        <div className="panel-header" style={{ padding: '20px', borderBottom: '1px solid #eaeaea' }}>
          <h3 style={{ margin: 0 }}>Guest Directory</h3>
        </div>

        <div className="table-wrap" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eaeaea', textAlign: 'left' }}>
                <th style={{ padding: '16px 20px' }}>Room</th>
                <th style={{ padding: '16px 20px' }}>Guest Information</th>
                <th style={{ padding: '16px 20px' }}>Balance</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Loading guests...</td></tr>
              ) : guests.map((guest) => (
                <tr key={guest.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 20px' }}><strong>{guest.roomNumber}</strong></td>
                  <td style={{ padding: '16px 20px' }}>{guest.guestName}</td>
                  <td style={{ padding: '16px 20px', color: guest.balance > 0 ? 'red' : 'green' }}>₱{guest.balance}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleCheckOut(guest.id)} 
                      disabled={processingId === guest.id}
                      className="btn" style={{ background: '#dc3545', color: '#fff', borderRadius: '6px' }}
                    >
                      {processingId === guest.id ? 'Processing...' : 'Check-Out'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default InHouseGuests;