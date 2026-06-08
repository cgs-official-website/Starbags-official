import React from 'react';
import '../../assets/styles/Skeleton.css';

// ── SKELETON CARD FOR MY ORDERS ──
export const OrderSkeleton = () => {
  return (
    <div className="orders-grid d-flex flex-column gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 border rounded-3 bg-white d-flex gap-3 align-items-center" style={{ minHeight: '120px' }}>
          <div className="skeleton-shimmer skeleton-block" style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px' }} />
          <div className="flex-grow-1 d-flex flex-column gap-2">
            <div className="skeleton-shimmer skeleton-block" style={{ width: '40%', height: '18px' }} />
            <div className="skeleton-shimmer skeleton-block" style={{ width: '25%', height: '14px' }} />
            <div className="skeleton-shimmer skeleton-block" style={{ width: '60%', height: '14px' }} />
          </div>
          <div className="d-flex flex-column align-items-end gap-2" style={{ flexShrink: 0 }}>
            <div className="skeleton-shimmer skeleton-block" style={{ width: '60px', height: '24px', borderRadius: '12px' }} />
            <div className="skeleton-shimmer skeleton-block" style={{ width: '80px', height: '16px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── SKELETON CARD FOR MY REVIEWS ──
export const ReviewSkeleton = () => {
  return (
    <div className="reviews-scroll-list d-flex flex-column gap-3">
      {[1, 2].map((i) => (
        <div key={i} className="p-3 border rounded-3 bg-white d-flex gap-3 align-items-start" style={{ minHeight: '130px' }}>
          <div className="skeleton-shimmer skeleton-block" style={{ width: '70px', height: '70px', flexShrink: 0, borderRadius: '8px' }} />
          <div className="flex-grow-1 d-flex flex-column gap-2">
            <div className="d-flex justify-content-between">
              <div className="skeleton-shimmer skeleton-block" style={{ width: '50%', height: '18px' }} />
              <div className="skeleton-shimmer skeleton-block" style={{ width: '60px', height: '16px' }} />
            </div>
            <div className="skeleton-shimmer skeleton-block" style={{ width: '100px', height: '14px' }} />
            <div className="skeleton-shimmer skeleton-block" style={{ width: '90%', height: '14px' }} />
            <div className="skeleton-shimmer skeleton-block" style={{ width: '80%', height: '14px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── SKELETON CARD FOR SAVED ADDRESSES ──
export const AddressSkeleton = () => {
  return (
    <div className="row g-3">
      {[1, 2].map((i) => (
        <div key={i} className="col-md-6">
          <div className="p-3 border rounded-3 bg-white d-flex flex-column gap-2" style={{ minHeight: '160px' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="skeleton-shimmer skeleton-block" style={{ width: '100px', height: '20px' }} />
              <div className="skeleton-shimmer skeleton-block" style={{ width: '50px', height: '16px', borderRadius: '4px' }} />
            </div>
            <div className="skeleton-shimmer skeleton-block" style={{ width: '150px', height: '16px', marginTop: '4px' }} />
            <div className="skeleton-shimmer skeleton-block" style={{ width: '85%', height: '14px' }} />
            <div className="skeleton-shimmer skeleton-block" style={{ width: '75%', height: '14px' }} />
            <div className="d-flex gap-2 mt-2">
              <div className="skeleton-shimmer skeleton-block" style={{ width: '60px', height: '28px', borderRadius: '4px' }} />
              <div className="skeleton-shimmer skeleton-block" style={{ width: '60px', height: '28px', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── SKELETON CARD FOR WISHLIST ──
export const WishlistSkeleton = () => {
  return (
    <div className="row g-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="col-xl-3 col-lg-4 col-sm-6">
          <div className="p-3 border rounded-3 bg-white d-flex flex-column gap-2" style={{ minHeight: '320px' }}>
            <div className="skeleton-shimmer skeleton-block" style={{ width: '100%', height: '180px', borderRadius: '8px' }} />
            <div className="skeleton-shimmer skeleton-block" style={{ width: '70%', height: '18px', marginTop: '8px' }} />
            <div className="skeleton-shimmer skeleton-block" style={{ width: '40%', height: '14px' }} />
            <div className="skeleton-shimmer skeleton-block" style={{ width: '50%', height: '20px' }} />
            <div className="skeleton-shimmer skeleton-block" style={{ width: '100%', height: '36px', borderRadius: '6px', marginTop: 'auto' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── SKELETON CARD FOR TRACK ORDER ──
export const TrackOrderSkeleton = () => {
  return (
    <div className="p-4 border rounded-3 bg-white d-flex flex-column gap-4" style={{ minHeight: '400px' }}>
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column gap-2" style={{ width: '40%' }}>
          <div className="skeleton-shimmer skeleton-block" style={{ height: '24px' }} />
          <div className="skeleton-shimmer skeleton-block" style={{ height: '14px', width: '60%' }} />
        </div>
        <div className="skeleton-shimmer skeleton-block" style={{ width: '100px', height: '30px', borderRadius: '6px' }} />
      </div>
      <hr style={{ color: '#e5e7eb', margin: 0 }} />
      <div className="d-flex flex-column gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="d-flex gap-3 align-items-start">
            <div className="skeleton-shimmer skeleton-block" style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0 }} />
            <div className="d-flex flex-column gap-2 flex-grow-1">
              <div className="skeleton-shimmer skeleton-block" style={{ width: '30%', height: '16px' }} />
              <div className="skeleton-shimmer skeleton-block" style={{ width: '50%', height: '14px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── SKELETON CARD FOR PRODUCT DETAILS ──
export const ProductDetailsSkeleton = () => {
  return (
    <div className="container py-4 my-2">
      <div className="row g-4">
        {/* Images Column */}
        <div className="col-md-6 d-flex flex-column gap-3">
          <div className="skeleton-shimmer skeleton-block" style={{ width: '100%', height: '400px', borderRadius: '12px' }} />
          <div className="d-flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-shimmer skeleton-block" style={{ width: '80px', height: '80px', borderRadius: '8px' }} />
            ))}
          </div>
        </div>
        {/* Info Column */}
        <div className="col-md-6 d-flex flex-column gap-3">
          <div className="skeleton-shimmer skeleton-block" style={{ width: '40%', height: '16px' }} />
          <div className="skeleton-shimmer skeleton-block" style={{ width: '85%', height: '32px', borderRadius: '6px' }} />
          <div className="skeleton-shimmer skeleton-block" style={{ width: '150px', height: '20px' }} />
          <hr style={{ color: '#e5e7eb', margin: '8px 0' }} />
          <div className="skeleton-shimmer skeleton-block" style={{ width: '120px', height: '28px' }} />
          <div className="skeleton-shimmer skeleton-block" style={{ width: '80%', height: '60px', borderRadius: '6px' }} />
          <div className="skeleton-shimmer skeleton-block" style={{ width: '100px', height: '18px' }} />
          <div className="d-flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-shimmer skeleton-block" style={{ width: '60px', height: '36px', borderRadius: '4px' }} />
            ))}
          </div>
          <div className="d-flex gap-3 mt-3">
            <div className="skeleton-shimmer skeleton-block" style={{ width: '180px', height: '48px', borderRadius: '8px' }} />
            <div className="skeleton-shimmer skeleton-block" style={{ width: '180px', height: '48px', borderRadius: '8px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
