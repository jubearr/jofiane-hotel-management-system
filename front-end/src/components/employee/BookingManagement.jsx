import React, { useState, useEffect } from 'react';


// Mock data 
const initialBookings = [
  { id: 'BKG-8001', guestName: 'Marisol Reyes', roomType: 'Veranda Suite', status: 'Checked-In' },
  { id: 'BKG-8002', guestName: 'Juan Santos', roomType: 'Deluxe Room', status: 'Confirmed' }
];

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  // FETCH DATA ON MOUNT
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        // const res = await fetch('http://localhost:8080/api/bookings');
        // const data = await res.json();
        await new Promise(resolve => setTimeout(resolve, 800));
        setBookings(initialBookings);
        setSelectedBookingId(initialBookings[0]?.id);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const activeBooking = bookings.find((b) => b.id === selectedBookingId);

  return (
    <section className="admin-tab-content active">
      <div className="page-header">
        <div className="left">
          <h2>Booking Management</h2>
        </div>
      </div>

      <div className="dashboard-split dashboard-split-13" style={{ gridTemplateColumns: '2fr 1.2fr' }}>
        
        {/* LIST PANEL */}
        <div className="panel">
          <div className="panel-header" style={{ marginBottom: 15 }}><h3>All Reservations</h3></div>
          <div className="table-wrap">
            {isLoading ? (
               <div style={{ padding: '40px', textAlign: 'center' }}>Loading Database...</div>
            ) : (
              <table>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} onClick={() => setSelectedBookingId(booking.id)} style={{ cursor: 'pointer', background: selectedBookingId === booking.id ? '#fdfbf7' : 'transparent' }}>
                      <td><strong>{booking.guestName}</strong><br/><small>{booking.id}</small></td>
                      <td>{booking.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* DETAILS PANEL */}
        <div className="panel">
          <div className="panel-header"><h3>Booking Details</h3></div>
          {activeBooking ? (
            <div style={{ marginTop: '20px' }}>
              <h4>{activeBooking.guestName}</h4>
              <p>Status: {activeBooking.status}</p>
              <button className="btn btn-gold" style={{ width: '100%', marginTop: '20px' }}>Edit Booking via API</button>
            </div>
          ) : (
            <p>Select a booking to view details.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default BookingManagement;