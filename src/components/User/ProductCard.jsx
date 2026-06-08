// ProductCard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { useWishlist } from "../../context/WishlistContext"; 

import { MdOutlineShoppingCart } from "react-icons/md";
import { FaStar, FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import "../../assets/styles/productCard.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const WishlistHeart = ({ product }) => {
  const { wishlist, toggleWishlist } = useWishlist();

  const isWishlist = wishlist.some(
    (item) => item.name === product.name && Number(item.price) === Number(product.price)
  );

  return (
    <div className="wishlist">
      <button
        className="wishlist-toggle shadow-sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); // Prevents card navigation trigger
          toggleWishlist(product);
        }}
        type="button"
      >
        {isWishlist ? (
          <FaHeart className="text-danger" />
        ) : (
          <FiHeart className="text-danger" />
        )}
      </button>
    </div>
  );
};

const ProductCard = ({ products = [] }) => {  
  const navigate = useNavigate(); 
  const { cart, addToCart } = useWishlist();
  const productCard = products;  

  const checkIsInCart = (product) => {
    return cart ? cart.find((item) => item.name === product.name && Number(item.price) === Number(product.price)) : null;
  };

  // Navigates cleanly to /product details layout and passes down selected object payload
  const handleProductDetailsRedirect = (pro) => {
    navigate("/product", {
      state: { product: pro }
    });
  };

  return (
    <>
      <section style={{ width: "100%" }}>
        <div className="ProductCard-section my-3">
          <div className="container d-flex gap-3 flex-wrap justify-content-start"> 
            {productCard.map((pro, index) => {
              const matchedCartItem = checkIsInCart(pro);
              const isInCart = !!matchedCartItem;

              return (
                <div
                  className="card border-0 shadow-sm position-relative"
                  key={pro.id || index}
                  style={{ width: "15rem", flex: "0 0 auto", cursor: "pointer" }}
                  onClick={() => handleProductDetailsRedirect(pro)} // Clicking the card takes the user to Product Details page
                >
                  <div className="position-relative" style={{ overflow: "hidden" }}>
                    <img src={pro.image} className="card-img-top" alt={pro.name} style={{ opacity: parseInt(pro.stocks) <= 0 ? 0.6 : 1 }} />
                    {parseInt(pro.stocks) <= 0 && (
                      <span className="badge bg-danger position-absolute" style={{ top: 12, left: 12, zIndex: 5, padding: "5px 10px", fontSize: "11px", fontWeight: "bold", borderRadius: "4px" }}>
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <WishlistHeart product={pro} />
                  
                  <div className="card-body">
                    <div className="d-flex justify-content-between pt-2">
                      <h6 className="card-title text-truncate" style={{ maxWidth: "70%" }}>
                        {pro.name}
                      </h6>
                      <span className="rating-stars d-flex align-items-center" style={{ color: "black" }}>
                        <FaStar className="me-1" style={{ color: "#fff240" }} />
                        {pro.rating || "0.0"}
                      </span>
                    </div>

                    <div className="price-details d-flex align-items-center gap-4 pt-1">
                      <p className="mb-1" style={{ color: "#1A1A1A", fontWeight: "600" }}>
                        ₹{pro.price}{" "}
                        {Number(pro.discount || 0) > 0 && (
                          <span>
                            <del style={{ color: "#7d7d7dff", fontWeight: "500" }}>
                              ₹{pro.realPrice}
                            </del>
                          </span>
                        )}
                      </p>
                      {Number(pro.discount || 0) > 0 && (
                        <span className="mb-1 text-success small">
                          <b>{pro.offer || `${pro.discount}%`} off</b>
                        </span>
                      )}
                    </div>

                    {/* Buttons removed */}
                    {/* <div className="d-flex gap-3 pt-2">
                      <button 
                        className="btn buy-now-btn flex-grow-1" 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); // Stops event bubbling up to the card element
                          handleProductDetailsRedirect(pro); // Buy Now also opens product details
                        }}
                        style={{ background: "#8B5CF6", color: "#fff", fontSize: "14px", fontWeight: "500" }}
                      >
                        Buy Now
                      </button>
                      
                      <button 
                        className="icon-btn-cart" 
                        onClick={(e) => {
                          e.stopPropagation(); // Crucial: prevents parent card's onClick from firing!
                          if (isInCart) {
                            navigate("/cart"); 
                          } else {
                            addToCart(pro); 
                          }
                        }}
                        style={{ 
                          border: "1.5px solid #8B5CF6", 
                          color: isInCart ? "#fff" : "#8B5CF6", 
                          background: isInCart ? "#8B5CF6" : "transparent", 
                          borderRadius: "6px", 
                          padding: "4px 12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                        type="button"
                      >
                        <MdOutlineShoppingCart style={{ fontSize: "1.1rem" }} />
                      </button>
                    </div> */}


                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductCard;
