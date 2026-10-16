import { Input, ValidatedForm, SubmitButton } from '../common/FormControls';
import React, { useState } from 'react';
import { authFetch, readError } from '../../utils/api';
import ChangePasswordModal from '../common/ChangePasswordModal';
import { createThemedPortal as createPortal } from '../common/ThemePortal';

function Settings({ isDarkMode, setIsDarkMode, sidebarCollapsed, setSidebarCollapsed, adminProfile, onUpdateProfile }) {
  // Use the shared profile from App (falls back to defaults if not provided)
  const profile = adminProfile || {
    fullName: 'Administrator',
    email: 'admin@jofiane.com',
    role: 'Super Admin',
    photo: null,
  };
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleSaveProfile = async (updatedProfile) => {
    // Password changes are handled by their own modal — this only saves the
    // profile info (name / email / photo).
    const { currentPassword, newPassword, confirmPassword, ...cleanProfile } = updatedProfile;
    if (onUpdateProfile) onUpdateProfile(cleanProfile);

    // Persist name/email/photo to MongoDB.
    if (profile._id) {
      try {
        const payload = {
          $set: {
            full_name: cleanProfile.fullName,
            'contact.email': cleanProfile.email,
            // The email doubles as the login username — keep them in sync so
            // the admin logs in with their (edited) email.
            'portal_access.username': (cleanProfile.email || '').trim().toLowerCase(),
            photo: cleanProfile.photo || '',
          },
        };
        const res = await authFetch(`/api/employees/${profile._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          console.error('Profile save failed:', await readError(res));
        }
      } catch (err) {
        console.error('Failed to persist admin profile to database:', err);
      }
    }
    setShowEditModal(false);
  };

  return (
    <section className="admin-tab-content active">
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Settings</h2>
          <p>System preferences and configuration</p>
        </div>
      </div>

      {/* ADMIN PROFILE */}
      <div className="panel" style={{ padding: '28px 32px', marginBottom: '22px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}> Profile Setting </h3>
        </div>

        {/* Avatar + Name + Edit Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: profile.photo ? 'transparent' : 'linear-gradient(135deg, #f0d98c, #b88b34)', display: 'grid', placeItems: 'center', fontSize: '30px', fontWeight: '800', color: '#3a2b20', flexShrink: 0, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {profile.photo ? (
              <img src={profile.photo} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              profile.fullName.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>{profile.fullName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', background: 'rgba(201,168,76,0.15)', color: 'var(--gold-dark)', borderRadius: '12px', border: '1px solid rgba(201,168,76,0.3)' }}>{profile.role}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>General Manager</span>
            </div>
          </div>
          <button className="btn btn-sm btn-gold" style={{ alignSelf: 'flex-end' }} onClick={() => setShowEditModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Edit Profile
          </button>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ padding: '16px 20px', background: 'var(--bg-input)', borderRadius: '10px', border: '1.5px solid rgba(201,168,76,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Full Name</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{profile.fullName}</div>
          </div>

          <div style={{ padding: '16px 20px', background: 'var(--bg-input)', borderRadius: '10px', border: '1.5px solid rgba(201,168,76,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Email</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{profile.email}</div>
          </div>

          <div style={{ padding: '16px 20px', background: 'var(--bg-input)', borderRadius: '10px', border: '1.5px solid rgba(201,168,76,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Role</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gold)' }}>{profile.role}</div>
          </div>

          <div style={{ padding: '16px 20px', background: 'var(--bg-input)', borderRadius: '10px', border: '1.5px solid rgba(201,168,76,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Password</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>••••••••</div>
          </div>
        </div>
      </div>

      {/* APPEARANCE */}
      <div className="panel" style={{ padding: '28px 32px', marginBottom: '22px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>Appearance</h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Dark Mode</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Switch between light and dark theme</div>
          </div>
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              position: 'relative',
              width: '48px',
              height: '26px',
              borderRadius: '13px',
              border: 'none',
              cursor: 'pointer',
              background: isDarkMode ? 'var(--gold)' : 'rgba(0,0,0,0.15)',
              transition: 'background 0.2s ease',
              padding: 0
            }}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDarkMode}
          >
            <span style={{
              position: 'absolute',
              top: '3px',
              left: isDarkMode ? '24px' : '3px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'left 0.2s ease'
            }} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Sidebar Collapsed by Default</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Start with the sidebar minimized on load</div>
          </div>
          <button
            type="button"
            onClick={() => {
              const newVal = !sidebarCollapsed;
              setSidebarCollapsed(newVal);
              window.localStorage.setItem('jofiane-sidebar-collapsed', JSON.stringify(newVal));
            }}
            style={{
              position: 'relative',
              width: '48px',
              height: '26px',
              borderRadius: '13px',
              border: 'none',
              cursor: 'pointer',
              background: sidebarCollapsed ? 'var(--gold)' : 'rgba(0,0,0,0.15)',
              transition: 'background 0.2s ease',
              padding: 0
            }}
            aria-label={sidebarCollapsed ? 'Expand sidebar by default' : 'Collapse sidebar by default'}
            aria-pressed={sidebarCollapsed}
          >
            <span style={{
              position: 'absolute',
              top: '3px',
              left: sidebarCollapsed ? '24px' : '3px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'left 0.2s ease'
            }} />
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className="panel" style={{ padding: '28px 32px', marginBottom: '22px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>Notifications</h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Email Notifications</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Receive booking and system alerts via email</div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Coming soon</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Low Occupancy Alerts</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Get notified when occupancy drops below threshold</div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Coming soon</span>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && createPortal(
        <EditProfileModal
          profile={profile}
          isDarkMode={isDarkMode}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
          onChangePassword={() => { setShowEditModal(false); setShowChangePassword(true); }}
        />,
        document.body
      )}

      {/* CHANGE PASSWORD MODAL (shared component, self-portals) */}
      {showChangePassword && (
        <ChangePasswordModal
          isDarkMode={isDarkMode}
          shellClass="admin-portal-shell"
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </section>
  );
}

/* ============================================================
   EDIT PROFILE MODAL
   ============================================================ */
function EditProfileModal({ profile, isDarkMode, onClose, onSave, onChangePassword }) {
  const [form, setForm] = useState({
    fullName: profile.fullName,
    email: profile.email,
    photo: profile.photo,
  });
  const [photoPreview, setPhotoPreview] = useState(profile.photo || null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image is too large. Please choose a file under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setForm(prev => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...profile,
      fullName: form.fullName,
      email: form.email,
      photo: form.photo,
    });
  };

  return (
    // Carry the admin shell theme onto the portaled modal so it matches the
    // rest of the admin popups (translucent beige card). Clicking the backdrop
    // is intentionally ignored (the modal only closes via Cancel / X).
    <div className={`portal-shell admin-portal-shell settings-edit-modal ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="modal-overlay open" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-content" style={{ maxWidth: '500px' }} onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Edit Profile</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Update your profile information</p>

        <ValidatedForm onSubmit={handleSubmit}>
          {/* Photo Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: photoPreview ? 'transparent' : 'linear-gradient(135deg, #f0d98c, #b88b34)', display: 'grid', placeItems: 'center', fontSize: '28px', fontWeight: '800', color: '#3a2b20', flexShrink: 0, overflow: 'hidden', border: '2px solid var(--border-light)' }}>
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                form.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <label
                htmlFor="photo-upload"
                style={{ display: 'inline-block', padding: '8px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Upload Photo
              </label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>JPG, PNG. Max 2MB.</div>
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Full Name</label>
            <Input
              type="text"
              value={form.fullName}
              required
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Enter full name"
            />
          </div>

          {/* Email */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Email</label>
            <Input
              type="email"
              value={form.email}
              required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter email address"
            />
          </div>

          {/* Password Section — opens a dedicated Change Password modal */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Password</label>
            <button
              type="button"
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={onChangePassword}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Change Password
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <SubmitButton  className="btn btn-gold">Save Changes</SubmitButton>
          </div>
        </ValidatedForm>
        </div>
      </div>
    </div>
  );
}

export default Settings;
