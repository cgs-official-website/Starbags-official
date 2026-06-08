import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // FIXED: Imported useNavigate for clean redirection
import { FaStar, FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { useWishlist } from "../../context/WishlistContext";
import "../../assets/styles/productCard.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const WishlistHeart = ({ product }) => {
  const { wishlist, toggleWishlist } = useWishlist();
  
  // FIX: Use both name AND price to create a unique identifier, 
  // since multiple items share the exact name "Leather Wallet"
  const isWishlist = wishlist.some(
    (item) => item.name === product.name && Number(item.price) === Number(product.price)
  );

  return (
    <div className="wishlist">
      <button
        className="wishlist-toggle shadow-sm"
        onClick={(e) => {
          e.stopPropagation(); // FIXED: Stops event bubbling up to prevent triggering card redirection!
          toggleWishlist(product);
        }}
        type="button"
      >
        {isWishlist ? (
          <FaHeart className="heart-icon text-danger" />
        ) : (
          <FiHeart className="text-danger" />
        )}
      </button>
    </div>
  );
};

const HomeProduct = ({ products = [] }) => {
  const navigate = useNavigate(); // FIXED: Initialized routing context handler

  // FIXED: Programmatic redirect navigation mapping array elements cleanly forward to details page
  const handleProductDetailsRedirect = (selectedProduct) => {
    navigate("/product", {
      state: { product: selectedProduct }
    });
  };

  return (
    <div className="ProductCard-section my-3">
      <div className="container">
        {products.map((pro, index) => (
          <div 
            className="card border-0 shadow-sm" 
            key={pro.id || index}
            onClick={() => handleProductDetailsRedirect(pro)} // FIXED: Clicking anywhere on the card opens product details
            style={{ cursor: "pointer", transition: "transform 0.2s ease" }}
          >
            <img src={pro.image} className="card-img-top" alt={pro.name} />
            
            {/* Context Connected Heart Toggle Button */}
            <WishlistHeart product={pro} />
            
            <div className="card-body">
              <div className="d-flex justify-content-between pt-2">
                <h6 className="card-title text-truncate" style={{ maxWidth: "70%" }}>
                  {pro.name}
                </h6>
                <span className="rating-stars d-flex align-items-center" style={{ color: "black" }}>
                  <FaStar className="me-1" style={{ color: "#fff240" }} />
                  {pro.rating}
                </span>
              </div>

              <div className="price-details d-flex align-items-center gap-4 pt-1">
                <p className="mb-1" style={{ color: "#1A1A1A", fontWeight: "600" }}>
                  ₹{pro.price}{" "}
                  {Number(pro.discount || 0) > 0 && (
                    <span>
                      <del style={{ fontWeight: "500" }}>₹{pro.realPrice}</del>
                    </span>
                  )}
                </p>
                {Number(pro.discount || 0) > 0 && (
                  <span className="mb-1 text-success small">
                    <b>{pro.offer || `${pro.discount}%`} off</b>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeProduct;