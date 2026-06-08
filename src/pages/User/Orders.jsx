import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Navbar from "../../components/User/Navbar";
import Footer from "../../components/User/Footer";
import ProfileSideNav from "../../components/User/Profile-Side-Nav";
import OrderCard from "../../components/User/OrderCard";
import ReviewModal from "../../components/User/ReviewModal"; 
import { FaSearch } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useProducts } from "../../context/ProductsContext";
import { OrderSkeleton } from "../../components/User/UserSkeleton";
import { db } from "../../firebase";
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import "../../assets/styles/Orders.css";

// ─── Dark-aware empty image hook ─────────────────────────────────────────────
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

// ─── Empty Orders Component ───────────────────────────────────────────────────
function EmptyOrders() {
  const navigate = useNavigate();
  const isDark = useDarkMode();

  const getEmptyImage = () => {
    if (isDark) {
      return new URL("../../assets/images/empty-dark.png", import.meta.url).href;
    }
    return new URL("../../assets/images/empty.png", import.meta.url).href;
  };

  return (
    <div className="orders-empty-container">
      <div className="orders-empty-image-wrapper">
        <img
          src={getEmptyImage()}
          alt="No Orders Vector"
          className="orders-empty-vector"
        />
      </div>
      <h3 className="orders-empty-heading">No orders yet!</h3>
      <p className="orders-empty-subheading">
        Your purchased products will appear here once you place an order.
      </p>
      <span
        onClick={() => navigate("/AllProducts")}
        className="btn orders-empty-shop-btn"
        style={{ cursor: "pointer" }}
      >
        Shop now
      </span>
    </div>
  );
}

