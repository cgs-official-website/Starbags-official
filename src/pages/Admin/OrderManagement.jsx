import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import AdminHeader from '../../components/Admin/AdminHeader';
import '../../assets/styles/OrderManagement.css';
import { TableSkeleton } from '../../components/Admin/AdminSkeleton';
import toast from 'react-hot-toast';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function OrderManagement() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const getNormalizedCategory = (data, docId) => {
    const orderId = (data.id || docId || '').toUpperCase();
    if (orderId.includes('-WLT-')) return 'Wallet';
    if (orderId.includes('-BLT-')) return 'Belt';
    if (orderId.includes('-BAG-')) return 'Bag';

    const prodName = (data.items?.[0]?.productName || data.product || '').toLowerCase();
    if (prodName.includes('wallet') || prodName.includes('card holder')) return 'Wallet';
    if (prodName.includes('belt')) return 'Belt';
    if (prodName.includes('bag') || prodName.includes('backpack')) return 'Bag';

    const cat = (data.items?.[0]?.category || data.category || '').toLowerCase();
    if (cat === 'wlt' || cat === 'wallet') return 'Wallet';
    if (cat === 'blt' || cat === 'belt') return 'Belt';
    if (cat === 'bag' || cat === 'bags') return 'Bag';

    return 'Bag';
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        const list = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const orderDateRaw = data.orderDate
            ? (data.orderDate.toDate ? data.orderDate.toDate() : new Date(data.orderDate))
            : new Date(0);
          
          const year = orderDateRaw.getFullYear();
          const month = String(orderDateRaw.getMonth() + 1).padStart(2, '0');
          const day = String(orderDateRaw.getDate()).padStart(2, '0');
          const orderDateYMD = `${year}-${month}-${day}`;

          list.push({
            id: data.id || docSnap.id,
            docId: docSnap.id,
            img: data.items?.[0]?.img || '',
            productName: data.items?.[0]?.productName || '',
            customer: data.customerDetails?.name || '',
            address: data.customerDetails?.shippingAddress || '',
            orderDateRaw,
            orderDateYMD,
            date: data.orderDate
              ? (data.orderDate.toDate
                  ? data.orderDate.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/')
                  : new Date(data.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/'))
              : '',
            paymentMode: data.paymentMode || '',
            amount: data.paymentDetails?.total ? `₹${data.paymentDetails.total}` : '',
            status: data.status || '',
            category: getNormalizedCategory(data, docSnap.id),
            orderType: data.orderType || '',
          });
        });
        // Sort orders by date descending (latest first)
        list.sort((a, b) => b.orderDateRaw - a.orderDateRaw);
        setOrders(list);
      } catch (err) {
        console.error('Error fetching orders:', err);
        toast.error('Failed to load orders!');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleResetFilter = () => {
    setDateFilter('');
    setCategoryFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const filteredOrders = orders.filter((order) => {
    if (dateFilter && order.orderDateYMD !== dateFilter) return false;
    if (categoryFilter && order.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (statusFilter && order.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + rowsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      return true;
    } catch (error) {
      console.error("Error updating order status:", error);
      return false;
    }
  };

  const handleStatusChange = async (e, orderId, docId, newStatus) => {
    e.stopPropagation(); // Prevent row click navigation
    
    // Attempt Firebase update
    const success = await updateOrderStatus(docId, newStatus);
    
    if (success) {
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );
      toast.success("Order status updated successfully");
    } else {
      toast.error("Failed to update order status");
    }
  };
  const getStatusClass = (status) => {
    switch (status) {
      case 'Delivered': return 'delivered';
      case 'Shipped': return 'shipped';
      case 'Out for Delivery': return 'out-for-delivery';
      case 'Order Placed': return 'placed';
      default: return '';
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        
        <AdminHeader title="Order Management" subtitle="Here's what's happening with your orders." />

      
        <div className="admin-content">
          {loading ? (
            <TableSkeleton rows={rowsPerPage} cols={7} />
          ) : (
            <>
          
          <div className="filter-bar">
            <button className="filter-icon-btn">
              <i className="bi bi-funnel"></i>
            </button>
            <p className="filter-label">Filter By</p>
            
            <div className="filter-divider"></div>
            
            <input 
              type="date" 
              className="filter-select" 
              style={{ paddingRight: '8px' }}
              value={dateFilter} 
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            />
            
            <div className="filter-divider"></div>
            
            <select className="filter-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">Category</option>
              <option value="Bag">Bag</option>
              <option value="Wallet">Wallet</option>
              <option value="Belt">Belt</option>
            </select>
            
            <div className="filter-divider"></div>
            
            <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">Order Status</option>
              <option value="Order Placed">Order Placed</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
            
            <button className="reset-filter-btn" onClick={handleResetFilter}>
              <i className="bi bi-arrow-clockwise"></i> Reset Filter
            </button>
          </div>

        
          <div className="order-table-wrapper">
            <table className="order-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product Image</th>
                  <th>Product Name</th>
                  <th>Customer Name</th>
                  <th>Address</th>
                  <th>Date</th>
                  {/* <th>Payment Mode</th> */}
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.length > 0 ? (
                  currentOrders.map((order, i) => (
                    <tr key={i} onClick={() => navigate('/admin/order-details', { state: { order } })}>
                      <td style={{ fontWeight: 500 }}>{order.id}</td>
                      <td>
                        <img src={order.img} alt={order.productName} className="order-product-img" />
                      </td>
                      <td style={{ fontWeight: 500 }}>{order.productName}</td>
                      <td>{order.customer}</td>
                      <td>
                        <div style={{ minWidth: 150, maxWidth: 250, fontSize: 12, lineHeight: 1.4, wordBreak: 'break-all', whiteSpace: 'normal' }}>
                          {order.address}
                        </div>
                      </td>
                      <td>{order.date}</td>
                      {/* <td>
                        <div className="d-flex align-items-center gap-2">
                          {order.paymentMode === 'Online' && (
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#1a1f71', background: '#e0e7ff', padding: '2px 4px', borderRadius: 2 }}>VISA</span>
                          )}
                          <span>{order.paymentMode}</span>
                        </div>
                      </td> */}
                      <td style={{ fontWeight: 500 }}>{order.amount}</td>
                      <td>
                        <select 
                          className={`status-badge ${getStatusClass(order.status)}`}
                          value={order.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(e, order.id, order.docId, e.target.value)}
                          style={{ cursor: 'pointer', border: 'none', outline: 'none' }}
                        >
                          <option value="Order Placed" style={{ background: '#fff', color: '#374151' }}>Order Placed</option>
                          <option value="Shipped" style={{ background: '#fff', color: '#374151' }}>Shipped</option>
                          <option value="Out for Delivery" style={{ background: '#fff', color: '#374151' }}>Out for Delivery</option>
                          <option value="Delivered" style={{ background: '#fff', color: '#374151' }}>Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4">No orders found for the selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            
            <div className="pagination-container">
              <span className="pagination-text">
                Showing {filteredOrders.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + rowsPerPage, filteredOrders.length)} results
              </span>
              
              <div className="pagination-controls">
                <button className="page-btn nav" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  <i className="bi bi-chevron-left"></i>
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i} 
                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button className="page-btn nav" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
              
              <div className="rows-per-page">
                Rows per page
                <select 
                  className="rows-select"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderManagement;