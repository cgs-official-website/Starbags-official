import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext"; 
import Navbar from "../../components/User/Navbar";
import Footer from "../../components/User/Footer";
import CartItem from "../../components/User/YourCart";
import OrderSummary from "../../components/User/OrderSummary";
import RecentProduct from "../../components/User/RecentProduct"; 
import "../../assets/styles/Cart.css";

// ─── Dark-aware hook ──────────────────────────────────────────────────────────
function useDarkMode() {
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

  return isDark;
}

// ─── Empty Cart Component ─────────────────────────────────────────────────────
const EmptyCartView = () => {
  const navigate = useNavigate();
  const isDark = useDarkMode();

  const getEmptyImage = () => {
    if (isDark) {
      return new URL("../../assets/images/empty-dark.png", import.meta.url).href;
    }
    return new URL("../../assets/images/empty.png", import.meta.url).href;
  };

  return (
    <div className="wl-empty-container my-4">
      <div className="wl-empty-image-wrapper">
        <img
          src={getEmptyImage()}
          alt="Empty Cart Vector"
          className="wl-empty-vector"
        />
      </div>
      <h3 className="wl-empty-heading">Your cart is empty!</h3>
      <button
        onClick={() => navigate("/AllProducts")}
        className="btn wl-empty-shop-btn"
        style={{ cursor: "pointer", border: "none" }}
      >
        Shop now
      </button>
    </div>
  );
};

