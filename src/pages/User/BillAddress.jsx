import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft as ArrowIcon } from "react-icons/fa";
import { TbCreditCardPay } from "react-icons/tb";
import { GiMoneyStack } from "react-icons/gi";
import PaymentImage from "../../assets/images/payment-icon.png";
import Navbar from "../../components/User/Navbar";
import Footer from "../../components/User/Footer";
import CartItem from "../../components/User/YourCart";
import OrderSummary from "../../components/User/OrderSummary";
import PaymentPopup from "../../components/User/PaymentPopup";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
} from "firebase/firestore";
import "../../assets/styles/Cart.css";

const BillAddress = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, setCart } = useWishlist();
  const { currentUser } = useAuth();

  // ─── STAGE 1: UNPACK STATE ───
  const {
    allCartItems = [],
    cartItems: initialSelected = [],
    rawTotal: passedRawTotal = 0,
    couponPercentageLabel = "",
    // product-level discount (MRP - selling price) passed from Checkout
    productDiscountTotal: passedProductDiscountTotal = 0,
    // coupon discount passed from Checkout (category-aware, already calculated)
    couponDiscount: passedCouponDiscount = 0,
    appliedCouponCode = "",
    appliedCouponId = "",
    selectedAddress = null,
  } = location.state || {};

  // ─── STAGE 2: PROCESS STATES ───
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [cartItems, setCartItems] = useState(initialSelected);
  const [masterCartList, setMasterCartList] = useState(allCartItems);

  const [isOrderingLoader, setIsOrderingLoader] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupDetails, setPopupDetails] = useState({});

  // ─── SINGLE-SUBMIT GUARD: prevents double order on rapid clicks ───
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (initialSelected.length === 0) {
      navigate("/cart");
    }
    window.scrollTo(0, 0);
  }, [initialSelected, navigate]);

  // ─── STAGE 3: CALCULATIONS ───
  //
  //  rawTotal            = MRP total of items
  //  productDiscount     = MRP - selling price   (product-level markdown)
  //  baseSubTotal        = selling price total    (after product discount)
  //  couponDiscount      = coupon savings         (category-specific, from Checkout)
  //  subTotalAfterCoupon = baseSubTotal - couponDiscount  ← GST base
  //  gstTotal            = subTotalAfterCoupon × 18%
  //  finalTotal          = subTotalAfterCoupon + gstTotal
  //
  const totalItemsCount = cartItems.reduce(
    (acc, item) => acc + (item.qty || 1),
    0,
  );

  const activeRawTotal =
    cartItems.length > 0
      ? cartItems.reduce((acc, item) => {
          const originalPrice =
            Number(item.realPrice) || Number(item.price) || 0;
          return acc + originalPrice * (item.qty || 1);
        }, 0)
      : passedRawTotal;

  const activeBaseSubTotal = cartItems.reduce(
    (acc, item) => acc + Number(item.price) * (item.qty || 1),
    0,
  );

  // Product-level discount: MRP - selling price
  const activeProductDiscount =
    activeRawTotal > activeBaseSubTotal
      ? activeRawTotal - activeBaseSubTotal
      : Number(passedProductDiscountTotal) || 0;

  // Coupon discount: use what Checkout calculated (category-aware)
  const activeCouponDiscount = Number(passedCouponDiscount) || 0;

  // SubTotal after coupon is the GST base
  const activeSubTotalAfterCoupon =
    activeBaseSubTotal - activeCouponDiscount > 0
      ? activeBaseSubTotal - activeCouponDiscount
      : 0;

  const activeGstTotal = Math.round(activeSubTotalAfterCoupon * 0.18);
  const activeFinalTotal = activeSubTotalAfterCoupon + activeGstTotal;

  const increaseQty = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: (item.qty || 1) + 1 } : item,
      ),
    );
    setMasterCartList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: (item.qty || 1) + 1 } : item,
      ),
    );
  };

  const decreaseQty = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && (item.qty || 1) > 1
          ? { ...item, qty: (item.qty || 1) - 1 }
          : item,
      ),
    );
    setMasterCartList((prev) =>
      prev.map((item) =>
        item.id === id && (item.qty || 1) > 1
          ? { ...item, qty: (item.qty || 1) - 1 }
          : item,
      ),
    );
  };

  // ─── STAGE 4: RAZORPAY SCRIPT LOADER ───
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (
        document.querySelector(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
        )
      ) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // ─── STAGE 5: BUILD ORDER PAYLOADS ───
  const buildOrderPayloads = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateString = `${year}${month}${day}`;
    const displayDate = today.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const displayTime = today.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const payloads = cartItems.map((item, idx) => {
      const productCategory = item.category?.toLowerCase() || "bag";
      let catToken = "BAG";
      if (productCategory === "wallet") catToken = "WLT";
      if (productCategory === "belt") catToken = "BLT";
      const categoryName =
        productCategory === "wallet"
          ? "Wallet"
          : productCategory === "belt"
            ? "Belt"
            : "Bag";

      const randomCount = String(
        Math.floor(Math.random() * 900) + (idx + 1),
      ).padStart(3, "0");
      const uniqueOrderId = `SBO-${catToken}-${dateString}-${randomCount}`;

      return {
        id: uniqueOrderId,
        productId: item.productId || item.id,
        product: item.name,
        category: catToken,
        categoryName,
        status: "Order Placed",
        time: displayDate,
        displayTime,
        rating: item.rating || 4.2,
        reviews: item.reviews || 120,
        deliveryDate: "Expected in 5 Days",
        discountedPrice: Number(item.price) * (item.qty || 1),
        originalPrice:
          (Number(item.realPrice) || Number(item.price)) * (item.qty || 1),
        quantity: item.qty,
        image: item.image,
        brand: item.brand,
        material: item.material,
        size: item.size,
        subCategory: item.subCategory,
      };
    });

    return payloads;
  };

  // ─── STAGE 6: SAVE ORDERS TO FIRESTORE ───
  const saveOrdersToFirestore = async (
    orderPayloads,
    paymentModeStr,
    razorpayPaymentId = null,
  ) => {
    for (const orderPayload of orderPayloads) {
      const itemProductDiscount = Math.max(
        0,
        orderPayload.originalPrice - orderPayload.discountedPrice,
      );

      const dbOrderPayload = {
        id: orderPayload.id,
        userId: currentUser ? currentUser.uid : "guest",
        productId: orderPayload.productId,
        product: orderPayload.product,
        status: "Order Placed",
        time: orderPayload.time,
        rating: orderPayload.rating,
        reviews: orderPayload.reviews,
        deliveryDate: orderPayload.deliveryDate,
        discountedPrice: orderPayload.discountedPrice,
        originalPrice: orderPayload.originalPrice,
        quantity: orderPayload.quantity,
        image: orderPayload.image,
        brand: orderPayload.brand,
        material: orderPayload.material,
        size: orderPayload.size,
        subCategory: orderPayload.subCategory,
        items: [
          {
            productId: orderPayload.productId,
            productName: orderPayload.product,
            img: orderPayload.image,
            price: orderPayload.discountedPrice / orderPayload.quantity,
            qty: orderPayload.quantity,
            category: orderPayload.categoryName,
            brand: orderPayload.brand,
            material: orderPayload.material,
            size: orderPayload.size,
            subCategory: orderPayload.subCategory,
          },
        ],
        customerDetails: {
          name: selectedAddress?.name || "Customer",
          shippingAddress: selectedAddress
            ? `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pin}`
            : "No shipping address details",
          email: currentUser ? currentUser.email : "guest@starbags.com",
          mobile: selectedAddress?.mobile || "",
        },
        orderDate: new Date().toISOString(),
        paymentMode: paymentModeStr,
        paymentStatus: paymentModeStr === "COD" ? "Pending" : "Success",
        paymentDetails: {
          itemsCount: orderPayload.quantity,
          itemsTotal: orderPayload.originalPrice,
          // product-level discount stored separately
          discount: itemProductDiscount,
          // coupon discount stored separately — TrackOrder & Invoice read from here
          couponDiscount: activeCouponDiscount,
          appliedCouponCode: appliedCouponCode || "",
          subTotal: orderPayload.discountedPrice,
          gst: Math.round(orderPayload.discountedPrice * 0.18),
          shippingFee: 0,
          total:
            orderPayload.discountedPrice +
            Math.round(orderPayload.discountedPrice * 0.18),
          ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
        },
        orderType: "Direct",
      };
      await setDoc(doc(db, "orders", orderPayload.id), dbOrderPayload);
    }
  };

  // ─── STAGE 7: PURGE CART AFTER ORDER ───
  const purgeOrderedItemsFromCart = () => {
    if (setCart) {
      setCart((prevCart) => {
        const updated = (prevCart || []).filter(
          (item) =>
            !cartItems.some(
              (sel) => sel.id === item.id || sel.name === item.name,
            ),
        );
        localStorage.setItem("user_cart", JSON.stringify(updated));
        localStorage.setItem("cart", JSON.stringify(updated));
        localStorage.setItem("cartItems", JSON.stringify(updated));
        return updated;
      });
    }
  };

  // ─── STAGE 8: UPDATE COUPON USAGE ───
  const updateCouponUsageIfApplied = async () => {
    if (!appliedCouponCode) return;
    try {
      let couponDocRef = null;
      let couponSnap = null;
      if (appliedCouponId) {
        couponDocRef = doc(db, "coupons", appliedCouponId);
        couponSnap = await getDoc(couponDocRef);
      }
      if (!couponSnap || !couponSnap.exists()) {
        const q = query(
          collection(db, "coupons"),
          where("code", "==", appliedCouponCode),
        );
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          couponDocRef = doc(db, "coupons", querySnap.docs[0].id);
          couponSnap = querySnap.docs[0];
        }
      }
      if (couponSnap && couponSnap.exists() && couponDocRef) {
        const newUsedCount = (Number(couponSnap.data().usedCount) || 0) + 1;
        await updateDoc(couponDocRef, { usedCount: newUsedCount });
        if (currentUser) {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const usedCoupons = userSnap.data().usedCoupons || {};
            const couponKey = couponDocRef.id;
            await updateDoc(userDocRef, {
              usedCoupons: {
                ...usedCoupons,
                [couponKey]: (Number(usedCoupons[couponKey]) || 0) + 1,
              },
            });
          }
        }
      }
    } catch (err) {
      console.error("Error updating coupon usedCount:", err);
    }
  };

  // ─── STAGE 9: MASTER ORDER SUBMIT HANDLER ───
  // Uses a ref-based guard so rapid double-clicks only fire ONE order.
  const handlePlaceOrderSubmit = async () => {
    // ─── DOUBLE-SUBMIT GUARD ───
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (!selectedAddress) {
      alert(
        "Please ensure a valid shipping destination address profile is active.",
      );
      isSubmittingRef.current = false;
      return;
    }

    const newOrderPayloads = buildOrderPayloads();

    // ── COD ────────────────────────────────────────────────────────────────
    if (paymentMethod === "cod") {
      try {
        await saveOrdersToFirestore(newOrderPayloads, "COD");
        await updateCouponUsageIfApplied();
        purgeOrderedItemsFromCart();
      } catch (err) {
        console.error("Error placing COD order:", err);
        isSubmittingRef.current = false;
        return;
      }
      setIsPopupOpen(true);
      setTimeout(() => {
        setIsPopupOpen(false);
        isSubmittingRef.current = false;
        navigate("/orders", { state: { newOrderPayloads } });
      }, 1000);
      return;
    }

    // ── ONLINE: Razorpay ───────────────────────────────────────────────────
    setIsOrderingLoader(true);
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setIsOrderingLoader(false);
      isSubmittingRef.current = false;
      alert(
        "Failed to load payment gateway. Please check your internet connection and try again.",
      );
      return;
    }
    setIsOrderingLoader(false);

    const amountInPaise = Math.round(activeFinalTotal * 100);
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    const options = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: "INR",
      name: "Star Bags",
      description: `Order for ${cartItems.length} item(s)`,
      image: "/src/assets/images/brand-logo-dark.png",
      prefill: {
        name: selectedAddress?.name || "",
        email: currentUser?.email || "",
        contact: selectedAddress?.mobile || "",
      },
      notes: {
        address: selectedAddress
          ? `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pin}`
          : "",
        orderId: newOrderPayloads[0]?.id || "",
      },
      theme: { color: "#8b5cf6" },
      modal: {
        ondismiss: () => {
          // User closed Razorpay without paying — release the guard
          isSubmittingRef.current = false;
        },
      },
      handler: async (response) => {
        const { razorpay_payment_id } = response;
        try {
          await saveOrdersToFirestore(
            newOrderPayloads,
            "Online",
            razorpay_payment_id,
          );
          await updateCouponUsageIfApplied();
          purgeOrderedItemsFromCart();
        } catch (err) {
          console.error("Error saving online order:", err);
          isSubmittingRef.current = false;
          return;
        }
        setIsPopupOpen(true);
        setTimeout(() => {
          setIsPopupOpen(false);
          isSubmittingRef.current = false;
          navigate("/orders", { state: { newOrderPayloads } });
        }, 3000);
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      console.error("Razorpay payment failed:", response.error);
      isSubmittingRef.current = false;
      alert(
        `Payment failed: ${response.error.description}. Please try again.`,
      );
    });
    rzp.open();
  };

  const handleBackToCheckout = () => {
    navigate("/checkout", {
      state: {
        allCartItems: masterCartList,
        cartItems: cartItems,
        couponPercentageLabel: couponPercentageLabel,
        couponCode: appliedCouponCode,
        returnedAddressId: selectedAddress?.id,
      },
    });
  };

  return (
    <div
      className="bill-address-page-root"
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <Navbar />

      {isOrderingLoader && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(5px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20000,
          }}
        >
          <div
            className="spinner-border"
            style={{
              width: "3.8rem",
              height: "3.8rem",
              color: "#8b5cf6",
              borderWidth: "4px",
            }}
            role="status"
          />
          <h4 className="fw-bold text-dark mt-4 mb-2">
            Loading Payment Gateway...
          </h4>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>
            Please wait while we connect to Razorpay securely.
          </p>
        </div>
      )}

      <PaymentPopup
        isOpen={isPopupOpen}
        details={popupDetails}
        onClose={() => setIsPopupOpen(false)}
      />

      <div className="cart-page style-page-billing">
        <div className="checkout-header">
          <h2 className="main-title">Billing and Address</h2>
          <button
            className="back-navigation-btn"
            onClick={handleBackToCheckout}
          >
            <ArrowIcon className="me-2" /> Back to Checkout
          </button>
        </div>

        <div className="cart-layout-grid">
          <div className="cart-left">
            <div className="cart-items">
              {cartItems.map((item, index) => (
                <CartItem
                  key={item.id || index}
                  item={item}
                  onIncrease={increaseQty}
                  onDecrease={decreaseQty}
                  showActions={false}
                  showCheckbox={false}
                />
              ))}
            </div>
          </div>

          <div className="cart-right">
            {/*
              ─── ORDER SUMMARY: same breakdown as Checkout ───
              rawTotal          = MRP total
              discountTotal     = product discount only  (MRP - selling price)
              couponDiscount    = coupon savings          (separate line)
              subTotal          = selling price - couponDiscount
              gstTotal          = subTotal × 18%
              finalTotal        = subTotal + gstTotal
            */}
            <OrderSummary
              totalItemsCount={totalItemsCount}
              rawTotal={activeRawTotal}
              discountTotal={activeProductDiscount}
              subTotal={activeSubTotalAfterCoupon}
              couponDiscount={activeCouponDiscount}
              couponPercentageLabel={couponPercentageLabel}
              gstTotal={activeGstTotal}
              finalTotal={activeFinalTotal}
              isBillingPage={true}
              paymentMethod={paymentMethod}
              handleCheckout={handlePlaceOrderSubmit}
            />

            <div className="address-box mt-4">
              <div className="address-top">
                <h5>Address</h5>
              </div>
              <div className="address-content">
                {selectedAddress ? (
                  <p>
                    <strong>{selectedAddress.name}</strong>
                    <br />
                    {selectedAddress.address}
                    <br />
                    {selectedAddress.city}, {selectedAddress.state} -{" "}
                    {selectedAddress.pin}
                    <br />
                    Mobile: {selectedAddress.mobile}
                  </p>
                ) : (
                  <p className="text-muted">
                    No selected destination address passed.
                  </p>
                )}
              </div>
            </div>

            <div className="payment-box mt-4">
              <h6 className="payment-title">Payment method</h6>
              <p className="payment-subtitle">Choose a payment method</p>

              <div
                className={`payment-card ${paymentMethod === "cod" ? "active-payment" : ""}`}
                onClick={() => setPaymentMethod("cod")}
              >
                <div className="payment-left">
                  <input
                    type="radio"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                  />
                  <div className="payment-icon">
                    <GiMoneyStack />
                  </div>
                  <div>
                    <p className="fw-bold m-0">Cash on delivery</p>
                    <p className="m-0">you pay when your order is delivered</p>
                  </div>
                </div>
              </div>

              <div
                className={`payment-card ${paymentMethod === "online" ? "active-payment" : ""}`}
                onClick={() => setPaymentMethod("online")}
              >
                <div className="payment-left">
                  <input
                    type="radio"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                  />
                  <div className="payment-icon">
                    <TbCreditCardPay />
                  </div>
                  <div>
                    <p className="fw-bold m-0">Online payment</p>
                    <p className="m-0">
                      Pay securely Using UPI, Cards, Net banking & More
                    </p>
                    <span className="payment-icons">
                      <img src={PaymentImage} alt="Payment Methods" />
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="continue-payment-btn"
                onClick={handlePlaceOrderSubmit}
              >
                {paymentMethod === "cod" ? "Place Order" : "Continue Payment"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BillAddress;