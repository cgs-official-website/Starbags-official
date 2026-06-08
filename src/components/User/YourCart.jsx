import React, { useState, useEffect } from "react";
import { FaStar, FaHeart, FaRegHeart, FaMinus, FaPlus } from "react-icons/fa";
import { TbTruckDelivery } from "react-icons/tb";
import { useWishlist } from "../../context/WishlistContext";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

const CartItem = ({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  onToggleWishlist,
  onSelect,
  showActions = true,
  showCheckbox = true,
}) => {
  const { wishlist, cart } = useWishlist();
  const navigate = useNavigate();

  const [ratingInfo, setRatingInfo] = useState({ rating: "0.0", count: 0 });

  useEffect(() => {
    const prodId = item.id || item.productId;
    if (!prodId) return;

    const q = query(
      collection(db, "reviews"),
      where("productId", "==", prodId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reviewsList = snapshot.docs
          .map((d) => d.data())
          .filter((r) => !r.isHidden);

        if (reviewsList.length > 0) {
          const sum = reviewsList.reduce((acc, r) => acc + (r.rating || 0), 0);
          const avg = (sum / reviewsList.length).toFixed(1);
          setRatingInfo({ rating: avg, count: reviewsList.length });
        } else {
          setRatingInfo({ rating: "0.0", count: 0 });
        }
      },
      (err) => {
        console.error("Error loading reviews for cart item:", err);
      }
    );

    return () => unsubscribe();
  }, [item.id, item.productId]);

  const discountPercent = parseInt(item.offer) || 0;
  const oldPriceNum = Number(item.realPrice) || Number(item.price);
  const currentPrice = Math.round(oldPriceNum - (oldPriceNum * discountPercent) / 100);

  const isItemInWishlist = wishlist ? wishlist.some(
    (wItem) => wItem.name === item.name && Number(wItem.price) === Number(item.price)
  ) : false;

  // Category identification checks
  const categoryToken = item.category?.toLowerCase() || "";
  const isBelt = categoryToken === "belt" || item.name?.toLowerCase().includes("belt");
  const isBag = categoryToken === "bag" || item.name?.toLowerCase().includes("bag");

  const handleSingleItemCheckout = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const singleCheckoutItem = [{ ...item, selected: true, qty: item.qty || 1 }];
    const totalItemsCount = item.qty || 1;
    const rawTotal = (Number(item.realPrice) || Number(item.price)) * totalItemsCount;
    const subTotal = Number(item.price) * totalItemsCount;
    const discountTotal = rawTotal > subTotal ? (rawTotal - subTotal) : 0;
    const gstTotal = Math.round(subTotal * 0.18);
    const finalTotal = subTotal + gstTotal;

    navigate("/checkout", {
      state: {
        allCartItems: cart || [],
        cartItems: singleCheckoutItem,
        totalItemsCount,
        rawTotal,
        discountTotal,
        subTotal,
        gstTotal,
        finalTotal,
        couponDiscount: 0,
        couponPercentageLabel: ""
      },
    });
  };

  return (
    <div className="cart-card">
      <div className="cart-image-wrapper">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={!!item.selected}
            onChange={() => onSelect(item.id)}
            className="cart-check-overlay"
          />
        )}
        <div className="cart-image">
          <img src={item.image} alt={item.name} />
        </div>
      </div>

      <div className="cart-content">
        <div>
          <div className="cart-top mb-3">
            <h6 className="cart-product-name">{item.name}</h6>
            <div className="cart-rating d-flex">
              <div className="rating-box">                
                <span><FaStar color="#facc15" /> {ratingInfo.rating !== "0.0" ? ratingInfo.rating : "0.0"}</span>
                <span className="rating-count">({ratingInfo.count})</span>
              </div>
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleWishlist(item);
                }} 
                className="wishlist-icon" 
                style={{ cursor: "pointer" }}
              >
                {isItemInWishlist ? <FaHeart color="red" size={20} /> : <FaRegHeart color="red" size={20} />}
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center price-row-container">
            <div className="price-row">
              <h5 className="current-price">₹ {currentPrice.toFixed(2)}</h5>
              <span className="old-price">₹ {oldPriceNum.toFixed(2)}</span>
              <span className="discount">{item.offer || "0% off"} off</span>
            </div>

            <div className="qty-box align-end">
              <button onClick={() => onDecrease(item.id)} className="qty-btn" type="button"><FaMinus /></button>
              <div className="qty-number">{item.qty || 1}</div>
              <button onClick={() => onIncrease(item.id)} className="qty-btn" type="button"><FaPlus /></button>
            </div>
          </div>
          
          <p className="pattern-text">Pattern : Leather</p>

          {/* ─── FIXED: EXPLICIT BELT SIZE OR BAG CAPACITY RENDERING INSERTS ─── */}
          {isBelt && (
            <p className="pattern-text" style={{ marginTop: "-8px" }}>
              Size : <span style={{ color: "#8b5cf6", fontWeight: "600" }}>{item.size || "M"}</span>
            </p>
          )}

          {isBag && (
            <p className="pattern-text" style={{ marginTop: "-8px" }}>
              Capacity : <span style={{ color: "#8b5cf6", fontWeight: "600" }}>{item.size || "40L"}</span>
            </p>
          )}

          <div className="cod-box">
            <p><span><TbTruckDelivery /></span>Cash On Delivery Available</p>
          </div>
        </div>

        {showActions && (
          <div className="cart-bottom">
            <div className="cart-buttons">
              <button onClick={() => onRemove(item.id)} className="remove-btn" type="button">
                <i className="bi bi-trash3 text-danger"></i> Remove
              </button>
              <button onClick={handleSingleItemCheckout} className="buy-btn" type="button">
                Buy this now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItem;