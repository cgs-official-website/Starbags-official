import { useState, useEffect } from "react";
import { CgAsterisk } from "react-icons/cg";
// import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { sendOtp } from "../../utils/sendOtp";
import { useAuth } from "../../context/AuthContext";

import "../../assets/styles/CreateAccount.css";


import LoginImage from "../../assets/images/login-image.png";
import { NavLink } from "react-router-dom";

const CreateAccount = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      const user = JSON.parse(localStorage.getItem("user"));
      const role = userData?.role || user?.role || "user";
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [currentUser, userData, navigate]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    termsAccepted: false
  });

  const [errors, setErrors] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };

    // Email validation - strictly email only
    const isEmail = /\S+@\S+\.\S+/.test(formData.email);
    
    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email address.";
      isValid = false;
    } else if (formData.email.trim() === "admin@starbags.com") {
      newErrors.email = "This email is reserved for Admin use.";
      isValid = false;
    } else if (!isEmail) {
      newErrors.email = "Please enter a valid email address.";
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password must be 8 characters or more.";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be 8 characters or more.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      console.log("Form submitted:", formData);
      
      const email = formData.email.trim();
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
        const user = userCredential.user;

        // Create the user document in firestore
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          role: "user",
          name: email.split("@")[0],
          mobile: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Auto-login registered user
        localStorage.setItem("user", JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: "user",
          name: email.split("@")[0],
          mobile: "",
          gender: "Male"
        }));

        // ─── Generate OTP, store in sessionStorage, send to email (non-blocking) ───
        sendOtp(user.email, "signup").catch((err) => {
          console.error("Background OTP sending failed:", err);
        });

        // Redirect to OTP verification page immediately
        navigate("/signup-verification");
      } catch (err) {
        console.error("Firebase Registration Error:", err);
        let errorMsg = "Failed to register account.";
        if (err.code === "auth/email-already-in-use") {
          errorMsg = "This email address is already registered.";
        } else if (err.code === "auth/invalid-email") {
          errorMsg = "Please enter a valid email format.";
        } else if (err.code === "auth/weak-password") {
          errorMsg = "Password is too weak.";
        } else if (err.message?.includes("EmailJS") || err.status) {
          // OTP email failed but account was created — still go to verify page
          // The user can resend from the verify page
          navigate("/signup-verification");
          return;
        }
        setErrors({
          email: errorMsg,
          password: ""
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // ─── GOOGLE SIGN-UP / SIGN-IN ───
  const handleGoogleSignIn = async () => {
    setGoogleError("");
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let role = "user";
      let userData = {};

      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
        role = userData.role === "admin" ? "admin" : "user";
      } else {
        userData = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split("@")[0] || "User",
          photo: user.photoURL || "",
          mobile: "",
          role: "user",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, userData);
      }

      localStorage.setItem("user", JSON.stringify({
        uid: user.uid,
        email: user.email,
        role,
        name: userData.name || user.displayName || user.email?.split("@")[0],
        photo: userData.photo || user.photoURL || "",
        mobile: userData.mobile || "",
        gender: userData.gender || "",
      }));

      navigate("/");
    } catch (err) {
      console.error("Google Sign-Up Error:", err);
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        // silent
      } else if (err.code === "auth/popup-blocked") {
        setGoogleError("Popup was blocked by your browser. Please allow popups for this site.");
      } else if (err.code === "auth/network-request-failed") {
        setGoogleError("Network error. Please check your connection and try again.");
      } else {
        setGoogleError("Google sign-up failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <div className="sign-up">
        {/* LEFT SIDE */}
        <div className="d-none d-lg-block col-lg-7 logo-image">
          <img src={LoginImage} alt="Leather Bag" />

          <div className="sign-up-content">
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
        <div className="col-12 col-lg-5 form-section ">
          <div className="sign-up-form">
            <h6>Create Account</h6>

            <p>Join Star Bags and experience timeless craftsmanship.</p>

            <form onSubmit={handleSubmit}>
              {/* EMAIL */}
              <div className="mb-1">
                <label className="form-label">
                  Email Address
                  <sup>
                    <CgAsterisk />
                  </sup>
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  placeholder="Enter your email address"
                  disabled={loading}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email}</div>
                )}
              </div>

              {/* PASSWORD */}
             <div className="mb-1" style={{ position: "relative" }}>
  <label className="form-label">
    Create password
    <sup>
      <CgAsterisk />
    </sup>
  </label>

  <input
    type={showPassword ? "text" : "password"}
    name="password"
    value={formData.password}
    onChange={handleChange}
    className={`form-control ${errors.password ? "is-invalid" : ""}`}
    placeholder="Create your Password"
    disabled={loading}
    style={{ paddingRight: "40px" }}
  />

  <span
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "15px",
      top: "46px", // Adjusted slightly based on your label margin
      cursor: "pointer",
      color: "#6c757d",
      display: "flex",
      alignItems: "center"
    }}
  >
    {showPassword ? <FiEyeOff /> : <FiEye />}
  </span>

  {errors.password && (
    <div className="invalid-feedback">{errors.password}</div>
  )}
