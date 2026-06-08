import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/User/Navbar";
import Footer from "../../components/User/Footer";
import ProfileSideNav from "../../components/User/Profile-Side-Nav";
import "../../assets/styles/Profile.css";
import "../../assets/styles/Skeleton.css";
import { MdEdit, MdSave, MdCancel } from "react-icons/md";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { IoAddCircle } from "react-icons/io5";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

function Profile() {
  const { currentUser, userData, loading } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoPopup, setShowPhotoPopup] = useState(false);

  const mobAvatarRef = useRef(null);
  const mobPopupRef = useRef(null);
  const mobFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    gender: "Male",
    mobile: "",
    email: "",
    photo: "",
  });

  const [tempData, setTempData] = useState({ ...formData });

  // Close popup on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        mobPopupRef.current &&
        !mobPopupRef.current.contains(e.target) &&
        mobAvatarRef.current &&
        !mobAvatarRef.current.contains(e.target)
      ) {
        setShowPhotoPopup(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/login");
    } else if (userData) {
      const data = {
        name: userData.name || "",
        gender: userData.gender || "Male",
        mobile: userData.mobile || "",
        email: userData.email || currentUser?.email || "",
        photo: userData.photo || "",
      };
      setFormData(data);
      setTempData(data);
    }
  }, [userData, currentUser, loading, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
    setTempData({ ...formData });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempData({ ...formData });
  };

  const handleSave = async () => {
    setIsEditing(false);
    
    // Detect if the name is being changed
    const nameChanged = tempData.name !== formData.name;
    
    setFormData({ ...tempData });
    try {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, {
          name: tempData.name,
          gender: tempData.gender,
          mobile: tempData.mobile,
          // email intentionally excluded — change via Firebase Auth separately
          photo: tempData.photo || "",
          updatedAt: new Date().toISOString(),
        });

        // ─── If name changed, update past reviews ───
        if (nameChanged && tempData.name) {
          const { collection, query, where, getDocs, writeBatch } = await import("firebase/firestore");
          const q = query(
            collection(db, "reviews"),
            where("customerId", "==", currentUser.uid)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const batch = writeBatch(db);
            snapshot.forEach((reviewDoc) => {
              batch.update(reviewDoc.ref, { customerName: tempData.name });
            });
            await batch.commit();
          }
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempData({ ...tempData, [name]: value });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Please upload a photo smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        setTempData((prev) => ({ ...prev, photo: base64 }));
        setFormData((prev) => ({ ...prev, photo: base64 }));
        try {
          if (currentUser) {
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, { photo: base64 });
          }
        } catch (error) {
          console.error("Error saving photo:", error);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleDeletePhoto = async (e) => {
    e.stopPropagation();
    setShowPhotoPopup(false);
    setTempData((prev) => ({ ...prev, photo: "" }));
    setFormData((prev) => ({ ...prev, photo: "" }));
    try {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, { photo: null });
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };

  const popupBtnBase = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "9px 14px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 500,
    whiteSpace: "nowrap",
    transition: "background 0.15s",
  };

  const userName = tempData.name || "User";

  return (
    <>
      <Navbar />
      <div className="container py-3 my-2">
        <h4 className="mb-3 fw-bold">Settings and Profile</h4>
        <div className="row justify-content-center align-items-start">
          <div className="col-lg-3 mb-3 d-none d-lg-block sidebar-sticky">
            {/* hideMobileBar prevents duplicate avatar on mobile — Profile.jsx renders its own */}
            <ProfileSideNav hideMobileBar />
          </div>

          <div className="col-lg-9 col-12">
            <div className="profile-details-card">
              {loading ? (
                <div className="skeleton-shimmer" style={{ height: "200px" }} />
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="fw-bold mb-0">Profile</h4>
                    {!isEditing ? (
                      <button className="btn edit-profile-btn" onClick={handleEdit}>
                        <MdEdit /> Edit Profile
                      </button>
                    ) : (
                      <div className="d-flex gap-2">
                        <button className="btn cancel-profile-btn" onClick={handleCancel}>
                          <MdCancel /> Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSave}>
                          <MdSave /> Save
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Mobile-only User Header (hidden on lg+) ── */}
                  <div
                    className="mobile-profile-header d-lg-none d-flex align-items-center p-3 mb-4 border rounded"
                    style={{
                      background: isDark ? "var(--surface-alt)" : "#ffffff",
                      borderColor: isDark ? "var(--border)" : "#e5e7eb",
                      overflow: "visible",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        flexShrink: 0,
                        width: "70px",
                        height: "70px",
                        overflow: "visible",
                      }}
                    >
                      <input
                        type="file"
                        ref={mobFileInputRef}
                        onChange={handlePhotoChange}
                        accept="image/*"
                        style={{ display: "none" }}
                      />

                      <div
                        ref={mobAvatarRef}
                        onClick={() => {
                          if (tempData.photo) {
                            setShowPhotoPopup((prev) => !prev);
                          } else {
                            mobFileInputRef.current?.click();
                          }
                        }}
                        style={{ cursor: "pointer", width: "70px", height: "70px", position: "relative" }}
                      >
                        {tempData.photo ? (
                          <img
                            src={tempData.photo}
                            alt="Profile"
                            style={{
                              width: "70px",
                              height: "70px",
                              objectFit: "cover",
                              borderRadius: "50%",
                              display: "block",
                              border: "2px solid #8b5cf6",
                            }}
                          />
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                              width: "70px",
                              height: "70px",
                              background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
                              borderRadius: "50%",
                              fontSize: "1.6rem",
                              textTransform: "uppercase",
                              userSelect: "none",
                            }}
                          >
                            {userName.charAt(0)}
                          </div>
                        )}

                        {!tempData.photo && (
                          <IoAddCircle
                            style={{
                              position: "absolute",
                              bottom: "0px",
                              right: "-2px",
                              fontSize: "22px",
                              color: "#8b5cf6",
                              background: "white",
                              borderRadius: "50%",
                            }}
                          />
                        )}
                      </div>

                      {showPhotoPopup && tempData.photo && (
                        <div
                          ref={mobPopupRef}
                          style={{
                            position: "absolute",
                            top: "78px",
                            left: "0",
                            background: isDark ? "#1e1e2e" : "#ffffff",
                            border: `1px solid ${isDark ? "#3f3f5a" : "#e5e7eb"}`,
                            borderRadius: "10px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                            zIndex: 9999,
                            overflow: "hidden",
                            minWidth: "145px",
                          }}
                        >
                          <button
                            onClick={() => {
                              setShowPhotoPopup(false);
                              mobFileInputRef.current?.click();
                            }}
                            style={{ ...popupBtnBase, color: isDark ? "#e2e8f0" : "#374151" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#2d2d44" : "#f3f4f6")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                          >
                            <FiEdit2 size={14} style={{ flexShrink: 0 }} />
                            Edit Photo
                          </button>
                          <div style={{ height: "1px", background: isDark ? "#3f3f5a" : "#e5e7eb" }} />
                          <button
                            onClick={handleDeletePhoto}
                            style={{ ...popupBtnBase, color: "#ef4444" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#2d2d44" : "#fef2f2")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                          >
                            <FiTrash2 size={14} style={{ flexShrink: 0 }} />
                            Delete Photo
                          </button>
                        </div>
                      )}
                    </div>

                    <h5
                      className="ms-3 fw-bold mb-0"
                      style={{ color: isDark ? "#e2e8f0" : "#111" }}
                    >
                      {userName}
                    </h5>
                  </div>

                  {/* Form */}
                  <form>
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={tempData.name}
                        onChange={handleChange}
                        readOnly={!isEditing}
                        style={{
                          backgroundColor: !isEditing ? "#f9fafb" : "#ffffff",
                          borderRadius: "8px",
                          height: "42px",
                          borderColor: "#e5e7eb",
                        }}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Gender</label>
                      <select
                        className="form-select"
                        name="gender"
                        value={tempData.gender}
                        onChange={handleChange}
                        disabled={!isEditing}
                        style={{
                          backgroundColor: !isEditing ? "#f9fafb" : "#ffffff",
                          borderRadius: "8px",
                          height: "42px",
                          borderColor: "#e5e7eb",
                        }}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Mobile Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="mobile"
                        maxLength={10}
                        value={tempData.mobile}
                        onChange={handleChange}
                        readOnly={!isEditing}
                        style={{
                          backgroundColor: !isEditing ? "#f9fafb" : "#ffffff",
                          borderRadius: "8px",
                          height: "42px",
                          borderColor: "#e5e7eb",
                        }}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        Email Address
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af",
                            fontWeight: 400,
                            marginLeft: "8px",
                          }}
                        >
                          (cannot be changed here)
                        </span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={tempData.email}
                        readOnly
                        style={{
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px",
                          height: "42px",
                          borderColor: "#e5e7eb",
                          cursor: "not-allowed",
                        }}
                      />
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Profile;