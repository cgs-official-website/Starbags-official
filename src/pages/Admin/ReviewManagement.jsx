import React, { useState, useEffect } from 'react';
import '../../assets/styles/AdminReviewManagement.css';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import AdminHeader from '../../components/Admin/AdminHeader';
import { CardSkeleton, TableSkeleton } from '../../components/Admin/AdminSkeleton';
import { BiMessageRoundedDetail, BiLike, BiDislike, BiSearch } from 'react-icons/bi';
import { FiRefreshCw, FiTrash2, FiEye, FiEyeOff, FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';
import ConfirmModal from '../../components/Admin/ConfirmModal';
import toast, { Toaster } from 'react-hot-toast';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function ReviewManagement() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'reviews'));
        const list = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            productId: data.productId || '',
            text: data.text || data.comment || '',
            image: data.image || data.productImage || '',
            productName: data.productName || '',
            customerName: data.customerName || data.userName || '',
            rating: data.rating || 0,
            date: data.date || data.createdAt || null,
            isHidden: data.isHidden || false,
          });
        });
        setReviews(list);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        toast.error('Failed to load reviews!');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  // Stats calculation (Last 30 Days)
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const reviewsLast30Days = reviews.filter(r => {
    if (!r.date) return false;
    const d = r.date.toDate ? r.date.toDate() : new Date(r.date);
    return !isNaN(d.getTime()) && d >= thirtyDaysAgo;
  });

  const totalReviewsLast30Days = reviewsLast30Days.length;
  const positiveReviewsLast30Days = reviewsLast30Days.filter(r => r.rating >= 4).length;
  const negativeReviewsLast30Days = reviewsLast30Days.filter(r => r.rating <= 2).length;

  const handleResetFilter = () => {
    setSearchQuery('');
    setDateFilter('');
    setRatingFilter('');
    setCurrentPage(1);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const handleDelete = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const review = reviews.find(r => r.id === deleteTargetId);
      if (review) {
        const reviewRef = doc(db, 'reviews', review.id);
        await deleteDoc(reviewRef);
        setReviews(reviews.filter(r => r.id !== deleteTargetId));
        toast.success('Review deleted!');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      toast.error('Failed to delete review!');
    }
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const handleToggleHide = async (id) => {
    const review = reviews.find(r => r.id === id);
    if (!review) return;
    const newHidden = !review.isHidden;
    try {
      const reviewRef = doc(db, 'reviews', review.id);
      await updateDoc(reviewRef, { isHidden: newHidden });
      setReviews(reviews.map(r => r.id === id ? { ...r, isHidden: newHidden } : r));
      if (newHidden) {
        toast.success('Review hidden — only visible to the reviewer');
      } else {
        toast.success('Review is now visible to all users');
      }
    } catch (err) {
      console.error('Error toggling review visibility:', err);
      toast.error('Failed to update review!');
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (searchQuery && !review.productName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Date filter helper matching
    let reviewDateStr = "";
    if (review.date) {
      const d = review.date.toDate ? review.date.toDate() : new Date(review.date);
      if (!isNaN(d.getTime())) {
        reviewDateStr = d.toISOString().split('T')[0];
      }
    }
    if (dateFilter && reviewDateStr !== dateFilter) return false;
    if (ratingFilter && review.rating.toString() !== ratingFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredReviews.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentReviews = filteredReviews.slice(startIndex, startIndex + rowsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "N/A";
    try {
      const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/');
    } catch (e) {
      return "N/A";
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < rating; i++) {
      stars.push(<span key={i} className="star-icon">★</span>);
    }
    return stars;
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader title="Review Management" subtitle="Showing feedback and review statistics for the last 30 days." />
        
        <div className="admin-content rm-content">
          {loading ? (
            <>
              <CardSkeleton count={3} />
              <TableSkeleton rows={rowsPerPage} cols={7} />
            </>
          ) : (
            <>
          
          <div className="rm-stats-grid">
            <div className="rm-stat-card">
              <div className="rm-stat-top">
                <div className="rm-stat-info">
                  <span className="rm-stat-label">Total reviews (30 Days)</span>
                  <span className="rm-stat-value">{totalReviewsLast30Days}</span>
                </div>
                <div className="rm-stat-icon purple">
                  <BiMessageRoundedDetail />
                </div>
              </div>
              <div className="rm-stat-bottom rm-stat-up">
                <FiArrowUpRight style={{ fontSize: '16px' }} /> {totalReviewsLast30Days} new reviews
              </div>
            </div>
            <div className="rm-stat-card">
              <div className="rm-stat-top">
                <div className="rm-stat-info">
                  <span className="rm-stat-label">Positive reviews (30 Days)</span>
                  <span className="rm-stat-value">{positiveReviewsLast30Days}</span>
                </div>
                <div className="rm-stat-icon green">
                  <BiLike />
                </div>
              </div>
              <div className={positiveReviewsLast30Days > negativeReviewsLast30Days ? "rm-stat-bottom rm-stat-up" : "rm-stat-bottom rm-stat-down"}>
                {positiveReviewsLast30Days > negativeReviewsLast30Days
                  ? <FiArrowUpRight style={{ fontSize: '16px' }} />
                  : <FiArrowDownRight style={{ fontSize: '16px' }} />}
                {' '}{totalReviewsLast30Days > 0 ? Math.round((positiveReviewsLast30Days / totalReviewsLast30Days) * 100) : 0}% Positive rate
              </div>
            </div>
            <div className="rm-stat-card">
              <div className="rm-stat-top">
                <div className="rm-stat-info">
                  <span className="rm-stat-label">Negative Reviews (30 Days)</span>
                  <span className="rm-stat-value">{negativeReviewsLast30Days}</span>
                </div>
                <div className="rm-stat-icon red">
                  <BiDislike />
                </div>
              </div>
              <div className={negativeReviewsLast30Days > 0 ? "rm-stat-bottom rm-stat-down" : "rm-stat-bottom rm-stat-up"}>
                {negativeReviewsLast30Days > 0
                  ? <FiArrowDownRight style={{ fontSize: '16px' }} />
                  : <FiArrowUpRight style={{ fontSize: '16px' }} />}
                {' '}{totalReviewsLast30Days > 0 ? Math.round((negativeReviewsLast30Days / totalReviewsLast30Days) * 100) : 0}% Negative rate
              </div>
            </div>
          </div>

          <div className="rm-filter-bar">
            <div className="rm-search-box">
              <BiSearch className="rm-search-icon" />
              <input 
                type="text" 
                placeholder="Search product" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <div className="rm-filter-select-wrap">
              <input 
                type="date" 
                className="rm-filter-select"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="rm-filter-select-wrap">
              <select 
                className="rm-filter-select"
                value={ratingFilter}
                onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            <button className="rm-reset-btn" onClick={handleResetFilter}>
              <FiRefreshCw /> Reset Filter
            </button>
          </div>

          <div className="rm-table-wrapper">
            <table className="rm-table">
              <thead>
                <tr>
                  <th className="rm-review-col" style={{ width: '30%' }}>User review</th>
                  <th>Product Image</th>
                  <th style={{ width: '15%' }}>Product Name</th>
                  <th style={{ width: '15%' }}>Customer Name</th>
                  <th>Review</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentReviews.length > 0 ? currentReviews.map((review) => (
                  <tr key={review.id} style={{ opacity: review.isHidden ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    <td className="rm-review-col">
                      <div className="rm-text-ellipsis-multi" title={review.text}>
                        {review.text}
                      </div>
                    </td>
                    <td>
                      <img src={review.image} alt="product" className="rm-product-img" />
                    </td>
                    <td>
                      <div className="rm-text-ellipsis" title={review.productName}>
                        {review.productName}
                      </div>
                    </td>
                    <td>
                      <div className="rm-text-ellipsis" title={review.customerName}>
                        {review.customerName}
                      </div>
                    </td>
                    <td>
                      <div className="rm-stars">
                        {renderStars(review.rating)}
                      </div>
                    </td>
                    <td>
                      {formatDate(review.date)}
                    </td>
                    <td>
                      <div className="rm-action-btn-group">
                        <button 
                          className={`rm-action-btn hide ${review.isHidden ? 'hidden-state' : ''}`} 
                          onClick={() => handleToggleHide(review.id)}
                          title={review.isHidden ? "Show review to everyone" : "Hide review from other users"}
                        >
                          {review.isHidden ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                        </button>
                        <button 
                          className="rm-action-btn delete" 
                          onClick={() => handleDelete(review.id)}
                          title="Delete review entirely"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4">No reviews found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div className="rm-pagination-container">
              <span className="rm-pagination-text">
                Showing {filteredReviews.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + rowsPerPage, filteredReviews.length)} results
              </span>
              
              <div className="rm-pagination-right">
                <div className="rm-pagination-controls">
                  <button className="rm-page-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      className={`rm-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button className="rm-page-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
                
                <div className="rm-rows-per-page">
                  Rows per page
                  <select 
                    className="rm-rows-select"
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={6}>6</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
            </>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message="Are you sure you want to Delete this Review ?"
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}

export default ReviewManagement;