import { useState } from "react";
import { Link } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import { CgAsterisk } from "react-icons/cg";
import loginImage from "../../assets/images/login-image.png";
import "../../assets/styles/Login.css";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";

// ─── Step 1: Enter Email ──────────────────────────────────────────────────────
function EmailStep({ onLinkSent }) {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed)                       return setError("Please enter your email address.");
    if (!/\S+@\S+\.\S+/.test(trimmed)) return setError("Please enter a valid email address.");

    setLoading(true);
    setError("");
    try {
      // Check if user exists using signup-then-delete check
      let exists = false;
      try {
        console.log("Checking email existence via signup-then-delete...");
        const checkCred = await createUserWithEmailAndPassword(auth, trimmed, "check-exists-dummy-password-12345");
        // If it succeeded, the email did not exist! We must delete this dummy account immediately.
        console.log("Email does not exist. Deleting dummy account...");
        await deleteUser(checkCred.user);
        exists = false;
      } catch (signUpErr) {
        console.log("SignUp check error code:", signUpErr.code);
        if (signUpErr.code === "auth/email-already-in-use") {
          exists = true;
        } else {
          console.error("SignUp check failed with other error:", signUpErr);
          // If signup failed because of something else, fallback to true so we don't block legitimate users
          exists = true;
        }
      }

      if (!exists) {
        setError("This email is not registered. Please create an account.");
        return;
      }

      // 2. Trigger Firebase's standard password reset email with action settings to redirect back to our resetPassword page
      const actionCodeSettings = {
        url: `${window.location.origin}/resetPassword`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, trimmed, actionCodeSettings);
      onLinkSent(trimmed);
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <div className="mb-4">
        <Link to="/login" className="navigate d-inline-flex align-items-center gap-2">
          <BiArrowBack /> Back to login
        </Link>
      </div>
      <h6>Forgot Password?</h6>
      <p>Enter your registered email and we'll send you a secure password reset link.</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">
            Email Address
            <sup style={{ color: "red", fontSize: "10px", top: "-2px" }}>
              <CgAsterisk />
            </sup>
          </label>
          <input
            type="email"
            className={`form-control ${error ? "is-invalid" : ""}`}
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            disabled={loading}
          />
          {error && <div className="invalid-feedback">{error}</div>}
        </div>
        <div className="d-grid mt-4">
          <button className="btn login-btn" type="submit" disabled={loading}>
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" />Sending link...</>
            ) : "Send reset link"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Step 2: Success Step ────────────────────────────────────────────────────
function SuccessStep({ email }) {
  return (
    <div className="login-form">
      <div className="mb-4 text-center">
        <span style={{ fontSize: "3.5rem" }}>✉️</span>
      </div>
      <h6 className="text-center">Check your inbox</h6>
      <p className="text-center" style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.6" }}>
        We have sent a secure password reset link to <b>{email}</b>. Please check your email and click the link to reset your password.
      </p>
      <div className="d-grid mt-4">
        <Link to="/login" className="btn login-btn">
          Back to login
        </Link>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function ForgotPassword() {
  const [step, setStep]           = useState("email"); // "email" | "success"
  const [sentEmail, setSentEmail] = useState("");

  return (
    <div className="login">
      <div className="d-none d-lg-block col-lg-7 logo-image">
        <img src={loginImage} alt="Leather Bag" />
        <div className="login-content">
          <div className="brand-logo"><span>✦</span><h5>Star Bags</h5></div>
          <h3>Timeless Craft.<br />Trusted Always.</h3>
          <div className="line"></div>
          <p>Premium leather essentials,<br />crafted to accompany every journey.</p>
        </div>
      </div>
      <div className="col-12 col-lg-5 form-section">
        {step === "email" ? (
          <EmailStep onLinkSent={(email) => { setSentEmail(email); setStep("success"); }} />
        ) : (
          <SuccessStep email={sentEmail} />
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;