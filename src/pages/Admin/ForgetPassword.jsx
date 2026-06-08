import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import loginImage from "../../assets/images/loginimage1.jpeg";

function ForgetPassword() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(119); // 1:59 in seconds
  const [timerActive, setTimerActive] = useState(true);
  const inputRefs = useRef([]);

 
  useEffect(() => {
    if (!timerActive || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          setTimerActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setTimer(119);
    setTimerActive(true);
    setOtp(["", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <div
      className="container-fluid vh-100 d-flex p-0 overflow-hidden admin-auth-page"
      style={{ backgroundColor: "#ffffff" }}
    >
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
          .otp-input {
            width: 50px !important;
            height: 50px !important;
            font-size: 1.15rem !important;
          }
          .resend-row {
            width: 100% !important;
            max-width: 260px !important;
            margin-bottom: 1rem !important;
          }
          .verify-btn {
            width: 100% !important;
            max-width: 260px !important;
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
            alt="Forgot Password"
            className="w-100 h-100"
            style={{ objectFit: "cover" }}
          />
        </div>

     
        <div
          className="col-12 col-lg-7 d-flex justify-content-center align-items-center h-100 admin-auth-col"
          style={{ overflowY: "auto" }}
        >
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

          <div
            className="w-100 admin-auth-card"
            style={{ maxWidth: "520px", padding: "1.5rem" }}
          >
            
            <Link
              to="/admin"
              className="d-inline-flex align-items-center gap-2 text-decoration-none mb-5"
              style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}
            >
              <i className="bi bi-arrow-left" style={{ fontSize: "16px" }} />
              Back to login
            </Link>

            <h2
              className="fw-medium mb-2"
              style={{ color: "#111827", fontSize: "1.75rem" }}
            >
              Enter your code
            </h2>
            <p
              className="mb-4"
              style={{ fontSize: "14px", color: "#4b5563", maxWidth: "340px" }}
            >
              We sent a 4-digit code to <b> starbags1993@gmail.com. </b>It
              expires in 2 minutes.
            </p>

            
            <div className="d-flex gap-3 mb-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="form-control text-center otp-input"
                  style={{
                    width: "68px",
                    height: "68px",
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    color: "#111827",
                    borderRadius: "8px",
                    border: "1.5px solid #d1d5db",
                    outline: "none",
                    flexShrink: 0,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                />
              ))}
            </div>
            <span
              style={{ fontSize: "14px", color: "#ef4444", fontWeight: "600" }}
            >
              The code you entered is incorrect. Please try again.
            </span>
         
            <div className="d-flex justify-content-between align-items-center mb-4 resend-row" style={{ width: '320px' }}>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                Didn't receive it?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="btn p-0 text-decoration-none fw-medium"
                  style={{
                    fontSize: "13px",
                    color: "#8b5cf6",
                    border: "none",
                    background: "transparent",
                  }}
                >
                  Resend code
                </button>
              </span>
              <span
                style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}
              >
                {formatTime(timer)}
              </span>
            </div>

            
            <NavLink
              type="button"
              to={'/admin/reset-password'}
              className="btn py-2 verify-btn"
              style={{
                width: '340px',
                backgroundColor: "#8b5cf6",
                color: "white",
                borderRadius: "6px",
                fontWeight: 500,
                fontSize: "15px",
                border: "none",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#7c3aed")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#8b5cf6")
              }
            >
              Verify code
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgetPassword;
