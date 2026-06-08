import { useNavigate } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useProducts } from "../../context/ProductsContext";
import "../../assets/styles/WishList.css";
import Navbar from "../../components/User/Navbar";
import Footer from "../../components/User/Footer";
import ProfileSideNav from "../../components/User/Profile-Side-Nav";
import { FaHeart, FaStar } from "react-icons/fa";
import { WishlistSkeleton } from "../../components/User/UserSkeleton";
import { useEffect, useState } from "react";

// ─── Single Wishlist Card ─────────────────────────────────────────────────────
function WishlistCard({ item, onRemove, onNavigate }) {
  return (
    <div
      className="wl-card"
      onClick={() => onNavigate(item)}
      style={{ cursor: "pointer" }}
    >
      <button
        className="wl-heart-btn"
        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
        aria-label="Remove from wishlist"
      >
        <FaHeart className="wl-heart-icon" />
      </button>

      <div className="wl-img-wrap">
        <img src={item.image} alt={item.name} className="wl-img" />
      </div>

      <div className="wl-card-body">
        <div className="wl-title-row">
          <h6 className="wl-name">{item.name}</h6>
          <span className="wl-rating">
            <FaStar className="wl-star" />
            {item.rating}
            <span className="wl-rating-count">({item.ratingCount || 0})</span>
          </span>
        </div>

        <div className="wl-price-row">
          <span className="wl-price">₹{item.price}</span>
          <del className="wl-real-price">₹{item.realPrice}</del>
          <span className="wl-offer">{item.offer} off</span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty Wishlist State ─────────────────────────────────────────────────────
function EmptyWishlist() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(
    () =>
      document.body.classList.contains("dark-theme") ||
      document.documentElement.getAttribute("data-theme") === "dark"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(
        document.body.classList.contains("dark-theme") ||
        document.documentElement.getAttribute("data-theme") === "dark"
      );
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, []);

  const getEmptyStateImage = () => {
    if (isDark) {
      return new URL("../../assets/images/empty-dark.png", import.meta.url).href;
    }
    return new URL("../../assets/images/empty.png", import.meta.url).href;
  };

  return (
    <div className="wl-empty-container">
      <div className="wl-empty-image-wrapper">
        <img
          src={getEmptyStateImage()}
          alt="Empty Bag Vector"
          className="wl-empty-vector"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <h3 className="wl-empty-heading">Your wishlist is empty!</h3>
      <span
        onClick={() => navigate("/AllProducts")}
        className="btn wl-empty-shop-btn"
        style={{ cursor: "pointer" }}
      >
        Shop now
      </span>
    </div>
  );
}

// ─── Main WishList Page ───────────────────────────────────────────────────────
function WishList() {
  const navigate = useNavigate();
  const { wishlist, wishlistLoading, removeFromWishlist } = useWishlist();
  const { products } = useProducts();

  const liveWishlist = wishlist.map((item) => {
    const liveProduct = products.find(
      (p) => p.id === item.id || p.productId === item.productId || p.name === item.name
    );
    if (liveProduct) {
      return {
        ...liveProduct,
        ...item,
        rating: liveProduct.rating,
        ratingCount: liveProduct.reviewCount || 0,
      };
    }
    return item;
  });

  const handleNavigateToProduct = (item) => {
    navigate("/product", { state: { product: item } });
  };

  return (
    <>
      <Navbar />

      <div className="container py-3 my-2">
        <h4 className="mb-3 fw-bold">Wishlist</h4>

        <div className="row justify-content-center align-items-start">

          <div className="col-lg-3 mb-3 d-none d-lg-block sidebar-sticky">
            <ProfileSideNav />
          </div>

          <div className="col-lg-9 col-12">
            <div className="profile-details-card">
              <div className="wishlist-header">
                <h4 className="fw-bold mb-1">My Wishlist</h4>
                <p className="wishlist-subtitle">Your favorite products saved here</p>
              </div>

              <div className="wishlist-list-wrapper">
                {wishlistLoading ? (
                  <WishlistSkeleton />
                ) : liveWishlist.length > 0 ? (
                  <div className="wl-grid">
                    {liveWishlist.map((item) => (
                      <WishlistCard
                        key={item.id}
                        item={item}
                        onRemove={removeFromWishlist}
                        onNavigate={handleNavigateToProduct}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyWishlist />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default WishList;

// import { useNavigate } from "react-router-dom";
// import { useWishlist } from "../../context/WishlistContext";
// import { useProducts } from "../../context/ProductsContext";
// import "../../assets/styles/WishList.css";
// import Navbar from "../../components/User/Navbar";
// import Footer from "../../components/User/Footer";
// import ProfileSideNav from "../../components/User/Profile-Side-Nav";
// import { FaHeart, FaStar } from "react-icons/fa";
// import { WishlistSkeleton } from "../../components/User/UserSkeleton";

// // ─── Single Wishlist Card ─────────────────────────────────────────────────────
// function WishlistCard({ item, onRemove, onNavigate }) {
//   return (
//     <div
//       className="wl-card"
//       onClick={() => onNavigate(item)}
//       style={{ cursor: "pointer" }}
//     >
//       {/* Heart remove button — stopPropagation so it doesn't trigger card navigation */}
//       <button
//         className="wl-heart-btn"
//         onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
//         aria-label="Remove from wishlist"
//       >
//         <FaHeart className="wl-heart-icon" />
//       </button>

//       <div className="wl-img-wrap">
//         <img src={item.image} alt={item.name} className="wl-img" />
//       </div>

//       <div className="wl-card-body">
//         <div className="wl-title-row">
//           <h6 className="wl-name">{item.name}</h6>
//           <span className="wl-rating">
//             <FaStar className="wl-star" />
//             {item.rating}
//             <span className="wl-rating-count">({item.ratingCount || 0})</span>
//           </span>
//         </div>

//         <div className="wl-price-row">
//           <span className="wl-price">₹{item.price}</span>
//           <del className="wl-real-price">₹{item.realPrice}</del>
//           <span className="wl-offer">{item.offer} off</span>
//         </div>

//         {/* FIXED: Buy Now and Cart action button block layer completely removed from here */}
//       </div>
//     </div>
//   );
// }

// // ─── Empty Wishlist State ─────────────────────────────────────────────────────
// function EmptyWishlist() {
//   const navigate = useNavigate();

//   const getEmptyStateImage = () =>
//     new URL("../../assets/images/empty.png", import.meta.url).href;

//   return (
//     <div className="wl-empty-container">
//       <div className="wl-empty-image-wrapper">
//         <img
//           src={getEmptyStateImage()}
//           alt="Empty Bag Vector"
//           className="wl-empty-vector"
//           style={{ width: "100%", height: "100%" }}
//         />
//       </div>
//       <h3 className="wl-empty-heading">Your wishlist is empty!</h3>
//       <span
//         onClick={() => navigate("/AllProducts")}
//         className="btn wl-empty-shop-btn"
//         style={{ cursor: "pointer" }}
//       >
//         Shop now
//       </span>
//     </div>
//   );
// }

// // ─── Main WishList Page ───────────────────────────────────────────────────────
// function WishList() {
//   const navigate = useNavigate();
//   const { wishlist, wishlistLoading, removeFromWishlist } = useWishlist();
//   const { products } = useProducts();

//   // Merge live product data for accurate rating + pass full product to ProductDetails
//   const liveWishlist = wishlist.map((item) => {
//     const liveProduct = products.find(
//       (p) => p.id === item.id || p.productId === item.productId || p.name === item.name
//     );
//     if (liveProduct) {
//       return {
//         ...liveProduct,  // full product fields for ProductDetails
//         ...item,         // wishlist overrides (id, image, offer, etc.)
//         rating: liveProduct.rating,
//         ratingCount: liveProduct.reviewCount || 0,
//       };
//     }
//     return item;
//   });

//   const handleNavigateToProduct = (item) => {
//     navigate("/product", { state: { product: item } });
//   };

//   return (
//     <>
//       <Navbar />

//       <div className="container py-3 my-2">
//         <h4 className="mb-3 fw-bold">Settings and Profile</h4>

//         <div className="row justify-content-center align-items-start">
//           {/* Sidebar — hidden on tablet & mobile, sticky on desktop */}
//           <div className="col-lg-4 mb-3 d-none d-lg-block sidebar-sticky">
//             <ProfileSideNav />
//           </div>

//           {/* Main content — full width on mobile/tablet, 8-col on desktop */}
//           <div className="col-lg-8 col-12">
//             <div className="profile-details-card">
//               <div className="wishlist-header">
//                 <h4 className="fw-bold mb-1">My Wishlist</h4>
//                 <p className="wishlist-subtitle">Your favorite products saved here</p>
//               </div>

//               {/* Wishlist Items */}
//               <div className="wishlist-list-wrapper">
//                 {wishlistLoading ? (
//                   <WishlistSkeleton />
//                 ) : liveWishlist.length > 0 ? (
//                   <div className="wl-grid">
//                     {liveWishlist.map((item) => (
//                       <WishlistCard
//                         key={item.id}
//                         item={item}
//                         onRemove={removeFromWishlist}
//                         onNavigate={handleNavigateToProduct}
//                       />
//                     ))}
//                   </div>
//                 ) : (
//                   <EmptyWishlist />
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <Footer />
//     </>
//   );
// }

// export default WishList;

// // import { useNavigate } from "react-router-dom"; // ← ADDED for robust routing
// // import { useWishlist } from "../../context/WishlistContext";
// // import { useProducts } from "../../context/ProductsContext";
// // import "../../assets/styles/WishList.css";
// // import Navbar from "../../components/User/Navbar";
// // import Footer from "../../components/User/Footer";
// // import ProfileSideNav from "../../components/User/Profile-Side-Nav";
// // import { FaHeart, FaStar } from "react-icons/fa";
// // import { MdOutlineShoppingCart } from "react-icons/md";

// // // ─── Single Wishlist Card ─────────────────────────────────────────────────────
// // function WishlistCard({ item, onRemove, onAddToCart }) {
// //   return (
// //     <div className="wl-card">
// //       <button
// //         className="wl-heart-btn"
// //         onClick={() => onRemove(item.id)}
// //         aria-label="Remove from wishlist"
// //       >
// //         <FaHeart className="wl-heart-icon" />
// //       </button>

// //       <div className="wl-img-wrap">
// //         <img src={item.image} alt={item.name} className="wl-img" />
// //       </div>

// //       <div className="wl-card-body">
// //         <div className="wl-title-row">
// //           <h6 className="wl-name">{item.name}</h6>
// //           <span className="wl-rating">
// //             <FaStar className="wl-star" />
// //             {item.rating}
// //             <span className="wl-rating-count">({item.ratingCount || 0})</span>
// //           </span>
// //         </div>

// //         <div className="wl-price-row">
// //           <span className="wl-price">₹{item.price}</span>
// //           <del className="wl-real-price">₹{item.realPrice}</del>
// //           <span className="wl-offer">{item.offer} off</span>
// //         </div>

// //         <div className="wl-actions">
// //           <button className="wl-buy-btn">Buy now</button>
// //           <button 
// //             className="wl-cart-btn" 
// //             aria-label="Add to cart"
// //             onClick={() => onAddToCart(item)}
// //           >
// //             <MdOutlineShoppingCart />
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // ─── Empty Wishlist State (Fixed Image & Navigation) ──────────────────────────
// // function EmptyWishlist() {
// //   const navigate = useNavigate();

// //   // Dynamic asset resolver to handle relative folder paths safely across routes
// //   const getEmptyStateImage = () => {
// //     return new URL("../../assets/images/empty.png", import.meta.url).href;
// //   };

// //   return (
// //     <div className="wl-empty-container">
// //       <div className="wl-empty-image-wrapper">
// //         {/* FIX: Handled asset resolution cleanly via baseline meta URL compiler syntax */}
// //         <img 
// //           src={getEmptyStateImage()} 
// //           alt="Empty Bag Vector" 
// //           className="wl-empty-vector" 
// //           style={{width:"100%",height:"100%"}}
// //         />
// //       </div>
// //       <h3 className="wl-empty-heading">Your wishlist is empty!</h3>
      
// //       {/* FIX: Switched from an <a> tag anchor to a robust navigate call path trigger */}
// //       <span 
// //         onClick={() => navigate("/AllProducts")} 
// //         className="btn wl-empty-shop-btn"
// //         style={{ cursor: "pointer" }}
// //       >
// //         Shop now
// //       </span>
// //     </div>
// //   );
// // }

// // // ─── Main WishList Page ───────────────────────────────────────────────────────
// // function WishList() {
// //   const { wishlist, wishlistLoading, removeFromWishlist, addToCart } = useWishlist();
// //   const { products } = useProducts();

// //   const liveWishlist = wishlist.map((item) => {
// //     const liveProduct = products.find(
// //       (p) => p.id === item.id || p.productId === item.productId || p.name === item.name
// //     );
// //     if (liveProduct) {
// //       return {
// //         ...item,
// //         rating: liveProduct.rating,
// //         ratingCount: liveProduct.reviewCount || 0,
// //       };
// //     }
// //     return item;
// //   });

// //   return (
// //     <>
// //       <Navbar />

// //       <div className="container py-3 my-2">
// //         <h4 className="mb-3 fw-bold">Wishlist</h4>

// //         <div className="row align-items-start">
// //           {/* Sidebar Area Column */}
// //           <div className="col-lg-3 mb-3 d-none d-lg-block wl-sidebar-sticky">
// //             <ProfileSideNav />
// //           </div>

// //           {/* Main Context Dynamic Grid Column Area */}
// //           <div className="col-lg-9 col-12">
// //             {wishlistLoading ? (
// //               <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
// //                 <div className="spinner-border" style={{ color: "#8b5cf6", width: "2.5rem", height: "2.5rem" }} role="status" />
// //               </div>
// //             ) : liveWishlist.length === 0 ? (
// //               <EmptyWishlist />
// //             ) : (
// //               <div className="wl-grid">
// //                 {liveWishlist.map((item) => (
// //                   <WishlistCard
// //                     key={item.id}
// //                     item={item}
// //                     onRemove={removeFromWishlist}
// //                     onAddToCart={addToCart}
// //                   />
// //                 ))}
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>

// //       <Footer />
// //     </>
// //   );
// // }

// // export default WishList;












// // import { useNavigate } from "react-router-dom";
// // import { useWishlist } from "../../context/WishlistContext";
// // import { useProducts } from "../../context/ProductsContext";
// // import "../../assets/styles/WishList.css";
// // import Navbar from "../../components/User/Navbar";
// // import Footer from "../../components/User/Footer";
// // import ProfileSideNav from "../../components/User/Profile-Side-Nav";
// // import { FaHeart, FaStar } from "react-icons/fa";
// // import { MdOutlineShoppingCart } from "react-icons/md";

// // // ─── Single Wishlist Card ─────────────────────────────────────────────────────
// // function WishlistCard({ item, onRemove, onAddToCart }) {
// //   return (
// //     <div className="wl-card">
// //       <button
// //         className="wl-heart-btn"
// //         onClick={() => onRemove(item.id)}
// //         aria-label="Remove from wishlist"
// //       >
// //         <FaHeart className="wl-heart-icon" />
// //       </button>

// //       <div className="wl-img-wrap">
// //         <img src={item.image} alt={item.name} className="wl-img" />
// //       </div>

// //       <div className="wl-card-body">
// //         <div className="wl-title-row">
// //           <h6 className="wl-name">{item.name}</h6>
// //           <span className="wl-rating">
// //             <FaStar className="wl-star" />
// //             {item.rating}
// //             <span className="wl-rating-count">({item.ratingCount || 0})</span>
// //           </span>
// //         </div>

// //         <div className="wl-price-row">
// //           <span className="wl-price">₹{item.price}</span>
// //           <del className="wl-real-price">₹{item.realPrice}</del>
// //           <span className="wl-offer">{item.offer} off</span>
// //         </div>

// //         <div className="wl-actions">
// //           <button className="wl-buy-btn">Buy now</button>
// //           <button 
// //             className="wl-cart-btn" 
// //             aria-label="Add to cart"
// //             onClick={() => onAddToCart(item)}
// //           >
// //             <MdOutlineShoppingCart />
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // ─── Empty Wishlist State (Fixed Image & Navigation) ──────────────────────────
// // function EmptyWishlist() {
// //   const navigate = useNavigate();

// //   // Dynamic asset resolver to handle relative folder paths safely across routes
// //   const getEmptyStateImage = () => {
// //     return new URL("../../assets/images/empty.png", import.meta.url).href;
// //   };

// //   return (
// //     <div className="wl-empty-container">
// //       <div className="wl-empty-image-wrapper">
// //         <img 
// //           src={getEmptyStateImage()} 
// //           alt="Empty Bag Vector" 
// //           className="wl-empty-vector" 
// //           style={{width:"100%",height:"100%"}}
// //         />
// //       </div>
// //       <h3 className="wl-empty-heading">Your wishlist is empty!</h3>
      
// //       <span 
// //         onClick={() => navigate("/AllProducts")} 
// //         className="btn wl-empty-shop-btn"
// //         style={{ cursor: "pointer" }}
// //       >
// //         Shop now
// //       </span>
// //     </div>
// //   );
// // }

// // // ─── Main WishList Page ───────────────────────────────────────────────────────
// // function WishList() {
// //   const { wishlist, wishlistLoading, removeFromWishlist, addToCart } = useWishlist();
// //   const { products } = useProducts();

// //   const liveWishlist = wishlist.map((item) => {
// //     const liveProduct = products.find(
// //       (p) => p.id === item.id || p.productId === item.productId || p.name === item.name
// //     );
// //     if (liveProduct) {
// //       return {
// //         ...item,
// //         rating: liveProduct.rating,
// //         ratingCount: liveProduct.reviewCount || 0,
// //       };
// //     }
// //     return item;
// //   });

// //   return (
// //     <>
// //       <Navbar />

// //       <div className="container py-3 my-2">
// //         <h4 className="mb-3 fw-bold">Settings and Profile</h4>

// //         <div className="row justify-content-center">
// //           {/* Sidebar Area Column */}
// //           <div className="col-lg-4 col-md-5 mb-3 d-none d-lg-block">
// //             <ProfileSideNav />
// //           </div>


// //           {/* Main Context Dynamic Grid Column Area */}
// //           <div className="col-lg-9 col-12">
// //             {wishlistLoading ? (
// //               <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
// //                 <div className="spinner-border" style={{ color: "#8b5cf6", width: "2.5rem", height: "2.5rem" }} role="status" />
// //               </div>
// //             ) : liveWishlist.length === 0 ? (
// //               <EmptyWishlist />
// //             ) : (
// //               <div className="wl-grid">
// //                 {liveWishlist.map((item) => (
// //                   <WishlistCard
// //                     key={item.id}
// //                     item={item}
// //                     onRemove={removeFromWishlist}
// //                     onAddToCart={addToCart}
// //                   />
// //                 ))}

// //               </div>

// //               {/* Wishlist Content */}
// //               {wishlist.length === 0 ? (
// //                 <EmptyWishlist />
// //               ) : (
// //                 <div className="wl-grid">
// //                   {wishlist.map((item) => (
// //                     <WishlistCard
// //                       key={item.id}
// //                       item={item}
// //                       onRemove={removeFromWishlist}
// //                       onAddToCart={addToCart}
// //                     />
// //                   ))}
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //   </
// //       <Footer />
// //     </>
// //   );
// // }

// // export default WishList;


