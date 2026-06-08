import React from 'react';
import '../../assets/styles/PaymentPopup.css';

const PaymentPopup = ({ 
  isOpen, 
  status = 'success', 
  onClose, 
  details = {}, 
  onDownloadReceipt 
}) => {
  if (!isOpen) return null;

  const defaultDetails = {
    amount: '$145.78',
    transactionId: 'TXN-899088786',
    paymentMethod: 'Credit card',
    date: 'Apr 04,2026',
    time: '12:34 PM',
    merchant: 'Shop name',
    ...details
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'payment-popup-overlay') {
      onClose();
    }
  };

  const isSuccess = status === 'success';

  return (
    <div className="payment-popup-overlay" onClick={handleOverlayClick}>
      <div className="payment-popup-content">
        
        {/* Close Button */}
        <button className="payment-popup-close" onClick={onClose} aria-label="Close popup">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Status Icon */}
        <div className="payment-popup-icon-wrap">
          {isSuccess ? (
            <svg className="payment-popup-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="40" fill="#00a800" />
              <path d="M26 41L35 50L54 29" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="payment-popup-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="40" fill="#ff4d4d" />
              <path d="M28 28L52 52M52 28L28 52" stroke="white" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {/* Title & Subtitle */}
        <h2 className="payment-popup-title">
          {isSuccess ? 'Payment Successful Completed' : 'Payment failed'}
        </h2>
        <p className="payment-popup-subtitle">
          {isSuccess 
            ? 'Your payment has been processed successfully. you will receive a confirmation email shortly'
            : 'Your payment could not be processed. Please try again or use a different payment method.'
          }
        </p>

        {/* Transaction Details Box */}
        <div className="payment-popup-details">
          <div className="payment-popup-row">
            <span className="payment-popup-label">Amount</span>
            <span className="payment-popup-value">{defaultDetails.amount}</span>
          </div>
          
          <div className="payment-popup-divider" />

          <div className="payment-popup-row">
            <span className="payment-popup-label">Order ID</span>
            <span className="payment-popup-value">{defaultDetails.transactionId}</span>
          </div>

          <div className="payment-popup-row">
            <span className="payment-popup-label">Payment method</span>
            <span className="payment-popup-value">{defaultDetails.paymentMethod}</span>
          </div>

          <div className="payment-popup-row">
            <span className="payment-popup-label">Date</span>
            <span className="payment-popup-value">{defaultDetails.date}</span>
          </div>

          <div className="payment-popup-row">
            <span className="payment-popup-label">Time</span>
            <span className="payment-popup-value">{defaultDetails.time}</span>
          </div>

          <div className="payment-popup-row">
            <span className="payment-popup-label">Merchant</span>
            <span className="payment-popup-value">{defaultDetails.merchant}</span>
          </div>
        </div>

        {/* Download Receipt Button (Only for Success) */}
        {isSuccess && (
          <div className="payment-popup-action">
            <button 
              className="payment-popup-btn" 
              onClick={onDownloadReceipt || (() => alert('Downloading receipt...'))}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download receipt
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentPopup;
