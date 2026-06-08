import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import { sendOtp, verifyOtp } from "../../utils/sendOtp";
import loginImage from "../../assets/images/login-image.png";
import "../../assets/styles/Login.css";

function SignUpVerification() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(119);
  const [timerActive, setTimerActive] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  const stored = JSON.parse(sessionStorage.getItem("signup_otp") || "{}");
  const email = stored?.email || "your email";

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!timerActive || timer <= 0) return;
    const id = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          setTimerActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerActive, timer]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError("");
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handleResend = () => {
    setResending(true);
    setError("");
    
    // Reset inputs and restart countdown instantly for smooth UX
    setTimer(119);
    setTimerActive(true);
    setOtp(["", "", "", ""]);
    inputRefs.current[0]?.focus();

    // Send the email in the background
    sendOtp(email, "signup")
      .catch((err) => {
        console.error("Resend OTP background fail:", err);
        setError("Failed to resend code. Please try again.");
      })
      .finally(() => {
        setResending(false);
      });
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const entered = otp.join("");
    if (entered.length < 4)
      return setError("Please enter the complete 4-digit code.");
    const result = verifyOtp(entered, "signup");
    if (!result.valid) return setError(result.error);
    setSuccess(true);
    setTimeout(() => navigate("/"), 1200);
  };

  return (
    <div className="login">
      <div className="d-none d-lg-block col-lg-7 logo-image">
        <img src={loginImage} alt="Leather Bag" />
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
      <div className="col-12 col-lg-5 form-section">
        <div className="login-form">
          <div className="mb-4">
            <Link
              to="/signup"
              className="navigate d-inline-flex align-items-center gap-2"
            >
              <BiArrowBack /> Back to sign up
            </Link>
          </div>
          <h6>Verify your account</h6>
          <p>
            We sent a 4-digit verification code to <b>{email}</b>. Please enter
            it below.
          </p>
          <form onSubmit={handleVerify}>
            <div className="d-flex gap-3 mb-2 justify-content-between">
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
                  className={`form-control text-center ${error ? "is-invalid" : success ? "is-valid" : ""}`}
                  style={{
                    width: "65px",
                    height: "65px",
                    fontSize: "1.5rem",
                    fontWeight: "600",
                  }}
                />
              ))}
            </div>
            <div className="mb-3" style={{ minHeight: "20px" }}>
              {error && (
                <span
                  style={{
                    fontSize: "13px",
                    color: "#ff4d4d",
                    fontWeight: "600",
                  }}
                >
                  {error}
                </span>
              )}
              {success && (
                <span
                  style={{
                    fontSize: "13px",
                    color: "#28a745",
                    fontWeight: "600",
                  }}
                >
                  ✓ Verified! Redirecting...
                </span>
              )}
            </div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <span style={{ fontSize: "13px", color: "var(--gray)" }}>
                Didn't receive it?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timerActive || resending}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    fontWeight: "700",
                    color:
                      timerActive || resending
                        ? "var(--gray)"
                        : "var(--levender)",
                    cursor: timerActive || resending ? "default" : "pointer",
                  }}
                >
                  {resending ? "Sending..." : "Resend code"}
                </button>
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--gray)",
                  fontWeight: "700",
                }}
              >
                {formatTime(timer)}
              </span>
            </div>
            <div className="d-grid">
              <button
                type="submit"
                className="btn login-btn"
                disabled={success}
              >
                {success ? "Verified!" : "Confirm & Activate"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUpVerification;
