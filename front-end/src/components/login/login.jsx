import React, { useState } from 'react';
import logo from '../../assets/Jofiane-logo.png'; 

const Login = ({ onLoginSuccess }) => {
  // step: 1 = Role Cards, 2 = Login Form
  const [step, setStep] = useState(1); 
  const [selectedRole, setSelectedRole] = useState(null); // 'admin' or 'employee'
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLoginSuccess) {
      onLoginSuccess(selectedRole, formData);
    }
  };

  return (
    <div className="portal-page-wrapper">
      
      {/* 1. TOP-LEFT BRAND LOGO */}
      <header className="top-brand-header">
        <img src={logo} alt="Jofiane Logo" className="header-logo" />
      </header>

      {/* 2. CENTERED SINGLE CARD */}
      <main className="portal-card-container">
        <div className="portal-card-box">
          
          {/* STEP 1: ROLE SELECTION */}
          {step === 1 && (
            <div className="portal-content animated-fade-in" key="step1">
              <h2 className="portal-title">Portal Access</h2>
              <p className="portal-subtitle">Select your account type to proceed</p>

              <div className="role-cards-grid">
                {/* EMPLOYEE CARD */}
                <button 
                  type="button" 
                  className="role-card-btn"
                  onClick={() => handleSelectRole('employee')}
                >
                  <div className="role-icon-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <span className="role-title-text">EMPLOYEE</span>
                </button>

                {/* ADMIN CARD */}
                <button 
                  type="button" 
                  className="role-card-btn"
                  onClick={() => handleSelectRole('admin')}
                >
                  <div className="role-icon-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      <rect x="9" y="10" width="6" height="5" rx="1"></rect>
                    </svg>
                  </div>
                  <span className="role-title-text">ADMIN</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LOGIN FORM */}
          {step === 2 && (
            <div className="portal-content animated-fade-in" key="step2">
              <div className="card-header-row">
                <button 
                  type="button" 
                  className="back-step-btn"
                  onClick={() => setStep(1)}
                  title="Back to Roles"
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
                
                <h2 className="portal-title">Welcome!</h2>
              </div>

              <p className="portal-subtitle">
                Sign in as <strong>{selectedRole === 'admin' ? 'Administrator' : 'Employee'}</strong>
              </p>

              <form onSubmit={handleSubmit} className="card-main-form">
                <div className="card-input-group">
                  <label>
                    {selectedRole === 'admin' ? 'Email ' : ' Email'}
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder={selectedRole === 'admin' ? 'admin@jofiane.com' : 'employee@jofiane.com'}
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="card-input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="card-options-row">
                  <label className="card-remember">
                    <input type="checkbox" /> Remember me
                  </label>
                  <button 
                    type="button" 
                    className="card-forgot-btn"
                    onClick={() => alert('Contact System Administrator to reset password.')}
                  >
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="card-submit-btn">
                  Login
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Login;