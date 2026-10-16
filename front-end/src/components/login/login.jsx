import React, { useState } from 'react';
import logo from '../../assets/Jofiane-logo.png';
import { Input, ValidatedForm, SubmitButton } from '../common/FormControls';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onLoginSuccess || !formData.username.trim() || !formData.password || isLoading) return;
    setIsLoading(true);
    setError('');

    // Authentication is handled entirely by the server. Credentials are never
    // embedded in the client, and there is no offline/backdoor login path.
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, password: formData.password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Always replace the token for THIS login so a previous user's token
        // can never linger and cause profile edits to hit the wrong account.
        if (data.token) localStorage.setItem('jofiane-token', data.token);
        else localStorage.removeItem('jofiane-token');
        // module === 'admin' means DB employee with Admin department → full admin panel
        onLoginSuccess(data.role, data.employee, data.module);
        return;
      }

      // Any non-ok response is an auth failure — never fall back to a local grant.
      localStorage.removeItem('jofiane-token');
      setError(data.error || 'Invalid credentials. Please try again.');
    } catch (err) {
      // Server unreachable → surface the error. There is intentionally no
      // offline login fallback, since that would bypass authentication.
      setError('Cannot reach the server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <header className="login-brand-bar">
        <a href="#hotel" aria-label="Jo Fiane Hotel home"><img src={logo} alt="Jo Fiane Hotel" /></a>
        <a className="login-back-link" href="#hotel">Explore the hotel <span aria-hidden="true">↗</span></a>
      </header>
      <main className="login-layout">
        <section className="login-intro" aria-label="Welcome to your workspace">
          <p className="login-eyebrow"><span /> THE PEOPLE BEHIND EVERY STAY</p>
          <h1>Exceptional stays.<br /><em>Start with you.</em></h1>
          <p className="login-intro-note">A thoughtful workspace for the team<br />that makes every guest feel at home.</p>
          <div className="login-brand-detail"><span>JO FIANE HOTEL</span><i /><span>EMPLOYEE WORKSPACE</span></div>
        </section>
        <section className="login-panel" aria-labelledby="signin-heading">
          <div className="login-panel-heading"><span className="login-eyebrow">YOUR WORKSPACE AWAITS</span><h2 id="signin-heading">Welcome back.</h2><p>Sign in to begin your shift.</p></div>
          <ValidatedForm onSubmit={handleSubmit} className="login-form">
            <div className="login-floating-field">
              <Input id="login-username" name="username" type="text" value={formData.username} onChange={handleChange} placeholder=" " autoComplete="username" autoCapitalize="none" spellCheck="false" required maxLength={254} />
              <label htmlFor="login-username">Username or email</label>
            </div>
            <div className="login-floating-field login-password-field">
              <Input id="login-password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder=" " autoComplete="current-password" required />
              <label htmlFor="login-password">Password</label>
              <button className="login-password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{showPassword && <path d="m3 3 18 18" />}</svg>
              </button>
            </div>
            <div className="login-assistance"><span>Staff access only</span><button type="button" onClick={() => alert('Contact System Administrator to reset password.')}>Forgot password?</button></div>
            {error && <div className="login-error" role="alert">{error}</div>}
            <SubmitButton className="login-submit" disabled={isLoading || !formData.username.trim() || !formData.password}>{isLoading ? <><span className="login-progress" aria-hidden="true" /> Signing in…</> : <>Sign in <span aria-hidden="true">→</span></>}</SubmitButton>
          </ValidatedForm>
          <p className="login-panel-footer"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg> Your team. Your hotel. Your workspace.</p>
        </section>
      </main>
      <footer className="login-footer"><span>Thoughtful hospitality, in every detail.</span><span>JO FIANE · HOTEL MANAGEMENT</span></footer>
    </div>
  );
};

export default Login;
