import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import '../../assets/styles/OrderManagement.css';
import '../../assets/styles/AdminHeader.css';
import { OrderDetailsSkeleton } from '../../components/Admin/AdminSkeleton';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { generateInvoicePDF } from '../../utils/generateInvoicePDF';

const OrderDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const orderId = location.state?.order?.id || "00000";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const docRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // 1. Fetch user-profile fallback if email or mobile are not in order document
          let userEmail = data.customerDetails?.email || data.email || "";
          let userMobile = data.customerDetails?.mobile || data.customerDetails?.mobileNumber || data.mobileNumber || "";
          const uid = data.userId || data.customerDetails?.customerId;
          if (uid && (!userEmail || userEmail === "N/A" || !userMobile || userMobile === "N/A")) {
            try {
              const userDocRef = doc(db, "users", uid);
              const userSnap = await getDoc(userDocRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                if (!userEmail || userEmail === "N/A") userEmail = userData.email || "";
                if (!userMobile || userMobile === "N/A") userMobile = userData.mobile || "";
              }
            } catch (err) {
              console.error("Error fetching user profile fallback:", err);
            }
          }

          // 2. Parse mobile number from address string if still empty
          if (!userMobile || userMobile === "N/A" || userMobile === "") {
            const addressString = data.customerDetails?.shippingAddress || data.address || "";
            const phoneMatch = addressString.match(/Mobile:\s*(\+?\d+)/i) || addressString.match(/Mobile\s*:\s*(\+?\d+)/i);
            const tenDigitMatch = addressString.match(/\b\d{10}\b/) || addressString.match(/\b\d{12}\b/);
            if (phoneMatch && phoneMatch[1]) {
              userMobile = phoneMatch[1];
            } else if (tenDigitMatch) {
              userMobile = tenDigitMatch[0];
            }
          }
          console.log("Firestore order raw details:", data);
          console.log("Resolved userMobile:", userMobile);

          // 3. Query the products collection to find product attributes if missing
          let productDetails = {};
          const productName = data.product || data.items?.[0]?.productName;
          if (productName) {
            try {
              const productsRef = collection(db, "products");
              const q = query(productsRef, where("name", "==", productName));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                const prodDoc = querySnapshot.docs[0].data();
                productDetails = {
                  brand: prodDoc.brand || "",
                  material: prodDoc.material || "",
                  size: prodDoc.size || "",
                  subCategory: prodDoc.subCategory || "",
                  category: prodDoc.category || ""
                };
              }
            } catch (err) {
              console.error("Error fetching product details fallback:", err);
            }
          }

          // 4. Map everything safely to setOrder state
          setOrder({
            id: data.id || docSnap.id,
            img: data.image || data.items?.[0]?.img || "../src/assets/images/leather1.png",
            productName: productName || "Product",
            customer: data.customerDetails?.name || data.customer || "Customer",
            address: data.customerDetails?.shippingAddress || data.address || "No Address Provided",
            mobileNumber: userMobile || "N/A",
            email: userEmail || "N/A",
            brand: data.brand || data.items?.[0]?.brand || productDetails.brand || "Star Bags",
            subCategory: data.subCategory || data.items?.[0]?.subCategory || productDetails.subCategory || "Casual",
            material: data.material || data.items?.[0]?.material || productDetails.material || "Leather",
            size: data.size || data.items?.[0]?.size || productDetails.size || "Standard",
            quantity: data.quantity || data.items?.[0]?.qty || 1,
            date: data.time || (data.orderDate
              ? new Date(data.orderDate).toLocaleDateString('en-GB')
              : ""),
            paymentMode: data.paymentMode || "COD",
            amount: data.discountedPrice ? `₹${data.discountedPrice}` : (data.amount || "₹0"),
            status: data.status || "Order Placed",
            category: data.category || data.items?.[0]?.category || productDetails.category || "Bag",
            orderDateRaw: data.orderDate || new Date().toISOString(),
            originalPrice: data.originalPrice,
            discountedPrice: data.discountedPrice,
            paymentDetails: data.paymentDetails
          });
        } else {
          // Fallback to location state or default order
          const fallback = location.state?.order || {
            id: "00000",
            img: "../src/assets/images/bag.png",
            productName: "Sample Bag",
            customer: "John Doe",
            address: "123 Sample St. City, Country",
            date: "01/01/2026",
            paymentMode: "Online",
            amount: "₹1000",
            status: "Order Placed",
            category: "Bag",
            orderType: "Online"
          };
          setOrder({
            ...fallback,
            mobileNumber: fallback.mobileNumber || "N/A",
            email: fallback.email || "N/A",
            brand: fallback.brand || "Star Bags",
            subCategory: fallback.subCategory || "Casual",
            material: fallback.material || "Leather",
            size: fallback.size || "Standard",
            quantity: fallback.quantity || 1,
            orderDateRaw: fallback.orderDate || new Date().toISOString(),
            originalPrice: fallback.originalPrice || 1000,
            discountedPrice: fallback.discountedPrice || 1000,
            paymentDetails: fallback.paymentDetails || {
              itemsCount: fallback.quantity || 1,
              itemsTotal: fallback.originalPrice || 1000,
              discount: 0,
              subTotal: fallback.discountedPrice || 1000,
              gst: Math.round((fallback.discountedPrice || 1000) * 0.18),
              shippingFee: 0,
              total: (fallback.discountedPrice || 1000) + Math.round((fallback.discountedPrice || 1000) * 0.18)
            }
          });
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId, location.state]);

  const originalSubtotal = order 
    ? (order.paymentDetails?.itemsTotal || order.originalPrice || order.discountedPrice || 0) 
    : 0;
    
  const couponDiscount = order 
    ? (order.paymentDetails?.discount || Math.max(0, originalSubtotal - (order.discountedPrice || 0))) 
    : 0;
    
  const subtotalAfterDiscount = order 
    ? (order.paymentDetails?.subTotal || order.discountedPrice || 0) 
    : 0;
    
  const gstAmount = order 
    ? (order.paymentDetails?.gst || Math.round(subtotalAfterDiscount * 0.18)) 
    : 0;
    
  const grandTotal = order 
    ? (order.paymentDetails?.total || (subtotalAfterDiscount + gstAmount)) 
    : 0;

  const getTrackingSteps = (orderDateRaw, status) => {
    const baseDate = orderDateRaw ? new Date(orderDateRaw) : new Date();
    
    const formatDate = (date, daysToAdd) => {
      const d = new Date(date);
      d.setDate(d.getDate() + daysToAdd);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + " - " + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    const statusMatch = status ? status.trim().toLowerCase() : "order placed";

    const steps = [
      { 
        title: "Order Placed", 
        desc: "Your order has been placed successfully.", 
        date: formatDate(baseDate, 0), 
        isActive: true 
      },
      { 
        title: "Order Shipped", 
        desc: "Your order has been handed over to the courier.", 
        date: formatDate(baseDate, 1), 
        isActive: ["shipped", "out for delivery", "delivered"].includes(statusMatch) 
      },
      { 
        title: "Out for Delivery", 
        desc: "Your package is out for local delivery.", 
        date: formatDate(baseDate, 3), 
        isActive: ["out for delivery", "delivered"].includes(statusMatch) 
      },
      { 
        title: "Delivered", 
        desc: "Your order has been delivered.", 
        date: formatDate(baseDate, 5), 
        isActive: statusMatch === "delivered" 
      }
    ];
    return steps;
  };

  const trackingSteps = order ? getTrackingSteps(order.orderDateRaw, order.status) : [];

  const downloadInvoice = () => {
    if (!order) return;
    // Build userAddress from available order data
    const userAddress = {
      name:    order.customer || '',
      address: order.address  || '',
      city:    '',
      state:   '',
      pin:     '',
      mobile:  order.mobileNumber || '',
    };
    generateInvoicePDF({
      order: { ...order, product: order.productName },
      userAddress,
      itemsPrice: originalSubtotal,
      savings:    couponDiscount,
      finalPrice: subtotalAfterDiscount,
    });
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main bg-light" style={{ background: '#f8fafc' }}>
      
        

        <div className="admin-content mt-3" style={{ padding: '0 20px 20px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
              <button onClick={() => navigate(-1)} className="btn btn-link text-dark p-0 text-decoration-none">
                <i className="bi bi-arrow-left" style={{ fontSize: 14 }}></i>
              
              <span style={{ fontSize: 12, color: '#111827', fontWeight: 500 }}>Order management</span> </button>
              <span style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 500 }}>/ Order details</span>
            </div>
            <button onClick={downloadInvoice} className="btn text-white d-flex align-items-center gap-2" style={{ background: '#8b5cf6', borderRadius: 6, fontSize: 11, fontWeight: 500, padding: '6px 12px', border: 'none' }}>
              <i className="bi bi-download"></i> Download invoice
            </button>
          </div>

          <div className="row g-4">
            {loading ? (
              <div className="col-12">
                <OrderDetailsSkeleton />
              </div>
            ) : (
              <>
            
            {/* Product Details */}
            <div className="col-lg-7">
              <div className="bg-white h-100 d-flex flex-column p-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', borderRadius: 12 }}>
                <div className="d-flex gap-3 h-100">
                  <div style={{ width: '35%', flexShrink: 0 }}>
                    <img src={order?.img} alt={order?.productName} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb', padding: '8px' }} />
                  </div>
                  <div className="d-flex flex-column flex-grow-1">
                    <h5 className="fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px', fontSize: '15px' }}>{order?.productName}</h5>
                    <div className="d-flex gap-3 mb-3 text-muted" style={{ fontSize: 11, fontWeight: 500 }}>
                      <span>Order ID : <span className="text-dark">#{order?.id}</span></span>
                      <span>Category : <span className="text-dark">{order?.category}</span></span>
                    </div>

                    <div className="row g-0 flex-grow-1 border-top border-bottom text-center">
                      <div className="col-4 border-end border-bottom d-flex flex-column justify-content-center p-2">
                        <span className="fw-bold mb-1" style={{ fontSize: 11 }}>Category</span>
                        <span className="text-muted" style={{ fontSize: 11 }}>{order?.category}</span>
                      </div>
                      <div className="col-4 border-end border-bottom d-flex flex-column justify-content-center p-2">
                        <span className="fw-bold mb-1" style={{ fontSize: 11 }}>Size</span>
                        <span className="text-muted" style={{ fontSize: 11 }}>{order?.size}</span>
                      </div>
                      <div className="col-4 border-bottom d-flex flex-column justify-content-center p-2">
                        <span className="fw-bold mb-1" style={{ fontSize: 11 }}>Quantity</span>
                        <span className="text-muted" style={{ fontSize: 11 }}>{order?.quantity}</span>
                      </div>
                      <div className="col-4 border-end d-flex flex-column justify-content-center p-2">
                        <span className="fw-bold mb-1" style={{ fontSize: 11 }}>Material</span>
                        <span className="text-muted" style={{ fontSize: 11 }}>{order?.material}</span>
                      </div>
                      <div className="col-4 border-end d-flex flex-column justify-content-center p-2">
                        <span className="fw-bold mb-1" style={{ fontSize: 11 }}>Brand</span>
                        <span className="text-muted" style={{ fontSize: 11, lineHeight: 1.2 }}>{order?.brand}</span>
                      </div>
                      <div className="col-4 d-flex flex-column justify-content-center p-2">
                        <span className="fw-bold mb-1" style={{ fontSize: 11 }}>Sub Category</span>
                        <span className="text-muted" style={{ fontSize: 11, lineHeight: 1.2 }}>{order?.subCategory}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="col-lg-5">
              <div className="bg-white p-3 h-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', borderRadius: 12 }}>
                <h6 className="fw-bold mb-3" style={{ fontSize: '13px' }}>Customer details</h6>
                
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-person-circle" style={{ fontSize: 24, color: "#8b5cf6" }} />
                  <span className="fw-bold" style={{ fontSize: '13px' }}>{order?.customer}</span>
                </div>

                <div className="d-flex align-items-start gap-2 mb-3">
                  <i className="bi bi-envelope" style={{ fontSize: 14, color: '#8b5cf6', marginTop: '2px' }}></i>
                  <div>
                    <span className="text-muted d-block mb-0.5" style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Email</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{order?.email}</span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2 mb-3">
                  <i className="bi bi-telephone" style={{ fontSize: 14, color: '#8b5cf6', marginTop: '2px' }}></i>
                  <div>
                    <span className="text-muted d-block mb-0.5" style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Mobile</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{order?.mobileNumber}</span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2">
                  <i className="bi bi-geo-alt" style={{ fontSize: 14, color: '#8b5cf6', marginTop: '2px' }}></i>
                  <div>
                    <span className="text-muted d-block mb-0.5" style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Shipping Address</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#374151', lineHeight: 1.4, display: 'block' }}>
                      {order?.address}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Tracking */}
            <div className="col-lg-7">
              <div className="bg-white p-3 h-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', borderRadius: 12 }}>
                <h6 className="fw-bold mb-3" style={{ fontSize: '13px' }}>Order tracking</h6>
                
                <div className="position-relative ms-2">
                  <div className="position-absolute" style={{ width: '2px', background: '#8b5cf6', left: '6px', top: '10px', bottom: '26px', zIndex: 0 }}></div>
                  
                  {trackingSteps.map((step, idx) => (
                    <div className="d-flex gap-3 mb-3 position-relative" key={idx}>
                      <div className="rounded-circle d-flex align-items-center justify-content-center" 
                           style={{ 
                             width: 14, 
                             height: 14, 
                             background: step.isActive ? '#8b5cf6' : '#e5e7eb', 
                             color: step.isActive ? 'white' : '#9ca3af', 
                             fontSize: 8, 
                             marginTop: '4px', 
                             zIndex: 1 
                           }}>
                        <i className="bi bi-check2"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0.5" style={{ fontSize: 12, color: step.isActive ? '#111827' : '#9ca3af' }}>
                          {step.title}
                        </h6>
                        <p className="mb-0.5" style={{ fontSize: 11, color: step.isActive ? '#374151' : '#9ca3af' }}>{step.desc}</p>
                        <span className="text-muted" style={{ fontSize: 9 }}>{step.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="col-lg-5">
              <div className="bg-white p-3 h-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', borderRadius: 12 }}>
                <h6 className="fw-bold mb-3" style={{ fontSize: '13px' }}>Payment Summary</h6>
                
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span style={{ fontSize: 12, color: '#374151' }}>Items ({order?.quantity || 1})</span>
                    <span style={{ fontSize: 12, color: '#374151' }}>₹{originalSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span style={{ fontSize: 12, color: '#374151' }}>Discount</span>
                    <span style={{ fontSize: 12, color: '#22c55e' }}>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span style={{ fontSize: 12, color: '#374151' }}>Sub total</span>
                    <span style={{ fontSize: 12, color: '#374151' }}>₹{subtotalAfterDiscount.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span style={{ fontSize: 12, color: '#374151' }}>GST Included (18%)</span>
                    <span style={{ fontSize: 12, color: '#374151' }}>₹{gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span style={{ fontSize: 12, color: '#374151' }}>Shipping Fee</span>
                    <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 500 }}>Free</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-1">
                    <span className="fw-bold" style={{ fontSize: 14 }}>Total</span>
                    <span className="fw-bold" style={{ fontSize: 13, color: '#8b5cf6' }}>₹{grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-uppercase text-muted fw-bold" style={{ fontSize: 11, letterSpacing: '0.5px' }}>PAYMENT MODE</span>
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-credit-card" style={{ color: '#8b5cf6', fontSize: 14 }}></i>
                      <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
                        {order?.paymentMode === 'COD' ? 'Cash on Delivery' : 'Online payment'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
