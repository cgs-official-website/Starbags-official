import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export const ScrollBanner = () => {
  const [texts, setTexts] = useState("Fashion meets function — grab your Star Bag today.");

  useEffect(() => {
    const fetchOfferTexts = async () => {
      try {
        const docRef = doc(db, "banners", "offer-banner-texts");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const combined = [data.text1, data.text2, data.text3, data.text4]
            .filter(Boolean)
            .join("   •   ");
          if (combined) setTexts(combined);
        }
      } catch (error) {
        console.error("Error fetching offer banner texts:", error);
      }
    };
    fetchOfferTexts();
  }, []);

  // Repeat the text multiple times to ensure it fills wide screens
  const repeatedText = Array(6).fill(texts).join("     •    ");

  return (
    <div
      className="p-2 d-flex align-items-center"
      style={{
        color: "var(--white-color)",
        background: "var(--levender)",
        fontSize: "1.35rem",
      }}
    >
      <style>
        {`
          .seamless-marquee-container {
            width: 100%;
            overflow: hidden;
            white-space: nowrap;
            display: flex;
          }
          .seamless-marquee-content {
            display: flex;
            width: max-content;
            animation: seamless-scroll 180s linear infinite;
          }
          .seamless-marquee-text {
          // font-family: "Playfair Display", serif;
          font-size: 1.3rem;
            padding-right: 2rem;
          }
          @keyframes seamless-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}
      </style>
      <div className="seamless-marquee-container">
        <div className="seamless-marquee-content">
          <span className="seamless-marquee-text">{repeatedText}</span>
          <span className="seamless-marquee-text">{repeatedText}</span>
        </div>
      </div>
    </div>
  );
};
