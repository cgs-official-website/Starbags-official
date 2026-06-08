import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { icon: 'bi-grid-1x2-fill',            label: 'Dashboard',              path: '/admin/dashboard' },
  { icon: 'bi-box-seam-fill',            label: 'Product Management',     path: '/admin/product-management' },
  { icon: 'bi-cart-check-fill',          label: 'Order Management',       path: '/admin/order-management' },
  { icon: 'bi-tag-fill',                 label: 'Coupons',                path: '/admin/coupons' },
  { icon: 'bi-credit-card-2-front-fill', label: 'Payment Management',     path: '/admin/payment-details' },
  { icon: 'bi-aspect-ratio-fill',        label: 'Banner Management',      path: '/admin/banner-management' },
  { icon: 'bi-star-fill',                label: 'Review Management',        path: '/admin/review-management' },
  { icon: 'bi-gear-fill',                label: 'Settings',               path: '/admin/settings' },
  // { icon: 'bi-box-arrow-left',           label: 'Logout',                 path: '/admin/login' },
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
    
      <button
        className="d-lg-none btn btn-sm position-fixed"
        style={{
          top: 14,
          left: mobileOpen ? 222 : 14,
          zIndex: 1100,
          background: '#7c3aed',
          color: '#fff',
          borderRadius: 8,
          border: 'none',
          transition: 'left 0.28s ease',
          boxShadow: '0 2px 10px rgba(124,58,237,0.35)',
        }}
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle sidebar"
      >
        <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'} fs-5`} />
      </button>


      {mobileOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
          style={{ background: 'rgba(0,0,0,0.38)', zIndex: 1050 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      
      <nav
        className="d-flex flex-column"
        style={{
          width: 260,
          minHeight: '100vh',
          background: '#22074F',
          transition: 'width 0.28s ease',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 1060,
          overflowX: 'hidden',
        }}
        data-mobile-open={mobileOpen}
      >

        <div
          className="d-flex align-items-center gap-2 px-3"
          style={{ height: 130, justifyContent:'center'}}
        >
          {/* <div> */}
           <img src="/src/assets/images/brand-logo-dark.png" alt=" Brand logo" style={{ maxWidth: '80%', maxHeight: '110px', objectFit: 'contain', marginTop: '10px' }} />
          {/* </div> */}
          {/* <span
            className="fw-bold text-white"
            style={{ fontSize: 16, whiteSpace: 'nowrap', letterSpacing: 0.3 }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 1)', fontSize: '20px', marginTop:'100px' }}>Star Bags</span>
          </span> */}
        </div>


        
        <ul className="list-unstyled mt-2 px-2 flex-grow-1">
          {navItems.map((item) => (
            <li key={item.path} className="mb-1">
              <NavLink
                to={item.path}
                end={item.path === '/admin'}
                className="admin-nav-link"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 15,
                  textDecoration: 'none',
                  borderRadius: 5,
                  padding: '19px 10px',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  fontSize: 16,
                  fontWeight: isActive ? 300 : 400,
                  color: isActive ? '#7c3aed' : 'rgba(255,255,255,0.8)',
                  background: isActive ? '#ffffff' : 'transparent',
                  boxShadow: isActive ? '0 2px 10px rgba(0,0,0,0.15)' : 'none',
                  transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
                })}
              >
                {({ isActive }) => (
                  <>
                    <i
                      className={`bi ${item.icon}`}
                      style={{
                        fontSize: 17,
                        color: isActive ? '#7c3aed' : 'rgba(255,255,255,0.85)',
                        flexShrink: 0,
                        minWidth: 20,
                        textAlign: 'center',
                      }}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>


        <div className="px-2 mb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 12 }}>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="d-flex align-items-center gap-2 btn w-100 py-2 px-2"
            style={{
              color: 'rgba(255,255,255,0.75)',
              background: 'transparent',
              border: 'none',
              fontSize: 16,
              textAlign: 'left',
              borderRadius: 10,
              transition: 'background 0.18s, color 0.18s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
            }}
          >
            <i className="bi bi-box-arrow-left" style={{ fontSize: 17, flexShrink: 0, minWidth: 20, textAlign: 'center' }} />
            <span>Logout</span>
          </button>
        </div> 
      </nav>

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setShowLogoutModal(false);
          try {
            await logout();
            navigate('/login');
          } catch (error) {
            console.error("Logout failed", error);
            localStorage.removeItem('user');
            navigate('/login');
          }
        }}
        title="Confirm Logout"
        message="Are you sure you want to Logout ?"
        confirmText="Logout"
        isDanger={true}
      />


      <style>{`
        @media (max-width: 991.98px) {
          nav[data-mobile-open="true"] {
            position: fixed !important;
            left: 0 !important;
            width: 220px !important;
          }
          nav[data-mobile-open="false"] {
            position: fixed !important;
            left: -260px !important;
          }
          
          /* Scale down padding and fonts */
          .admin-nav-link {
            padding: 12px 10px !important;
            font-size: 14px !important;
          }
          
          .admin-nav-link i {
            font-size: 15px !important;
          }

          /* Scale down logout button */
          nav.d-flex.flex-column .btn {
            font-size: 14px !important;
            padding-top: 8px !important;
            padding-bottom: 8px !important;
          }
          nav.d-flex.flex-column .btn i {
            font-size: 15px !important;
          }

          /* Scale down Brand header container */
          nav.d-flex.flex-column > div:first-child {
            height: 90px !important;
          }
          nav.d-flex.flex-column > div:first-child img {
            max-height: 70px !important;
            margin-top: 5px !important;
          }
        }

        .admin-nav-link:hover {
          background: #7c3aed !important;
          color: #ffffff !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15) !important;
        }
        .admin-nav-link:hover i {
          color: #ffffff !important;
        }
      `}</style>
    </>
  );
};

export default AdminSidebar;
