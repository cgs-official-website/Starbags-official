import React from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import { useProducts } from "../../context/ProductsContext";
import "../../assets/styles/productCard.css";

const RecentProduct = () => {
  const navigate = useNavigate();
  const { products, loading } = useProducts();

  // Show the 6 most recently added products (Firestore is already ordered by createdAt desc)
  const recentProducts = products.slice(0, 6);

  const handleRecentProductClick = (productItem) => {
    navigate("/product", {
      state: { product: productItem }
    });
  };

  return (
    <section className="recent-products-section my-5 w-100">
      <div className="container text-center mb-4">
        <h2 className="fw-bold text-uppercase" style={{ letterSpacing: "1px", color: "#fff" }}>
          YOU MAY ALSO LIKE PRODUCTS
        </h2>
        <p className="text-muted mx-auto" style={{ maxWidth: "600px", fontSize: "0.95rem" }}>
          Premium Leather Furniture Crafted For Comfort, Durability, And Timeless Style
          Designed To Elevate Every Space.
        </p>
      </div>

      <div className="recent-products-scroll-container">
        {loading ? (
          <div className="container">
            <p className="text-muted py-3">Loading products...</p>
          </div>
        ) : (
          <ProductCard
            products={recentProducts}
            onBuyNowClick={handleRecentProductClick}
          />
        )}
      </div>
    </section>
  );
};

export default RecentProduct;