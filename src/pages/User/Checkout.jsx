import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaArrowLeft as ArrowIcon,
  FaExclamationTriangle,
  FaTrashAlt,
} from "react-icons/fa";
import { BiEditAlt } from "react-icons/bi";
import { MdAdd, MdClose, MdModeEdit } from "react-icons/md";
import { TiPencil } from "react-icons/ti";
import CartItem from "../../components/User/YourCart";
import OrderSummary from "../../components/User/OrderSummary";
import Navbar from "../../components/User/Navbar";
import Footer from "../../components/User/Footer";
import { useWishlist } from "../../context/WishlistContext";
import CouponCard from "../../components/User/CouponCard";
import { useAuth } from "../../context/AuthContext";
import { AddressSkeleton } from "../../components/User/UserSkeleton";

import { db } from "../../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";

import "../../assets/styles/Cart.css";
import "../../assets/styles/checkout.css";

// ─── HELPER: normalize subCategory string for comparison ───
const normSub = (str = "") => str.toLowerCase().trim();

// Removed hardcoded getCouponSubtotal

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { toggleWishlist } = useWishlist();

  // ─── STATE ───
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState(null);
  const [showAddressWarningModal, setShowAddressWarningModal] = useState(false);

  const {
    allCartItems = [],
    cartItems: initialSelected = [],
    couponPercentageLabel = "",
    couponCode = "",
  } = location.state || {};

  const [checkoutItems, setCheckoutItems] = useState(initialSelected);
  const [couponInput, setCouponInput] = useState(couponCode);
  const [couponError, setCouponError] = useState("");
  const [couponPercentLabel, setCouponPercentLabel] = useState(
    couponPercentageLabel,
  );
  const [dbCoupons, setDbCoupons] = useState([]);

  // ─── FETCH ADDRESSES ───
  useEffect(() => {
    if (!currentUser) return;
    const fetchAddresses = async () => {
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const addrs = snap.data().addresses ?? [];
          setSavedAddresses(addrs);
          localStorage.setItem("savedAddresses", JSON.stringify(addrs));
          if (location.state?.returnedAddressId) {
            setSelectedAddressId(location.state.returnedAddressId);
          } else if (addrs.length > 0) {
            setSelectedAddressId(addrs[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching addresses:", err);
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, [currentUser, location.state?.returnedAddressId]);

  useEffect(() => {
    if (initialSelected.length === 0) navigate("/cart");
    window.scrollTo(0, 0);
  }, [initialSelected, navigate]);

  // ─── FETCH COUPONS FROM FIREBASE ───
  useEffect(() => {
    const fetchDbCoupons = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "coupons"));
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let userUsedCoupons = {};
        if (currentUser) {
          try {
            const userSnap = await getDoc(doc(db, "users", currentUser.uid));
            if (userSnap.exists()) {
              userUsedCoupons = userSnap.data().usedCoupons || {};
            }
          } catch (err) {
            console.error("Error fetching user usedCoupons:", err);
          }
        }

        const list = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let isActive = true;

          if (data.startDate) {
            const startDate = new Date(data.startDate);
            startDate.setHours(0, 0, 0, 0);
            if (startDate > today) isActive = false;
          }
          if (data.endDate) {
            const endDate = new Date(data.endDate);
            endDate.setHours(0, 0, 0, 0);
            if (endDate < today) isActive = false;
          }

          const usageLimit = Number(data.usageLimit);
          const userUsedCount =
            Number(userUsedCoupons[docSnap.id] || userUsedCoupons[data.code]) ||
            0;
          if (
            !isNaN(usageLimit) &&
            usageLimit > 0 &&
            userUsedCount >= usageLimit
          ) {
            isActive = false;
          }

          if (isActive) {
            const discountRaw = (data.discount || "").replace("%", "").trim();
            const percentage = parseInt(discountRaw, 10) || 0;
            const offer = `${percentage}%`;

            list.push({
              ...data,
              id: docSnap.id,
              offer,
              percentage,
              minThreshold: Number(data.minOrder) || 0,
              description: data.desc || "",
              subCategory: data.subCategory || "",
              category: data.category || "",
              code: data.code || docSnap.id,
            });
          }
        });

        setDbCoupons(list);
      } catch (err) {
        console.error("Error fetching coupons from DB:", err);
      }
    };
    fetchDbCoupons();
  }, [currentUser]);

  // ─── SUBTOTAL CALCULATIONS ───
  const getSubtotalByCategory = (categoryName, subCategoryName = "all") => {
    return checkoutItems
      .filter((item) => {
        const itemCat = (item.category || "").toLowerCase().trim();
        const itemSub = normSub(item.subCategory);
        const matchesCat = itemCat === categoryName.toLowerCase().trim();
        if (subCategoryName === "all") return matchesCat;
        return matchesCat && itemSub === subCategoryName.toLowerCase().trim();
      })
      .reduce((acc, item) => acc + Number(item.price) * (item.qty || 1), 0);
  };

  const totalItemsCount = checkoutItems.reduce(
    (acc, item) => acc + (item.qty || 1),
    0,
  );

  // rawTotal = sum of original (real/MRP) prices
  const rawTotal = checkoutItems.reduce((acc, item) => {
    const originalPrice = Number(item.realPrice) || Number(item.price) || 0;
    return acc + originalPrice * (item.qty || 1);
  }, 0);

  // baseSubTotal = sum of discounted selling prices (after product-level markdown)
  const baseSubTotal = checkoutItems.reduce(
    (acc, item) => acc + Number(item.price) * (item.qty || 1),
    0,
  );

  // productDiscountTotal = MRP - selling price (product-level savings only)
  const productDiscountTotal = Math.round(rawTotal - baseSubTotal);

  // ─── DYNAMIC COUPON SUBTOTAL CALCULATION ───
  const getCouponSubtotal = (coupon) => {
    const cat = (coupon.category || "").toLowerCase().trim();
    const sub = normSub(coupon.subCategory);

    if (cat === "all products" || cat === "all") return baseSubTotal;
    
    // If coupon is for "All Bags" or similar
    if (sub === "all bags" || sub === "all" || sub === "") {
      return getSubtotalByCategory(cat, "all");
    }
    
    return getSubtotalByCategory(cat, sub);
  };

  // ─── COUPON DISCOUNT CALCULATION ───
  // couponDiscount = percentage off on the category-specific subtotal
  let calculatedCouponDiscount = 0;
  if (couponPercentLabel) {
    const matched = dbCoupons.find(
      (c) => (c.code || "").toUpperCase() === couponInput.trim().toUpperCase(),
    );
    if (matched) {
      const activeSubtotal = getCouponSubtotal(matched);
      if (activeSubtotal >= matched.minThreshold) {
        calculatedCouponDiscount = Math.round((activeSubtotal * matched.percentage) / 100);
      }
    }
  }

  // subTotal = baseSubTotal - couponDiscount  (what GST is calculated on)
  const subTotalAfterCoupon =Math.round(
    baseSubTotal - calculatedCouponDiscount > 0
      ? baseSubTotal - calculatedCouponDiscount
      : 0
  );

  const gstTotal = Math.round(subTotalAfterCoupon * 0.18);
  const finalTotal = Math.round(subTotalAfterCoupon + gstTotal);

  const activeSelectedAddress = savedAddresses.find(
    (addr) => addr.id === selectedAddressId,
  );

  // ─── VISIBLE COUPONS FILTER ───
  const visibleCoupons = dbCoupons.filter((c) => {
    const activeSubtotal = getCouponSubtotal(c);
    return activeSubtotal > 0;
  });

  // ─── APPLY COUPON HANDLER ───
  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const matched = dbCoupons.find(
      (c) => (c.code || "").toUpperCase() === code,
    );

    if (!matched) {
      setCouponError("Invalid or expired coupon code");
      return;
    }

    const activeSubtotal = getCouponSubtotal(matched);

    if (activeSubtotal >= matched.minThreshold) {
      setCouponPercentLabel(matched.offer);
      setCouponError("");
    } else {
      setCouponPercentLabel("");
      setCouponError(
        `Add minimum ₹${matched.minThreshold} of applicable products to use this coupon`,
      );
    }
  };

  // ─── QTY HANDLERS ───
  const handleQtyIncrease = (id) => {
    setCheckoutItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: (item.qty || 1) + 1 } : item,
      ),
    );
  };

  const handleQtyDecrease = (id) => {
    setCheckoutItems((prev) =>
      prev.map((item) =>
        item.id === id && (item.qty || 1) > 1
          ? { ...item, qty: (item.qty || 1) - 1 }
          : item,
      ),
    );
  };

  // ─── ADDRESS HANDLERS ───
  const promptDeleteAddress = (e, id) => {
    e.stopPropagation();
    setTargetDeleteId(id);
    setShowDeleteModal(true);
  };

  const executeDeleteAddress = async () => {
    const updated = savedAddresses.filter((addr) => addr.id !== targetDeleteId);
    setSavedAddresses(updated);
    localStorage.setItem("savedAddresses", JSON.stringify(updated));
    if (currentUser) {
      try {
        await updateDoc(doc(db, "users", currentUser.uid), {
          addresses: updated,
        });
      } catch (err) {
        console.error("Error saving addresses to DB:", err);
      }
    }
    if (selectedAddressId === targetDeleteId) {
      setSelectedAddressId(updated.length > 0 ? updated[0].id : null);
    }
    setShowDeleteModal(false);
    setTargetDeleteId(null);
  };

  // ─── PROCEED TO BILLING ───
  const handleProceedToBilling = () => {
    if (!activeSelectedAddress) {
      setShowAddressWarningModal(true);
      return;
    }
    const matchedCoupon = dbCoupons.find(
      (c) => (c.code || "").toUpperCase() === couponInput.trim().toUpperCase(),
    );
    navigate("/BillAddress", {
      state: {
        allCartItems,
        cartItems: checkoutItems,
        totalItemsCount,
        rawTotal,
        // ─── Pass product discount and coupon discount SEPARATELY ───
        productDiscountTotal,                           // MRP - selling price
        couponDiscount: calculatedCouponDiscount,       // coupon savings
        subTotal: subTotalAfterCoupon,                  // after both discounts
        couponPercentageLabel: couponPercentLabel,
        appliedCouponCode: couponPercentLabel
          ? couponInput.trim().toUpperCase()
          : "",
        appliedCouponId:
          couponPercentLabel && matchedCoupon ? matchedCoupon.id : "",
        gstTotal,
        finalTotal,
        selectedAddress: activeSelectedAddress,
      },
    });
  };

  return (
    <>
      <Navbar />
      <div className="cart-page style-page-checkout">
        <div className="checkout-header">
          <h2 className="main-title">Product Checkout</h2>
          <button
            className="back-navigation-btn"
            onClick={() => navigate("/cart")}
          >
            <ArrowIcon className="me-2" /> Back to Cart
          </button>
        </div>

        <div className="cart-layout-grid">
          <div className="cart-left">
            {/* ─── ADDRESS BOX ─── */}
            <div className="address-box mb-3">
              <div className="address-top-row">
                <h4 className="section-subtitle-heading">Address</h4>
                {!loadingAddresses && savedAddresses.length > 0 && (
                  <button
                    className="choose-address-btn d-flex align-items-center gap-1"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <BiEditAlt /> Choose Address
                  </button>
                )}
              </div>

              {loadingAddresses ? (
                <AddressSkeleton />
              ) : savedAddresses.length === 0 ? (
                <div
                  className="empty-address-viewport d-flex justify-content-center align-items-center py-3 border rounded"
                  style={{ backgroundColor: "#ffffff" }}
                >
                  <button
                    type="button"
                    className="add-delivery-trigger-btn d-flex align-items-center gap-2"
                    onClick={() => navigate("/address")}
                  >
                    <TiPencil style={{ transform: "rotate(-45deg)" }} /> Add
                    your Delivery Address
                  </button>
                </div>
              ) : !activeSelectedAddress ? (
                <div className="p-3 bg-warning bg-opacity-10 border border-warning rounded text-warning fw-semibold small d-flex justify-content-between align-items-center">
                  <span>
                    ⚠️ Please select an active delivery address card to unlock
                    billing options.
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-warning fw-bold text-dark px-3"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Select Address
                  </button>
                </div>
              ) : (
                <div className="address-body-content">
                  <p className="user-name-line">
                    {activeSelectedAddress.name} ,{" "}
                    {activeSelectedAddress.address}
                  </p>
                  <p className="user-city-zip">
                    {activeSelectedAddress.city}, {activeSelectedAddress.state}{" "}
                    - {activeSelectedAddress.pin}
                  </p>
                  <p className="user-phone-line">
                    Mobile:{" "}
                    {activeSelectedAddress.mobile ||
                      activeSelectedAddress.contact}
                  </p>
                </div>
              )}
            </div>

            {/* ─── CART ITEMS ─── */}
            <div className="cart-items">
              {checkoutItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onIncrease={handleQtyIncrease}
                  onDecrease={handleQtyDecrease}
                  onToggleWishlist={toggleWishlist}
                  showActions={false}
                  showCheckbox={false}
                />
              ))}
            </div>
          </div>

          <div className="cart-right">
            {/*
              ─── ORDER SUMMARY: correct breakdown ───
              rawTotal          = MRP total
              productDiscount   = MRP - selling price  (shown as "Discount")
              couponDiscount    = coupon savings        (shown as "Coupon Discount")
              subTotal          = selling price - couponDiscount
              gstTotal          = subTotal × 18%
              finalTotal        = subTotal + gstTotal
            */}
            <OrderSummary
              totalItemsCount={totalItemsCount}
              rawTotal={rawTotal}
              discountTotal={productDiscountTotal}
              subTotal={subTotalAfterCoupon}
              couponDiscount={calculatedCouponDiscount}
              couponPercentageLabel={couponPercentLabel}
              gstTotal={gstTotal}
              finalTotal={finalTotal}
              isBillingPage={false}
              isCheckoutPage={true}
              handleCheckout={handleProceedToBilling}
            />

            {/* ─── COUPON SECTION ─── */}
            <div className="coupon-section">
              <h4 className="coupon-title" style={{ paddingTop: "20px" }}>
                Apply coupon
              </h4>
              <div className="coupon-input-box">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  className="coupon-input"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    setCouponError("");
                  }}
                />
                <button className="apply-btn" onClick={handleApplyCoupon}>
                  Apply
                </button>
              </div>

              {couponError && (
                <p className="coupon-error-msg text-danger small mt-1">
                  {couponError}
                </p>
              )}

              {/* ─── COUPON CARDS ─── */}
              <div className="coupon-list" style={{ marginTop: "16px" }}>
                {visibleCoupons.length === 0 ? (
                  <p className="text-muted small">
                    No coupons available for your cart items.
                  </p>
                ) : (
                  visibleCoupons.map((couponItem) => {
                      const subTotalFeedValue = getCouponSubtotal(couponItem);
                    return (
                      <CouponCard
                        key={couponItem.code}
                        coupon={couponItem}
                        onSelectCoupon={(code) => {
                          setCouponInput(code);
                          setCouponPercentLabel("");
                          setCouponError("");
                          document
                            .querySelector(".coupon-input")
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                        }}
                        currentSubTotal={subTotalFeedValue}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ADDRESS MODAL ─── */}
      {isModalOpen && (
        <div
          className="address-popup-modal-overlay d-flex justify-content-center align-items-center"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 999,
          }}
        >
          <div
            className="address-popup-modal-box shadow-lg p-4 rounded"
            style={{
              width: "92%",
              maxWidth: "625px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
              <h4
                className="m-0 text-dark fw-bold"
                style={{ fontSize: "1.4rem" }}
              >
                Select delivery address
              </h4>
              <button
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => setIsModalOpen(false)}
              >
                <MdClose size={24} />
              </button>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5
                className="m-0 text-dark fw-semibold"
                style={{ fontSize: "1.05rem" }}
              >
                Saved Addresses
              </h5>
              <button
                type="button"
                className="popup-add-new-address-btn d-flex align-items-center gap-1"
                style={{
                  backgroundColor: "#8b5cf6",
                  color: "#fff",
                  border: "none",
                  padding: "7px 14px",
                  borderRadius: "6px",
                  fontWeight: "600",
                  fontSize: "0.8rem",
                }}
                onClick={() => navigate("/address")}
              >
                <MdAdd size={16} /> Add a New Address
              </button>
            </div>
            <div
              className="popup-address-items-scroller pr-1"
              style={{ maxHeight: "365px", overflowY: "auto" }}
            >
              {savedAddresses.map((addr, index) => (
                <div
                  key={addr.id}
                  className={`popup-address-item-card p-3 mb-3 border rounded position-relative ${
                    selectedAddressId === addr.id ? "selected-card" : ""
                  }`}
                  onClick={() => {
                    setSelectedAddressId(addr.id);
                    setIsModalOpen(false);
                  }}
                  style={{
                    cursor: "pointer",
                    borderColor:
                      selectedAddressId === addr.id ? "#8b5cf6" : "#e5e7eb",
                    backgroundColor:
                      selectedAddressId === addr.id ? "#f5f3ff" : "#fff",
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span
                      className="fw-bold text-dark"
                      style={{ fontSize: "1rem" }}
                    >
                      Address {index + 1}
                    </span>
                    {selectedAddressId === addr.id && (
                      <span
                        className="px-2 py-0.5 rounded-pill"
                        style={{
                          backgroundColor: "#ddd6fe",
                          color: "#6d28d9",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                        }}
                      >
                        Selected
                      </span>
                    )}
                    <div
                      className="popup-card-actions-tray d-flex align-items-center gap-2 ms-auto"
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                      }}
                    >
                      <button
                        type="button"
                        className="edit-icon"
                        style={{
                          background: "transparent",
                          border: "1px solid #c4b5fd",
                          color: "#8b5cf6",
                          borderRadius: "20px",
                          padding: "3px 12px",
                          fontSize: "0.78rem",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/address");
                        }}
                      >
                        <MdModeEdit size={14} />{" "}
                        <span style={{ marginLeft: "2px" }}>Edit</span>
                      </button>
                      <button
                        type="button"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#9ca3af",
                          cursor: "pointer",
                        }}
                        onClick={(e) => promptDeleteAddress(e, addr.id)}
                      >
                        <FaTrashAlt size={13} />
                      </button>
                    </div>
                  </div>
                  <p
                    className="text-dark m-0 mb-1"
                    style={{ fontSize: "0.88rem" }}
                  >
                    {addr.name} , {addr.address}
                  </p>
                  <p
                    className="text-dark m-0 mb-1"
                    style={{ fontSize: "0.88rem" }}
                  >
                    {addr.city}, {addr.state} - {addr.pin}
                  </p>
                  <p className="text-muted m-0" style={{ fontSize: "0.85rem" }}>
                    Mobile: {addr.mobile || addr.contact}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ─── */}
      {showDeleteModal && (
        <div
          className="modal-overlay-custom"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            className="modal-box-custom shadow-lg p-4 rounded text-center"
            style={{ width: "90%", maxWidth: "400px" }}
          >
            <h5 className="fw-bold mb-2">Confirm Deletion</h5>
            <p className="text-muted small">
              Are you sure you want to delete this delivery address profile?
            </p>
            <div className="d-flex gap-3 mt-4">
              <button
                type="button"
                className="btn btn-secondary flex-fill"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger flex-fill"
                onClick={executeDeleteAddress}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADDRESS WARNING MODAL ─── */}
      {showAddressWarningModal && (
        <div
          className="modal-overlay-custom"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001,
          }}
        >
          <div
            className="modal-box-custom shadow-lg p-4 rounded text-center"
            style={{
              width: "90%",
              maxWidth: "420px",
              borderTop: "4px solid #8b5cf6",
            }}
          >
            <div className="mb-3" style={{ color: "#8b5cf6" }}>
              <FaExclamationTriangle size={42} />
            </div>
            <h5 className="fw-bold mb-2" style={{ color: "#171744" }}>
              Delivery Address Required
            </h5>
            <p
              className="text-muted"
              style={{ fontSize: "0.88rem", lineHeight: "1.4" }}
            >
              You cannot proceed to billing without specifying a destination.
              Please add or choose a valid address card to unlock payment
              options.
            </p>
            <div className="d-flex gap-3 mt-4">
              <button
                type="button"
                className="btn btn-secondary flex-fill fw-bold"
                style={{ fontSize: "0.85rem" }}
                onClick={() => setShowAddressWarningModal(false)}
              >
                Close Window
              </button>
              <button
                type="button"
                className="btn text-white flex-fill fw-bold"
                style={{ background: "#8b5cf6", fontSize: "0.85rem" }}
                onClick={() => {
                  setShowAddressWarningModal(false);
                  if (savedAddresses.length === 0) {
                    navigate("/address");
                  } else {
                    setIsModalOpen(true);
                  }
                }}
              >
                {savedAddresses.length === 0 ? "Add Address" : "Choose Address"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Checkout;