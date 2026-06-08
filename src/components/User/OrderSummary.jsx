import React from "react";
import { GiPartyPopper } from "react-icons/gi";
import { FaArrowRight } from "react-icons/fa";

const OrderSummary = ({
  totalItemsCount = 0,
  rawTotal = 0,        // Sum of (oldPrice * qty)
  discountTotal = 0,   // Sum of product price savings
  subTotal = 0,        // total items value after standard retail discount deduction
  couponDiscount = 0,  // Value computed from applied coupon code percentage
  couponPercentageLabel = "",
  gstTotal = 0,
  finalTotal = 0,
  isBillingPage = false,
  isCheckoutPage = false, // Received from Checkout.jsx
  paymentMethod = "cod",   // Received from BillAddress.jsx
  handleCheckout,
}) => {
  return (
    <div className="summary-box">
      <h3 className="summary-title">Order Summary</h3>
      
      <div className="summary-row">
        <span>Items Price ({totalItemsCount})</span>
        <span>
          ₹{typeof rawTotal === "number" ? rawTotal.toFixed(2) : Number(rawTotal).toFixed(2)}
        </span>
      </div>
      
      <div className="summary-row">
        <span>Discount</span>
        <span className="discount-price">
          -₹{typeof discountTotal === "number" ? discountTotal.toFixed(2) : Number(discountTotal).toFixed(2)}
        </span>
      </div>

      {couponDiscount > 0 && (
        <div className="summary-row coupon-discount-row">
          <span className="fw-bold text-success">Coupon Applied ({couponPercentageLabel})</span>
          <span className="text-success fw-bold">
            -₹{typeof couponDiscount === "number" ? couponDiscount.toFixed(2) : Number(couponDiscount).toFixed(2)}
          </span>
        </div>
      )}

      <div className="summary-row">
        <span>Sub total</span>
        <span>
          ₹{typeof subTotal === "number" ? subTotal.toFixed(2) : Number(subTotal).toFixed(2)}
        </span>
      </div>
      
      <div className="summary-row">
        <span>GST Include (18%)</span>
        <span>
          ₹{typeof gstTotal === "number" ? gstTotal.toFixed(2) : Number(gstTotal).toFixed(2)}
        </span>
      </div>
      
      <div className="total-row">
        <span>Total</span>
        <span className="total-price">
          ₹{typeof finalTotal === "number" ? finalTotal.toFixed(2) : Number(finalTotal).toFixed(2)}
        </span>
      </div>
      
      {/* ─── FIXED: ACTION BUTTON RENDERS ONLY IF NOT ON BILLING PAGE ─── */}
      {!isBillingPage && (
        <button onClick={handleCheckout} className="checkout-btn w-100 mt-3">
          {isCheckoutPage ? "Proceed to Billing" : "Proceed to Checkout"}
          &nbsp; <FaArrowRight />
        </button>
      )}

      {/* Dynamic Celebration Tag Row Footer (Shows beautifully only on Billing Page) */}
      {isBillingPage && (discountTotal > 0 || couponDiscount > 0) && (
        <h4 className="save-content btn w-100 text-center m-0 mt-3">
          <GiPartyPopper /> Yay! you saved ₹{(Number(discountTotal) + Number(couponDiscount)).toFixed(2)}
        </h4>
      )}
    </div>
  );
};

export default OrderSummary;