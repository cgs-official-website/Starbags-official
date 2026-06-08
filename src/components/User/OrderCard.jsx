import React from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../../context/ProductsContext";
import '../../assets/styles/OrderCard.css';

const STATUS_MAP = {
  "Order Placed": { color: "#8b5cf6" },
  Shipped: { color: "#2563eb" },
  "Out for Delivery": { color: "#d97706" },
  Delivered: { color: "#16a34a" },
  Processing: { color: "#f59e0b" },
};

const getStatusColor = (s) => (STATUS_MAP[s] || { color: "#f59e0b" }).color;

const Stars = ({ rating }) => (
  <span style={{ display: "inline-flex", gap: "1px" }}>
    {[...Array(5)].map((_, i) =>
      i < Math.round(rating) ? (
        <FaStar key={i} style={{ color: "#f59e0b", fontSize: "12px" }} />
      ) : (
        <FaRegStar key={i} style={{ color: "#d1d5db", fontSize: "12px" }} />
      ),
    )}
  </span>
);

const OrderCard = ({ order, onReviewClick, reviewed = false }) => {
  const navigate = useNavigate();
  const { products } = useProducts();

  const matchedProduct = products.find(
    (p) =>
      p.name === order.product ||
      p.id === order.productId ||
      p.productId === order.productId,
  );

  // ✅ Fixed: inside component, uses navigate hook, has access to matchedProduct & order
  const handleProductClick = () => {
    const productToNavigate = matchedProduct || {
      ...order,
      name: order.product,
      id: order.productId,
    };
    navigate("/product", {
      state: { product: productToNavigate },
    });
  };

  const getFormattedOrderId = () => {
    if (order.id && order.id.startsWith("SBO-")) return order.id;
    const category = order.category || "bag";
    let catCode = "BAG";
    if (category.toLowerCase().includes("wallet") || category.toLowerCase().includes("wlt"))
      catCode = "WLT";
    if (category.toLowerCase().includes("belt") || category.toLowerCase().includes("blt"))
      catCode = "BLT";

    const today = new Date();
    return `SBO-${catCode}-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-001`;
  };

  const finalOrderId = getFormattedOrderId();
  const discountedPrice = Number(order.discountedPrice) || 0;
  const originalPrice = Number(order.originalPrice) || discountedPrice;
  const hasDiscount = originalPrice > discountedPrice;
  const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");

  const statusColor = getStatusColor(order.status);
  const isDelivered = order.status === "Delivered";

  return (
    <div className="responsive-order-card-root">
      {/* DESKTOP VIEW */}
      <div className="desktop-card-layout-view">
        <div className="responsive-col-box desktop-info-box">
          <div className="desktop-image-wrapper" onClick={handleProductClick} style={{ cursor: 'pointer' }}>
            {order.image ? (
              <img
                src={order.image}
                alt={order.product}
                className="desktop-product-img"
              />
            ) : (
              <div className="desktop-product-img-fallback">🛍️</div>
            )}
          </div>
          <div className="desktop-text-wrapper">
            <p className="desktop-order-id-txt">{finalOrderId}</p>
            <div className="desktop-title-row">
              <span
                className="desktop-product-title-name"
                onClick={handleProductClick}
                style={{ cursor: 'pointer' }}
              >
                {order.product}
              </span>
              {matchedProduct && matchedProduct.reviewCount > 0 && (
                <>
                  <Stars rating={matchedProduct.rating || 0} />
                  <span className="desktop-reviews-count-lbl">
                    ({matchedProduct.reviewCount || 0})
                  </span>
                </>
              )}
            </div>
            <div className="desktop-price-row">
              <span className="desktop-current-price">
                {fmt(discountedPrice)}
              </span>
              {hasDiscount && (
                <span className="desktop-original-price">
                  {fmt(originalPrice)}
                </span>
              )}
            </div>
            <p className="desktop-qty-lbl">Qty: {order.quantity || 1}</p>
          </div>
        </div>

        <div className="responsive-section-divider" />

        <div className="responsive-col-box desktop-status-box">
          <span className="desktop-section-title">STATUS</span>
          <span
            className="desktop-status-value-txt"
            style={{ color: statusColor }}
          >
            {order.status === "Processing" ? "Order Placed" : order.status}
          </span>
          <button
            className="desktop-track-btn"
            onClick={() => navigate("/Track-Order", { state: { order } })}
          >
            Track order
          </button>
        </div>

        <div className="responsive-section-divider" />

        <div className="responsive-col-box desktop-time-box">
          <span className="desktop-section-title">TIME</span>
          <span className="desktop-time-val-txt">
            {order.time || "25/04/2020"}
          </span>
          <span
            className="desktop-delivery-eta-txt"
            style={{
              color: order.status === "Delivered" ? "#16a34a" : "#374151",
            }}
          >
            {order.deliveryDate || "Expected in 5 Days"}
          </span>
          <div className="desktop-review-trigger-slot">
            {isDelivered &&
              (reviewed ? (
                <div className="desktop-reviewed-badge">
                  <MdVerified size={14} /> Review Submitted
                </div>
              ) : (
                <button
                  className="desktop-rate-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReviewClick();
                  }}
                >
                  ★ Rate Your Product
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className="mobile-card-layout-view">
        <div className="mobile-upper-mesh-block">
          <div className="mobile-image-frame" onClick={handleProductClick} style={{ cursor: 'pointer' }}>
            {order.image ? (
              <img
                src={order.image}
                alt={order.product}
                className="mobile-img-element"
              />
            ) : (
              <div className="mobile-img-element-fallback">🛍️</div>
            )}
          </div>

          <div className="mobile-right-specs-column">
            {/* ROW 1 : Product Name (Ellipsis) */}
            <div
              className="mobile-specs-row-one d-flex justify-content-between align-items-center"
              style={{ width: "100%" }}
            >
              <span
                className="mobile-product-title-string"
                onClick={handleProductClick}
                style={{
                  cursor: 'pointer',
                  maxWidth:
                    matchedProduct && matchedProduct.reviewCount > 0
                      ? "70%"
                      : "100%",
                }}
              >
                {order.product}
              </span>
              {matchedProduct && matchedProduct.reviewCount > 0 && (
                <span className="mobile-product-rating-badge">
                  {Number(matchedProduct.rating || 0).toFixed(1)}{" "}
                  <FaStar
                    style={{
                      color: "#f59e0b",
                      fontSize: "11px",
                      marginBottom: "2px",
                    }}
                  />
                </span>
              )}
            </div>

            <div className="mobile-specs-row-two">
              <div className="mobile-price-inline-group">
                <span className="mobile-curr-price-txt">
                  {fmt(discountedPrice)}
                </span>
                {hasDiscount && (
                  <span className="mobile-orig-price-txt">
                    {fmt(originalPrice)}
                  </span>
                )}
              </div>
              <span className="mobile-qty-string-txt">
                Qty: {order.quantity || 1}
              </span>
            </div>
          </div>
        </div>

        <div className="mobile-lower-actions-tray-block">
          <div className="mobile-action-status-cell">
            <span className="mobile-action-label">Status</span>
            <span
              className="mobile-action-status-val"
              style={{ color: statusColor }}
            >
              {order.status === "Processing" ? "Order Placed" : order.status}
            </span>
          </div>

          <div className="mobile-action-time-cell">
            <span className="mobile-action-label">Time</span>
            <span className="mobile-action-time-val">
              {order.time || "25/04/2020"}
            </span>
          </div>

          <button
            className="mobile-action-track-submit-btn"
            onClick={() => navigate("/Track-Order", { state: { order } })}
          >
            Track order
          </button>
        </div>

        {isDelivered && (
          <div style={{ padding: "8px 12px 12px" }}>
            {reviewed ? (
              <div
                className="desktop-reviewed-badge"
                style={{ justifyContent: "center" }}
              >
                <MdVerified size={14} /> Review Submitted
              </div>
            ) : (
              <button
                className="desktop-rate-action-btn"
                style={{ width: "100%" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onReviewClick();
                }}
              >
                ★ Rate Your Product
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;