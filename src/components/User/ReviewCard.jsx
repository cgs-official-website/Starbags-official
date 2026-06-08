import React, { useState, useRef, useEffect } from 'react';
import { FaStar } from 'react-icons/fa6';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FiEdit2, FiTrash2, FiEyeOff } from 'react-icons/fi';
import { BiLike, BiDislike, BiSolidLike, BiSolidDislike } from 'react-icons/bi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../context/ProductsContext';
import { db } from '../../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import '../../assets/styles/ReviewCard.css';

function StarRating({ rating, max = 5 }) {
  return (
    <div className="d-flex align-items-center gap-1 star-rating-row">
      {Array.from({ length: max }, (_, i) => (
        <FaStar
          key={i}
          className={i < rating ? 'star-filled' : 'star-empty'}
        />
      ))}
    </div>
  );
}

const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function ReviewCard({ review, onEdit, onDelete }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { products } = useProducts();
  const uid = currentUser?.uid;

  const liked    = (review.likes    || []).includes(uid);
  const disliked = (review.dislikes || []).includes(uid);

  const likeCount    = Math.max(0, review.likeCount    ?? 0);
  const dislikeCount = Math.max(0, review.dislikeCount ?? 0);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProductClick = () => {
    const matchedProduct = products.find(
      (p) =>
        p.name === review.productName ||
        p.id === review.productId ||
        p.productId === review.productId
    );
    const productToNavigate = matchedProduct || {
      name: review.productName,
      id: review.productId || review.id,
      image: review.productImage || review.image,
    };
    navigate("/product", {
      state: { product: productToNavigate },
    });
  };

  const handleLike = async () => {
    if (!uid) return;
    const ref = doc(db, 'reviews', review.firestoreId);
    const currentLikes    = Math.max(0, review.likeCount    ?? 0);
    const currentDislikes = Math.max(0, review.dislikeCount ?? 0);
    try {
      if (liked) {
        await updateDoc(ref, {
          likes:     arrayRemove(uid),
          likeCount: Math.max(0, currentLikes - 1),
        });
      } else {
        const updates = {
          likes:     arrayUnion(uid),
          likeCount: currentLikes + 1,
        };
        if (disliked) {
          updates.dislikes     = arrayRemove(uid);
          updates.dislikeCount = Math.max(0, currentDislikes - 1);
        }
        await updateDoc(ref, updates);
      }
    } catch (err) {
      console.error('Error updating like feedback:', err);
    }
  };

  const handleDislike = async () => {
    if (!uid) return;
    const ref = doc(db, 'reviews', review.firestoreId);
    const currentLikes    = Math.max(0, review.likeCount    ?? 0);
    const currentDislikes = Math.max(0, review.dislikeCount ?? 0);
    try {
      if (disliked) {
        await updateDoc(ref, {
          dislikes:     arrayRemove(uid),
          dislikeCount: Math.max(0, currentDislikes - 1),
        });
      } else {
        const updates = {
          dislikes:     arrayUnion(uid),
          dislikeCount: currentDislikes + 1,
        };
        if (liked) {
          updates.likes     = arrayRemove(uid);
          updates.likeCount = Math.max(0, currentLikes - 1);
        }
        await updateDoc(ref, updates);
      }
    } catch (err) {
      console.error('Error updating dislike feedback:', err);
    }
  };

  const handleEdit = () => {
    setMenuOpen(false);
    if (onEdit) onEdit(review);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (onDelete) onDelete(review.id || review.firestoreId);
  };

  return (
    <div className={`review-card mb-3 ${review.isHidden ? 'review-card--hidden' : ''}`}>

      {/* Header: product image + name | stars + menu */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div 
          className="d-flex align-items-center gap-2" 
          onClick={handleProductClick} 
          style={{ cursor: 'pointer' }}
          title="View Product"
        >
          <img
            src={review.productImage || review.image}
            alt={review.productName}
            className="review-product-img"
          />
          <span className="review-product-name">{review.productName}</span>
        </div>

        {review.isHidden && (
          <span className="review-hidden-badge">
            <FiEyeOff size={12} style={{ marginRight: '4px' }} />
            Hidden by admin
          </span>
        )}

        <div className="d-flex align-items-center gap-2">
          <StarRating rating={review.rating} />

          <div className="review-menu-wrapper" ref={menuRef}>
            <button
              className={`review-menu-btn ${menuOpen ? 'active' : ''}`}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Review options"
            >
              <BsThreeDotsVertical />
            </button>

            {menuOpen && (
              <div className="review-dropdown">
                <button
                  className={`review-dropdown-item edit ${review.isHidden ? 'disabled' : ''}`}
                  onClick={review.isHidden ? undefined : handleEdit}
                  style={review.isHidden ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                  title={review.isHidden ? 'Cannot edit a hidden review' : 'Edit review'}
                >
                  <FiEdit2 className="dropdown-icon" />
                  Edit
                </button>
                <button className="review-dropdown-item delete" onClick={handleDelete}>
                  <FiTrash2 className="dropdown-icon" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review body */}
      <p className="review-body-text mb-1">{review.reviewText || review.text}</p>
      <p className="review-short-text mb-0">{review.shortReview || ''}</p>

      {/* Date & Like / Dislike */}
      <div className="d-flex align-items-center justify-content-between mt-3 border-top pt-2">
        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
          {review.date ? `Reviewed on ${formatDate(review.date)}` : ''}
        </span>
        <div className="d-flex align-items-center gap-3">
          <button
            className="review-action-btn"
            style={{
              color: liked ? '#058aff' : '#6c757d',
              background: 'none',
              border: 'none',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: uid ? 'pointer' : 'not-allowed',
            }}
            onClick={handleLike}
            disabled={!uid}
            aria-label="Like this review"
          >
            {liked ? <BiSolidLike /> : <BiLike />}
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#6c757d' }}>
              {likeCount}
            </span>
          </button>

          <button
            className="review-action-btn dislike"
            style={{
              color: disliked ? '#f25858' : '#6c757d',
              background: 'none',
              border: 'none',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: uid ? 'pointer' : 'not-allowed',
            }}
            onClick={handleDislike}
            disabled={!uid}
            aria-label="Dislike this review"
          >
            {disliked ? <BiSolidDislike /> : <BiDislike />}
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#6c757d' }}>
              {dislikeCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewCard;


// import React, { useState, useRef, useEffect } from 'react';
// import { FaStar } from 'react-icons/fa6';
// import { BsThreeDotsVertical } from 'react-icons/bs';
// import { FiEdit2, FiTrash2, FiEyeOff } from 'react-icons/fi';
// import { BiLike, BiDislike, BiSolidLike, BiSolidDislike } from 'react-icons/bi';
// import { useAuth } from '../../context/AuthContext';
// import { db } from '../../firebase';
// import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
// import '../../assets/styles/ReviewCard.css';

// function StarRating({ rating, max = 5 }) {
//   return (
//     <div className="d-flex align-items-center gap-1">
//       {Array.from({ length: max }, (_, i) => (
//         <FaStar
//           key={i}
//           // FIX 2: visible muted grey instead of near-invisible white
//           style={{ color: i < rating ? '#FFC107' : '#9ca3af', fontSize: '1rem' }}
//         />
//       ))}
//     </div>
//   );
// }

// const formatDate = (ts) => {
//   if (!ts) return '';
//   const d = ts.toDate ? ts.toDate() : new Date(ts);
//   return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
// };

// function ReviewCard({ review, onEdit, onDelete }) {
//   const { currentUser } = useAuth();
//   const uid = currentUser?.uid;

//   const liked    = (review.likes    || []).includes(uid);
//   const disliked = (review.dislikes || []).includes(uid);

//   // FIX 3: always clamp counts to 0 — never show negative
//   const likeCount    = Math.max(0, review.likeCount    ?? 0);
//   const dislikeCount = Math.max(0, review.dislikeCount ?? 0);

//   const [menuOpen, setMenuOpen] = useState(false);
//   const menuRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (menuRef.current && !menuRef.current.contains(e.target)) {
//         setMenuOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // FIX 3: guard against negative counts — use absolute values not increment()
//   const handleLike = async () => {
//     if (!uid) return;
//     const ref = doc(db, 'reviews', review.firestoreId);
//     const currentLikes    = Math.max(0, review.likeCount    ?? 0);
//     const currentDislikes = Math.max(0, review.dislikeCount ?? 0);
//     try {
//       if (liked) {
//         await updateDoc(ref, {
//           likes:     arrayRemove(uid),
//           likeCount: Math.max(0, currentLikes - 1),
//         });
//       } else {
//         const updates = {
//           likes:     arrayUnion(uid),
//           likeCount: currentLikes + 1,
//         };
//         if (disliked) {
//           updates.dislikes     = arrayRemove(uid);
//           updates.dislikeCount = Math.max(0, currentDislikes - 1);
//         }
//         await updateDoc(ref, updates);
//       }
//     } catch (err) {
//       console.error('Error updating like feedback:', err);
//     }
//   };

//   const handleDislike = async () => {
//     if (!uid) return;
//     const ref = doc(db, 'reviews', review.firestoreId);
//     const currentLikes    = Math.max(0, review.likeCount    ?? 0);
//     const currentDislikes = Math.max(0, review.dislikeCount ?? 0);
//     try {
//       if (disliked) {
//         await updateDoc(ref, {
//           dislikes:     arrayRemove(uid),
//           dislikeCount: Math.max(0, currentDislikes - 1),
//         });
//       } else {
//         const updates = {
//           dislikes:     arrayUnion(uid),
//           dislikeCount: currentDislikes + 1,
//         };
//         if (liked) {
//           updates.likes     = arrayRemove(uid);
//           updates.likeCount = Math.max(0, currentLikes - 1);
//         }
//         await updateDoc(ref, updates);
//       }
//     } catch (err) {
//       console.error('Error updating dislike feedback:', err);
//     }
//   };

//   const handleEdit = () => {
//     setMenuOpen(false);
//     if (onEdit) onEdit(review);
//   };

//   const handleDelete = () => {
//     setMenuOpen(false);
//     if (onDelete) onDelete(review.id || review.firestoreId);
//   };

//   return (
//     <div className={`review-card mb-3 ${review.isHidden ? 'review-card--hidden' : ''}`}>

//       {/* Header: product image + name | stars + menu */}
//       <div className="d-flex align-items-center justify-content-between mb-2">
//         <div className="d-flex align-items-center gap-2">
//           <img
//             src={review.productImage || review.image}
//             alt={review.productName}
//             className="review-product-img"
//           />
//           <span className="review-product-name">{review.productName}</span>
//         </div>

//         {review.isHidden && (
//           <span className="review-hidden-badge">
//             <FiEyeOff size={12} style={{ marginRight: '4px' }} />
//             Hidden by admin
//           </span>
//         )}

//         <div className="d-flex align-items-center gap-2">
//           <StarRating rating={review.rating} />

//           <div className="review-menu-wrapper" ref={menuRef}>
//             <button
//               className={`review-menu-btn ${menuOpen ? 'active' : ''}`}
//               onClick={() => setMenuOpen((prev) => !prev)}
//               aria-label="Review options"
//             >
//               <BsThreeDotsVertical />
//             </button>

//             {menuOpen && (
//               <div className="review-dropdown">
//                 <button
//                   className={`review-dropdown-item edit ${review.isHidden ? 'disabled' : ''}`}
//                   onClick={review.isHidden ? undefined : handleEdit}
//                   style={review.isHidden ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
//                   title={review.isHidden ? 'Cannot edit a hidden review' : 'Edit review'}
//                 >
//                   <FiEdit2 className="dropdown-icon" />
//                   Edit
//                 </button>
//                 <button className="review-dropdown-item delete" onClick={handleDelete}>
//                   <FiTrash2 className="dropdown-icon" />
//                   Delete
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Review body */}
//       <p className="review-body-text mb-1">{review.reviewText || review.text}</p>
//       <p className="review-short-text mb-0">{review.shortReview || ''}</p>

//       {/* Date & Like / Dislike — FIX 3+4: real-time safe counts */}
//       <div className="d-flex align-items-center justify-content-between mt-3 border-top pt-2">
//         <span className="text-muted" style={{ fontSize: '0.72rem' }}>
//           {review.date ? `Reviewed on ${formatDate(review.date)}` : ''}
//         </span>
//         <div className="d-flex align-items-center gap-3">
//           <button
//             className="review-action-btn"
//             style={{
//               color: liked ? '#058aff' : '#6c757d',
//               background: 'none',
//               border: 'none',
//               fontSize: '16px',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '4px',
//               cursor: uid ? 'pointer' : 'not-allowed',
//             }}
//             onClick={handleLike}
//             disabled={!uid}
//             aria-label="Like this review"
//           >
//             {liked ? <BiSolidLike /> : <BiLike />}
//             <span style={{ fontSize: '12px', fontWeight: '500', color: '#6c757d' }}>
//               {likeCount}
//             </span>
//           </button>

//           <button
//             className="review-action-btn dislike"
//             style={{
//               color: disliked ? '#f25858' : '#6c757d',
//               background: 'none',
//               border: 'none',
//               fontSize: '16px',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '4px',
//               cursor: uid ? 'pointer' : 'not-allowed',
//             }}
//             onClick={handleDislike}
//             disabled={!uid}
//             aria-label="Dislike this review"
//           >
//             {disliked ? <BiSolidDislike /> : <BiDislike />}
//             <span style={{ fontSize: '12px', fontWeight: '500', color: '#6c757d' }}>
//               {dislikeCount}
//             </span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ReviewCard;

// // import React, { useState, useRef, useEffect } from 'react';
// // import { FaStar } from 'react-icons/fa6';
// // import { BsThreeDotsVertical } from 'react-icons/bs';
// // import { FiEdit2, FiTrash2, FiEyeOff } from 'react-icons/fi';
// // import { BiLike, BiDislike, BiSolidLike, BiSolidDislike } from 'react-icons/bi';
// // import { useAuth } from '../../context/AuthContext';
// // import { db } from '../../firebase';
// // import { doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
// // import '../../assets/styles/ReviewCard.css';

// // function StarRating({ rating, max = 5 }) {
// //   return (
// //     <div className="d-flex align-items-center gap-1">
// //       {Array.from({ length: max }, (_, i) => (
// //         <FaStar
// //           key={i}
// //           style={{ color: i < rating ? '#FFC107' : '#e0e0e0', fontSize: '1rem' }}
// //         />
// //       ))}
// //     </div>
// //   );
// // }

// // const formatDate = (ts) => {
// //   if (!ts) return '';
// //   const d = ts.toDate ? ts.toDate() : new Date(ts);
// //   return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
// // };

// // function ReviewCard({ review, onEdit, onDelete }) {
// //   const { currentUser } = useAuth();
// //   const uid = currentUser?.uid;

// //   // Get real like/dislike status from Firestore data
// //   const liked = (review.likes || []).includes(uid);
// //   const disliked = (review.dislikes || []).includes(uid);

// //   // Real counts from Firestore
// //   const likeCount = review.likeCount || 0;
// //   const dislikeCount = review.dislikeCount || 0;

// //   const [menuOpen, setMenuOpen] = useState(false);
// //   const menuRef = useRef(null);

// //   useEffect(() => {
// //     const handleClickOutside = (e) => {
// //       if (menuRef.current && !menuRef.current.contains(e.target)) {
// //         setMenuOpen(false);
// //       }
// //     };
// //     document.addEventListener('mousedown', handleClickOutside);
// //     return () => document.removeEventListener('mousedown', handleClickOutside);
// //   }, []);

// //   const handleLike = async () => {
// //     if (!uid) return;
// //     const ref = doc(db, "reviews", review.firestoreId);
// //     try {
// //       if (liked) {
// //         await updateDoc(ref, { 
// //           likes: arrayRemove(uid), 
// //           likeCount: increment(-1) 
// //         });
// //       } else {
// //         const updates = { 
// //           likes: arrayUnion(uid), 
// //           likeCount: increment(1) 
// //         };
// //         if (disliked) {
// //           updates.dislikes = arrayRemove(uid);
// //           updates.dislikeCount = increment(-1);
// //         }
// //         await updateDoc(ref, updates);
// //       }
// //     } catch (err) {
// //       console.error("Error updating like feedback:", err);
// //     }
// //   };

// //   const handleDislike = async () => {
// //     if (!uid) return;
// //     const ref = doc(db, "reviews", review.firestoreId);
// //     try {
// //       if (disliked) {
// //         await updateDoc(ref, { 
// //           dislikes: arrayRemove(uid), 
// //           dislikeCount: increment(-1) 
// //         });
// //       } else {
// //         const updates = { 
// //           dislikes: arrayUnion(uid), 
// //           dislikeCount: increment(1) 
// //         };
// //         if (liked) {
// //           updates.likes = arrayRemove(uid);
// //           updates.likeCount = increment(-1);
// //         }
// //         await updateDoc(ref, updates);
// //       }
// //     } catch (err) {
// //       console.error("Error updating dislike feedback:", err);
// //     }
// //   };

// //   const handleEdit = () => {
// //     setMenuOpen(false);
// //     if (onEdit) onEdit(review);
// //   };

// //   const handleDelete = () => {
// //     setMenuOpen(false);
// //     if (onDelete) onDelete(review.id || review.firestoreId);
// //   };

// //   return (
// //     <div className={`review-card mb-3 ${review.isHidden ? 'review-card--hidden' : ''}`}>
// //       {/* Header: product image + name | stars + menu */}
// //       <div className="d-flex align-items-center justify-content-between mb-2">
// //         <div className="d-flex align-items-center gap-2">
// //           <img
// //             src={review.productImage || review.image}
// //             alt={review.productName}
// //             className="review-product-img"
// //           />
// //           <span className="review-product-name">{review.productName}</span>
// //         </div>

// //         {/* Hidden by admin badge */}
// //         {review.isHidden && (
// //           <span className="review-hidden-badge">
// //             <FiEyeOff size={12} style={{ marginRight: '4px' }} />
// //             Hidden by admin
// //           </span>
// //         )}

// //         <div className="d-flex align-items-center gap-2">
// //           <StarRating rating={review.rating} />

// //           {/* Three Dot Menu */}
// //           <div className="review-menu-wrapper" ref={menuRef}>
// //             <button
// //               className={`review-menu-btn ${menuOpen ? 'active' : ''}`}
// //               onClick={() => setMenuOpen((prev) => !prev)}
// //               aria-label="Review options"
// //             >
// //               <BsThreeDotsVertical />
// //             </button>

// //             {menuOpen && (
// //               <div className="review-dropdown">
// //                 <button
// //                   className={`review-dropdown-item edit ${review.isHidden ? 'disabled' : ''}`}
// //                   onClick={review.isHidden ? undefined : handleEdit}
// //                   style={review.isHidden ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
// //                   title={review.isHidden ? 'Cannot edit a hidden review' : 'Edit review'}
// //                 >
// //                   <FiEdit2 className="dropdown-icon" />
// //                   Edit
// //                 </button>
// //                 <button className="review-dropdown-item delete" onClick={handleDelete}>
// //                   <FiTrash2 className="dropdown-icon" />
// //                   Delete
// //                 </button>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Review body */}
// //       <p className="review-body-text mb-1">{review.reviewText || review.text}</p>
// //       <p className="review-short-text mb-0">{review.shortReview || ''}</p>

// //       {/* Date & Like / Dislike with REAL COUNTS */}
// //       <div className="d-flex align-items-center justify-content-between mt-3 border-top pt-2">
// //         <span className="text-muted" style={{ fontSize: "0.72rem" }}>
// //           {review.date ? `Reviewed on ${formatDate(review.date)}` : ""}
// //         </span>
// //         <div className="d-flex align-items-center gap-3">
// //           {/* Like Button with Count */}
// //           <button
// //             className="review-action-btn"
// //             style={{
// //               color: liked ? "#058aff" : "#6c757d",
// //               background: "none",
// //               border: "none",
// //               fontSize: "16px",
// //               display: "flex",
// //               alignItems: "center",
// //               gap: "4px",
// //               cursor: uid ? "pointer" : "not-allowed"
// //             }}
// //             onClick={handleLike}
// //             disabled={!uid}
// //             aria-label="Like this review"
// //           >
// //             {liked ? <BiSolidLike /> : <BiLike />}
// //             <span style={{ fontSize: "12px", fontWeight: "500" }}>
// //               {likeCount}
// //             </span>
// //           </button>

// //           {/* Dislike Button with Count */}
// //           <button
// //             className="review-action-btn dislike"
// //             style={{
// //               color: disliked ? "#f25858" : "#6c757d",
// //               background: "none",
// //               border: "none",
// //               fontSize: "16px",
// //               display: "flex",
// //               alignItems: "center",
// //               gap: "4px",
// //               cursor: uid ? "pointer" : "not-allowed"
// //             }}
// //             onClick={handleDislike}
// //             disabled={!uid}
// //             aria-label="Dislike this review"
// //           >
// //             {disliked ? <BiSolidDislike /> : <BiDislike />}
// //             <span style={{ fontSize: "12px", fontWeight: "500" }}>
// //               {dislikeCount}
// //             </span>
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // export default ReviewCard;




// // import React, { useState, useRef, useEffect } from 'react';
// // // import { thumbsUp, FaThumbsDown, FaStar } from 'react-icons/fa';
// // import { FaRegThumbsUp, FaRegThumbsDown ,FaStar} from 'react-icons/fa6';
// // import { BsThreeDotsVertical } from 'react-icons/bs';
// // import { FiEdit2, FiTrash2, FiEyeOff } from 'react-icons/fi';
// // import '../../assets/styles/ReviewCard.css';

// // function StarRating({ rating, max = 5 }) {
// //   return (
// //     <div className="d-flex align-items-center gap-1">
// //       {Array.from({ length: max }, (_, i) => (
// //         <FaStar
// //           key={i}
// //           style={{ color: i < rating ? '#FFC107' : '#e0e0e0', fontSize: '1rem' }}
// //         />
// //       ))}
// //     </div>
// //   );
// // }

// // function ReviewCard({ review, onEdit, onDelete }) {
// //   const [liked, setLiked] = useState(false);
// //   const [disliked, setDisliked] = useState(false);
// //   const [menuOpen, setMenuOpen] = useState(false);
// //   const menuRef = useRef(null);

// //   useEffect(() => {
// //     const handleClickOutside = (e) => {
// //       if (menuRef.current && !menuRef.current.contains(e.target)) {
// //         setMenuOpen(false);
// //       }
// //     };
// //     document.addEventListener('mousedown', handleClickOutside);
// //     return () => document.removeEventListener('mousedown', handleClickOutside);
// //   }, []);

// //   const handleLike = () => {
// //     if (liked) { setLiked(false); }
// //     else { setLiked(true); if (disliked) setDisliked(false); }
// //   };

// //   const handleDislike = () => {
// //     if (disliked) { setDisliked(false); }
// //     else { setDisliked(true); if (liked) setLiked(false); }
// //   };

// //   const handleEdit = () => {
// //     setMenuOpen(false);
// //     if (onEdit) onEdit(review);
// //   };

// //   const handleDelete = () => {
// //     setMenuOpen(false);
// //     if (onDelete) onDelete(review.id);
// //   };

// //   return (
// //     <div className={`review-card mb-3 ${review.isHidden ? 'review-card--hidden' : ''}`}>

// //       {/* Header: product image + name | stars + menu */}
// //       <div className="d-flex align-items-center justify-content-between mb-2">
// //         <div className="d-flex align-items-center gap-2">
// //           <img
// //             src={review.productImage}
// //             alt={review.productName}
// //             className="review-product-img"
// //           />
// //           <span className="review-product-name">{review.productName}</span>
// //         </div>

// //         {/* Hidden by admin badge */}
// //         {review.isHidden && (
// //           <span className="review-hidden-badge">
// //             <FiEyeOff size={12} style={{ marginRight: '4px' }} />
// //             Hidden by admin
// //           </span>
// //         )}

// //         <div className="d-flex align-items-center gap-2">
// //           <StarRating rating={review.rating} />

// //           {/* Three Dot Menu */}
// //           <div className="review-menu-wrapper" ref={menuRef}>
// //             <button
// //               className={`review-menu-btn ${menuOpen ? 'active' : ''}`}
// //               onClick={() => setMenuOpen((prev) => !prev)}
// //               aria-label="Review options"
// //             >
// //               <BsThreeDotsVertical />
// //             </button>

// //             {menuOpen && (
// //               <div className="review-dropdown">
// //                 <button
// //                   className={`review-dropdown-item edit ${review.isHidden ? 'disabled' : ''}`}
// //                   onClick={review.isHidden ? undefined : handleEdit}
// //                   style={review.isHidden ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
// //                   title={review.isHidden ? 'Cannot edit a hidden review' : 'Edit review'}
// //                 >
// //                   <FiEdit2 className="dropdown-icon" />
// //                   Edit
// //                 </button>
// //                 <button className="review-dropdown-item delete" onClick={handleDelete}>
// //                   <FiTrash2 className="dropdown-icon" />
// //                   Delete
// //                 </button>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Review body */}
// //       <p className="review-body-text mb-1">{review.reviewText}</p>
// //       <p className="review-short-text mb-0">{review.shortReview}</p>

// //       {/* Like / Dislike */}
// //       <div className="d-flex align-items-center justify-content-end gap-3 mt-2">
// //         <button
// //           className={`review-action-btn ${liked ? 'active-like' : ''}`}
// //           onClick={handleLike}
// //           aria-label="Like this review"
// //         >
// //           <FaRegThumbsUp />
// //         </button>
// //         <button
// //           className={`review-action-btn dislike ${disliked ? 'active-dislike' : ''}`}
// //           onClick={handleDislike}
// //           aria-label="Dislike this review"
// //         >
// //           <FaRegThumbsDown />
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }

// // export default ReviewCard;


// // // import React, { useState, useRef, useEffect } from 'react';
// // // import { FaStar } from 'react-icons/fa6';
// // // import { BsThreeDotsVertical } from 'react-icons/bs';
// // // import { FiEdit2, FiTrash2, FiEyeOff } from 'react-icons/fi';
// // // import { BiLike, BiDislike, BiSolidLike, BiSolidDislike } from 'react-icons/bi';
// // // import { useAuth } from '../../context/AuthContext';
// // // import { db } from '../../firebase';
// // // import { doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
// // // import '../../assets/styles/ReviewCard.css';

// // // function StarRating({ rating, max = 5 }) {
// // //   return (
// // //     <div className="d-flex align-items-center gap-1">
// // //       {Array.from({ length: max }, (_, i) => (
// // //         <FaStar
// // //           key={i}
// // //           style={{ color: i < rating ? '#FFC107' : '#e0e0e0', fontSize: '1rem' }}
// // //         />
// // //       ))}
// // //     </div>
// // //   );
// // // }

// // // const formatDate = (ts) => {
// // //   if (!ts) return '';
// // //   const d = ts.toDate ? ts.toDate() : new Date(ts);
// // //   return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
// // // };

// // // function ReviewCard({ review, onEdit, onDelete }) {
// // //   const { currentUser } = useAuth();
// // //   const uid = currentUser?.uid;

// // //   const liked = (review.likes || []).includes(uid);
// // //   const disliked = (review.dislikes || []).includes(uid);

// // //   const [menuOpen, setMenuOpen] = useState(false);
// // //   const menuRef = useRef(null);

// // //   useEffect(() => {
// // //     const handleClickOutside = (e) => {
// // //       if (menuRef.current && !menuRef.current.contains(e.target)) {
// // //         setMenuOpen(false);
// // //       }
// // //     };
// // //     document.addEventListener('mousedown', handleClickOutside);
// // //     return () => document.removeEventListener('mousedown', handleClickOutside);
// // //   }, []);

// // //   const handleLike = async () => {
// // //     if (!uid) return;
// // //     const ref = doc(db, "reviews", review.firestoreId);
// // //     try {
// // //       if (liked) {
// // //         await updateDoc(ref, { likes: arrayRemove(uid), likeCount: increment(-1) });
// // //       } else {
// // //         const updates = { likes: arrayUnion(uid), likeCount: increment(1) };
// // //         if (disliked) {
// // //           updates.dislikes = arrayRemove(uid);
// // //           updates.dislikeCount = increment(-1);
// // //         }
// // //         await updateDoc(ref, updates);
// // //       }
// // //     } catch (err) {
// // //       console.error("Error updating like feedback in ReviewCard:", err);
// // //     }
// // //   };

// // //   const handleDislike = async () => {
// // //     if (!uid) return;
// // //     const ref = doc(db, "reviews", review.firestoreId);
// // //     try {
// // //       if (disliked) {
// // //         await updateDoc(ref, { dislikes: arrayRemove(uid), dislikeCount: increment(-1) });
// // //       } else {
// // //         const updates = { dislikes: arrayUnion(uid), dislikeCount: increment(1) };
// // //         if (liked) {
// // //           updates.likes = arrayRemove(uid);
// // //           updates.likeCount = increment(-1);
// // //         }
// // //         await updateDoc(ref, updates);
// // //       }
// // //     } catch (err) {
// // //       console.error("Error updating dislike feedback in ReviewCard:", err);
// // //     }
// // //   };

// // //   const handleEdit = () => {
// // //     setMenuOpen(false);
// // //     if (onEdit) onEdit(review);
// // //   };

// // //   const handleDelete = () => {
// // //     setMenuOpen(false);
// // //     if (onDelete) onDelete(review.id);
// // //   };

// // //   return (
// // //     <div className={`review-card mb-3 ${review.isHidden ? 'review-card--hidden' : ''}`}>

// // //       {/* Header: product image + name | stars + menu */}
// // //       <div className="d-flex align-items-center justify-content-between mb-2">
// // //         <div className="d-flex align-items-center gap-2">
// // //           <img
// // //             src={review.productImage}
// // //             alt={review.productName}
// // //             className="review-product-img"
// // //           />
// // //           <span className="review-product-name">{review.productName}</span>
// // //         </div>

// // //         {/* Hidden by admin badge */}
// // //         {review.isHidden && (
// // //           <span className="review-hidden-badge">
// // //             <FiEyeOff size={12} style={{ marginRight: '4px' }} />
// // //             Hidden by admin
// // //           </span>
// // //         )}

// // //         <div className="d-flex align-items-center gap-2">
// // //           <StarRating rating={review.rating} />

// // //           {/* Three Dot Menu */}
// // //           <div className="review-menu-wrapper" ref={menuRef}>
// // //             <button
// // //               className={`review-menu-btn ${menuOpen ? 'active' : ''}`}
// // //               onClick={() => setMenuOpen((prev) => !prev)}
// // //               aria-label="Review options"
// // //             >
// // //               <BsThreeDotsVertical />
// // //             </button>

// // //             {menuOpen && (
// // //               <div className="review-dropdown">
// // //                 <button
// // //                   className={`review-dropdown-item edit ${review.isHidden ? 'disabled' : ''}`}
// // //                   onClick={review.isHidden ? undefined : handleEdit}
// // //                   style={review.isHidden ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
// // //                   title={review.isHidden ? 'Cannot edit a hidden review' : 'Edit review'}
// // //                 >
// // //                   <FiEdit2 className="dropdown-icon" />
// // //                   Edit
// // //                 </button>
// // //                 <button className="review-dropdown-item delete" onClick={handleDelete}>
// // //                   <FiTrash2 className="dropdown-icon" />
// // //                   Delete
// // //                 </button>
// // //               </div>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>

// // //       {/* Review body */}
// // //       <p className="review-body-text mb-1">{review.reviewText}</p>
// // //       <p className="review-short-text mb-0">{review.shortReview}</p>

// // //       {/* Date & Like / Dislike */}
// // //       <div className="d-flex align-items-center justify-content-between mt-3 border-top pt-2">
// // //         <span className="text-muted" style={{ fontSize: "0.72rem" }}>
// // //           {review.date ? `Reviewed on ${formatDate(review.date)}` : ""}
// // //         </span>
// // //         <div className="d-flex align-items-center gap-3">
// // //           <button
// // //             className="review-action-btn"
// // //             style={{
// // //               color: liked ? "#058aff" : "#6c757d",
// // //               background: "none",
// // //               border: "none",
// // //               fontSize: "16px",
// // //               display: "flex",
// // //               alignItems: "center",
// // //               gap: "4px"
// // //             }}
// // //             onClick={handleLike}
// // //             aria-label="Like this review"
// // //           >
// // //             {liked ? <BiSolidLike /> : <BiLike />}
// // //             <span style={{ fontSize: "12px", color: "#6c757d" }}>
// // //               {review.likeCount || 0}
// // //             </span>
// // //           </button>
// // //           <button
// // //             className="review-action-btn dislike"
// // //             style={{
// // //               color: disliked ? "#f25858" : "#6c757d",
// // //               background: "none",
// // //               border: "none",
// // //               fontSize: "16px",
// // //               display: "flex",
// // //               alignItems: "center",
// // //               gap: "4px"
// // //             }}
// // //             onClick={handleDislike}
// // //             aria-label="Dislike this review"
// // //           >
// // //             {disliked ? <BiSolidDislike /> : <BiDislike />}
// // //             <span style={{ fontSize: "12px", color: "#6c757d" }}>
// // //               {review.dislikeCount || 0}
// // //             </span>
// // //           </button>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // export default ReviewCard;






