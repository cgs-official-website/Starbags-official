import React, { useEffect } from "react";

const PaymentPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="popup-overlay"
      onClick={(e) => e.target.id === "popup-overlay" && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30000,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Injecting CSS Keyframes directly into render so you don't need any external CSS files */}
      <style>{`
        @keyframes popupScaleIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        /* THE REAL TRICK: White line slicing slash across the circle */
        @keyframes whiteSlashSlice {
          0% {
            transform: translate(-100%, 100%) rotate(-45deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          40% {
            transform: translate(100%, -100%) rotate(-45deg);
            opacity: 1;
          }
          100% {
            transform: translate(100%, -100%) rotate(-45deg);
            opacity: 0;
          }
        }

        /* Checkmark pop out scale effect after slicing completed */
        @keyframes checkmarkPopOut {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          70% { transform: scale(1.2) rotate(5deg); opacity: 0.8; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>

      {/* ─── MODAL MAIN CARD WINDOW ─── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          width: "90%",
          maxWidth: "520px",
          borderRadius: "8px",
          padding: "60px 40px",
          textAlign: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          position: "relative",
          animation: "popupScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          boxSizing: "border-box",
        }}
      >
        {/* ─── ANIMATION LAYER CORE ENGINE ─── */}
        <div
          style={{
            position: "relative",
            width: "82px",
            height: "82px",
            margin: "0 auto 30px auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Base Solid Static Purple Circle */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "#8B5CF6",
              borderRadius: "50%",
              zIndex: 1,
            }}
          />

          {/* TRICK: The Dynamic Slicing White Knife Blade Layer */}
          <div
            style={{
              position: "absolute",
              width: "140%",
              height: "8px", // Blade thickness
              backgroundColor: "#ffffff",
              zIndex: 2,
              borderRadius: "4px",
              boxShadow: "0 0 8px rgba(255,255,255,0.8)",
              animation: "whiteSlashSlice 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards",
              animationDelay: "0.1s", // Fires instantly right after circle mounts
            }}
          />

          {/* END STATE: Nested White Checkmark Vector Icon */}
          <div
            style={{
              position: "absolute",
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "checkmarkPopOut 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
              animationDelay: "0.5s", // Emerges flawlessly exactly when blade passes across center
              transform: "scale(0)",
              opacity: 0,
            }}
          >
            <svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.5 12.5L9.5 17.5L19.5 7.5"
                stroke="#ffffff"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* ─── TITLE HEADINGS MATCHING VIDEO METRICS ─── */}
        <h2
          style={{
            margin: 0,
            fontWeight: "500",
            color: "#000000",
            fontSize: "1.3rem",
            letterSpacing: "-0.5px",
          }}
        >
          Order successfully placed
        </h2>
      </div>
    </div>
  );
};

export default PaymentPopup;