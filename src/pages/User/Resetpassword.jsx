import React, { useState, useEffect } from "react";
import { CgAsterisk } from "react-icons/cg";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate, NavLink } from "react-router-dom";
import { auth } from "../../firebase";
import { confirmPasswordReset } from "firebase/auth";
import LoginImage from "../../assets/images/login-image.png";
import "../../assets/styles/Login.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    newPassword: "",
    confirmPassword: "",
    general: "",
  });

  // Guard: redirect if verification was not done and oobCode is not in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oobCode = params.get("oobCode");
    const verified = JSON.parse(sessionStorage.getItem("fp_verified") || "{}");
    if (!oobCode && !verified?.verified) {
      navigate("/forgotPassword");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = () => {
    const newErrors = { newPassword: "", confirmPassword: "", general: "" };
    let valid = true;

    if (!formData.newPassword) {
      newErrors.newPassword = "Please enter a new password.";
      valid = false;
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters.";
      valid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
      valid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({ newPassword: "", confirmPassword: "", general: "" });

    try {
      // Get oobCode from URL
      const params = new URLSearchParams(window.location.search);
      const oobCode = params.get("oobCode");

      if (!oobCode) {
        throw new Error(
          "Invalid or missing reset link. Please click the link from your email.",
        );
      }

      await confirmPasswordReset(auth, oobCode, formData.newPassword);

      sessionStorage.removeItem("fp_verified");
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Reset Password Error:", err);
      let msg = "Failed to reset password. Please try again.";

      if (err.code === "auth/expired-action-code") {
        msg = "The reset link has expired.";
      } else if (err.code === "auth/invalid-action-code") {
        msg = "The reset link is invalid or already used.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password is too weak.";
      } else {
        msg = err.message || msg;
      }

      setErrors({ newPassword: "", confirmPassword: "", general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      {/* LEFT SIDE */}
      <div className="d-none d-lg-block col-lg-7 logo-image">
        <img src={LoginImage} alt="Leather Bag" />
        <div className="login-content">
          <div className="brand-logo">
            <span>✦</span>
            <h5>Star Bags</h5>
          </div>
          <h3>
            Timeless Craft.
            <br />
            Trusted Always.
          </h3>
          <div className="line"></div>
          <p>
            Premium leather essentials,
            <br />
            crafted to accompany every journey.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="col-12 col-lg-5 form-section">
        <div className="login-form">
          <h6>Reset Password</h6>
          <p>Create a strong new password for your Star Bags account.</p>

          {success ? (
            <div
              style={{
                background: "#f0fff4",
                border: "1px solid #28a745",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
                color: "#28a745",
                fontWeight: "600",
              }}
            >
              ✓ Password reset successful! Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errors.general && (
                <div
                  className="mb-3"
                  style={{
                    background: "#fff5f5",
                    border: "1px solid #ff4d4d",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "#ff4d4d",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {errors.general}
                </div>
              )}

              {/* NEW PASSWORD */}
              <div className="mb-1" style={{ position: "relative" }}>
                <label className="form-label">
                  New Password{" "}
                  <sup>
                    <CgAsterisk />
                  </sup>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`form-control ${errors.newPassword ? "is-invalid" : ""}`}
                  placeholder="Min. 8 characters"
                  disabled={loading}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "40px",
                    cursor: "pointer",
                    color: "#6c757d",
                  }}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
                {errors.newPassword && (
                  <div className="invalid-feedback">{errors.newPassword}</div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="mb-2 mt-3" style={{ position: "relative" }}>
                <label className="form-label">
                  Confirm Password{" "}
                  <sup>
                    <CgAsterisk />
                  </sup>
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                <span
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "40px",
                    cursor: "pointer",
                    color: "#6c757d",
                  }}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </span>
                {errors.confirmPassword && (
                  <div className="invalid-feedback">
                    {errors.confirmPassword}
                  </div>
                )}
              </div>

              <div className="d-grid mt-4">
                <button
                  className="btn login-btn"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>

              <div className="text-center mt-3">
                <NavLink
                  to="/login"
                  className="navigate"
                  style={{ fontSize: "13px" }}
                >
                  Back to login
                </NavLink>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