// ─── Main Orders Page ─────────────────────────────────────────────────────────
function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const { products } = useProducts();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalRating, setModalRating] = useState(5);
  const [activeOrderForReview, setActiveOrderForReview] = useState(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());

  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!currentUser) {
        setOrders([]);
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id });
        });

        const incoming = location.state?.newOrderPayloads || [];
        const normalizedIncoming = incoming.map((o) => ({
          ...o,
          discountedPrice: Number(o.discountedPrice) || 0,
          originalPrice: Number(o.originalPrice) || 0,
        }));

        const merged = [...list];
        normalizedIncoming.forEach((item) => {
          if (!merged.some((o) => o.id === item.id)) {
            merged.push(item);
          }
        });

        merged.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));

        setOrders(merged);
        localStorage.setItem("user_orders", JSON.stringify(merged));
      } catch (err) {
        console.error("Error fetching user orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();

    if (location.state?.newOrderPayloads) {
      window.history.replaceState({}, document.title);
    }
  }, [currentUser, location.state]);

  useEffect(() => {
    if (!currentUser || products.length === 0) return;
    const fetchReviewedOrders = async () => {
      try {
        const q = query(
          collection(db, "reviews"),
          where("customerId", "==", currentUser.uid)
        );
        const snap = await getDocs(q);
        const ids = new Set(snap.docs.map(d => d.data().orderId).filter(Boolean));
        setReviewedOrderIds(ids);

        snap.docs.forEach(async (docSnap) => {
          const r = docSnap.data();
          const currentProductId = r.productId;
          if (currentProductId && (currentProductId.startsWith("SBO-") || !currentProductId)) {
            const matched = products.find((p) => p.name === r.productName);
            if (matched) {
              try {
                await updateDoc(doc(db, "reviews", docSnap.id), {
                  productId: matched.id
                });
              } catch (migrateErr) {
                console.error("Failed to auto-migrate review:", migrateErr);
              }
            }
          }
        });
      } catch (err) {
        console.error("Error checking reviewed orders:", err);
      }
    };
    fetchReviewedOrders();
  }, [currentUser, products]);

  const handleOpenReviewModal = (orderItem) => {
    setActiveOrderForReview(orderItem);
    setModalRating(5);
    setModalOpen(true);
  };

  const handleReviewSubmit = async (rating, text) => {
    if (!activeOrderForReview || !currentUser) return;
    try {
      let customerName = currentUser.email || "Anonymous User";
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          customerName = snap.data().name || snap.data().displayName || customerName;
        }
      } catch (_) {}

      const matchedProduct = products.find(
        (p) => p.name === activeOrderForReview.product || p.id === activeOrderForReview.productId || p.productId === activeOrderForReview.productId
      );
      const realProductId = matchedProduct?.id || activeOrderForReview.productId || activeOrderForReview.items?.[0]?.productId || activeOrderForReview.id;

      const reviewPayload = {
        productId: realProductId,
        productName: activeOrderForReview.product,
        image: activeOrderForReview.image || "",
        customerId: currentUser.uid,
        customerName,
        orderId: activeOrderForReview.id,
        text: text.trim(),
        rating: Number(rating),
        likes: [],
        dislikes: [],
        likeCount: 0,
        dislikeCount: 0,
        date: new Date(),
        isHidden: false,
      };

      await addDoc(collection(db, "reviews"), reviewPayload);
      setReviewedOrderIds(prev => new Set([...prev, activeOrderForReview.id]));
      setModalOpen(false);
      alert("Review submitted successfully!");
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review. Please try again.");
    }
  };

  const filteredOrders = orders.filter((o) => {
    const productMatch = o.product && o.product.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = o.id && o.id.toLowerCase().includes(searchTerm.toLowerCase());
    return productMatch || idMatch;
  });

  return (
    <>
      <Navbar />

      <div className="container py-3 my-2">
        <h4 className="mb-3 fw-bold">Settings and Profile</h4>

        <div className="row justify-content-center align-items-start">

          {/* Sidebar — sticky on desktop, hidden on tablet & mobile */}
          <div className="col-lg-3 col-md-5 mb-3 d-none d-lg-block sidebar-sticky">
            <ProfileSideNav />
          </div>

          {/* Main content — full width on mobile/tablet, 8-col on desktop */}
          <div className="col-lg-9 col-12">
            <div className="profile-details-card">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="fw-bold mb-1">My Orders</h4>
                  <p className="orders-purchase-history-text">View my last purchase history</p>
                </div>
              </div>

              <div className="orders-search-wrapper mb-3">
                <div className="orders-search">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search your orders or IDs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="orders-list-wrapper">
                {loading ? (
                  <OrderSkeleton />
                ) : filteredOrders.length > 0 ? (
                  <div className="orders-grid">
                    {filteredOrders.map((order, index) => (
                      <OrderCard
                        key={`${order.id}-${index}`}
                        order={order}
                        reviewed={reviewedOrderIds.has(order.id)}
                        onReviewClick={() => handleOpenReviewModal(order)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyOrders />
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <ReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleReviewSubmit}
        rating={modalRating}
        setRating={setModalRating}
      />

      <Footer />
    </>
  );
}

export default Orders;
// //                   <FaSearch className="search-icon" />
// //                   <input
// //                     type="text"
// //                     className="search-input"
// //                     placeholder="Search your orders or IDs"
// //                     value={searchTerm}
// //                     onChange={(e) => setSearchTerm(e.target.value)}
// //                   />
// //                 </div>
// //               </div>

// //               {/* Orders List */}
// //               <div className="orders-list-wrapper">
// //                 {loading ? (
// //                   <div className="text-center py-5">
// //                     <div className="spinner-border text-primary" role="status">
// //                       <span className="visually-hidden">Loading...</span>
// //                     </div>
// //                     <p className="mt-2 text-muted">Loading your orders...</p>
// //                   </div>
// //                 ) : filteredOrders.length > 0 ? (
// //                   <div className="orders-grid">
// //                     {filteredOrders.map((order, index) => (
// //                       <OrderCard 
// //                         key={`${order.id}-${index}`} 
// //                         order={order}
// //                         reviewed={reviewedOrderIds.has(order.id)}
// //                         onReviewClick={() => handleOpenReviewModal(order)} 
// //                       />
// //                     ))}
// //                   </div>
// //                 ) : (
// //                   <EmptyOrders />
// //                 )}
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       <ReviewModal 
// //         isOpen={modalOpen} 
// //         onClose={() => setModalOpen(false)} 
// //         onSubmit={handleReviewSubmit} 
// //         rating={modalRating} 
// //         setRating={setModalRating} 
// //       />

// //       <Footer />
// //     </>
// //   );
// // }

// // export default Orders;





// // // import React, { useState, useEffect } from "react";
// // // import { useNavigate, useLocation } from "react-router-dom";

// // // import Navbar from "../../components/User/Navbar";
// // // import Footer from "../../components/User/Footer";
// // // import ProfileSideNav from "../../components/User/Profile-Side-Nav";
// // // import OrderCard from "../../components/User/OrderCard";
// // // import ReviewModal from "../../components/User/ReviewModal"; 
// // // import { FaSearch } from "react-icons/fa";
// // // import { useAuth } from "../../context/AuthContext";
// // // import { useProducts } from "../../context/ProductsContext";
// // // import { db } from "../../firebase";
// // // import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
// // // import "../../assets/styles/Orders.css";
// // // import emptyOrders from "../../assets/images/empty.png";

// // // function Orders() {
// // //   const navigate = useNavigate();
// // //   const location = useLocation();
// // //   const [searchTerm, setSearchTerm] = useState("");
// // //   const { products } = useProducts();


// // //   const [modalOpen, setModalOpen] = useState(false);
// // //   const [modalRating, setModalRating] = useState(5);
// // //   const [activeOrderForReview, setActiveOrderForReview] = useState(null);
// // //   const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());

// // //   const { currentUser } = useAuth();
// // //   const [orders, setOrders] = useState([]);
// // //   const [loading, setLoading] = useState(true);

// // //   useEffect(() => {
// // //     const fetchUserOrders = async () => {
// // //       if (!currentUser) {
// // //         setOrders([]);
// // //         setLoading(false);
// // //         return;
// // //       }
// // //       try {
// // //         const q = query(
// // //           collection(db, "orders"),
// // //           where("userId", "==", currentUser.uid)
// // //         );
// // //         const querySnapshot = await getDocs(q);
// // //         const list = [];
// // //         querySnapshot.forEach((docSnap) => {
// // //           list.push(docSnap.data());
// // //         });

// // //         // Merge with incoming location state payload if not present yet
// // //         const incoming = location.state?.newOrderPayloads || [];
// // //         const normalizedIncoming = incoming.map((o) => ({
// // //           ...o,
// // //           discountedPrice: Number(o.discountedPrice) || 0,
// // //           originalPrice: Number(o.originalPrice) || 0,
// // //         }));

// // //         const merged = [...list];
// // //         normalizedIncoming.forEach((item) => {
// // //           if (!merged.some((o) => o.id === item.id)) {
// // //             merged.push(item);
// // //           }
// // //         });

// // //         // Sort orders by orderDate descending
// // //         merged.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));

// // //         setOrders(merged);
// // //         localStorage.setItem("user_orders", JSON.stringify(merged));
// // //       } catch (err) {
// // //         console.error("Error fetching user orders:", err);
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     };

// // //     fetchUserOrders();

// // //     // Clean up location state once handled
// // //     if (location.state?.newOrderPayloads) {
// // //       window.history.replaceState({}, document.title);
// // //     }
// // //   }, [currentUser, location.state]);

// // //   // Track which orders this user has already reviewed and auto-migrate legacy ones
// // //   useEffect(() => {
// // //     if (!currentUser || products.length === 0) return;
// // //     const fetchReviewedOrders = async () => {
// // //       try {
// // //         const q = query(
// // //           collection(db, "reviews"),
// // //           where("customerId", "==", currentUser.uid)
// // //         );
// // //         const snap = await getDocs(q);
// // //         const ids = new Set(snap.docs.map(d => d.data().orderId).filter(Boolean));
// // //         setReviewedOrderIds(ids);

// // //         // Auto-migrate legacy order-ID-based productIds to catalog IDs
// // //         snap.docs.forEach(async (docSnap) => {
// // //           const r = docSnap.data();
// // //           const currentProductId = r.productId;
// // //           if (currentProductId && (currentProductId.startsWith("SBO-") || !currentProductId)) {
// // //             const matched = products.find((p) => p.name === r.productName);
// // //             if (matched) {
// // //               try {
// // //                 await updateDoc(doc(db, "reviews", docSnap.id), {
// // //                   productId: matched.id
// // //                 });
// // //                 console.log(`Auto-migrated review ${docSnap.id} to correct productId: ${matched.id}`);
// // //               } catch (migrateErr) {
// // //                 console.error("Failed to auto-migrate review:", migrateErr);
// // //               }
// // //             }
// // //           }
// // //         });
// // //       } catch (err) {
// // //         console.error("Error checking reviewed orders:", err);
// // //       }
// // //     };
// // //     fetchReviewedOrders();
// // //   }, [currentUser, products]);

// // //   const handleOpenReviewModal = (orderItem) => {
// // //     setActiveOrderForReview(orderItem);
// // //     setModalRating(5);
// // //     setModalOpen(true);
// // //   };

// // //   const handleReviewSubmit = async (rating, text) => {
// // //     if (!activeOrderForReview || !currentUser) return;
// // //     try {
// // //       let customerName = currentUser.email || "Anonymous User";
// // //       try {
// // //         const snap = await getDoc(doc(db, "users", currentUser.uid));
// // //         if (snap.exists()) {
// // //           customerName = snap.data().name || snap.data().displayName || customerName;
// // //         }
// // //       } catch (_) {}

// // //       const matchedProduct = products.find(
// // //         (p) => p.name === activeOrderForReview.product || p.id === activeOrderForReview.productId || p.productId === activeOrderForReview.productId
// // //       );
// // //       const realProductId = matchedProduct?.id || activeOrderForReview.productId || activeOrderForReview.items?.[0]?.productId || activeOrderForReview.id;

// // //       const reviewPayload = {
// // //         productId: realProductId,
// // //         productName: activeOrderForReview.product,
// // //         image: activeOrderForReview.image || "",
// // //         customerId: currentUser.uid,
// // //         customerName,
// // //         orderId: activeOrderForReview.id,
// // //         text: text.trim(),
// // //         rating: Number(rating),
// // //         likes: [],
// // //         dislikes: [],
// // //         likeCount: 0,
// // //         dislikeCount: 0,
// // //         date: new Date(),
// // //         isHidden: false,
// // //       };

// // //       await addDoc(collection(db, "reviews"), reviewPayload);
// // //       setReviewedOrderIds(prev => new Set([...prev, activeOrderForReview.id]));
// // //     } catch (err) {
// // //       console.error("Error submitting review:", err);
// // //       alert("Failed to submit review. Please try again.");
// // //     }
// // //   };


// // //   const filteredOrders = orders.filter(
// // //     (o) =>
// // //       o.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //       o.id.toLowerCase().includes(searchTerm.toLowerCase())
// // //   );


// // //   const EmptyOrders = () => (
// // //     <div className="orders-empty-container text-center py-5">
// // //       <div className="orders-empty-image-wrapper mb-3">
// // //         <img src={emptyOrders} alt="No Orders" className="orders-empty-vector" style={{ maxWidth: "200px" }} />

// // //       </div>
// // //       <h3 className="orders-empty-heading">No orders yet!</h3>
// // //       <span onClick={() => navigate("/AllProducts")} className="btn orders-empty-shop-btn text-white mt-2" style={{ cursor: "pointer", backgroundColor: "#8b5cf6", padding: "8px 24px", borderRadius: "6px" }}>
// // //         Shop now
// // //       </span>
// // //     </div>
// // //   );

// // //   return (
// // //     <>
// // //       <Navbar />

// // //       <main className="orders-container container py-3 my-2">
// // //         <h4 className="mb-4 fw-bold">Settings and Profile</h4>

// // //         <div className="row justify-content-center">
// // //           <div className="col-lg-3 col-md-5 mb-4 sidebar-column-view wl-sidebar-sticky">
// // //             <ProfileSideNav />
// // //           </div>

// // //           <div className="col-lg-9 col-md-7 list-column-view">
// // //             <div className="orders-card p-4 bg-white shadow-sm border rounded-3">
// // //               <div className="orders-header ">
// // //                 <div>
// // //                   <h4 className="fw-bold mb-1 outfit-font text-dark-theme">My Orders</h4>
// // //                   <p className="orders-subtitle text-muted small">View your purchase history and tracking details</p>
// // //                 </div>
// // //               </div>

// // //               <div className="orders-search-wrapper mb-4">
// // //                 <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
// // //                   <FaSearch style={{ position: "absolute", left: "14px", color: "#9ca3af" }} />

// // //                   <input
// // //                     type="text"
// // //                     className="search-input"
// // //                     style={{ paddingLeft: "40px", width: "100%", height: "42px", borderRadius: "8px", border: "1px solid #e5e7eb" }}
// // //                     placeholder="Search your orders or IDs"
// // //                     value={searchTerm}
// // //                     onChange={(e) => setSearchTerm(e.target.value)}
// // //                   />
// // //                 </div>
// // //               </div>

// // //               <div className="orders-list-wrapper">
// // //                 {loading ? (
// // //                   <div className="text-center py-5">
// // //                     <div className="spinner-border text-primary" role="status">
// // //                       <span className="visually-hidden">Loading...</span>
// // //                     </div>
// // //                     <p className="mt-2 text-muted">Loading your orders...</p>
// // //                   </div>
// // //                 ) : filteredOrders.length > 0 ? (
// // //                   <div className="orders-grid d-flex flex-column gap-3">
// // //                     {filteredOrders.map((order, index) => (
// // //                       <OrderCard 
// // //                         key={`${order.id}-${index}`} 
// // //                         order={order}
// // //                         reviewed={reviewedOrderIds.has(order.id)}
// // //                         onReviewClick={() => handleOpenReviewModal(order)} 
// // //                       />
// // //                     ))}
// // //                   </div>
// // //                 ) : (
// // //                   <EmptyOrders />
// // //                 )}
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </main>

// // //       <ReviewModal 
// // //         isOpen={modalOpen} 
// // //         onClose={() => setModalOpen(false)} 
// // //         onSubmit={handleReviewSubmit} 
// // //         rating={modalRating} 
// // //         setRating={setModalRating} 
// // //       />

// // //       <Footer />
// // //     </>
// // //   );
// // // }

// // // export default Orders;


// // // import React, { useState } from "react";
// // // import { useNavigate } from "react-router-dom";
// // // import Navbar from "../../components/User/Navbar";
// // // import Footer from "../../components/User/Footer";
// // // import ProfileSideNav from "../../components/User/Profile-Side-Nav";
// // // import OrderCard from "../../components/User/OrderCard";
// // // import { FaSearch } from "react-icons/fa";
// // // import "../../assets/styles/Orders.css";
// // // import emptyOrders from "../../assets/images/empty.png";

// // // function Orders() {
// // //   const navigate = useNavigate();
// // //   const [searchTerm, setSearchTerm] = useState("");

// // //   // Premium mock orders dataset matching your database & team specs
// // //   const [orders] = useState([
// // //     // {
// // //     //   id: "ORD002457890KJM",
// // //     //   product: "2-Seater Leather Sofa",
// // //     //   status: "Delivered",
// // //     //   time: "12 Mar, 2026",
// // //     //   rating: 4.2,
// // //     //   reviews: 120,
// // //     //   deliveryDate: "25/04/2020",
// // //     //   discountedPrice: 120,
// // //     //   originalPrice: 120,
// // //     //   quantity: 1,
// // //     //   image: "",
// // //     // },
// // //     // {
// // //     //   id: "ORD002457890KJM",
// // //     //   product: "Leather Backpack",
// // //     //   status: "Delivered",
// // //     //   time: "12 Mar, 2026",
// // //     //   rating: 4.2,
// // //     //   reviews: 120,
// // //     //   deliveryDate: "25/04/2020",
// // //     //   discountedPrice: 120,
// // //     //   originalPrice: 120,
// // //     //   quantity: 1,
// // //     //   image: "",
// // //     // },
// // //     // {
// // //     //   id: "ORD002",
// // //     //   product: "Wooden Coffee Table",
// // //     //   status: "Shipped",
// // //     //   time: "10 Mar, 2026",
// // //     //   rating: 4.5,
// // //     //   reviews: 85,
// // //     //   deliveryDate: "30/04/2020",
// // //     //   discountedPrice: 79,
// // //     //   originalPrice: 89,
// // //     //   quantity: 2,
// // //     //   image: "",
// // //     // },
// // //     // {
// // //     //   id: "ORD003",
// // //     //   product: "Modern Floor Lamp",
// // //     //   status: "Processing",
// // //     //   time: "08 Mar, 2026",
// // //     //   rating: 4.8,
// // //     //   reviews: 42,
// // //     //   deliveryDate: "02/05/2020",
// // //     //   discountedPrice: 45,
// // //     //   originalPrice: 45,
// // //     //   quantity: 1,
// // //     //   image: "",
// // //     // },
// // //     // {
// // //     //   id: "ORD004",
// // //     //   product: "Cotton Bedsheet Set",
// // //     //   status: "Delivered",
// // //     //   time: "05 Mar, 2026",
// // //     //   rating: 4.0,
// // //     //   reviews: 200,
// // //     //   deliveryDate: "20/03/2020",
// // //     //   discountedPrice: 29,
// // //     //   originalPrice: 35,
// // //     //   quantity: 3,
// // //     //   image: "",
// // //     // },
// // //     // {
// // //     //   id: "ORD005",
// // //     //   product: "Ceramic Flower Vase",
// // //     //   status: "Cancelled",
// // //     //   time: "01 Mar, 2026",
// // //     //   rating: 3.9,
// // //     //   reviews: 15,
// // //     //   deliveryDate: "Cancelled",
// // //     //   discountedPrice: 25,
// // //     //   originalPrice: 25,
// // //     //   quantity: 1,
// // //     //   image: "",
// // //     // }
// // //   ]);

// // //   // Filter orders based on user typing in search bar
// // //   const filteredOrders = orders.filter(
// // //     (order) =>
// // //       order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //       order.id.toLowerCase().includes(searchTerm.toLowerCase())
// // //   );

// // //   // Empty orders component - Matching SavedAddress card style
// // //   const EmptyOrders = () => {
// // //     return (
// // //       <div className="orders-empty-container">
// // //         <div className="orders-empty-image-wrapper">
// // //           <img 
// // //             src={emptyOrders} 
// // //             alt="No Orders Vector" 
// // //             className="orders-empty-vector" 
// // //           />
// // //         </div>
// // //         <h3 className="orders-empty-heading">No orders found!</h3>
// // //         <span 
// // //           onClick={() => navigate("/AllProducts")} 
// // //           className="btn orders-empty-shop-btn"
// // //           style={{ cursor: "pointer" }}
// // //         >
// // //           Shop now
// // //         </span>
// // //       </div>
// // //     );
// // //   };

// // //   return (
// // //     <div className="orders-page-app-wrapper">
// // //       <Navbar />
      
// // //       <main className="container py-3 my-2">
// // //         <h4 className="mb-3 fw-bold">Settings and Profile</h4>
        
// // //         <div className="row justify-content-center align-items-start">
// // //           {/* Profile Navigation Sidebar */}
// // //           <div className="col-lg-4 mb-3 d-none d-lg-block sidebar-sticky">
// // //             <ProfileSideNav />
// // //           </div>

// // //           {/* Main Orders Dashboard */}
// // //           <div className="col-lg-8 col-12">
// // //             <div className="orders-card">
              
// // //               {/* Header with consistent styling like SavedAddress */}
// // //               <div className="d-flex justify-content-between align-items-center mb-3">
// // //                 <h5 className="fw-bold mb-0">My Orders</h5>
// // //               </div>

// // //               {/* Search Bar */}
// // //               <div className="orders-search-wrapper mb-3">
// // //                 <div className="orders-search">
// // //                   <FaSearch className="search-icon" />
// // //                   <input
// // //                     type="text"
// // //                     className="search-input"
// // //                     placeholder="Search your orders or IDs"
// // //                     value={searchTerm}
// // //                     onChange={(e) => setSearchTerm(e.target.value)}
// // //                   />
// // //                 </div>
// // //               </div>

// // //               {/* Orders List */}
// // //               <div className="orders-list-wrapper">
// // //                 {filteredOrders.length > 0 ? (
// // //                   <div className="orders-grid">
// // //                     {filteredOrders.map((order, index) => (
// // //                       <OrderCard key={`${order.id}-${index}`} order={order} />
// // //                     ))}
// // //                   </div>
// // //                 ) : (
// // //                   <EmptyOrders />
// // //                 )}
// // //               </div>
              
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </main>

// // //       <Footer />
// // //     </div>
// // //   );
// // // }

// // // export default Orders;