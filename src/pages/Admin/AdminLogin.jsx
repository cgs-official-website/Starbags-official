import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import loginImage from '../../assets/images/loginimage1.jpeg';

function AdminLogin() {
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
            alt="Admin Login" 
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
              src="/src/assets/images/brand-logo-dark.png" 
              alt="Brand logo" 
              style={{ height: '36px', marginRight: '10px' }} 
            />
            <span className="fw-bold text-white" style={{ fontSize: '15px', letterSpacing: '0.3px' }}>
              Star Bags
            </span>
          </div>

          <div className="w-100 admin-auth-card" style={{ maxHeight: '90vh', maxWidth: '550px', padding: '1.5rem' }}>
            <h2 className="fw-medium mb-1" style={{ color: '#111827', fontSize: '1.75rem' }}>Welcome Back</h2>
            <p className="mb-3" style={{ fontSize: '14px', color: '#4b5563' }}>
              Login to Your Account and Continue.
            </p>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="mb-3">
                <label className="form-label mb-1" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>E-mail Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="Enter your e-mail" 
                  style={{ fontSize: '14px', borderRadius: '6px', border: '1px solid #d1d5db', padding: '0.6rem 0.8rem' }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label mb-1" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Enter your Password" 
                  style={{ fontSize: '14px', borderRadius: '6px', border: '1px solid #d1d5db', padding: '0.6rem 0.8rem' }}
                />
              </div>

              <div className="mb-4 form-check d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  {/* <input type="checkbox" className="form-check-input mt-0" id="rememberMe" style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
                  <label className="form-check-label" htmlFor="rememberMe" style={{ fontSize: '13px', color: '#111827', cursor: 'pointer' }}>
                    Remember me
                  </label> */}
                </div>
                <Link to="/admin/forget-password" className="text-decoration-none" style={{ fontSize: '13px', color: '#8b5cf6' }}>
                  Forgot Password?
                </Link>
              </div>

              <NavLink 
                type="submit" 
                to="/admin/dashboard"
                className="btn w-100 py-2 mb-3" 
                style={{ 
                  backgroundColor: '#8b5cf6', 
                  color: 'white', 
                  borderRadius: '6px', 
                  fontWeight: 500,
                  fontSize: '15px',
                  border: 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#7c3aed'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#8b5cf6'}
              >
                Log In
              </NavLink>

              {/* <div className="d-flex align-items-center mb-3">
                <hr className="flex-grow-1" style={{ borderColor: '#d1d5db' }} />
                <span className="mx-3" style={{ fontSize: '13px', color: '#6b7280' }}>or</span>
                <hr className="flex-grow-1" style={{ borderColor: '#d1d5db' }} />
              </div>
              <div className="mb-4">
                <button 
                  type="button"
                  className="btn w-100 d-flex justify-content-center align-items-center gap-2 mb-3" 
                  style={{ borderRadius: '6px', border: '1px solid #d1d5db', padding: '0.6rem 0.8rem', color: '#374151', backgroundColor: '#ffffff', transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  <i className="bi bi-apple" style={{ fontSize: '18px', color: '#000' }}></i>
                  <span style={{ fontWeight: 500, fontSize: '14px' }}>Sign in with Apple</span>
                </button>

                <button 
                  type="button"
                  className="btn w-100 d-flex justify-content-center align-items-center gap-2" 
                  style={{ borderRadius: '6px', border: '1px solid #d1d5db', padding: '0.6rem 0.8rem', color: '#374151', backgroundColor: '#ffffff', transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span style={{ fontWeight: 500, fontSize: '14px' }}>Sign in with google</span>
                </button>
              </div> */}

              <div className="text-center" style={{ fontSize: '13px', color: '#6b7280' }}>
                Don't have an account ?{' '}
                <Link to="/admin/signup" className="text-decoration-none fw-medium" style={{ color: '#8b5cf6' }}>
                  Sign up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;