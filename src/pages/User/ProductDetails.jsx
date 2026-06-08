import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/User/Navbar";
import Footer from "../../components/User/Footer";
import RecentProduct from "../../components/User/RecentProduct";
import ReviewModal from "../../components/User/ReviewModal";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FaStar, FaRegStar, FaHeart, FaTrashAlt } from "react-icons/fa";
import { BiLike, BiDislike, BiSolidLike, BiSolidDislike } from "react-icons/bi";
import { FiHeart } from "react-icons/fi";
import { IoMdCart } from "react-icons/io";
import { MdAdd, MdClose, MdModeEdit } from "react-icons/md";
import { TiPencil } from "react-icons/ti";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

import "../../assets/styles/ProductDetails.css";

function ProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, cart, addToCart } = useWishlist();
  const { currentUser } = useAuth();

  const { product } = location.state || {};
  const currentProduct = product || {};

  // Address and Selector States — fetched from Firestore
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const fetchAddresses = async () => {
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const addrs = snap.data().addresses ?? [];
          setSavedAddresses(addrs);
          if (addrs.length > 0) setSelectedAddressId(addrs[0].id);
        }
      } catch (err) {
        console.error("Error fetching addresses:", err);
      }
    };
    fetchAddresses();
  }, [currentUser]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState(null);

  const activeSelectedAddress = savedAddresses.find(
    (addr) => addr.id === selectedAddressId
  );
  const [quantity, setQuantity] = useState(1);

  // Wishlist and Category Parsing
  const isProductInWishlist = wishlist?.some(
    (item) => item.id === currentProduct.id
  );
  const productCategory =
    currentProduct.category?.toLowerCase() === "wallet"
      ? "Wallet"
      : currentProduct.category?.toLowerCase() === "belt"
      ? "Belt"
      : "Bag";

  const [selectedSize, setSelectedSize] = useState(() => {
    if (parseInt(currentProduct.stocks) <= 0) return null;
    const raw = currentProduct.size ?? "";
    const first = raw.split(",")[0]?.trim();
    if (first) return first;
    return productCategory === "Bag" ? "20L" : "Small";
  });

  // ─── REVIEW SYSTEM STATE ───
  const [dynamicReviews, setDynamicReviews] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRating, setModalRating] = useState(4);
  const [isReviewsHovered, setIsReviewsHovered] = useState(false);
  const reviewsScrollRef = useRef(null);

  // ─── Load reviews from Firestore (real-time) ───
  useEffect(() => {
    if (!currentProduct.id) {
      setDynamicReviews([]);
      return;
    }
    const q = query(
      collection(db, "reviews"),
      where("productId", "==", currentProduct.id)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reviews = snapshot.docs
          .map((d) => ({
            ...d.data(),
            firestoreId: d.id,
            // FIX 4: Always default counts and arrays to prevent undefined/-ve values
            likeCount: Math.max(0, d.data().likeCount ?? 0),
            dislikeCount: Math.max(0, d.data().dislikeCount ?? 0),
            likes: d.data().likes ?? [],
            dislikes: d.data().dislikes ?? [],
          }))
          .filter((r) => !r.isHidden);

        reviews.sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
          return dateB - dateA;
        });

        setDynamicReviews(reviews);
      },
      (err) => {
        console.error("Error loading reviews:", err);
      }
    );
    window.scrollTo(0, 0);
    return () => unsubscribe();
  }, [currentProduct.id]);

  // Mobile Auto Scroll Carousel
  useEffect(() => {
    if (window.innerWidth > 768) return;
    let animationFrameId;
    const scrollStep = () => {
      if (reviewsScrollRef.current && !isReviewsHovered) {
        reviewsScrollRef.current.scrollLeft += 1;
        if (
          reviewsScrollRef.current.scrollLeft >=
          reviewsScrollRef.current.scrollWidth -
            reviewsScrollRef.current.clientWidth -
            1
        ) {
          reviewsScrollRef.current.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scrollStep);
    };
    animationFrameId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isReviewsHovered]);

  // Live Score Calculations
  const totalReviewsCount = dynamicReviews.length;
  const averageRatingScore =
    totalReviewsCount > 0
      ? (
          dynamicReviews.reduce((sum, r) => sum + r.rating, 0) /
          totalReviewsCount
        ).toFixed(1)
      : "0.0";

  const getStarCountFactor = (starNum) =>
    dynamicReviews.filter((r) => r.rating === starNum).length;
  const getStarPercentFactor = (starNum) =>
    totalReviewsCount > 0
      ? `${(getStarCountFactor(starNum) / totalReviewsCount) * 100}%`
      : "0%";

  const sortedFilteredReviews = dynamicReviews
    .filter((review) => {
      if (activeFilter === "Positive") return review.rating >= 3;
      if (activeFilter === "Negative") return review.rating <= 2;
      return true;
    })
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
      return dateB - dateA;
    });

  // FIX 3: Like/Dislike handler — guard against negative counts
  const handleFeedback = async (review, type) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const ref = doc(db, "reviews", review.firestoreId);
    const alreadyLiked = (review.likes || []).includes(uid);
    const alreadyDisliked = (review.dislikes || []).includes(uid);
    const currentLikes = Math.max(0, review.likeCount ?? 0);
    const currentDislikes = Math.max(0, review.dislikeCount ?? 0);

    try {
      if (type === "like") {
        if (alreadyLiked) {
          await updateDoc(ref, {
            likes: arrayRemove(uid),
            likeCount: Math.max(0, currentLikes - 1),
          });
        } else {
          const updates = {
            likes: arrayUnion(uid),
            likeCount: currentLikes + 1,
          };
          if (alreadyDisliked) {
            updates.dislikes = arrayRemove(uid);
            updates.dislikeCount = Math.max(0, currentDislikes - 1);
          }
          await updateDoc(ref, updates);
        }
      } else {
        if (alreadyDisliked) {
          await updateDoc(ref, {
            dislikes: arrayRemove(uid),
            dislikeCount: Math.max(0, currentDislikes - 1),
          });
        } else {
          const updates = {
            dislikes: arrayUnion(uid),
            dislikeCount: currentDislikes + 1,
          };
          if (alreadyLiked) {
            updates.likes = arrayRemove(uid);
            updates.likeCount = Math.max(0, currentLikes - 1);
          }
          await updateDoc(ref, updates);
        }
      }
    } catch (err) {
      console.error("Error updating feedback:", err);
    }
  };

  const handleWriteReviewSubmit = async (rating, text) => {
    try {
      let customerName = "Anonymous User";
      if (currentUser) {
        try {
          const snap = await getDoc(doc(db, "users", currentUser.uid));
          if (snap.exists()) {
            customerName =
              snap.data().name ||
              snap.data().displayName ||
              currentUser.email ||
              "Anonymous User";
          }
        } catch (_) {}
      }

      const reviewPayload = {
        productId: currentProduct.id,
        productName: currentProduct.name,
        image: currentProduct.image || "",
        customerId: currentUser?.uid || "guest",
        customerName,
        text,
        rating,
        likes: [],
        dislikes: [],
        likeCount: 0,
        dislikeCount: 0,
        date: new Date(),
        isHidden: false,
      };

      await addDoc(collection(db, "reviews"), reviewPayload);
    } catch (err) {
      console.error("Error saving review:", err);
      alert("Failed to submit review. Please try again.");
    }
  };

  // Size Configurations
  const dbSizeRaw = currentProduct.size ?? "";
  const dbSizes = dbSizeRaw
    ? dbSizeRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const allBagSizes = ["20L", "30L", "40L"];
  const allBeltSizes = ["Small", "Medium", "Long"];

  const sizeOptions =
    productCategory === "Bag"
      ? allBagSizes.map((v) => ({
          value: v,
          label: "Capacity",
          disabled: dbSizes.length > 0 && !dbSizes.includes(v),
        }))
      : productCategory === "Belt"
      ? allBeltSizes.map((v) => ({
          value: v,
          label: "Size",
          disabled: dbSizes.length > 0 && !dbSizes.includes(v),
        }))
      : [];

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const images = (() => {
    const dbImages = (currentProduct.images ?? []).filter(Boolean);
    if (dbImages.length > 0) return dbImages;
    return currentProduct.image ? [currentProduct.image] : [];
  })();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const mainImage = images[currentImageIndex] ?? currentProduct.image;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const promptDeleteAddress = (e, id) => {
    e.stopPropagation();
    setTargetDeleteId(id);
    setShowDeleteModal(true);
  };

  const executeDeleteAddress = async () => {
    const updated = savedAddresses.filter((addr) => addr.id !== targetDeleteId);
    setSavedAddresses(updated);
    if (currentUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, { addresses: updated });
      } catch (err) {
        console.error("Error deleting address from DB:", err);
      }
    }
    localStorage.setItem("savedAddresses", JSON.stringify(updated));
    if (selectedAddressId === targetDeleteId) {
      setSelectedAddressId(updated.length > 0 ? updated[0].id : null);
    }
    setShowDeleteModal(false);
    setTargetDeleteId(null);
  };

  const isCurrentlyInCartWithThisSize = cart?.some(
    (item) => item.id === currentProduct.id && item.size === selectedSize
  );

  const isOutOfStock =
    currentProduct.stocks !== undefined &&
    currentProduct.stocks !== null &&
    parseInt(currentProduct.stocks) <= 0;

  const handleAddToCartAction = () => {
    if (isCurrentlyInCartWithThisSize) {
      navigate("/cart");
    } else {
      const cartPayload = {
        ...currentProduct,
        qty: quantity,
        size: selectedSize,
      };
      addToCart(cartPayload);
    }
  };

  const handleProceedToCheckoutDirectly = () => {
    if (isOutOfStock) return;
    const itemPayload = {
      ...currentProduct,
      qty: quantity,
      size: selectedSize,
    };
    navigate("/checkout", {
      state: {
        allCartItems: [itemPayload],
        cartItems: [itemPayload],
        couponPercentageLabel: "",
        returnedAddressId: selectedAddressId,
      },
    });
  };

  return (
    <div className="product-details-page" style={{ position: "relative" }}>
      <Navbar />

      <div className="container py-4">
        <div className="row mb-4">
          <div className="col-lg-6 d-flex align-items-center"></div>
          <div className="col-lg-6 ps-lg-5 d-flex justify-content-between align-items-center">
            <div
              className="breadcrumb-text"
              style={{ textTransform: "capitalize" }}
            >
              {currentProduct.category}s /{" "}
              <span className="active">{currentProduct.name}</span>
            </div>
            <div
              className="text-danger fs-4 cursor-pointer wishlist-btn"
              onClick={() => toggleWishlist(currentProduct)}
            >
              {isProductInWishlist ? <FaHeart /> : <FiHeart />}
            </div>
          </div>
        </div>

        <div className="row mb-5">
          <div className="col-lg-6 mb-4 mb-lg-0">
            <div className="main-image-container">
              <button
                className="arrow-btn d-none d-md-block"
                onClick={handlePrevImage}
              >
                <IoIosArrowBack />
              </button>
              <img
                key={currentImageIndex}
                src={mainImage}
                alt={currentProduct.name}
                className="main-product-image mx-4"
              />
              <button
                className="arrow-btn d-none d-md-block"
                onClick={handleNextImage}
              >
                <IoIosArrowForward />
              </button>
            </div>
            <div className="thumbnail-gallery mt-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`thumbnail-box ${currentImageIndex === idx ? "active" : ""}`}
                  onClick={() => setCurrentImageIndex(idx)}
                >
                  <img src={img} alt="Thumbnail" />
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-6 ps-lg-5">
            <div
              className="stock-text mb-2"
              style={{
                color: isOutOfStock ? "#ef4444" : "#10b981",
                fontWeight: "600",
              }}
            >
              {isOutOfStock
                ? "Out of Stock"
                : `${currentProduct.stocks} in stock available`}
            </div>
            <h1 className="product-title">{currentProduct.name}</h1>
            <div className="price-section d-flex align-items-center mb-2">
              <span className="current-price">₹ {currentProduct.price}</span>
              {Number(currentProduct.discount || 0) > 0 && (
                <>
                  <span className="original-price">
                    ₹ {currentProduct.realPrice}
                  </span>
                  <span className="discount">
                    {currentProduct.offer || `${currentProduct.discount}%`} off
                  </span>
                </>
              )}
            </div>

            <div className="d-flex align-items-center mb-3">
              <div className="rating-stars text-warning me-2">
                {[...Array(5)].map((_, i) =>
                  i < Math.round(Number(averageRatingScore)) ? (
                    <FaStar key={i} />
                  ) : (
                    // FIX 2: visible muted color instead of near-invisible #d1d5db
                    <FaRegStar key={i} style={{ color: "#9ca3af" }} />
                  )
                )}
              </div>
              <span
                className="rating-count"
                style={{ fontSize: "0.85rem", color: "#6b7280" }}
              >
                {totalReviewsCount > 0
                  ? `${averageRatingScore} / 5.0`
                  : "No ratings yet"}{" "}
                ({totalReviewsCount} Reviews)
              </span>
            </div>
            <p className="product-description">{currentProduct.description}</p>

            {sizeOptions.length > 0 && (
              <div className="size-selector-section mb-4">
                <h6 className="fw-bold mb-3" style={{ fontSize: "13px" }}>
                  Select Size {productCategory === "Bag" && "(Capacity)"}
                </h6>
                <div className="d-flex gap-3 flex-wrap">
                  {sizeOptions.map((opt, idx) => {
                    const isDisabled = opt.disabled || isOutOfStock;
                    return (
                      <div
                        key={idx}
                        className={`size-option-box ${selectedSize === opt.value ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                        onClick={() => !isDisabled && setSelectedSize(opt.value)}
                        style={
                          isDisabled
                            ? { opacity: 0.35, cursor: "not-allowed", pointerEvents: "none" }
                            : {}
                        }
                        title={
                          isDisabled
                            ? isOutOfStock
                              ? "Product is out of stock"
                              : "Not available"
                            : ""
                        }
                      >
                        <div className="size-value">{opt.value}</div>
                        <div className="size-label">{opt.label}</div>
                        {selectedSize === opt.value && !isOutOfStock && (
                          <div className="size-check-icon">
                            <i className="bi bi-check-circle-fill"></i>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="d-flex align-items-center gap-3 mb-4">
              <div
                className="quantity-selector"
                style={isOutOfStock ? { pointerEvents: "none", opacity: 0.5 } : {}}
              >
                <button onClick={decreaseQuantity} disabled={isOutOfStock}>-</button>
                <input type="text" value={isOutOfStock ? 0 : quantity} readOnly />
                <button onClick={increaseQuantity} disabled={isOutOfStock}>+</button>
              </div>

              {/* FIX 1: Add to Cart — hover handled by CSS class btn-add-cart-dynamic */}
              <button
                className={`btn-add-cart ${isOutOfStock ? "out-of-stock" : ""} ${!isOutOfStock && !isCurrentlyInCartWithThisSize ? "btn-add-cart-hoverable" : ""}`}
                onClick={handleAddToCartAction}
                disabled={isOutOfStock}
                style={{
                  backgroundColor: isOutOfStock
                    ? "#9ca3af"
                    : isCurrentlyInCartWithThisSize
                    ? "#4b5563"
                    : "#f3f4f6",
                  color: isOutOfStock
                    ? "#e5e7eb"
                    : isCurrentlyInCartWithThisSize
                    ? "#ffffff"
                    : "#1f2937",
                  border: isOutOfStock
                    ? "1px solid #9ca3af"
                    : isCurrentlyInCartWithThisSize
                    ? "none"
                    : "1px solid #d1d5db",
                  fontWeight: "600",
                  cursor: isOutOfStock ? "not-allowed" : "pointer",
                  opacity: isOutOfStock ? 0.6 : 1,
                }}
              >
                <IoMdCart />
                {isOutOfStock
                  ? "Out of Stock"
                  : isCurrentlyInCartWithThisSize
                  ? "Go to Cart"
                  : "Add to Cart"}
              </button>
            </div>

            <button
              className={`btn-buy-now ${isOutOfStock ? "out-of-stock" : ""}`}
              onClick={handleProceedToCheckoutDirectly}
              disabled={isOutOfStock}
              style={
                isOutOfStock
                  ? {
                      backgroundColor: "#9ca3af",
                      color: "#e5e7eb",
                      cursor: "not-allowed",
                      border: "none",
                      opacity: 0.6,
                    }
                  : {}
              }
            >
              Buy Now
            </button>

            <div className="delivery-box mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0 fw-bold text-dark">Delivery Address</h6>
                {savedAddresses.length > 0 && (
                  <h6
                    style={{
                      color: "#8b5cf6",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Choose Address <span className="bi bi-pencil-square"></span>
                  </h6>
                )}
              </div>
              <hr style={{ width: "100%", borderColor: "#ddd" }} className="my-2" />

              {savedAddresses.length === 0 ? (
                <div
                  className="empty-address-viewport d-flex justify-content-center align-items-center py-2"
                  style={{ backgroundColor: "#ffffff" }}
                >
                  <button
                    type="button"
                    className="add-delivery-trigger-btn d-flex align-items-center gap-2"
                    style={{
                      background: "none",
                      border: "1px dashed #8b5cf6",
                      color: "#8b5cf6",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                    }}
                    onClick={() => navigate("/address")}
                  >
                    <TiPencil style={{ transform: "rotate(-45deg)" }} /> Add
                    your Delivery Address
                  </button>
                </div>
              ) : !activeSelectedAddress ? (
                <div className="p-2 text-warning small fw-semibold">
                  ⚠️ Please click 'Choose Address' to select a card.
                </div>
              ) : (
                <div className="text-muted mt-2" style={{ fontSize: "0.9rem" }}>
                  <p className="mb-1">
                    <strong>{activeSelectedAddress.name}</strong>,{" "}
                    {activeSelectedAddress.address}
                  </p>
                  <p className="mb-1">
                    {activeSelectedAddress.city}, {activeSelectedAddress.state} -{" "}
                    {activeSelectedAddress.pin}
                  </p>
                  <p className="mb-0">Mobile: {activeSelectedAddress.mobile}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Details Table */}
        <div className="details-section mb-5">
          <h3>Product details</h3>
          <div className="table-responsive">
            <table className="table table-bordered product-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Specifications</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Product Name</td>
                  <td>{currentProduct.name || "-"}</td>
                </tr>
                <tr>
                  <td>Brand Name</td>
                  <td>{currentProduct.brand || currentProduct.brandName || "-"}</td>
                </tr>
                <tr>
                  <td>Product ID</td>
                  <td>{currentProduct.id || currentProduct.productId || "-"}</td>
                </tr>
                <tr>
                  <td>Material</td>
                  <td>{currentProduct.material || "-"}</td>
                </tr>
                {currentProduct.subCategory && currentProduct.subCategory !== "-" && (
                  <tr>
                    <td>Sub Category</td>
                    <td>{currentProduct.subCategory}</td>
                  </tr>
                )}
                {currentProduct.capacity && currentProduct.capacity !== "-" && (
                  <tr>
                    <td>Capacity</td>
                    <td>{currentProduct.capacity}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── RATING AND REVIEWS ─── */}
        <div className="reviews-section">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Rating And Reviews</h4>
          </div>

          <div className="overall-rating-card shadow-sm mb-4">
            <div className="rating-score">
              <h2>
                {averageRatingScore}{" "}
                {totalReviewsCount > 0 ? (
                  <FaStar className="fs-4 text-warning" />
                ) : (
                  <FaRegStar className="fs-4" style={{ color: "#9ca3af" }} />
                )}
              </h2>
              <p>{totalReviewsCount} Ratings</p>
              <p>&</p>
              <p>{totalReviewsCount} Reviews</p>
            </div>

            <div className="rating-bars">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="rating-bar-row">
                  <span>
                    {star}{" "}
                    <FaStar
                      style={{
                        color:
                          getStarCountFactor(star) > 0 ? "#fbbf24" : "#9ca3af",
                      }}
                    />
                  </span>
                  <div className="progress-custom">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: getStarPercentFactor(star),
                        backgroundColor:
                          star >= 3 ? "#22c55e" : star === 2 ? "#fbbf24" : "#ef4444",
                      }}
                    />
                  </div>
                  <span className="text-muted" style={{ width: "40px", textAlign: "right" }}>
                    {getStarCountFactor(star)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="filter-buttons">
            {["All", "Positive", "Negative"].map((type) => (
              <button
                key={type}
                className={`filter-btn-user ${activeFilter === type ? "active" : ""}`}
                onClick={() => setActiveFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {sortedFilteredReviews.length === 0 ? (
            <div
              className="text-center py-5 shadow-sm border rounded-3 my-3 bg-white"
              style={{ fontFamily: "system-ui" }}
            >
              <div style={{ fontSize: "2.8rem", color: "#a8a29e" }} className="mb-2">
                ✍️
              </div>
              <h5 className="fw-bold mb-1 text-dark" style={{ fontSize: "1.1rem" }}>
                No matching reviews yet
              </h5>
              <p className="text-muted small mb-3">
                Be the first to leave a verified review matching your selected filter!
              </p>
            </div>
          ) : (
            <div
              className="reviews-list-container mobile-swipe-slider"
              ref={reviewsScrollRef}
              onTouchStart={() => setIsReviewsHovered(true)}
              onTouchEnd={() => setIsReviewsHovered(false)}
              onMouseEnter={() => setIsReviewsHovered(true)}
              onMouseLeave={() => setIsReviewsHovered(false)}
            >
              <div
                className="row flex-nowrap flex-md-wrap g-4 mt-2 reviews-row"
                style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
              >
                {sortedFilteredReviews.map((review) => (
                  <div
                    key={review.firestoreId}
                    className="col-10 col-sm-6 col-md-4 review-col flex-shrink-0"
                  >
                    <div className="review-card p-3 border rounded bg-white shadow-sm">
                      <div className="review-header d-flex justify-content-between mb-2">
                        <div className="reviewer-info d-flex align-items-center gap-2">
                          <div
                            className="d-flex align-items-center justify-content-center fw-bold text-white rounded-circle"
                            style={{
                              width: "32px",
                              height: "32px",
                              background: "linear-gradient(135deg, #7c3aed, #9061f9)",
                              fontSize: "14px",
                              flexShrink: 0,
                            }}
                          >
                            {(review.customerName || review.name || "Anonymous")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <p
                            className="reviewer-name fw-bold m-0 small"
                            style={{ color: "#111827" }}
                          >
                            {review.customerName || review.name || "Anonymous"}
                          </p>
                        </div>
                        {/* FIX 2: correct star colors in review cards */}
                        <div className="rating-stars text-warning small">
                          {[...Array(5)].map((_, i) =>
                            i < review.rating ? (
                              <FaStar key={i} />
                            ) : (
                              <FaRegStar key={i} style={{ color: "#9ca3af" }} />
                            )
                          )}
                        </div>
                      </div>
                      <p
                        className="review-text small text-muted"
                        style={{ lineHeight: "1.5", height: "65px", overflowY: "auto" }}
                      >
                        {review.text}
                      </p>

                      <div className="review-actions d-flex justify-content-between align-items-center mt-3 border-top pt-2">
                        <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                          {review.date?.toDate
                            ? review.date.toDate().toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : review.date}
                        </span>
                        <div className="helpful-btns d-flex gap-2">
                          {/* FIX 3: show safe non-negative counts */}
                          <button
                            style={{
                              color: (review.likes || []).includes(currentUser?.uid)
                                ? "#058aff"
                                : "#6c757d",
                              background: "none",
                              border: "none",
                              fontSize: "16px",
                            }}
                            onClick={() => handleFeedback(review, "like")}
                          >
                            {(review.likes || []).includes(currentUser?.uid) ? (
                              <BiSolidLike />
                            ) : (
                              <BiLike />
                            )}
                            <span style={{ fontSize: "12px", marginLeft: "3px", color: "#6c757d" }}>
                              {Math.max(0, review.likeCount ?? 0)}
                            </span>
                          </button>
                          <button
                            style={{
                              color: (review.dislikes || []).includes(currentUser?.uid)
                                ? "#f25858"
                                : "#6c757d",
                              background: "none",
                              border: "none",
                              fontSize: "16px",
                            }}
                            onClick={() => handleFeedback(review, "dislike")}
                          >
                            {(review.dislikes || []).includes(currentUser?.uid) ? (
                              <BiSolidDislike />
                            ) : (
                              <BiDislike />
                            )}
                            <span style={{ fontSize: "12px", marginLeft: "3px", color: "#6c757d" }}>
                              {Math.max(0, review.dislikeCount ?? 0)}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="recent-products-outer-container py-4 border-top mt-5"
          style={{ backgroundColor: "#fafafa" }}
        >
          <div className="container">
            <RecentProduct />
          </div>
        </div>
      </div>

      {/* Address Selection Modal */}
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
              backgroundColor: "#fff",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
              <h4 className="title m-0 fw-bold" style={{ fontSize: "1.4rem" }}>
                Select delivery address
              </h4>
              <button
                type="button"
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
                onClick={() => setIsModalOpen(false)}
              >
                <MdClose size={24} className="modal-close-icon" />
              </button>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0 text-dark fw-semibold" style={{ fontSize: "1.05rem" }}>
                Saved Addresses
              </h5>
              <button
                type="button"
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
              className="popup-address-items-scroller"
              style={{ maxHeight: "365px", overflowY: "auto" }}
            >
              {savedAddresses.map((addr, index) => (
                <div
                  key={addr.id}
                  className={`popup-address-item-card p-3 mb-3 border rounded position-relative ${selectedAddressId === addr.id ? "selected-card" : ""}`}
                  onClick={() => {
                    setSelectedAddressId(addr.id);
                    setIsModalOpen(false);
                  }}
                  style={{
                    cursor: "pointer",
                    borderColor: selectedAddressId === addr.id ? "#8b5cf6" : "#e5e7eb",
                    backgroundColor: selectedAddressId === addr.id ? "#f5f3ff" : "#fff",
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="fw-bold text-dark" style={{ fontSize: "1rem" }}>
                      Address {index + 1}
                    </span>
                    {selectedAddressId === addr.id && (
                      <span
                        className="px-2 rounded-pill"
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
                      className="d-flex align-items-center gap-2 ms-auto"
                      style={{ position: "absolute", top: "14px", right: "14px" }}
                    >
                      <button
                        type="button"
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
                  <p className="text-dark m-0 mb-1" style={{ fontSize: "0.88rem" }}>
                    {addr.name} , {addr.address}
                  </p>
                  <p className="text-dark m-0 mb-1" style={{ fontSize: "0.88rem" }}>
                    {addr.city}, {addr.state} - {addr.pin}
                  </p>
                  <p className="text-muted m-0" style={{ fontSize: "0.85rem" }}>
                    Mobile: {addr.mobile}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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

      <ReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleWriteReviewSubmit}
        rating={modalRating}
        setRating={setModalRating}
      />
      <Footer />
    </div>
  );
}

export default ProductDetails;



// import React, { useState, useEffect, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import Navbar from "../../components/User/Navbar";
// import Footer from "../../components/User/Footer";
// import RecentProduct from "../../components/User/RecentProduct";
// import ReviewModal from "../../components/User/ReviewModal";
// import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
// import { FaStar, FaRegStar, FaHeart, FaTrashAlt } from "react-icons/fa";

// import { BiLike, BiDislike, BiSolidLike, BiSolidDislike } from "react-icons/bi";
// import { FiHeart } from "react-icons/fi";
// import { IoMdCart } from "react-icons/io";
// import { MdAdd, MdClose, MdModeEdit } from "react-icons/md";
// import { TiPencil } from "react-icons/ti";
// import { useWishlist } from "../../context/WishlistContext";
// import { useAuth } from "../../context/AuthContext";
// import { db } from "../../firebase";
// import {
//   doc,
//   getDoc,
//   addDoc,
//   collection,
//   query,
//   where,
//   orderBy,
//   onSnapshot,
//   updateDoc,
//   arrayUnion,
//   arrayRemove,
//   increment,
// } from "firebase/firestore";

// import "../../assets/styles/ProductDetails.css";

// function ProductDetails() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { wishlist, toggleWishlist, cart, addToCart } = useWishlist();
//   const { currentUser } = useAuth();

//   const { product } = location.state || {};

//   const currentProduct = product || {};

//   // Address and Selector States — fetched from Firestore
//   const [savedAddresses, setSavedAddresses] = useState([]);
//   const [selectedAddressId, setSelectedAddressId] = useState(null);

//   useEffect(() => {
//     if (!currentUser) return;
//     const fetchAddresses = async () => {
//       try {
//         const snap = await getDoc(doc(db, "users", currentUser.uid));
//         if (snap.exists()) {
//           const addrs = snap.data().addresses ?? [];
//           setSavedAddresses(addrs);
//           if (addrs.length > 0) setSelectedAddressId(addrs[0].id);
//         }
//       } catch (err) {
//         console.error("Error fetching addresses:", err);
//       }
//     };
//     fetchAddresses();
//   }, [currentUser]);

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [targetDeleteId, setTargetDeleteId] = useState(null);

//   const activeSelectedAddress = savedAddresses.find(
//     (addr) => addr.id === selectedAddressId,
//   );
//   const [quantity, setQuantity] = useState(1);

//   // Wishlist and Category Parsing
//   const isProductInWishlist = wishlist?.some(
//     (item) => item.id === currentProduct.id,
//   );
//   const productCategory =
//     currentProduct.category?.toLowerCase() === "wallet"
//       ? "Wallet"
//       : currentProduct.category?.toLowerCase() === "belt"
//         ? "Belt"
//         : "Bag";

//   // Pre-select the first available DB size, otherwise fall back to a default
//   // Find this inside your ProductDetails function
//   const [selectedSize, setSelectedSize] = useState(() => {
//     if (parseInt(currentProduct.stocks) <= 0) return null; // Add this check
//     const raw = currentProduct.size ?? "";
//     const first = raw.split(",")[0]?.trim();
//     if (first) return first;
//     return productCategory === "Bag" ? "20L" : "Small";
//   });

//   // ─── REVIEW SYSTEM STATE MANAGEMENT ENGINE ───
//   const [dynamicReviews, setDynamicReviews] = useState([]);
//   const [activeFilter, setActiveFilter] = useState("All");
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalRating, setModalRating] = useState(4);
//   const [feedbackState, setFeedbackState] = useState({});
//   const [isReviewsHovered, setIsReviewsHovered] = useState(false);
//   const reviewsScrollRef = useRef(null);

//   // ─── Load reviews from Firestore (real-time) ───────────────────────────────
//   useEffect(() => {
//     if (!currentProduct.id) {
//       setDynamicReviews([]);
//       return;
//     }
//     const q = query(
//       collection(db, "reviews"),
//       where("productId", "==", currentProduct.id),
//     );
//     const unsubscribe = onSnapshot(
//       q,
//       (snapshot) => {
//         const reviews = snapshot.docs
//           .map((d) => ({ ...d.data(), firestoreId: d.id }))
//           .filter((r) => !r.isHidden);

//         // Sort reviews in-memory by date descending
//         reviews.sort((a, b) => {
//           const dateA = a.date?.toDate
//             ? a.date.toDate()
//             : new Date(a.date || 0);
//           const dateB = b.date?.toDate
//             ? b.date.toDate()
//             : new Date(b.date || 0);
//           return dateB - dateA;
//         });

//         setDynamicReviews(reviews);
//       },
//       (err) => {
//         console.error("Error loading reviews:", err);
//       },
//     );
//     window.scrollTo(0, 0);
//     return () => unsubscribe();
//   }, [currentProduct.id]);

//   // Mobile Auto Scroll Carousel Animation Effect for Reviews
//   useEffect(() => {
//     if (window.innerWidth > 768) return;

//     let animationFrameId;
//     const scrollStep = () => {
//       if (reviewsScrollRef.current && !isReviewsHovered) {
//         reviewsScrollRef.current.scrollLeft += 1;
//         if (
//           reviewsScrollRef.current.scrollLeft >=
//           reviewsScrollRef.current.scrollWidth -
//             reviewsScrollRef.current.clientWidth -
//             1
//         ) {
//           reviewsScrollRef.current.scrollLeft = 0;
//         }
//       }
//       animationFrameId = requestAnimationFrame(scrollStep);
//     };

//     animationFrameId = requestAnimationFrame(scrollStep);
//     return () => cancelAnimationFrame(animationFrameId);
//   }, [isReviewsHovered]);

//   // Live Score System Calculations
//   const totalReviewsCount = dynamicReviews.length;
//   const averageRatingScore =
//     totalReviewsCount > 0
//       ? (
//           dynamicReviews.reduce((sum, r) => sum + r.rating, 0) /
//           totalReviewsCount
//         ).toFixed(1)
//       : "0.0";

//   const getStarCountFactor = (starNum) =>
//     dynamicReviews.filter((r) => r.rating === starNum).length;
//   const getStarPercentFactor = (starNum) =>
//     totalReviewsCount > 0
//       ? `${(getStarCountFactor(starNum) / totalReviewsCount) * 100}%`
//       : "0%";

//   // Filters and sorts reviews directly by descending format (5, 4, 3, 2, 1) with no extra truncation logic bounds
//   const sortedFilteredReviews = dynamicReviews
//     .filter((review) => {
//       if (activeFilter === "Positive") {
//         return review.rating >= 3 && review.rating <= 5;
//       }
//       if (activeFilter === "Negative") {
//         return review.rating === 1 || review.rating === 2;
//       }
//       return true; // "All" should show all reviews
//     })
//     .sort((a, b) => {
//       // Sort from high reviews (5 stars) to low reviews (1 star)
//       if (b.rating !== a.rating) {
//         return b.rating - a.rating;
//       }
//       // If ratings are equal, sort by date descending (newest first)
//       const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
//       const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
//       return dateB - dateA;
//     });

//   const handleFeedback = async (review, type) => {
//     if (!currentUser) return;
//     const uid = currentUser.uid;
//     const ref = doc(db, "reviews", review.firestoreId);
//     const alreadyLiked = (review.likes || []).includes(uid);
//     const alreadyDisliked = (review.dislikes || []).includes(uid);

//     try {
//       if (type === "like") {
//         if (alreadyLiked) {
//           await updateDoc(ref, {
//             likes: arrayRemove(uid),
//             likeCount: increment(-1),
//           });
//         } else {
//           const updates = { likes: arrayUnion(uid), likeCount: increment(1) };
//           if (alreadyDisliked) {
//             updates.dislikes = arrayRemove(uid);
//             updates.dislikeCount = increment(-1);
//           }
//           await updateDoc(ref, updates);
//         }
//       } else {
//         if (alreadyDisliked) {
//           await updateDoc(ref, {
//             dislikes: arrayRemove(uid),
//             dislikeCount: increment(-1),
//           });
//         } else {
//           const updates = {
//             dislikes: arrayUnion(uid),
//             dislikeCount: increment(1),
//           };
//           if (alreadyLiked) {
//             updates.likes = arrayRemove(uid);
//             updates.likeCount = increment(-1);
//           }
//           await updateDoc(ref, updates);
//         }
//       }
//     } catch (err) {
//       console.error("Error updating feedback:", err);
//     }
//   };

//   const handleWriteReviewSubmit = async (rating, text) => {
//     try {
//       // Resolve reviewer display name from Firestore profile, fallback to email or "Anonymous"
//       let customerName = "Anonymous User";
//       if (currentUser) {
//         try {
//           const snap = await getDoc(doc(db, "users", currentUser.uid));
//           if (snap.exists()) {
//             customerName =
//               snap.data().name ||
//               snap.data().displayName ||
//               currentUser.email ||
//               "Anonymous User";
//           }
//         } catch (_) {}
//       }

//       const reviewPayload = {
//         productId: currentProduct.id,
//         productName: currentProduct.name,
//         image: currentProduct.image || "",
//         customerId: currentUser?.uid || "guest",
//         customerName,
//         text,
//         rating,
//         likes: [],
//         dislikes: [],
//         likeCount: 0,
//         dislikeCount: 0,
//         date: new Date(),
//         isHidden: false,
//       };

//       await addDoc(collection(db, "reviews"), reviewPayload);
//     } catch (err) {
//       console.error("Error saving review:", err);
//       alert("Failed to submit review. Please try again.");
//     }
//   };

//   // Size Configurations — driven by DB `size` field (comma-separated, e.g. "20L, 30L" or "Small, Medium")
//   const dbSizeRaw = currentProduct.size ?? "";
//   // Parse the comma-separated string into an array of available sizes
//   const dbSizes = dbSizeRaw
//     ? dbSizeRaw
//         .split(",")
//         .map((s) => s.trim())
//         .filter(Boolean)
//     : [];

//   // Belt size values in DB use full words: "Small", "Medium", "Long"
//   const allBagSizes = ["20L", "30L", "40L"];
//   const allBeltSizes = ["Small", "Medium", "Long"];

//   const sizeOptions =
//     productCategory === "Bag"
//       ? allBagSizes.map((v) => ({
//           value: v,
//           label: "Capacity",
//           // Disabled only if DB has sizes and this size is NOT in them
//           disabled: dbSizes.length > 0 && !dbSizes.includes(v),
//         }))
//       : productCategory === "Belt"
//         ? allBeltSizes.map((v) => ({
//             value: v,
//             label: "Size",
//             disabled: dbSizes.length > 0 && !dbSizes.includes(v),
//           }))
//         : [];

//   const decreaseQuantity = () => {
//     if (quantity > 1) setQuantity(quantity - 1);
//   };

//   const increaseQuantity = () => {
//     setQuantity(quantity + 1);
//   };

//   // Image Gallery — filter null slots from DB images[] array
//   const images = (() => {
//     const dbImages = (currentProduct.images ?? []).filter(Boolean);
//     if (dbImages.length > 0) return dbImages;
//     return currentProduct.image ? [currentProduct.image] : [];
//   })();

//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const mainImage = images[currentImageIndex] ?? currentProduct.image;

//   const handlePrevImage = () => {
//     setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
//   };

//   const handleNextImage = () => {
//     setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
//   };

//   const promptDeleteAddress = (e, id) => {
//     e.stopPropagation();
//     setTargetDeleteId(id);
//     setShowDeleteModal(true);
//   };

//   // ─────────────────────────────────────────────────────────────────────────────
// // FIX 2: Replace the executeDeleteAddress function in ProductDetails.jsx
// // Also add "updateDoc" to your firebase imports if not already present:
// //   import { doc, getDoc, addDoc, collection, query, where, orderBy,
// //            onSnapshot, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
// // ─────────────────────────────────────────────────────────────────────────────

// const executeDeleteAddress = async () => {
//   const updated = savedAddresses.filter((addr) => addr.id !== targetDeleteId);
//   setSavedAddresses(updated);

//   // ✅ Persist deletion to Firestore (was missing — only localStorage was updated before)
//   if (currentUser) {
//     try {
//       const userDocRef = doc(db, "users", currentUser.uid);
//       await updateDoc(userDocRef, { addresses: updated });
//     } catch (err) {
//       console.error("Error deleting address from DB:", err);
//     }
//   }

//   // Keep localStorage in sync too
//   localStorage.setItem("savedAddresses", JSON.stringify(updated));

//   if (selectedAddressId === targetDeleteId) {
//     setSelectedAddressId(updated.length > 0 ? updated[0].id : null);
//   }
//   setShowDeleteModal(false);
//   setTargetDeleteId(null);
// };

//   const isCurrentlyInCartWithThisSize = cart?.some(
//     (item) => item.id === currentProduct.id && item.size === selectedSize,
//   );

//   const isOutOfStock =
//     currentProduct.stocks !== undefined &&
//     currentProduct.stocks !== null &&
//     parseInt(currentProduct.stocks) <= 0;

//   const handleAddToCartAction = () => {
//     if (isCurrentlyInCartWithThisSize) {
//       navigate("/cart");
//     } else {
//       const cartPayload = {
//         ...currentProduct,
//         qty: quantity,
//         size: selectedSize,
//       };
//       addToCart(cartPayload);
//     }
//   };

//   const handleProceedToCheckoutDirectly = () => {
//   // Prevent action if out of stock
//   if (isOutOfStock) {
//     return;
//   }
  
//   const itemPayload = {
//     ...currentProduct,
//     qty: quantity,
//     size: selectedSize,
//   };
//   navigate("/checkout", {
//     state: {
//       allCartItems: [itemPayload],
//       cartItems: [itemPayload],
//       couponPercentageLabel: "",
//       returnedAddressId: selectedAddressId,
//     },
//   });
// };
//   return (
//     <div className="product-details-page" style={{ position: "relative" }}>
//       <Navbar />

//       <div className="container py-4">
//         <div className="row mb-4">
//           <div className="col-lg-6 d-flex align-items-center"></div>
//           <div className="col-lg-6 ps-lg-5 d-flex justify-content-between align-items-center">
//             <div
//               className="breadcrumb-text"
//               style={{ textTransform: "capitalize" }}
//             >
//               {currentProduct.category}s /{" "}
//               <span className="active">{currentProduct.name}</span>
//             </div>
//             <div
//               className="text-danger fs-4 cursor-pointer wishlist-btn"
//               onClick={() => toggleWishlist(currentProduct)}
//             >
//               {isProductInWishlist ? <FaHeart /> : <FiHeart />}
//             </div>
//           </div>
//         </div>

//         <div className="row mb-5">
//           <div className="col-lg-6 mb-4 mb-lg-0">
//             <div className="main-image-container">
//               <button
//                 className="arrow-btn d-none d-md-block"
//                 onClick={handlePrevImage}
//               >
//                 <IoIosArrowBack />
//               </button>
//               <img
//                 key={currentImageIndex}
//                 src={mainImage}
//                 alt={currentProduct.name}
//                 className="main-product-image mx-4"
//               />
//               <button
//                 className="arrow-btn d-none d-md-block"
//                 onClick={handleNextImage}
//               >
//                 <IoIosArrowForward />
//               </button>
//             </div>
//             <div className="thumbnail-gallery mt-4">
//               {images.map((img, idx) => (
//                 <div
//                   key={idx}
//                   className={`thumbnail-box ${currentImageIndex === idx ? "active" : ""}`}
//                   onClick={() => setCurrentImageIndex(idx)}
//                 >
//                   <img src={img} alt="Thumbnail segment element" />
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="col-lg-6 ps-lg-5">
//             {/* Stock from DB */}
//             <div
//               className="stock-text mb-2"
//               style={{
//                 color: isOutOfStock ? "#ef4444" : "#10b981",
//                 fontWeight: "600",
//               }}
//             >
//               {isOutOfStock
//                 ? "Out of Stock"
//                 : `${currentProduct.stocks} in stock available`}
//             </div>
//             <h1 className="product-title">{currentProduct.name}</h1>
//             <div className="price-section d-flex align-items-center mb-2">
//               <span className="current-price">₹ {currentProduct.price}</span>
//               {Number(currentProduct.discount || 0) > 0 && (
//                 <>
//                   <span className="original-price">
//                     ₹ {currentProduct.realPrice}
//                   </span>
//                   <span className="discount">
//                     {currentProduct.offer || `${currentProduct.discount}%`} off
//                   </span>
//                 </>
//               )}
//             </div>

//             <div className="d-flex align-items-center mb-3">
//               <div className="rating-stars text-warning me-2">
//                 {[...Array(5)].map((_, i) =>
//                   i < Math.round(Number(averageRatingScore)) ? (
//                     <FaStar key={i} />
//                   ) : (
//                     <FaRegStar key={i} style={{ color: "#d1d5db" }} />
//                   ),
//                 )}
//               </div>
//               <span
//                 className="rating-count"
//                 style={{ fontSize: "0.85rem", color: "#6b7280" }}
//               >
//                 {totalReviewsCount > 0
//                   ? `${averageRatingScore} / 5.0`
//                   : "No ratings yet"}{" "}
//                 ({totalReviewsCount} Reviews)
//               </span>
//             </div>
//             <p className="product-description">{currentProduct.description}</p>

//             {sizeOptions.length > 0 && (
//               <div className="size-selector-section mb-4">
//                 <h6 className="fw-bold mb-3" style={{ fontSize: "13px" }}>
//                   Select Size {productCategory === "Bag" && "(Capacity)"}
//                 </h6>
//                 <div className="d-flex gap-3 flex-wrap">
//                   {sizeOptions.map((opt, idx) => {
//                     // Define if the option is disabled (either by DB logic or stock status)
//                     const isDisabled = opt.disabled || isOutOfStock;

//                     return (
//                       <div
//                         key={idx}
//                         className={`size-option-box ${selectedSize === opt.value ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
//                         onClick={() =>
//                           !isDisabled && setSelectedSize(opt.value)
//                         }
//                         style={
//                           isDisabled
//                             ? {
//                                 opacity: 0.35,
//                                 cursor: "not-allowed",
//                                 pointerEvents: "none",
//                               }
//                             : {}
//                         }
//                         title={
//                           isDisabled
//                             ? isOutOfStock
//                               ? "Product is out of stock"
//                               : "Not available"
//                             : ""
//                         }
//                       >
//                         <div className="size-value">{opt.value}</div>
//                         <div className="size-label">{opt.label}</div>
//                         {/* Only show check icon if selected AND in stock */}
//                         {selectedSize === opt.value && !isOutOfStock && (
//                           <div className="size-check-icon">
//                             <i className="bi bi-check-circle-fill"></i>
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}

//             <div className="d-flex align-items-center gap-3 mb-4">
//   {/* Quantity Selector - Disabled when out of stock */}
//   <div
//     className="quantity-selector"
//     style={
//       isOutOfStock ? { pointerEvents: "none", opacity: 0.5 } : {}
//     }
//   >
//     <button onClick={decreaseQuantity} disabled={isOutOfStock}>
//       -
//     </button>
//     <input
//       type="text"
//       value={isOutOfStock ? 0 : quantity}
//       readOnly
//     />
//     <button onClick={increaseQuantity} disabled={isOutOfStock}>
//       +
//     </button>
//   </div>

//   {/* ADD TO CART BUTTON - Dull colors when out of stock */}
//   <button
//     className={`btn-add-cart ${isOutOfStock ? "out-of-stock" : ""}`}
//     onClick={handleAddToCartAction}
//     disabled={isOutOfStock}
//     style={{
//       backgroundColor: isOutOfStock
//         ? "#9ca3af"  // Dull gray color
//         : isCurrentlyInCartWithThisSize
//           ? "#4b5563"
//           : "#f3f4f6",
//       color: isOutOfStock
//         ? "#e5e7eb"  // Light dull text
//         : isCurrentlyInCartWithThisSize
//           ? "#ffffff"
//           : "#1f2937",
//       border: isOutOfStock
//         ? "1px solid #9ca3af"
//         : isCurrentlyInCartWithThisSize
//           ? "none"
//           : "1px solid #d1d5db",
//       fontWeight: "600",
//       transition: "none",  // No transition when out of stock
//       cursor: isOutOfStock ? "not-allowed" : "pointer",
//       opacity: isOutOfStock ? 0.6 : 1,
//     }}
//   >
//     <IoMdCart /> 
//     {isOutOfStock 
//       ? "Out of Stock" 
//       : isCurrentlyInCartWithThisSize 
//         ? "Go to Cart" 
//         : "Add to Cart"}
//   </button>
// </div>

// {/* BUY NOW BUTTON - Dull colors when out of stock */}
// <button
//   className={`btn-buy-now ${isOutOfStock ? "out-of-stock" : ""}`}
//   onClick={handleProceedToCheckoutDirectly}
//   disabled={isOutOfStock}
//   style={
//     isOutOfStock
//       ? {
//           backgroundColor: "#9ca3af",  // Dull gray color
//           color: "#e5e7eb",            // Light dull text
//           cursor: "not-allowed",
//           border: "none",
//           transition: "none",           // No transition/hover effects
//           opacity: 0.6,
//         }
//       : {}
//   }
// >
//   Buy Now
// </button>

//             <div className="delivery-box mt-4">
//               <div className="d-flex justify-content-between align-items-center mb-2">
//                 <h6 className="mb-0 fw-bold text-dark">Delivery Address</h6>
//                 {savedAddresses.length > 0 && (
//                   <h6
//                     className="cursor-pointer"
//                     style={{
//                       color: "#8b5cf6",
//                       fontSize: "13px",
//                       fontWeight: "600",
//                       cursor: "pointer",
//                     }}
//                     onClick={() => setIsModalOpen(true)}
//                   >
//                     Choose Address <span className="bi bi-pencil-square"></span>
//                   </h6>
//                 )}
//               </div>
//               <hr
//                 style={{ width: "100%", borderColor: "#ddd" }}
//                 className="my-2"
//               />

//               {savedAddresses.length === 0 ? (
//                 <div
//                   className="empty-address-viewport d-flex justify-content-center align-items-center py-2"
//                   style={{ backgroundColor: "#ffffff" }}
//                 >
//                   <button
//                     type="button"
//                     className="add-delivery-trigger-btn d-flex align-items-center gap-2"
//                     style={{
//                       background: "none",
//                       border: "1px dashed #8b5cf6",
//                       color: "#8b5cf6",
//                       padding: "6px 12px",
//                       borderRadius: "6px",
//                       fontSize: "0.85rem",
//                       fontWeight: "600",
//                     }}
//                     onClick={() => navigate("/address")}
//                   >
//                     <TiPencil style={{ transform: "rotate(-45deg)" }} /> Add
//                     your Delivery Address
//                   </button>
//                 </div>
//               ) : !activeSelectedAddress ? (
//                 <div className="p-2 text-warning small fw-semibold">
//                   ⚠️ Please click 'Choose Address' to select a card.
//                 </div>
//               ) : (
//                 <div className="text-muted mt-2" style={{ fontSize: "0.9rem" }}>
//                   <p className="mb-1">
//                     <strong>{activeSelectedAddress.name}</strong>,{" "}
//                     {activeSelectedAddress.address}
//                   </p>
//                   <p className="mb-1">
//                     {activeSelectedAddress.city}, {activeSelectedAddress.state}{" "}
//                     - {activeSelectedAddress.pin}
//                   </p>
//                   <p className="mb-0">Mobile: {activeSelectedAddress.mobile}</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="details-section mb-5">
//           <h3>Product details</h3>
//           <div className="table-responsive">
//             <table className="table table-bordered product-table">
//               <thead>
//                 <tr>
//                   <th>Category</th>
//                   <th>Specifications</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr>
//                   <td>Product Name</td>
//                   <td>{currentProduct.name || "-"}</td>
//                 </tr>
//                 {/* DB uses `brand` field (not brandName) */}
//                 <tr>
//                   <td>Brand Name</td>
//                   <td>
//                     {currentProduct.brand || currentProduct.brandName || "-"}
//                   </td>
//                 </tr>
//                 {/* DB uses `id` as the product ID */}
//                 <tr>
//                   <td>Product ID</td>
//                   <td>
//                     {currentProduct.id || currentProduct.productId || "-"}
//                   </td>
//                 </tr>
//                 <tr>
//                   <td>Material</td>
//                   <td>{currentProduct.material || "-"}</td>
//                 </tr>
//                 {currentProduct.subCategory &&
//                   currentProduct.subCategory !== "-" && (
//                     <tr>
//                       <td>Sub Category</td>
//                       <td>{currentProduct.subCategory}</td>
//                     </tr>
//                   )}
//                 {currentProduct.capacity && currentProduct.capacity !== "-" && (
//                   <tr>
//                     <td>Capacity</td>
//                     <td>{currentProduct.capacity}</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* ─── RATING AND USER REVIEWS PANEL ─── */}
//         <div className="reviews-section">
//           <div className="d-flex justify-content-between align-items-center mb-3">
//             <h4>Rating And Reviews</h4>
//             {/* <span className="text-muted small" style={{ fontSize: "0.78rem" }}>
//               ✅ Only verified buyers can write a review
//             </span> */}
//           </div>

//           <div className="overall-rating-card shadow-sm mb-4">
//             <div className="rating-score">
//               <h2>
//                 {averageRatingScore}{" "}
//                 {totalReviewsCount > 0 ? (
//                   <FaStar className="fs-4 text-warning" />
//                 ) : (
//                   <FaRegStar className="fs-4" />
//                 )}
//               </h2>
//               <p>{totalReviewsCount} Ratings</p>
//               <p>&</p>
//               <p>{totalReviewsCount} Reviews</p>
//             </div>

//             <div className="rating-bars">
//               {[5, 4, 3, 2, 1].map((star) => (
//                 <div key={star} className="rating-bar-row">
//                   <span>
//                     {star}{" "}
//                     <FaStar
//                       style={{
//                         color:
//                           getStarCountFactor(star) > 0 ? "#fbbf24" : "#e5e7eb",
//                       }}
//                     />
//                   </span>
//                   <div className="progress-custom">
//                     <div
//                       className="progress-bar-fill"
//                       style={{
//                         width: getStarPercentFactor(star),
//                         backgroundColor:
//                           star >= 3
//                             ? "#22c55e"
//                             : star === 2
//                               ? "#fbbf24"
//                               : "#ef4444",
//                       }}
//                     />
//                   </div>
//                   <span
//                     className="text-muted"
//                     style={{ width: "40px", textAlign: "right" }}
//                   >
//                     {getStarCountFactor(star)}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="filter-buttons">
//             {["All", "Positive", "Negative"].map((type) => (
//               <button
//                 key={type}
//                 className={`filter-btn-user ${activeFilter === type ? "active" : ""}`}
//                 onClick={() => setActiveFilter(type)}
//               >
//                 {type}
//               </button>
//             ))}
//           </div>

//           {sortedFilteredReviews.length === 0 ? (
//             <div
//               className="text-center py-5 shadow-sm border rounded-3 my-3 bg-white"
//               style={{ fontFamily: "system-ui" }}
//             >
//               <div
//                 style={{ fontSize: "2.8rem", color: "#a8a29e" }}
//                 className="mb-2"
//               >
//                 ✍️
//               </div>
//               <h5
//                 className="fw-bold mb-1 text-dark"
//                 style={{ fontSize: "1.1rem" }}
//               >
//                 No matching reviews yet
//               </h5>
//               <p className="text-muted small mb-3">
//                 Be the first to leave a verified review matching your selected
//                 filter metrics!
//               </p>
//             </div>
//           ) : (
//             <div
//               className="reviews-list-container mobile-swipe-slider"
//               ref={reviewsScrollRef}
//               onTouchStart={() => setIsReviewsHovered(true)}
//               onTouchEnd={() => setIsReviewsHovered(false)}
//               onMouseEnter={() => setIsReviewsHovered(true)}
//               onMouseLeave={() => setIsReviewsHovered(false)}
//             >
//               <div
//                 className="row flex-nowrap flex-md-wrap g-4 mt-2 reviews-row"
//                 style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
//               >
//                 {sortedFilteredReviews.map((review) => (
//                   <div
//                     key={review.id}
//                     className="col-10 col-sm-6 col-md-4 review-col flex-shrink-0"
//                   >
//                     <div className="review-card p-3 border rounded bg-white shadow-sm">
//                       <div className="review-header d-flex justify-content-between mb-2">
//                         <div className="reviewer-info d-flex align-items-center gap-2">
//                           <div
//                             className="d-flex align-items-center justify-content-center fw-bold text-white rounded-circle"
//                             style={{
//                               width: "32px",
//                               height: "32px",
//                               background:
//                                 "linear-gradient(135deg, #7c3aed, #9061f9)",
//                               fontSize: "14px",
//                               flexShrink: 0,
//                               textShadow: "0 1px 1px rgba(0,0,0,0.1)",
//                             }}
//                           >
//                             {(review.customerName || review.name || "Anonymous")
//                               .charAt(0)
//                               .toUpperCase()}
//                           </div>
//                           <p
//                             className="reviewer-name fw-bold m-0 small"
//                             style={{ color: "#111827" }}
//                           >
//                             {review.customerName || review.name || "Anonymous"}
//                           </p>
//                         </div>
//                         <div className="rating-stars text-warning small">
//                           {[...Array(5)].map((_, i) =>
//                             i < review.rating ? (
//                               <FaStar key={i} />
//                             ) : (
//                               <FaRegStar key={i} />
//                             ),
//                           )}
//                         </div>
//                       </div>
//                       <p
//                         className="review-text small text-muted"
//                         style={{
//                           lineHeight: "1.5",
//                           height: "65px",
//                           overflowY: "auto",
//                         }}
//                       >
//                         {review.text}
//                       </p>

//                       <div className="review-actions d-flex justify-content-between align-items-center mt-3 border-top pt-2">
//                         <span
//                           className="text-muted"
//                           style={{ fontSize: "0.7rem" }}
//                         >
//                           {review.date?.toDate
//                             ? review.date
//                                 .toDate()
//                                 .toLocaleDateString("en-IN", {
//                                   day: "numeric",
//                                   month: "short",
//                                   year: "numeric",
//                                 })
//                             : review.date}
//                         </span>
//                         <div className="helpful-btns d-flex gap-2">
//                           <button
//                             style={{
//                               color: (review.likes || []).includes(
//                                 currentUser?.uid,
//                               )
//                                 ? "#058aff"
//                                 : "#6c757d",
//                               background: "none",
//                               border: "none",
//                               fontSize: "16px",
//                             }}
//                             onClick={() => handleFeedback(review, "like")}
//                           >
//                             {(review.likes || []).includes(currentUser?.uid) ? (
//                               <BiSolidLike />
//                             ) : (
//                               <BiLike />
//                             )}
//                             <span
//                               style={{
//                                 fontSize: "12px",
//                                 marginLeft: "3px",
//                                 color: "#6c757d",
//                               }}
//                             >
//                               {review.likeCount || 0}
//                             </span>
//                           </button>
//                           <button
//                             style={{
//                               color: (review.dislikes || []).includes(
//                                 currentUser?.uid,
//                               )
//                                 ? "#f25858"
//                                 : "#6c757d",
//                               background: "none",
//                               border: "none",
//                               fontSize: "16px",
//                             }}
//                             onClick={() => handleFeedback(review, "dislike")}
//                           >
//                             {(review.dislikes || []).includes(
//                               currentUser?.uid,
//                             ) ? (
//                               <BiSolidDislike />
//                             ) : (
//                               <BiDislike />
//                             )}
//                             <span
//                               style={{
//                                 fontSize: "12px",
//                                 marginLeft: "3px",
//                                 color: "#6c757d",
//                               }}
//                             >
//                               {review.dislikeCount || 0}
//                             </span>
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         <div
//           className="recent-products-outer-container py-4 border-top mt-5"
//           style={{ backgroundColor: "#fafafa" }}
//         >
//           <div className="container">
//             <RecentProduct />
//           </div>
//         </div>
//       </div>

//       {/* Address Selection Modal Grid */}
//       {isModalOpen && (
//         <div
//           className="address-popup-modal-overlay d-flex justify-content-center align-items-center"
//           style={{
//             position: "fixed",
//             inset: 0,
//             backgroundColor: "rgba(0,0,0,0.45)",
//             backdropFilter: "blur(2px)",
//             zIndex: 999,
//           }}
//         >
//           <div
//             className="address-popup-modal-box shadow-lg p-4 rounded"
//             style={{
//               width: "92%",
//               maxWidth: "625px",
//               maxHeight: "90vh",
//               display: "flex",
//               flexDirection: "column",
//               backgroundColor: "#fff",
//             }}
//           >
//             <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
//               <h4 className="title m-0 fw-bold" style={{ fontSize: "1.4rem" }}>
//                 Select delivery address
//               </h4>
//               <button
//                 type="button"
//                 style={{
//                   background: "transparent",
//                   border: "none",
//                   cursor: "pointer",
//                 }}
//                 onClick={() => setIsModalOpen(false)}
//               >
//                 <MdClose size={24} className="modal-close-icon" />
//               </button>
//             </div>
//             <div className="d-flex justify-content-between align-items-center mb-3">
//               <h5
//                 className="m-0 text-dark fw-semibold"
//                 style={{ fontSize: "1.05rem" }}
//               >
//                 Saved Addresses
//               </h5>
//               <button
//                 type="button"
//                 className="popup-add-new-address-btn d-flex align-items-center gap-1"
//                 style={{
//                   backgroundColor: "#8b5cf6",
//                   color: "#fff",
//                   border: "none",
//                   padding: "7px 14px",
//                   borderRadius: "6px",
//                   fontWeight: "600",
//                   fontSize: "0.8rem",
//                 }}
//                 onClick={() => navigate("/address")}
//               >
//                 <MdAdd size={16} /> Add a New Address
//               </button>
//             </div>
//             <div
//               className="popup-address-items-scroller pr-1"
//               style={{ maxHeight: "365px", overflowY: "auto" }}
//             >
//               {savedAddresses.map((addr, index) => (
//                 <div
//                   key={addr.id}
//                   className={`popup-address-item-card p-3 mb-3 border rounded position-relative ${selectedAddressId === addr.id ? "selected-card" : ""}`}
//                   onClick={() => {
//                     setSelectedAddressId(addr.id);
//                     setIsModalOpen(false);
//                   }}
//                   style={{
//                     cursor: "pointer",
//                     borderColor:
//                       selectedAddressId === addr.id ? "#8b5cf6" : "#e5e7eb",
//                     backgroundColor:
//                       selectedAddressId === addr.id ? "#f5f3ff" : "#fff",
//                   }}
//                 >
//                   <div className="d-flex align-items-center gap-2 mb-2">
//                     <span
//                       className="fw-bold text-dark"
//                       style={{ fontSize: "1rem" }}
//                     >
//                       Address {index + 1}
//                     </span>
//                     {selectedAddressId === addr.id && (
//                       <span
//                         className="px-2 py-0.5 rounded-pill"
//                         style={{
//                           backgroundColor: "#ddd6fe",
//                           color: "#6d28d9",
//                           fontSize: "0.72rem",
//                           fontWeight: "700",
//                         }}
//                       >
//                         Selected
//                       </span>
//                     )}
//                     <div
//                       className="popup-card-actions-tray d-flex align-items-center gap-2 ms-auto"
//                       style={{
//                         position: "absolute",
//                         top: "14px",
//                         right: "14px",
//                       }}
//                     >
//                       <button
//                         type="button"
//                         className="edit-icon"
//                         style={{
//                           background: "transparent",
//                           border: "1px solid #c4b5fd",
//                           color: "#8b5cf6",
//                           borderRadius: "20px",
//                           padding: "3px 12px",
//                           fontSize: "0.78rem",
//                         }}
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           navigate("/address");
//                         }}
//                       >
//                         <MdModeEdit size={14} />{" "}
//                         <span style={{ marginLeft: "2px" }}>Edit</span>
//                       </button>
//                       <button
//                         type="button"
//                         style={{
//                           background: "transparent",
//                           border: "none",
//                           color: "#9ca3af",
//                           cursor: "pointer",
//                         }}
//                         onClick={(e) => promptDeleteAddress(e, addr.id)}
//                       >
//                         <FaTrashAlt size={13} />
//                       </button>
//                     </div>
//                   </div>
//                   <p
//                     className="text-dark m-0 mb-1"
//                     style={{ fontSize: "0.88rem" }}
//                   >
//                     {addr.name} , {addr.address}
//                   </p>
//                   <p
//                     className="text-dark m-0 mb-1"
//                     style={{ fontSize: "0.88rem" }}
//                   >
//                     {addr.city}, {addr.state} - {addr.pin}
//                   </p>
//                   <p className="text-muted m-0" style={{ fontSize: "0.85rem" }}>
//                     Mobile: {addr.mobile}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete Address Modal Confirmation Block */}
//       {showDeleteModal && (
//         <div
//           className="modal-overlay-custom"
//           style={{
//             position: "fixed",
//             inset: 0,
//             backgroundColor: "rgba(0,0,0,0.4)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 10000,
//           }}
//         >
//           <div
//             className="modal-box-custom shadow-lg p-4 rounded text-center"
//             style={{ width: "90%", maxWidth: "400px" }}
//           >
//             <h5 className="fw-bold mb-2">Confirm Deletion</h5>
//             <p className="text-muted small">
//               Are you sure you want to delete this delivery address profile?
//             </p>
//             <div className="d-flex gap-3 mt-4">
//               <button
//                 type="button"
//                 className="btn btn-secondary flex-fill"
//                 onClick={() => setShowDeleteModal(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 className="btn btn-danger flex-fill"
//                 onClick={executeDeleteAddress}
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Review Modal Dialog component wrapper */}
//       <ReviewModal
//         isOpen={modalOpen}
//         onClose={() => setModalOpen(false)}
//         onSubmit={handleWriteReviewSubmit}
//         rating={modalRating}
//         setRating={setModalRating}
//       />
//       <Footer />
//     </div>
//   );
// }

// export default ProductDetails;
