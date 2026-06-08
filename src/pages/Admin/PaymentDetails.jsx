import React, { useState, useMemo, useEffect } from 'react';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import { FaCcVisa, FaCcMastercard, FaPaypal, FaMoneyBillWave, FaCreditCard } from "react-icons/fa";
import { FiRefreshCw, FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';
import '../../assets/styles/AdminDashboard.css';
import '../../assets/styles/PaymentDetails.css';
import AdminHeader from '../../components/Admin/AdminHeader';
import PaymentPopup from '../../components/Admin/PaymentPopup';
import { CardSkeleton, TableSkeleton } from '../../components/Admin/AdminSkeleton';
import toast, { Toaster } from 'react-hot-toast';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const renderMethodIcon = (method) => {
  if (method === 'cash' || method === 'cod') {
    return <FaMoneyBillWave size={22} color="#8b5cf6" />;
  }
  return <FaCreditCard size={22} color="#0072bc" />;
};

const PaymentDetails = () => {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        const list = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const isCOD = (data.paymentMode || '').toLowerCase().includes('cod') || (data.paymentMode || '').toLowerCase().includes('cash');
          const amountRaw = data.paymentDetails?.total || 0;
          const orderDate = data.orderDate?.toDate ? data.orderDate.toDate() : (data.orderDate ? new Date(data.orderDate) : null);
          list.push({
            id: data.id || docSnap.id,
            amount: amountRaw ? `₹${Number(amountRaw).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00',
            amountRaw: Number(amountRaw),
            currency: 'INR',
            mode: isCOD ? 'COD' : 'Razorpay',
            method: isCOD ? 'cash' : 'razorpay',
            date: orderDate ? orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/') : '-',
            time: orderDate ? orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
            status: data.paymentStatus || (data.status === 'Delivered' ? 'Success' : 'Pending'),
            orderDateRaw: orderDate || new Date(0),
          });
        });
        // Sort payments by date descending (latest first)
        list.sort((a, b) => b.orderDateRaw - a.orderDateRaw);
        setAllData(list);
      } catch (err) {
        console.error('Error fetching payments:', err);
        toast.error('Failed to load payment data!');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  // Live stats (Last 30 Days)
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const paymentsLast30Days = allData.filter(r => r.orderDateRaw && r.orderDateRaw >= thirtyDaysAgo);
  const totalPaymentLast30Days = paymentsLast30Days.reduce((sum, r) => sum + r.amountRaw, 0);
  const codPaymentLast30Days = paymentsLast30Days.filter(r => r.mode === 'COD').reduce((sum, r) => sum + r.amountRaw, 0);
  const onlinePaymentLast30Days = paymentsLast30Days.filter(r => r.mode === 'Razorpay').reduce((sum, r) => sum + r.amountRaw, 0);


  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMode, setPaymentMode] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const popupDetails = selectedPayment ? {
    amount: selectedPayment.amount,
    transactionId: selectedPayment.id,
    paymentMethod: {
      cash: "Cash on delivery",
      razorpay: "Razorpay"
    }[selectedPayment.method] || "Razorpay",
    date: selectedPayment.date,
    time: selectedPayment.time || "12:00 PM",
    merchant: "Star Bags"
  } : {};

  const popupStatus = selectedPayment && selectedPayment.status === 'Success' ? 'success' : 'failed';

  const handleResetFilter = () => {
    setSearchQuery("");
    setPaymentMode("All");
    setPaymentStatus("All");
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    return allData.filter(item => {
      const matchesSearch = item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMode = paymentMode === 'All' || item.mode === paymentMode;
      const matchesStatus = paymentStatus === 'All' || item.status === paymentStatus;
      return matchesSearch && matchesMode && matchesStatus;
    });
  }, [allData, searchQuery, paymentMode, paymentStatus]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="admin-layout">
      <Toaster position="top-right" />
      <AdminSidebar />
      <div className="admin-main payment-details-wrapper">
       
       <AdminHeader title="Payment Management" subtitle="Showing payment summary statistics for the last 30 days."  />

        <div className="admin-content">
          {loading ? (
            <>
              <CardSkeleton count={3} />
              <TableSkeleton rows={rowsPerPage} cols={6} />
            </>
          ) : (
            <>
              <div className="payment-stats-grid">
            <div className="payment-stat-card">
              <div className="payment-stat-top">
                <div className="payment-stat-info">
                  <p className="payment-stat-label">Total payment (30 Days)</p>
                  <p className="payment-stat-value">₹ {totalPaymentLast30Days.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</p>
                </div>
                <div className="payment-stat-icon-wrap" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                  <i className="bi bi-wallet2" style={{ fontSize: '20px' }}></i>
                </div>
              </div>
              <div className="payment-stat-trend">
                <FiArrowUpRight style={{ fontSize: '16px' }} />
                <span>{paymentsLast30Days.filter(r => r.status === 'Success').length} Successful</span>
              </div>
            </div>

            <div className="payment-stat-card">
              <div className="payment-stat-top">
                <div className="payment-stat-info">
                  <p className="payment-stat-label">Cash on delivery (30 Days)</p>
                  <p className="payment-stat-value">₹ {codPaymentLast30Days.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</p>
                </div>
                <div className="payment-stat-icon-wrap" style={{ background: '#dcfce7', color: '#16a34a' }}>
                  <i className="bi bi-cash-coin" style={{ fontSize: '20px' }}></i>
                </div>
              </div>
              <div className="payment-stat-trend">
                <FiArrowUpRight style={{ fontSize: '16px' }} />
                <span>{paymentsLast30Days.filter(r => r.mode === 'COD').length} orders</span>
              </div>
            </div>

            <div className="payment-stat-card">
              <div className="payment-stat-top">
                <div className="payment-stat-info">
                  <p className="payment-stat-label">Online payment (30 Days)</p>
                  <p className="payment-stat-value">₹ {onlinePaymentLast30Days.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</p>
                </div>
                <div className="payment-stat-icon-wrap" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                  <i className="bi bi-credit-card" style={{ fontSize: '20px' }}></i>
                </div>
              </div>
              <div className="payment-stat-trend">
                <FiArrowUpRight style={{ fontSize: '16px' }} />
                <span>{paymentsLast30Days.filter(r => r.mode === 'Razorpay').length} orders</span>
              </div>
            </div>
          </div>
          <div className="payment-filter-section">
            <div className="payment-filter-group search">
              <label>SEARCH</label>
              <div className="payment-search-input-wrap">
                <i className="bi bi-search" />
                <input 
                  type="text" 
                  className="payment-search-input" 
                  placeholder="Search by Order ID / Transaction ID" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="payment-filter-group">
              <label>PAYMENT MODE</label>
              <select className="payment-select" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                <option value="All">All</option>
                <option value="Razorpay">Razorpay</option>
                <option value="COD">COD</option>
              </select>
            </div>
            <div className="payment-filter-group">
              <label>PAYMENT STATUS</label>
              <select className="payment-select" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                <option value="All">All</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <button className="payment-reset-btn" onClick={handleResetFilter}>
              <FiRefreshCw /> Reset Filter
            </button>
          </div>
          <div className="payment-table-container">
            <div style={{ overflowX: 'auto' }}>
              <table className="payment-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>AMOUNT</th>
                    <th>PAYMENT MODE</th>
                    <th>CREATION DATE</th>
                    <th>STATUS</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((row, index) => (
                      <tr key={index}>
                        <td style={{ color: '#6b7280' }}>{row.id}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#374151' }}>{row.amount}</span>
                          <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 6 }}>{row.currency}</span>
                        </td>
                        <td>
                          <div className="payment-method">
                            {renderMethodIcon(row.method)}
                            <span>{row.mode}</span>
                          </div>
                        </td>
                        <td style={{ color: '#6b7280' }}>{row.date}</td>
                        <td>
                          <span className={`payment-status-badge ${row.status.toLowerCase()}`}>
                            {row.status === 'Success' && <i className="bi bi-check-circle-fill" />}
                            {row.status === 'Failed' && <i className="bi bi-dash-circle-fill" />}
                            {row.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="payment-more-btn"
                            onClick={() => {
                              setSelectedPayment(row);
                              setShowPopup(true);
                            }}
                          >
                            <i className="bi bi-three-dots-vertical" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                        No results found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="payment-pagination">
              <div className="payment-pagination-info">
                Showing {filteredData.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + rowsPerPage, filteredData.length)} results
              </div>
              <div className="payment-pagination-controls">
                <div className="payment-page-numbers">
                  <button className="payment-page-btn nav" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                    <i className="bi bi-chevron-left" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      className={`payment-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button className="payment-page-btn nav" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
                <div className="payment-rows-per-page">
                  <span>Rows per page</span>
                  <select 
                    className="payment-rows-select"
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
          </div>
            </>
          )}
        </div>
      </div>

      <PaymentPopup 
        isOpen={showPopup}
        status={popupStatus}
        details={popupDetails}
        onClose={() => setShowPopup(false)}
        onDownloadReceipt={() => alert("Downloading receipt PDF...")}
      />
    </div>
  );
};

export default PaymentDetails;