</div>

              {/* CHECKBOX */}
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="remember"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />

                <label className="form-check-label" htmlFor="remember">
                  Accepted the <NavLink className="text-decoration-none term" to="/terms">Terms and condition</NavLink>
                </label>
              </div>

              {/* BUTTON */}
              <div className="d-grid">
                <button className="btn signup-btn" type="submit" disabled={loading}>
                  {loading ? "Registering..." : "Sign up"}
                </button>
              </div>
            </form>

            {/* DIVIDER */}
            <div className="divider">
              <hr />

              <span>or</span>

              <hr />
            </div>

            {/* SOCIAL BUTTONS */}
            <div className="social-buttons">
              <button
                className="social-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                ) : (
                  <FcGoogle className="social-icon" />
                )}
                {googleLoading ? "Connecting..." : "Sign up with Google"}
              </button>
              {googleError && (
                <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '6px', textAlign: 'center' }}>
                  {googleError}
                </p>
              )}
            </div>
            {/* FOOTER */}
            <div className="signin-footer">
              <p>
                Already have an account?
                <NavLink to={"/login"}> Sign in</NavLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateAccount;


// import { CgAsterisk } from "react-icons/cg";
// import { FaApple } from "react-icons/fa";
// import { FcGoogle } from "react-icons/fc";

// import "../../assets/styles/CreateAccount.css";

// import LoginImage from "../../assets/images/login-image.png";
// import { NavLink } from "react-router-dom";

// const CreateAccount = () => {
//   return (
//     <>
//       <div className="sign-up">
//         {/* LEFT SIDE */}
//         <div className="d-none d-lg-block col-lg-7 logo-image">
//           <img src={LoginImage} alt="Leather Bag" />

//           <div className="sign-up-content">
//             <div className="brand-logo">
//               <span>✦</span>
//               <h5>Star Bags</h5>
//             </div>

//             <h3>
//               Timeless Craft.
//               <br />
//               Trusted Always.
//             </h3>

//             <div className="line"></div>

//             <p>
//               Premium leather essentials,
//               <br />
//               crafted to accompany every journey.
//             </p>
//           </div>
//         </div>

//         {/* RIGHT SIDE */}
//         <div className="col-12 col-lg-5 form-section ">
//           <div className="sign-up-form">
//             <h6>Create Account</h6>

//             <p>Join Star Bags and experience timeless craftsmanship.</p>

//             <form>
//               {/* NAME */}
//               {/* <div className="mb-1">
//                 <label className="form-label">
//                   Enter your name
//                   <sup>
//                     <CgAsterisk />
//                   </sup>
//                 </label>

//                 <input
//                   type="text"
//                   className="form-control"
//                   placeholder="Enter your name"
//                 />
//               </div> */}

//               {/* EMAIL */}
//               <div className="mb-1">
//                 <label className="form-label">
//                   E-mail Address
//                   <sup>
//                     <CgAsterisk />
//                   </sup>
//                 </label>

//                 <input
//                   type="email"
//                   className="form-control"
//                   placeholder="Enter your e-mail"
//                 />
//               </div>

//               {/* PASSWORD */}
//               <div className="mb-1">
//                 <label className="form-label">
//                   Create password
//                   <sup>
//                     <CgAsterisk />
//                   </sup>
//                 </label>

//                 <input
//                   type="password"
//                   className="form-control"
//                   placeholder="Create your Password"
//                 />
//               </div>

//               {/* CONFIRM PASSWORD */}
//               {/* <div className="mb-3">
//                 <label className="form-label">
//                   Confirm your password
//                   <sup>
//                     <CgAsterisk />
//                   </sup>
//                 </label>

//                 <input
//                   type="password"
//                   className="form-control"
//                   placeholder="Confirm your password"
//                 />
//               </div> */}

//               {/* CHECKBOX */}
//               <div className="form-check mb-3">
//                 <input
//                   className="form-check-input"
//                   type="checkbox"
//                   id="remember"
//                 />

//                 <label className="form-check-label" htmlFor="remember">
//                   Accepted the <NavLink className="text-decoration-none term" >Terms and condition</NavLink>
//                 </label>
//               </div>

//               {/* BUTTON */}
//               <div className="d-grid">
//                 <NavLink to={'/signupVerify'} className="btn signup-btn" type="submit">
//                   Sign up
//                 </NavLink>
//               </div>
//             </form>

//             {/* DIVIDER */}
//             <div className="divider">
//               <hr />

//               <span>or</span>

//               <hr />
//             </div>

//             {/* SOCIAL BUTTONS */}
//             <div className="social-buttons">
              
//               <button className="social-btn">
//                 <FcGoogle className="social-icon" />
//                 Sign in with Google
//               </button>  

//               <button className="social-btn">
//                 <FaApple className="social-icon" />
//                 Sign in with Apple
//               </button>
//             </div>
//             {/* FOOTER */}
//             <div className="signin-footer">
//               <p>
//                 Already have an account?
//                 <NavLink  to={"/login"}> Sign in</NavLink>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default CreateAccount;