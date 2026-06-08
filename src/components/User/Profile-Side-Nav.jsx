import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import "../../assets/styles/Profile-Side-Nav.css";
import { FaRegUserCircle, FaRegHeart } from "react-icons/fa";
import { FiBox, FiLogOut, FiEdit2, FiTrash2 } from "react-icons/fi";
import { GrLocation } from "react-icons/gr";
import { BsSun } from "react-icons/bs";
import { IoAddCircle } from "react-icons/io5";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { MdOutlineRateReview } from "react-icons/md";
import { db } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";

// ── AvatarBlock is defined OUTSIDE ProfileSideNav so refs stay stable ──
function AvatarBlock({
  isMobile,
  avatarRef,
  popupRef,
  fileInputRef,
  show,
  onAvatarClick,
  onEdit,
  onRemove,
  onPhotoChange,
  userData,
  isDark,
  userName,
}) {
  const size = isMobile ? "70px" : "55px";

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

  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onPhotoChange}
        style={{ display: "none" }}
        accept="image/*"
      />

      <div
        ref={avatarRef}
        onClick={onAvatarClick}
        style={{
          cursor: "pointer",
          width: size,
          height: size,
          position: "relative",
          borderRadius: "50%",
          overflow: "visible",
        }}
      >
        {userData?.photo ? (
          <img
            src={userData.photo}
            alt="Avatar"
            style={{
              width: size,
              height: size,
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
              width: size,
              height: size,
              background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
              borderRadius: "50%",
              fontSize: isMobile ? "1.6rem" : "1.2rem",
              textTransform: "uppercase",
              userSelect: "none",
            }}
          >
            {userName.charAt(0)}
          </div>
        )}

        {!userData?.photo && (
          <IoAddCircle
            style={{
              position: "absolute",
              bottom: "0px",
              right: "-2px",
              fontSize: isMobile ? "22px" : "18px",
              color: "#8b5cf6",
              background: "white",
              borderRadius: "50%",
            }}
          />
        )}
      </div>

      {show && userData?.photo && (
        <div
          ref={popupRef}
          style={{
            position: "absolute",
            top: isMobile ? "78px" : "62px",
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
            onClick={onEdit}
            style={{ ...popupBtnBase, color: isDark ? "#e2e8f0" : "#374151" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#2d2d44" : "#f3f4f6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <FiEdit2 size={14} style={{ flexShrink: 0 }} />
            Edit Photo
          </button>
          <div style={{ height: "1px", background: isDark ? "#3f3f5a" : "#e5e7eb" }} />
          <button
            onClick={onRemove}
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
  );
}

// ── Main Component ──
function ProfileSideNav({ hideMobileBar = false }) {
  const navigate = useNavigate();
  const { userData, currentUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Desktop refs
  const fileInputRef = useRef(null);
  const avatarRef = useRef(null);
  const popupRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);

  // Mobile refs
  const mobileFileInputRef = useRef(null);
  const mobileAvatarRef = useRef(null);
  const mobilePopupRef = useRef(null);
  const [showMobilePopup, setShowMobilePopup] = useState(false);

  const userName =
    userData?.name ||
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "User";

  // Close popups on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(e.target)
      ) {
        setShowPopup(false);
      }
      if (
        mobilePopupRef.current &&
        !mobilePopupRef.current.contains(e.target) &&
        mobileAvatarRef.current &&
        !mobileAvatarRef.current.contains(e.target)
      ) {
        setShowMobilePopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("user");
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file && currentUser) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Please upload a photo smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          await updateDoc(userDocRef, { photo: reader.result });
          const storedUser = JSON.parse(localStorage.getItem("user")) || {};
          localStorage.setItem("user", JSON.stringify({ ...storedUser, photo: reader.result }));
        } catch (err) {
          console.error("Error saving profile photo:", err);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleRemovePhoto = async (e) => {
    e.stopPropagation();
    setShowPopup(false);
    setShowMobilePopup(false);
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, { photo: null });
      const storedUser = JSON.parse(localStorage.getItem("user")) || {};
      localStorage.setItem("user", JSON.stringify({ ...storedUser, photo: null }));
    } catch (err) {
      console.error("Error removing profile photo:", err);
    }
  };

  // Desktop handlers
  const handleAvatarClick = () => {
    if (userData?.photo) {
      setShowPopup((prev) => !prev);
    } else {
      fileInputRef.current?.click();
    }
  };
  const handleEditPhoto = () => {
    setShowPopup(false);
    fileInputRef.current?.click();
  };

  // Mobile handlers
  const handleMobileAvatarClick = () => {
    if (userData?.photo) {
      setShowMobilePopup((prev) => !prev);
    } else {
      mobileFileInputRef.current?.click();
    }
  };
  const handleMobileEditPhoto = () => {
    setShowMobilePopup(false);
    mobileFileInputRef.current?.click();
  };

  return (
    <>
      {/* ── MOBILE ONLY avatar bar — hidden when hideMobileBar is true ── */}
      {!hideMobileBar && (
        <div
          className="d-flex d-lg-none align-items-center gap-3 mb-3 p-3"
          style={{
            background: isDark ? "#1e1e2e" : "#ffffff",
            border: `1px solid ${isDark ? "#3f3f5a" : "#e0e0e0"}`,
            borderRadius: "10px",
            overflow: "visible",
          }}
        >
          <AvatarBlock
            isMobile={true}
            avatarRef={mobileAvatarRef}
            popupRef={mobilePopupRef}
            fileInputRef={mobileFileInputRef}
            show={showMobilePopup}
            onAvatarClick={handleMobileAvatarClick}
            onEdit={handleMobileEditPhoto}
            onRemove={handleRemovePhoto}
            onPhotoChange={handlePhotoChange}
            userData={userData}
            isDark={isDark}
            userName={userName}
          />
          <div style={{ minWidth: 0 }}>
            <h5
              className="fw-bold mb-1 text-truncate"
              style={{ color: isDark ? "#e2e8f0" : "#111" }}
            >
              {userName}
            </h5>
          </div>
        </div>
      )}

      {/* ── DESKTOP sidebar card (hidden on mobile) ── */}
      <div
        className="profile-sidebar-card mb-2 d-none d-lg-block"
        style={{ overflow: "visible" }}
      >
        <div
          className="d-flex align-items-center gap-3 mb-3"
          style={{ overflow: "visible", flexWrap: "nowrap" }}
        >
          <AvatarBlock
            isMobile={false}
            avatarRef={avatarRef}
            popupRef={popupRef}
            fileInputRef={fileInputRef}
            show={showPopup}
            onAvatarClick={handleAvatarClick}
            onEdit={handleEditPhoto}
            onRemove={handleRemovePhoto}
            onPhotoChange={handlePhotoChange}
            userData={userData}
            isDark={isDark}
            userName={userName}
          />
          <div style={{ minWidth: 0, flexGrow: 1 }}>
            <h5 className="fw-bold mb-1 text-truncate">{userName}</h5>
          </div>
        </div>

        {/* Menu Navigation */}
        <ul className="profile-menu-list list-unstyled mb-0">
          {[
            { to: "/profile", icon: FaRegUserCircle, label: "My profile" },
            { to: "/orders", icon: FiBox, label: "My orders" },
            { to: "/wishlist", icon: FaRegHeart, label: "Wish list" },
            { to: "/address", icon: GrLocation, label: "Saved address" },
            { to: "/reviews", icon: MdOutlineRateReview, label: "My Reviews" },
          ].map((item, i) => (
            <li key={i}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "profile-menu-link active" : "profile-menu-link"
                }
                style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}
              >
                <item.icon className="menu-icon" />
                {item.label}
              </NavLink>
            </li>
          ))}

          <li>
            <div
              className="profile-menu-link theme-toggle-item"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                whiteSpace: "nowrap",
              }}
            >
              <div className="d-flex align-items-center">
                <BsSun className="menu-icon" />
                Dark Theme
              </div>
              <div
                onClick={toggleTheme}
                style={{
                  width: "44px",
                  height: "24px",
                  borderRadius: "999px",
                  background: isDark ? "#8b5cf6" : "#d1d5db",
                  position: "relative",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "background 0.25s ease",
                  border: isDark ? "2px solid #a78bfa" : "2px solid #9ca3af",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: isDark ? "20px" : "2px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    transition: "left 0.25s ease",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }}
                />
              </div>
            </div>
          </li>
        </ul>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="btn logout-btn w-100 mt-2"
        style={{
          border: "none",
          backgroundColor: "#8B5CF6",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          whiteSpace: "nowrap",
        }}
      >
        <FiLogOut className="me-2" style={{ transform: "rotate(180deg)" }} />
        Log out your Account
      </button>
    </>
  );
}

export default ProfileSideNav;