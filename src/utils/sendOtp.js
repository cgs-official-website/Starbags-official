// src/utils/sendOtp.js
import emailjs from "@emailjs/browser";

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Generates a random 4-digit OTP, stores it in sessionStorage,
 * and sends it to the given email via EmailJS.
 *
 * @param {string} email        - Recipient email address
 * @param {"signup"|"forgot"}   - Which flow (used as sessionStorage key)
 * @returns {Promise<string>}   - Resolves with the generated OTP string
 */
export async function sendOtp(email, flow = "signup") {
  const otp    = Math.floor(1000 + Math.random() * 9000).toString();
  const expiry = Date.now() + 2 * 60 * 1000; // 2 minutes

  const key = flow === "forgot" ? "fp_otp" : "signup_otp";
  sessionStorage.setItem(key, JSON.stringify({ otp, email, expiry }));

  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    { email, passcode: otp, otp },   // must match your EmailJS template variables
    PUBLIC_KEY
  );

  return otp;
}

/**
 * Validates the OTP the user entered against sessionStorage.
 *
 * @param {string} entered  - What the user typed
 * @param {"signup"|"forgot"} flow
 * @returns {{ valid: boolean, error?: string }}
 */
export function verifyOtp(entered, flow = "signup") {
  const key    = flow === "forgot" ? "fp_otp" : "signup_otp";
  const stored = JSON.parse(sessionStorage.getItem(key) || "{}");

  if (!stored.otp) {
    return { valid: false, error: "OTP not found. Please request a new code." };
  }
  if (Date.now() > stored.expiry) {
    sessionStorage.removeItem(key);
    return { valid: false, error: "Your code has expired. Please request a new one." };
  }
  if (entered !== stored.otp) {
    return { valid: false, error: "The code you entered is incorrect. Please try again." };
  }

  sessionStorage.removeItem(key);
  return { valid: true };
}
