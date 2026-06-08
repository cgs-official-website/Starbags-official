import { createContext, useContext, useState, useEffect } from "react";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("user_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [toasts, setToasts] = useState([]);

  // ─── Track auth state reactively ───────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });
    return unsubscribe;
  }, []);

  // ─── Load wishlist whenever the user changes ────────────────────────────────
  useEffect(() => {
    const fetchWishlist = async () => {
      setWishlistLoading(true);
      if (currentUser) {
        try {
          await currentUser.getIdToken(true);
          const querySnapshot = await getDocs(
            collection(db, `users/${currentUser.uid}/wishlist`),
          );
          const rawDocs = querySnapshot.docs.map((d) => ({
            ...d.data(),
            firestoreId: d.id,
          }));

          const uniqueItems = [];
          const seen = new Set();
          for (const item of rawDocs) {
            const key = `${item.name}-${item.price}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueItems.push(item);
            } else {
              deleteDoc(
                doc(db, `users/${currentUser.uid}/wishlist`, item.firestoreId),
              ).catch((err) =>
                console.error(
                  "Error cleaning up duplicate wishlist item:",
                  err,
                ),
              );
            }
          }
          setWishlist(uniqueItems);
        } catch (err) {
          console.error("Error loading wishlist from Firestore:", err);
          const saved = localStorage.getItem("user_wishlist");
          if (saved) {
            setWishlist(JSON.parse(saved));
          }
        }
      } else {
        const saved = localStorage.getItem("user_wishlist");
        if (saved) {
          setWishlist(JSON.parse(saved));
        }
      }
      setWishlistLoading(false);
    };
    fetchWishlist();
  }, [currentUser]);

  // ─── Persist guest wishlist to localStorage only ───────────────────────────
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem("user_wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, currentUser]);

  useEffect(() => {
    localStorage.setItem("user_cart", JSON.stringify(cart));
  }, [cart]);

  // SINGLE POPUP HANDLER: Overwrites previous toast instantly to avoid lagging animations
  const showNotification = (message, type = "success") => {
    const id = Date.now();
    setToasts([{ id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  };

  // ─── FIXED TRICK: INJECTING DYNAMIC PRODUCT NAME INTO WISHLIST POPUPS ───
  const toggleWishlist = async (product) => {
    const isCurrentlyIn = wishlist.some(
      (item) =>
        item.name === product.name &&
        Number(item.price) === Number(product.price),
    );

    // Instantly toggle local state for 0% UI lag
    if (isCurrentlyIn) {
      setWishlist((prev) =>
        prev.filter(
          (item) =>
            !(
              item.name === product.name &&
              Number(item.price) === Number(product.price)
            ),
        ),
      );
      // FIXED: Shows specific product name inside the info popup
      showNotification(`Removed "${product.name}" from Wishlist`, "info");
    } else {
      const safeId = String(
        product.id || product.productId || Date.now() + Math.random(),
      );
      const newItem = { ...product, id: product.id || safeId };
      setWishlist((prev) => [...prev, newItem]);
      // FIXED: Shows specific product name inside the success popup
      showNotification(`Added "${product.name}" to Wishlist!`, "success");
    }

    // Safely execute asynchronous backend updates in secondary scope channels
    try {
      if (isCurrentlyIn) {
        const matches = wishlist.filter(
          (item) =>
            item.name === product.name &&
            Number(item.price) === Number(product.price),
        );
        if (currentUser) {
          for (const match of matches) {
            if (match.firestoreId) {
              await deleteDoc(
                doc(db, `users/${currentUser.uid}/wishlist`, match.firestoreId),
              );
            }
          }
        }
      } else {
        const safeId = String(
          product.id || product.productId || Date.now() + Math.random(),
        );
        const docId =
          String(product.name).replace(/[^a-zA-Z0-9-_]/g, "_") +
          "_" +
          safeId.substring(0, 8);
        const newItem = { ...product, id: product.id || safeId };

        if (currentUser) {
          const docRef = doc(db, `users/${currentUser.uid}/wishlist`, docId);
          await setDoc(docRef, newItem);
          newItem.firestoreId = docId;
          setWishlist((prev) =>
            prev.map((item) =>
              item.name === product.name
                ? { ...item, firestoreId: docId }
                : item,
            ),
          );
        }
      }
    } catch (err) {
      console.error("Background Firestore wishlist sync exception:", err);
    }
  };

  const removeFromWishlist = async (id) => {
    const item = wishlist.find((i) => i.id === id);
    if (item) {
      setWishlist((prev) => prev.filter((item) => item.id !== id));
      // FIXED: Added product name context to single item card remove commands
      showNotification(`Removed "${item.name}" from Wishlist`, "info");

      if (currentUser && item.firestoreId) {
        try {
          await deleteDoc(
            doc(db, `users/${currentUser.uid}/wishlist`, item.firestoreId),
          );
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.some(
        (item) => item.name === product.name && item.size === product.size,
      );
      if (exists) {
        showNotification(
          `Updated "${product.name}" quantity inside Cart!`,
          "success",
        );
        return prev.map((item) =>
          item.name === product.name && item.size === product.size
            ? { ...item, qty: (item.qty || 1) + (product.qty || 1) }
            : item,
        );
      }
      showNotification(`Added "${product.name}" to Cart!`, "success");
      return [
        ...prev,
        {
          ...product,
          id: product.id || Date.now() + Math.random(),
          qty: product.qty || 1,
          selected: true,
        },
      ];
    });
  };

  const removeFromCart = (id) => {
    const item = cart.find((i) => i.id === id);
    if (item) showNotification(`Removed "${item.name}" from Cart`, "info");
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCartQty = (id, amount) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = (item.qty || 1) + amount;
          return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
      }),
    );
  };

  const toggleCartSelect = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistLoading,
        cart,
        toasts,
        toggleWishlist,
        removeFromWishlist,
        addToCart,
        removeFromCart,
        updateCartQty,
        toggleCartSelect,
        setCart,
      }}
    >
      {children}

      {/* TOP-RIGHT STACKED TOAST CHANNELS TRAY */}
      <div
        className="global-toast-container"
        style={{
          position: "fixed",
          top: "80px",
          right: "24px",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`custom-toast-popup ${toast.type === "success" ? "success" : "info"}`}
            style={{
              animation:
                "toastSlideInInstantAnimation 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            <div
              className="toast-body-wrapper d-flex align-items-center"
              style={{
                fontSize: "0.88rem",
                fontWeight: "700",
              }}
            >
              <i
                className={`bi ${toast.type === "success" ? "bi-check-circle-fill text-success" : "bi-info-circle-fill text-primary"} me-2`}
                style={{ fontSize: "1.15rem" }}
              ></i>
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastSlideInInstantAnimation {
          from {
            opacity: 0;
            transform: translateY(-10px) translateX(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1);
          }
        }
      `}</style>
    </WishlistContext.Provider>
  );
};

const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error(
      "useWishlist must be wrapped inside a WishlistProvider element block",
    );
  }
  return context;
};

export { WishlistContext, useWishlist };
