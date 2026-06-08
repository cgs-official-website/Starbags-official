import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import '../../assets/styles/AdminSettings.css';
import '../../assets/styles/AdminDashboard.css';
import AdminHeader from '../../components/Admin/AdminHeader';
import { FormSkeleton } from '../../components/Admin/AdminSkeleton';
import toast, { Toaster } from 'react-hot-toast';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
// const recentActivities = [
//   { id: 1, title: "New Product Added", description: '"Hand purse"', time: "2 hours ago", color: "#4f46e5" },
//   { id: 2, title: "Product Edited", description: '"Hand purse"', time: "5 hours ago", color: "#10b981" },
//   { id: 3, title: "New Product Added", description: '"Backpack"', time: "Yesterday", color: "#3b82f6" },
//   { id: 4, title: "New Product Added", description: '"Laptop bag"', time: "Oct 24, 2023", color: "#f97316" }
// ];

function Settings() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [backupData, setBackupData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    storeName: '',
    gstIn: '',
    storeAddress: '',
    profilePhoto: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'admin-profile'));
        if (docSnap.exists()) {
          setFormData(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = () => {
    setBackupData({ ...formData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (backupData) {
      setFormData(backupData);
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'settings', 'admin-profile'), formData);
      toast.success('Profile saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save profile!');
    }
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      document.getElementById('avatarInput').click();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="admin-layout">
      <Toaster position="top-right" />
      <AdminSidebar />
      <div className="admin-main">
       
       <AdminHeader title="Settings" />

        <div className="admin-content settings-content">
          {loading ? (
            <FormSkeleton />
          ) : (
            <>
          <div className="settings-banner">
            <div className="settings-banner-left">
              <div 
                className={`settings-avatar-wrap ${isEditing ? 'editable' : ''}`} 
                onClick={handleAvatarClick}
                title={isEditing ? "Click to change profile photo" : ""}
              >
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Profile" className="settings-avatar-img" />
                ) : (
                  <div className="settings-avatar-placeholder">
                    <i className="bi bi-person-fill" style={{ fontSize: '40px', color: '#9ca3af' }}></i>
                  </div>
                )}
                {isEditing ? (
                  <div className="settings-avatar-overlay">
                    <i className="bi bi-camera-fill"></i>
                  </div>
                ) : (
                  <div className="settings-status-dot"></div>
                )}
                <input 
                  type="file" 
                  id="avatarInput" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  style={{ display: 'none' }} 
                />
              </div>
              <div className="settings-user-info">
                <h2 className="settings-user-name">{formData.fullName}</h2>
                <p className="settings-user-role">{formData.storeName}</p>
                <p className="settings-user-email">
                  <i className="bi bi-envelope"></i> {formData.email}
                </p>
              </div>
            </div>
            <div>
              {isEditing ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="settings-cancel-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button className="settings-save-btn" onClick={handleSave}>
                    <i className="bi bi-check-lg"></i> Save Changes
                  </button>
                </div>
              ) : (
                <button className="settings-edit-btn" onClick={handleEditClick}>
                  <i className="bi bi-pencil-fill"></i> Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="settings-grid">
            {/* Left Column: Personal Information */}
            <div className="settings-card">
               <h3 className="settings-section-title">Personal Information</h3>
               <p className="settings-section-subtitle">Manage your Personal details and Store details.</p>

               <div className="settings-form-row">
                 <div className="settings-form-group">
                   <label className="settings-form-label">Full Name</label>
                   <input type="text" className="settings-input" name="fullName" value={formData.fullName} onChange={handleChange} disabled={!isEditing} />
                 </div>
               </div>

               <div className="settings-form-row">
                 <div className="settings-form-group">
                   <label className="settings-form-label">Phone Number</label>
                   <input type="text" className="settings-input" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} />
                 </div>
               </div>

               <div className="settings-form-row">
                 <div className="settings-form-group">
                   <label className="settings-form-label">Email Address</label>
                   <input type="email" className="settings-input" name="email" value={formData.email} onChange={handleChange} disabled={!isEditing} />
                 </div>
               </div>
            </div>

            {/* Right Column: Store Details */}
            <div className="settings-card">
               <h3 className="settings-section-title">Store Details</h3>
               <p className="settings-section-subtitle" style={{ visibility: 'hidden' }}>Spacer</p>

               <div className="settings-form-row">
                 <div className="settings-form-group">
                   <label className="settings-form-label">Store Name</label>
                   <input type="text" className="settings-input" name="storeName" value={formData.storeName} onChange={handleChange} disabled={!isEditing} />
                 </div>
               </div>

               <div className="settings-form-row">
                 <div className="settings-form-group">
                   <label className="settings-form-label">GST IN</label>
                   <input type="text" className="settings-input" name="gstIn" value={formData.gstIn} onChange={handleChange} disabled={!isEditing} />
                 </div>
               </div>

               <div className="settings-form-row" style={{ marginBottom: 0 }}>
                 <div className="settings-form-group">
                   <label className="settings-form-label">Store Business Address</label>
                   <textarea className="settings-input" name="storeAddress" value={formData.storeAddress} onChange={handleChange} disabled={!isEditing} style={{ minHeight: '120px' }} />
                 </div>
               </div>
            </div>

            
            {/* <div className="settings-card" style={{ height: 'fit-content' }}>
              <h3 className="settings-section-title" style={{ marginBottom: '24px' }}>Recent Activity</h3>
              <div className="activity-timeline">
                {recentActivities.map((activity) => (
                  <div className="activity-item" key={activity.id}>
                    <div className="activity-dot" style={{ background: activity.color }}></div>
                    <div className="activity-content">
                      <h4 className="activity-title">{activity.title}</h4>
                      <p className="activity-desc">{activity.description}</p>
                      <p className="activity-time">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}

          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;