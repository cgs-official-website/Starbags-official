import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import loginImage from '../../assets/images/loginimage1.jpeg';

function ResetPassword() {
  return (
    <div className="container-fluid vh-100 d-flex p-0 overflow-hidden admin-auth-page" style={{ backgroundColor: '#ffffff' }}>
      <style>{`
        @media (max-width: 991.98px) {
          .admin-auth-page {
            background-color: #f9fafb !important;
            overflow-y: auto !important;
          }
          .admin-auth-col {
            background-color: #f9fafb !important;
            height: auto !important;
            min-height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            padding: 0 0 24px 0 !important;
          }
          .admin-auth-card {
            background: #ffffff !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 10px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
            margin: 24px auto !important;
            padding: 1.25rem 1.1rem !important;
            max-width: calc(100% - 24px) !important;
          }
          .admin-auth-card h2 {
            font-size: 1.35rem !important;
          }
          .admin-auth-card p {
            font-size: 12.5px !important;
            margin-bottom: 0.75rem !important;
          }
          .admin-auth-card label {
            font-size: 12px !important;
          }
          .admin-auth-card .form-control {
            font-size: 13px !important;
            padding: 0.45rem 0.65rem !important;
          }
          .admin-auth-card .btn {
            font-size: 13.5px !important;
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }
          .admin-auth-card a, 
          .admin-auth-card span, 
          .admin-auth-card div {
            font-size: 12px !important;
          }
        }
      `}</style>

      <div className="row g-0 w-100 h-100">
        <div className="col-12 col-lg-5 d-none d-lg-block p-0 h-100">
          <img 
            src={loginImage} 
            alt="Reset Password" 
            className="w-100 h-100" 
            style={{ objectFit: 'cover' }}
          />
        </div>

        <div className="col-12 col-lg-7 d-flex justify-content-center align-items-center h-100 admin-auth-col" style={{ overflowY: 'auto'}}>
          {/* Mobile Top Navbar */}
          <div 
            className="d-lg-none w-100 d-flex align-items-center px-3"
            style={{ 
              height: '56px', 
              backgroundColor: '#22074F', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              flexShrink: 0
            }}
          >
            <img 
              src="/src/assets/images/brand-logo-light.png" 
              alt="Brand logo" 
              style={{ height: '36px', marginRight: '10px' }} 
            />
            <span className="fw-bold text-white" style={{ fontSize: '15px', letterSpacing: '0.3px' }}>
              Star Bags
            </span>
          </div>

          <div className="w-100 admin-auth-card" style={{ maxHeight: '90vh', maxWidth: '550px', padding: '1.5rem' }}>
            <h2 className="fw-medium mb-1" style={{ color: '#111827', fontSize: '1.75rem' }}>New Password</h2>
            <p className="mb-3" style={{ fontSize: '14px', color: '#000000ff' }}>
              Create a strong password for your Star Bags account. You'll use it
every time you sign in.
            </p>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="mb-3">
                <label className="form-label mb-1" style={{ fontSize: '13px', fontWeight: 500, color: '#000000ff' }}>New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Enter New Password" 
                  style={{ fontSize: '14px', borderRadius: '6px', border: '1px solid #d1d5db', padding: '0.6rem 0.8rem' }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label mb-1" style={{ fontSize: '13px', fontWeight: 500, color: '#000000ff' }}>Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Confirm your Password" 
                  style={{ fontSize: '14px', borderRadius: '6px', border: '1px solid #d1d5db', padding: '0.6rem 0.8rem' }}
                />
              </div>
              <NavLink 
                type="submit" 
                to="/admin"
                className="btn w-100 py-2 mb-10" 
                style={{                   backgroundColor: '#8b5cf6', 
                  color: 'white', 
                  borderRadius: '6px', 
                  fontWeight: 500,
                  fontSize: '15px',
                  border: 'none',
                  transition: 'background-color 0.2s',
                  marginTop: '15px',
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#7c3aed'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#8b5cf6'}
              >
                Reset Password
              </NavLink>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;