// ─── Main Cart Page ───────────────────────────────────────────────────────────
const CartPage = () => {
  const navigate = useNavigate();
  const { cart, setCart, toggleWishlist, removeFromCart, updateCartQty, toggleCartSelect } = useWishlist();
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const syncCartFromStorage = () => {
      try {
        const rawUserCart = localStorage.getItem("user_cart");
        const rawCart = localStorage.getItem("cart");
        const rawCartItems = localStorage.getItem("cartItems");
        const activeRawData = rawUserCart || rawCart || rawCartItems;
        if (activeRawData && (!cart || cart.length === 0)) {
          const parsedData = JSON.parse(activeRawData);
          if (setCart && Array.isArray(parsedData)) {
            setCart(parsedData);
          }
        }
      } catch (error) {
        console.error("Error syncing cart from localStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };
    syncCartFromStorage();
    window.scrollTo(0, 0);
  }, []);

  const selectedItems = useMemo(() =>
    cart ? cart.filter((item) => item.selected) : [],
    [cart]
  );

  const totalItemsCount = useMemo(() =>
    selectedItems.reduce((acc, item) => acc + (item.qty || 1), 0),
    [selectedItems]
  );

  const rawTotal = useMemo(() =>
    selectedItems.reduce((acc, item) => {
      const originalPrice = Number(item.realPrice) || Number(item.price) || 0;
      return acc + (originalPrice * (item.qty || 1));
    }, 0),
    [selectedItems]
  );

  const subTotal = useMemo(() =>
    selectedItems.reduce((acc, item) => {
      return acc + (Number(item.price) * (item.qty || 1));
    }, 0),
    [selectedItems]
  );

  const discountTotal = rawTotal > subTotal ? (rawTotal - subTotal) : 0;
  const gstTotal = Math.round(subTotal * 0.18);
  const finalTotal = subTotal + gstTotal;

  const handleCheckout = useCallback(() => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to proceed.");
      return;
    }
    navigate("/checkout", {
      state: {
        allCartItems: cart,
        cartItems: selectedItems,
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
  }, [selectedItems, cart, totalItemsCount, rawTotal, discountTotal, subTotal, gstTotal, finalTotal, navigate]);

  const handleRemoveWithAnimation = useCallback(async (id) => {
    if (isRemoving) return;
    setIsRemoving(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    removeFromCart(id);
    setTimeout(() => setIsRemoving(false), 300);
  }, [removeFromCart, isRemoving]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="cart-page">
          <div className="cart-loading-spinner">
            <div className="spinner"></div>
            <p>Loading your cart...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="cart-page">
        <h4 className="cart-title">
          Your cart <span className="cart-count">({cart?.length || 0} items)</span>
        </h4>
        <p className="cart-subtitle">Review your items and proceed to checkout</p>

        {!cart || cart.length === 0 ? (
          <>
            <EmptyCartView />
            <RecentProduct />
          </>
        ) : (
          <div className="cart-layout-grid">
            <div className="cart-left">
              <div className="cart-items">
                {cart.map((item, index) => (
                  <CartItem
                    key={item.id || `${item.name}-${index}`}
                    item={item}
                    onIncrease={(id) => updateCartQty(id, 1)}
                    onDecrease={(id) => updateCartQty(id, -1)}
                    onRemove={(id) => handleRemoveWithAnimation(id)}
                    onToggleWishlist={(product) => toggleWishlist(product)}
                    onSelect={(id) => toggleCartSelect(id)}
                  />
                ))}
              </div>
            </div>
            <div className="cart-right">
              <OrderSummary
                totalItemsCount={totalItemsCount}
                rawTotal={rawTotal}
                discountTotal={discountTotal}
                subTotal={subTotal}
                couponDiscount={0}
                gstTotal={gstTotal}
                finalTotal={finalTotal}
                handleCheckout={handleCheckout}
                isBillingPage={false}
              />
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CartPage;



// import React, { useEffect, useState, useCallback, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import { useWishlist } from "../../context/WishlistContext"; 
// import Navbar from "../../components/User/Navbar";
// import Footer from "../../components/User/Footer";
// import CartItem from "../../components/User/YourCart";
// import OrderSummary from "../../components/User/OrderSummary";
// import RecentProduct from "../../components/User/RecentProduct"; 
// import "../../assets/styles/Cart.css";

// const EmptyCartView = () => {
//   const navigate = useNavigate();
//   return (
//     <div className="wl-empty-container my-4">
//       <div className="wl-empty-image-wrapper">
//         <img 
//           src={new URL("../../assets/images/empty.png", import.meta.url).href} 
//           alt="Empty Cart Vector" 
//           className="wl-empty-vector" 
//         />
//       </div>
//       <h3 className="wl-empty-heading">Your cart is empty!</h3>
//       <button 
//         onClick={() => navigate("/AllProducts")} 
//         className="btn wl-empty-shop-btn" 
//         style={{ cursor: "pointer", border: "none" }}
//       >
//         Shop now
//       </button>
//     </div>
//   );
// };

// const CartPage = () => {
//   const navigate = useNavigate();
//   const { cart, setCart, toggleWishlist, removeFromCart, updateCartQty, toggleCartSelect } = useWishlist();
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRemoving, setIsRemoving] = useState(false);

//   // ─── FIXED: STAGE 1: LOCALSTORAGE VERIFICATION ENGINE (RUNS ONLY ONCE) ───
//   useEffect(() => {
//     const syncCartFromStorage = () => {
//       try {
//         const rawUserCart = localStorage.getItem("user_cart");
//         const rawCart = localStorage.getItem("cart");
//         const rawCartItems = localStorage.getItem("cartItems");
        
//         // Selects the first active and valid cache scheme present in browser environment
//         const activeRawData = rawUserCart || rawCart || rawCartItems;
        
//         if (activeRawData && (!cart || cart.length === 0)) {
//           const parsedData = JSON.parse(activeRawData);
//           // Synchronize context mesh instantly if memory variations occur
//           if (setCart && Array.isArray(parsedData)) {
//             setCart(parsedData);
//           }
//         }
//       } catch (error) {
//         console.error("Error syncing cart from localStorage:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };
    
//     syncCartFromStorage();
//     window.scrollTo(0, 0);
//     // Empty dependency array - runs only once on mount to prevent re-render loops
//   }, []); // FIXED: Removed cart and setCart dependencies

//   // Core calculations engine matching your transaction ledger guidelines
//   const selectedItems = useMemo(() => 
//     cart ? cart.filter((item) => item.selected) : [], 
//     [cart]
//   );
  
//   const totalItemsCount = useMemo(() => 
//     selectedItems.reduce((acc, item) => acc + (item.qty || 1), 0), 
//     [selectedItems]
//   );

//   // Raw Total calculation using top-grain baseline parameters (Strict INR Currency ₹)
//   const rawTotal = useMemo(() => 
//     selectedItems.reduce((acc, item) => {
//       const originalPrice = Number(item.realPrice) || Number(item.price) || 0;
//       return acc + (originalPrice * (item.qty || 1));
//     }, 0), 
//     [selectedItems]
//   );
  
//   // Checkout Subtotal after target wholesale item discount matrices
//   const subTotal = useMemo(() => 
//     selectedItems.reduce((acc, item) => {
//       return acc + (Number(item.price) * (item.qty || 1));
//     }, 0), 
//     [selectedItems]
//   );

//   const discountTotal = rawTotal > subTotal ? (rawTotal - subTotal) : 0;
//   const gstTotal = Math.round(subTotal * 0.18);
//   const finalTotal = subTotal + gstTotal;

//   const handleCheckout = useCallback(() => {
//     if (selectedItems.length === 0) {
//       alert("Please select at least one item to proceed.");
//       return;
//     }
//     navigate("/checkout", {
//       state: {
//         allCartItems: cart,
//         cartItems: selectedItems,
//         totalItemsCount,
//         rawTotal,
//         discountTotal,
//         subTotal,
//         gstTotal,
//         finalTotal,
//         couponDiscount: 0,
//         couponPercentageLabel: ""
//       },
//     });
//   }, [selectedItems, cart, totalItemsCount, rawTotal, discountTotal, subTotal, gstTotal, finalTotal, navigate]);

//   // FIXED: Wrapper function to handle remove with smooth animation
//   const handleRemoveWithAnimation = useCallback(async (id) => {
//     if (isRemoving) return;
    
//     setIsRemoving(true);
//     // Small delay to ensure smooth animation
//     await new Promise(resolve => setTimeout(resolve, 50));
//     removeFromCart(id);
    
//     // Reset removing state after a short delay
//     setTimeout(() => {
//       setIsRemoving(false);
//     }, 300);
//   }, [removeFromCart, isRemoving]);

//   if (isLoading) {
//     return (
//       <>
//         <Navbar />
//         <div className="cart-page">
//           <div className="cart-loading-spinner">
//             <div className="spinner"></div>
//             <p>Loading your cart...</p>
//           </div>
//         </div>
//         <Footer />
//       </>
//     );
//   }

//   return (
//     <>
//       <Navbar />
//       <div className="cart-page">
//         <h4 className="cart-title">
//           Your cart <span className="cart-count">({cart?.length || 0} items)</span>
//         </h4>
//         <p className="cart-subtitle">Review your items and proceed to checkout</p>

//         {/* ─── CONDITIONAL LAYOUT SPLIT MATRIX ─── */}
//         {!cart || cart.length === 0 ? (
//           <>
//             {/* Display clean empty graphics if ledger holds zero entries */}
//             <EmptyCartView />
            
//             {/* Recommendation products strip grid panel banner link layout */}
//             <RecentProduct />
//           </>
//         ) : (
//           <div className="cart-layout-grid">
//             {/* Left Block: Render list elements with dynamic custom triggers */}
//             <div className="cart-left">
//               <div className="cart-items">
//                 {cart.map((item, index) => (
//                   <CartItem 
//                     key={item.id || `${item.name}-${index}`} 
//                     item={item} 
//                     onIncrease={(id) => updateCartQty(id, 1)} 
//                     onDecrease={(id) => updateCartQty(id, -1)} 
//                     onRemove={(id) => handleRemoveWithAnimation(id)} 
//                     onToggleWishlist={(product) => toggleWishlist(product)} 
//                     onSelect={(id) => toggleCartSelect(id)} 
//                   />
//                 ))}
//               </div>
//             </div>
            
//             {/* Right Block: Order Total Calculation Summary column layout box panel */}
//             <div className="cart-right">
//               <OrderSummary 
//                 totalItemsCount={totalItemsCount} 
//                 rawTotal={rawTotal} 
//                 discountTotal={discountTotal} 
//                 subTotal={subTotal} 
//                 couponDiscount={0} 
//                 gstTotal={gstTotal} 
//                 finalTotal={finalTotal} 
//                 handleCheckout={handleCheckout} 
//                 isBillingPage={false} 
//               />
//             </div>
//           </div>
//         )}
//       </div>
//       <Footer />
//     </>
//   );
// };

// export default CartPage;

// // import React, { useEffect } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { useWishlist } from "../../context/WishlistContext"; 
// // import Navbar from "../../components/User/Navbar";
// // import Footer from "../../components/User/Footer";
// // import CartItem from "../../components/User/YourCart";
// // import OrderSummary from "../../components/User/OrderSummary";
// // import RecentProduct from "../../components/User/RecentProduct"; 
// // import "../../assets/styles/Cart.css";

// // const EmptyCartView = () => {
// //   const navigate = useNavigate();
// //   return (
// //     <div className="wl-empty-container my-4">
// //       <div className="wl-empty-image-wrapper">
// //         <img 
// //           src={new URL("../../assets/images/empty.png", import.meta.url).href} 
// //           alt="Empty Cart Vector" 
// //           className="wl-empty-vector" 
// //         />
// //       </div>
// //       <h3 className="wl-empty-heading">Your cart is empty!</h3>
// //       <button 
// //         onClick={() => navigate("/AllProducts")} 
// //         className="btn wl-empty-shop-btn" 
// //         style={{ cursor: "pointer", border: "none" }}
// //       >
// //         Shop now
// //       </button>
// //     </div>
// //   );
// // };

// // const CartPage = () => {
// //   const navigate = useNavigate();
// //   const { cart, setCart, toggleWishlist, removeFromCart, updateCartQty, toggleCartSelect } = useWishlist();

// //   // ─── STAGE 1: LOCALSTORAGE VERIFICATION ENGINE ───
// //   useEffect(() => {
// //     const rawUserCart = localStorage.getItem("user_cart");
// //     const rawCart = localStorage.getItem("cart");
// //     const rawCartItems = localStorage.getItem("cartItems");
    
// //     // Selects the first active and valid cache scheme present in browser environment
// //     const activeRawData = rawUserCart || rawCart || rawCartItems;
    
// //     if (activeRawData) {
// //       const parsedData = JSON.parse(activeRawData);
// //       // Synchronize context mesh instantly if memory variations occur
// //       if (parsedData.length !== (cart?.length || 0) && setCart) {
// //         setCart(parsedData);
// //       }
// //     } else if (cart && cart.length > 0 && setCart) {
// //       setCart([]);
// //     }
// //     window.scrollTo(0, 0);
// //   }, [cart, setCart]);

// //   // Core calculations engine matching your transaction ledger guidelines
// //   const selectedItems = cart ? cart.filter((item) => item.selected) : [];
// //   const totalItemsCount = selectedItems.reduce((acc, item) => acc + (item.qty || 1), 0);

// //   // Raw Total calculation using top-grain baseline parameters (Strict INR Currency ₹)
// //   const rawTotal = selectedItems.reduce((acc, item) => {
// //     const originalPrice = Number(item.realPrice) || Number(item.price) || 0;
// //     return acc + (originalPrice * (item.qty || 1));
// //   }, 0);
  
// //   // Checkout Subtotal after target wholesale item discount matrices
// //   const subTotal = selectedItems.reduce((acc, item) => {
// //     return acc + (Number(item.price) * (item.qty || 1));
// //   }, 0);

// //   const discountTotal = rawTotal > subTotal ? (rawTotal - subTotal) : 0;
// //   const gstTotal = Math.round(subTotal * 0.18);
// //   const finalTotal = subTotal + gstTotal;

// //   const handleCheckout = () => {
// //     if (selectedItems.length === 0) {
// //       alert("Please select at least one item to proceed.");
// //       return;
// //     }
// //     navigate("/checkout", {
// //       state: {
// //         allCartItems: cart,
// //         cartItems: selectedItems,
// //         totalItemsCount,
// //         rawTotal,
// //         discountTotal,
// //         subTotal,
// //         gstTotal,
// //         finalTotal,
// //         couponDiscount: 0,
// //         couponPercentageLabel: ""
// //       },
// //     });
// //   };

// //   return (
// //     <>
// //       <Navbar />
// //       <div className="cart-page">
// //         <h4 className="cart-title">
// //           Your cart <span className="cart-count">({cart?.length || 0} items)</span>
// //         </h4>
// //         <p className="cart-subtitle">Review your items and proceed to checkout</p>

// //         {/* ─── CONDITIONAL LAYOUT SPLIT MATRIX ─── */}
// //         {!cart || cart.length === 0 ? (
// //           <>
// //             {/* Display clean empty graphics if ledger holds zero entries */}
// //             <EmptyCartView />
            
// //             {/* Recommendation products strip grid panel banner link layout */}
// //             <RecentProduct />
// //           </>
// //         ) : (
// //           <div className="cart-layout-grid">
// //             {/* Left Block: Render list elements with dynamic custom triggers */}
// //             <div className="cart-left">
// //               <div className="cart-items">
// //                 {cart.map((item, index) => (
// //                   <CartItem 
// //                     key={item.id || `${item.name}-${index}`} 
// //                     item={item} 
// //                     onIncrease={(id) => updateCartQty(id, 1)} 
// //                     onDecrease={(id) => updateCartQty(id, -1)} 
// //                     onRemove={(id) => removeFromCart(id)} 
// //                     onToggleWishlist={(product) => toggleWishlist(product)} 
// //                     onSelect={(id) => toggleCartSelect(id)} 
// //                   />
// //                 ))}
// //               </div>
// //             </div>
            
// //             {/* Right Block: Order Total Calculation Summary column layout box panel */}
// //             <div className="cart-right">
// //               <OrderSummary 
// //                 totalItemsCount={totalItemsCount} 
// //                 rawTotal={rawTotal} 
// //                 discountTotal={discountTotal} 
// //                 subTotal={subTotal} 
// //                 couponDiscount={0} 
// //                 gstTotal={gstTotal} 
// //                 finalTotal={finalTotal} 
// //                 handleCheckout={handleCheckout} 
// //                 isBillingPage={false} 
// //               />
// //             </div>
// //           </div>
// //         )}
// //       </div>
// //       <Footer />
// //     </>
// //   );
// // };

// // export default CartPage;