import React from 'react';
import '../../assets/styles/Skeleton.css';

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="skeleton-stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-stat-card">
          <div className="skeleton-stat-top">
            <div className="skeleton-stat-info">
              <div className="skeleton-block skeleton-shimmer skeleton-label" style={{ width: '40%', height: '14px' }}></div>
              <div className="skeleton-block skeleton-shimmer" style={{ width: '70%', height: '28px', marginTop: '4px' }}></div>
            </div>
            <div className="skeleton-block skeleton-shimmer skeleton-stat-icon"></div>
          </div>
          <div className="skeleton-block skeleton-shimmer skeleton-stat-trend"></div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div>
      {/* Search and Filters Toolbar Skeleton */}
      <div className="skeleton-toolbar">
        <div className="skeleton-toolbar-left">
          <div className="skeleton-block skeleton-shimmer skeleton-toolbar-item" style={{ width: '240px' }}></div>
          <div className="skeleton-block skeleton-shimmer skeleton-toolbar-item" style={{ width: '150px' }}></div>
          <div className="skeleton-block skeleton-shimmer skeleton-toolbar-item" style={{ width: '150px' }}></div>
        </div>
        <div className="skeleton-block skeleton-shimmer skeleton-toolbar-item" style={{ width: '120px' }}></div>
      </div>

      {/* Table Skeleton */}
      <div className="skeleton-table-wrapper">
        <div className="skeleton-table-header" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="skeleton-block skeleton-shimmer" style={{ height: '16px' }}></div>
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="skeleton-table-row" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="skeleton-block skeleton-shimmer" style={{ height: '14px', width: c === 0 ? '40%' : '75%' }}></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const FormSkeleton = () => {
  return (
    <div className="skeleton-form-grid">
      <div className="skeleton-form-panel">
        <div className="skeleton-block skeleton-shimmer" style={{ width: '30%', height: '24px', marginBottom: '12px' }}></div>
        <div className="skeleton-form-row mb-3">
          <div className="skeleton-form-group">
            <div className="skeleton-block skeleton-shimmer skeleton-label"></div>
            <div className="skeleton-block skeleton-shimmer skeleton-input"></div>
          </div>
          <div className="skeleton-form-group">
            <div className="skeleton-block skeleton-shimmer skeleton-label"></div>
            <div className="skeleton-block skeleton-shimmer skeleton-input"></div>
          </div>
        </div>
        <div className="skeleton-form-row mb-3">
          <div className="skeleton-form-group">
            <div className="skeleton-block skeleton-shimmer skeleton-label"></div>
            <div className="skeleton-block skeleton-shimmer skeleton-input" style={{ height: '120px' }}></div>
          </div>
        </div>
        <div className="skeleton-form-row" style={{ justifyContent: 'flex-end', gap: '12px' }}>
          <div className="skeleton-block skeleton-shimmer" style={{ width: '100px', height: '42px', borderRadius: '8px' }}></div>
          <div className="skeleton-block skeleton-shimmer" style={{ width: '140px', height: '42px', borderRadius: '8px' }}></div>
        </div>
      </div>
      <div className="skeleton-form-panel">
        <div className="skeleton-block skeleton-shimmer" style={{ width: '50%', height: '20px', marginBottom: '12px' }}></div>
        <div className="skeleton-block skeleton-shimmer" style={{ height: '180px', borderRadius: '12px' }}></div>
        <div className="skeleton-block skeleton-shimmer" style={{ width: '70%', height: '14px', marginTop: '12px' }}></div>
      </div>
    </div>
  );
};

export const OrderDetailsSkeleton = () => {
  return (
    <div className="skeleton-details-grid">
      <div className="skeleton-form-panel">
        <div className="skeleton-block skeleton-shimmer" style={{ width: '30%', height: '24px', marginBottom: '12px' }}></div>
        <div className="skeleton-block skeleton-shimmer" style={{ height: '150px', borderRadius: '12px', marginBottom: '12px' }}></div>
        <div className="skeleton-block skeleton-shimmer" style={{ height: '120px', borderRadius: '12px' }}></div>
      </div>
      <div className="skeleton-form-panel">
        <div className="skeleton-block skeleton-shimmer" style={{ width: '40%', height: '22px', marginBottom: '12px' }}></div>
        <div className="skeleton-block skeleton-shimmer" style={{ height: '100px', marginBottom: '12px' }}></div>
        <div className="skeleton-block skeleton-shimmer" style={{ height: '100px' }}></div>
      </div>
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div>
      <CardSkeleton count={4} />
      <div className="row mb-4">
        <div className="col-12 col-xl-8 mb-4 mb-xl-0">
          <div className="skeleton-chart-container">
            <div className="skeleton-block skeleton-shimmer" style={{ width: '25%', height: '20px' }}></div>
            <div className="skeleton-block skeleton-shimmer" style={{ flex: 1 }}></div>
          </div>
        </div>
        <div className="col-12 col-xl-4">
          <div className="skeleton-chart-container">
            <div className="skeleton-block skeleton-shimmer" style={{ width: '40%', height: '20px' }}></div>
            <div className="skeleton-block skeleton-shimmer" style={{ flex: 1 }}></div>
          </div>
        </div>
      </div>
      <TableSkeleton rows={4} cols={5} />
    </div>
  );
};
