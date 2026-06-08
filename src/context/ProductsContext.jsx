import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

const ProductsContext = createContext();

export const useProducts = () => useContext(ProductsContext);

/**
 * Normalizes a Firestore product document into the shape
 * expected by ProductCard, Allproducts, and SearchContext.
 */
const normalizeProduct = (docId, data, dynamicRating = null, dynamicReviewCount = 0) => {
  const originalPrice = Number(data.realPrice ?? data.price ?? 0);
  const discountPercent = Number(data.discount ?? 0);
  const discountedPrice = discountPercent > 0
    ? Math.round(originalPrice - (originalPrice * discountPercent) / 100)
    : originalPrice;

  const finalRating = dynamicRating !== null ? dynamicRating : (data.rating ?? 0);

  return {
    id:          data.id        ?? docId,
    productId:   data.id        ?? docId,
    name:        data.name      ?? '',
    category:    (data.category ?? '').toLowerCase(),
    brand:       data.brand     ?? '',
    brandName:   data.brand     ?? '',
    description: data.description ?? '',
    price:       String(discountedPrice),
    realPrice:   String(originalPrice),
    discount:    String(discountPercent),
    offer:       discountPercent > 0 ? `${discountPercent}%` : '',
    rating:      finalRating,
    ratingCount: dynamicReviewCount,
    reviewCount: dynamicReviewCount,
    capacity:    data.capacity  ?? '',
    size:        data.size      ?? '',
    material:    data.material  ?? '',
    subCategory: data.subCategory ?? '',
    image:       data.image     ?? (Array.isArray(data.images) ? data.images[0] : ''),
    images:      Array.isArray(data.images) ? data.images : [],
    createdAt:   data.createdAt ?? null,
    stocks:      data.stocks    ?? null,
  };
};

export const ProductsProvider = ({ children }) => {
  const [products, setProducts]     = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [reviewsMap, setReviewsMap]   = useState({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  // Tracks whether the first Firestore snapshot has arrived
  const snapshotReceived = useRef(false);

  // 1. Listen to products in real-time
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          docId: doc.id,
          data: doc.data(),
        }));
        snapshotReceived.current = true;
        setRawProducts(docs);
        setError(null);
      },
      (err) => {
        console.error('Failed to listen to products from Firestore:', err);
        setError(err.message ?? 'Unknown error');
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Listen to reviews in real-time to compute aggregated ratings
  useEffect(() => {
    const q = collection(db, 'reviews');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const aggregates = {};
        snapshot.docs.forEach((doc) => {
          const r = doc.data();
          if (!r.isHidden) {
            const pId = r.productId;
            if (pId) {
              if (!aggregates[pId]) {
                aggregates[pId] = { sum: 0, count: 0 };
              }
              aggregates[pId].sum += Number(r.rating || 0);
              aggregates[pId].count += 1;
            }
          }
        });
        setReviewsMap(aggregates);
      },
      (err) => {
        console.error('Failed to listen to reviews from Firestore:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // 3. Combine raw products and dynamic reviews
  useEffect(() => {
    // Don't resolve loading until the first Firestore snapshot has arrived
    if (!snapshotReceived.current) return;

    if (rawProducts.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const merged = rawProducts.map(({ docId, data }) => {
      const pId = data.id ?? docId;
      const reviewStats = reviewsMap[pId];
      let dynamicRating = null;
      let dynamicCount = 0;

      if (reviewStats && reviewStats.count > 0) {
        dynamicRating = Number((reviewStats.sum / reviewStats.count).toFixed(1));
        dynamicCount = reviewStats.count;
      }

      return normalizeProduct(docId, data, dynamicRating, dynamicCount);
    });

    setProducts(merged);
    setLoading(false);
  }, [rawProducts, reviewsMap]);

  return (
    <ProductsContext.Provider value={{ products, loading, error }}>
      {children}
    </ProductsContext.Provider>
  );
};
