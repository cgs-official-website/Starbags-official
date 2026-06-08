// ─── REPLACE your handleSubmit in CreateAccount.jsx with this ───────────────
// Also add this import at the top of CreateAccount.jsx:
// import { sendOtp } from "../../utils/sendOtp";

const handleSubmit = async (e) => {
  e.preventDefault();
  if (validateForm()) {
    setLoading(true);
    const email = formData.email.trim();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
      const user = userCredential.user;

      // Create Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        role: "user",
        name: email.split("@")[0],
        mobile: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Auto-login
      localStorage.setItem("user", JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: "user",
        name: email.split("@")[0],
        mobile: "",
        gender: "Male",
      }));

      // ─── Generate OTP, store in sessionStorage, send to email ───
      await sendOtp(user.email, "signup");

      // Redirect to OTP verification page
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
      setErrors({ email: errorMsg, password: "" });
    } finally {
      setLoading(false);
    }
  }
};