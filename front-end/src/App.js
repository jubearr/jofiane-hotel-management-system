import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/admin/Sidebar';
import Overview from './components/admin/Overview';
import Payments from './components/admin/Payments';
import Rooms from './components/admin/Rooms';
import Employees from './components/admin/Employees';
import EmployeeModal from './components/admin/EmployeeModal';
import employee1 from './assets/employee1.jpeg';
import EmployeePortal from './components/employee/EmployeePortal';

const initialEmployees = [
  {
    id: 1,
    name: 'Ana Buenaflor',
    email: 'ana@jofiane.com',
    role: 'Front Desk Concierge',
    salary: '18000',
    start: '06:00',
    end: '14:00',
    status: 'Active',
    password: 'ana2026secure',
    photo: employee1,
  },
  {
    id: 2,
    name: 'Marco Diaz',
    email: 'marco@jofiane.com',
    role: 'Night Auditor',
    salary: '22000',
    start: '14:00',
    end: '22:00',
    status: 'Active',
    password: 'marcoNight123',
    photo: employee1,
  },
  {
    id: 3,
    name: 'Liza Fernandez',
    email: 'liza@jofiane.com',
    role: 'Housekeeping Lead',
    salary: '19500',
    start: '07:00',
    end: '15:00',
    status: 'On Leave',
    password: 'lizaClean99',
    photo: employee1,
  },
  {
    id: 4,
    name: 'Ronnie Cruz',
    email: 'ronnie@jofiane.com',
    role: 'Maintenance Tech',
    salary: '20000',
    start: '09:00',
    end: '17:00',
    status: 'Active',
    password: 'wrench2026',
    photo: employee1,
  },
  {
    id: 5,
    name: 'David Reyes',
    email: 'david@jofiane.com',
    role: 'Bellhop',
    salary: '15000',
    start: '',
    end: '',
    status: 'Terminated',
    password: 'invalidPass',
    photo: employee1,
  },
];

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [employees, setEmployees] = useState(initialEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('admin'); // 'admin' or 'employee'
  
  const openModal = (employee = null) => {
    setSelectedEmployee(employee);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
  };

  const saveEmployee = (updatedEmployee) => {
    if (updatedEmployee.id) {
      // Edit existing
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp))
      );
    } else {
      // Add new
      const newId = Math.max(...employees.map((e) => e.id), 0) + 1;
      setEmployees([...employees, { ...updatedEmployee, id: newId, photo: employee1 }]);
    }
    closeModal();
  };

  const deleteEmployee = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      closeModal();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview setActiveTab={setActiveTab} />;
      case 'payments':
        return <Payments />;
      case 'rooms':
        return <Rooms />;
      case 'shifts':
        return <Employees employees={employees} openModal={openModal} />;
      default:
        return <Overview setActiveTab={setActiveTab} />;
    }
  };

  // Render Employee Portal view if selected
  if (viewMode === 'employee') {
    return (
      <div>
        <button 
          onClick={() => setViewMode('admin')} 
          style={{ 
            position: 'fixed', 
            top: '12px', 
            right: '20px', 
            zIndex: 9999, 
            padding: '8px 16px', 
            background: '#2C1B14', 
            color: '#E8D5A3', 
            border: '1px solid #C9A84C', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontWeight: '600',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          ← Switch to Admin View
        </button>
        <EmployeePortal />
      </div>
    );
  }

  // Render Admin Console view by default
  return (
    <div className="portal-shell">
      <button 
        onClick={() => setViewMode('employee')} 
        style={{ 
          position: 'fixed', 
          top: '12px', 
          right: '20px', 
          zIndex: 9999, 
          padding: '8px 16px', 
          background: '#C9A84C', 
          color: '#2C1B14', 
          border: 'none', 
          borderRadius: '6px', 
          cursor: 'pointer', 
          fontWeight: '600',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        Switch to Employee Portal →
      </button>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {renderContent()}
      </main>
      {modalOpen && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={closeModal}
          onSave={saveEmployee}
          onDelete={deleteEmployee}
        />
      )}
    </div>
  );
}

export default App;