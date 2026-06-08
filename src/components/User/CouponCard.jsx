import React from "react";
import { FaRegCopy } from "react-icons/fa";
import "../../assets/styles/coupon.css";

export const couponsDataList = [
  {
    code: "SBC-WLT-001",
    offer: "10%",
    percentage: 10,
    minThreshold: 1000,
    category: "Wallet",
    subCategory: "All",
    usageLimit: 2,
    description: "Save 10% on leather wallets and cardholders.",
    startDate: "2026-04-01",
    endDate: "2026-07-01",
  },
  {
    code: "SBC-BLT-001",
    offer: "10%",
    percentage: 10,
    minThreshold: 1000,
    category: "Belt",
    subCategory: "All",
    usageLimit: 5,
    description: "Flat discount active on genuine leather apparel belts.",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  },
  {
    code: "SBC-BAG-001",
    offer: "15%",
    percentage: 15,
    minThreshold: 1500,
    category: "Bag",
    subCategory: "Hand Bag",
    usageLimit: 1,
    description: "Get 15% off on our premium Hand Bag collections.",
    startDate: "2026-05-01",
    endDate: "2026-06-30",
  },
  {
    code: "SBC-BAG-002",
    offer: "30%",
    percentage: 30,
    minThreshold: 2500,
    category: "Bag",
    subCategory: "Sling Bag",
    usageLimit: 1,
    description: "Exclusive discount on luxury Sling Bags.",
    startDate: "2026-05-10",
    endDate: "2026-06-15",
  },
  {
    code: "SBC-BAG-003",
    offer: "20%",
    percentage: 20,
    minThreshold: 3000,
    category: "Bag",
    subCategory: "Tolly Bag",
    usageLimit: 1,
    description: "Save big on durable, high-capacity premium Tolly Bags.",
    startDate: "2026-05-01",
    endDate: "2026-08-31",
  },
  {
    code: "SBC-BAG-004",
    offer: "25%",
    percentage: 25,
    minThreshold: 4000,
    category: "Bag",
    subCategory: "Travel Bag",
    usageLimit: 1,
    description: "Special seasonal discount applied to all classic Travel Bags.",
    startDate: "2026-05-01",
    endDate: "2026-07-15",
  },
  {
    code: "SBC-BAG-005",
    offer: "12%",
    percentage: 12,
    minThreshold: 1200,
    category: "Bag",
    subCategory: "School Bag",
    usageLimit: 2,
    description: "Back-to-school offer on highly ergonomic School Bags.",
    startDate: "2026-05-15",
    endDate: "2026-06-30",
  },
  {
    code: "SBC-BAG-006",
    offer: "18%",
    percentage: 18,
    minThreshold: 2000,
    category: "Bag",
    subCategory: "Office Bag",
    usageLimit: 1,
    description: "Professional markdown valid on executive Office Bags.",
    startDate: "2026-04-01",
    endDate: "2026-09-01",
  },
  {
    code: "SBC-BAG-007",
    offer: "10%",
    percentage: 10,
    minThreshold: 800,
    category: "Bag",
    subCategory: "Lunch Bag",
    usageLimit: 3,
    description: "Compact deal valid on insulated, fresh Lunch Bags.",
    startDate: "2026-02-01",
    endDate: "2026-12-31",
  },
  {
    code: "SBC-BAG-008",
    offer: "22%",
    percentage: 22,
    minThreshold: 2200,
    category: "Bag",
    subCategory: "Laptop Bag",
    usageLimit: 1,
    description: "Secure savings on shockproof protective Laptop Bags.",
    startDate: "2026-03-15",
    endDate: "2026-07-31",
  }
];

const CouponCard = ({ coupon, onSelectCoupon, currentSubTotal }) => {
  const minThreshold = coupon.minThreshold || 1000; 

  const copyCoupon = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(coupon.code);
    alert(`Coupon "${coupon.code}" copied to clipboard!`);
  };

  return (
    <div className="custom-coupon-card">
      <div className="coupon-header-row">
        <span className="coupon-discount-badge">{coupon.offer} off</span>
        <button 
          className="coupon-action-apply-btn"
          onClick={() => onSelectCoupon(coupon.code)}
        >
          Apply
        </button>
      </div>

      <div className="coupon-code-clipboard-row">
        <span className="coupon-plain-code-text">{coupon.code}</span>
        <FaRegCopy className="coupon-copy-utility-icon" onClick={copyCoupon} />
      </div>

      <p className="coupon-savings-green-text">
        Save ₹{((currentSubTotal * (coupon.percentage || 0)) / 100).toFixed(0)} on this order
      </p>

      <div className="coupon-card-divider-dashed"></div>

      <p className="coupon-terms-description-text">
        If you want to Claim Coupon Add minimum ₹{minThreshold} Product, If not , you can't claim this coupon
      </p>
    </div>
  );
};

export default CouponCard;