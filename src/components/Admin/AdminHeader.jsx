import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/AdminHeader.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const AdminHeader = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const [adminProfile, setAdminProfile] = useState({ fullName: 'Admin', storeName: 'Store', profilePhoto: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'admin-profile'));
        if (docSnap.exists()) {
          setAdminProfile({
            fullName: docSnap.data().fullName || 'Admin',
            storeName: docSnap.data().storeName || 'Store',
            profilePhoto: docSnap.data().profilePhoto || ''
          });
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      }
    };
    fetchProfile();
  }, []);

  return (
    <header className="admin-header">
      <div className="admin-header-title-wrapper">
        <h1 className="admin-header-title" title={title}>{title}</h1>
        {subtitle && <p className="admin-header-subtitle">{subtitle}</p>}
      </div>

      <div className="header-right">
        {/* Profile */}
        <div className="admin-profile" onClick={() => navigate('/admin/settings')}>
          <div className="profile-avatar" style={adminProfile.profilePhoto ? { padding: 0, overflow: 'hidden' } : {}}>
            {adminProfile.profilePhoto ? (
              <img src={adminProfile.profilePhoto} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <i className="bi bi-person-fill" style={{ fontSize: 20, color: "#7c3aed" }} />
            )}
          </div>
          <div className="profile-info">
            <span className="profile-name">{adminProfile.fullName}</span>
            <span className="profile-role">{adminProfile.storeName}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
