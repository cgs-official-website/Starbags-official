import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSearch } from '../../context/SearchContext';
import { useProducts } from '../../context/ProductsContext';
import SortBySelect from '../../components/User/SortBySelect';
import FilterSideBar, { DEFAULT_FILTERS } from '../../components/User/Filtersidebar';
import Navbar from "../../components/User/Navbar";
import Footer from "../../components/User/Footer";
import ProductCard from "../../components/User/ProductCard";

import "../../assets/styles/allproducts.css";

const STORAGE_KEY = 'allproducts_filters';

export const allProductsData = [];

const saveFilters = (filters) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
};

const loadFilters = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
};

const buildActiveTags = (filters) => {
  const tags = [];
  (filters.bags ?? []).forEach((b) => tags.push({ type: 'Bag', label: b }));
  if (filters.category === 'wallet') tags.push({ type: 'Category', label: 'Wallet' });
  if (filters.category === 'belt')   tags.push({ type: 'Category', label: 'Belts' });
  if (filters.category === 'bag')    tags.push({ type: 'Category', label: 'Bag' });
  (filters.brands ?? []).forEach((b) => tags.push({ type: 'Brand', label: b }));
  (filters.material ?? []).forEach((m) => tags.push({ type: 'Material', label: m }));
  (filters.sizes ?? []).forEach((s) => tags.push({ type: 'Size', label: s }));
  if (filters.priceRange) {
    const map = {
      under500:    'Under ₹500',
      '500-1000':  '₹500 - ₹1000',
      '1000-2000': '₹1000 - ₹2000',
      above2000:   'Above ₹2000',
    };
    tags.push({ type: 'Price', label: map[filters.priceRange] ?? filters.priceRange });
  }
  (filters.capacities ?? []).forEach((c) => tags.push({ type: 'Capacity', label: c }));
  return tags;
};

// Helper function to detect category from search query
const detectCategoryFromSearch = (searchQuery) => {
  if (!searchQuery) return null;
  const query = searchQuery.toLowerCase();
  if (query.includes('bag') || query.includes('backpack') || query.includes('trolley') || query.includes('travel bag')) {
    return 'bag';
  }
  if (query.includes('wallet') || query.includes('purse') || query.includes('card holder')) {
    return 'wallet';
  }
  if (query.includes('belt') || query.includes('leather belt')) {
    return 'belt';
  }
  return null;
};

const AllProducts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchResults, shouldShowResults, clearSearch, searchQuery } = useSearch();
  const { products: dbProducts, loading, error } = useProducts();

  const [filters, setFilters] = useState(() => {
    const incoming = location.state?.filters;
    if (incoming) {
      const merged = { ...DEFAULT_FILTERS, ...incoming };
      saveFilters(merged);
      return merged;
    }
    return loadFilters() ?? DEFAULT_FILTERS;
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [activeTags, setActiveTags] = useState(() => buildActiveTags(filters));
  const [sortBy, setSortBy] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAppliedCategory, setLastAppliedCategory] = useState(null);

  useEffect(() => {
    const incoming = location.state?.filters;
    if (incoming) {
      const merged = { ...DEFAULT_FILTERS, ...incoming };
      applyFilters(merged);
      window.history.replaceState({}, document.title);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.state]);

  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  // Auto-apply category filter based on search query and reset filters when category changes
  useEffect(() => {
    if (shouldShowResults && searchResults.length > 0 && searchQuery) {
      const detectedCategory = detectCategoryFromSearch(searchQuery);
      if (detectedCategory) {
        // Check if the category has changed from previous search
        if (lastAppliedCategory !== null && lastAppliedCategory !== detectedCategory) {
          // Category changed - reset all filters to default but keep the new category
          const resetFilters = { ...DEFAULT_FILTERS, category: detectedCategory };
          applyFilters(resetFilters);
          setLastAppliedCategory(detectedCategory);
        } else if (filters.category !== detectedCategory && lastAppliedCategory === null) {
          // First time applying category - preserve existing filters
          const updatedFilters = { ...filters, category: detectedCategory };
          applyFilters(updatedFilters);
          setLastAppliedCategory(detectedCategory);
        } else if (lastAppliedCategory === null && filters.category === detectedCategory) {
          setLastAppliedCategory(detectedCategory);
        }
      }
    }
  }, [shouldShowResults, searchResults, searchQuery]);

  // Reset lastAppliedCategory when there's no search
  useEffect(() => {
    if (!shouldShowResults || searchResults.length === 0) {
      setLastAppliedCategory(null);
    }
  }, [shouldShowResults, searchResults]);

  // Cleanup body scroll lock when component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove('filter-drawer-open');
    };
  }, []);

  // Handle screen resize - close drawer if switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992 && drawerOpen) {
        setDrawerOpen(false);
        document.body.classList.remove('filter-drawer-open');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [drawerOpen]);

  const applyFilters = (next) => {
    setFilters(next);
    setAppliedFilters(next);
    setActiveTags(buildActiveTags(next));
    saveFilters(next);
  };

  const handleFilterChange = (next) => applyFilters(next);

  const handleRemoveTag = (index) => {
    const tag = activeTags[index];
    const updated = { ...filters };
    if (tag.type === 'Bag') updated.bags = updated.bags.filter((v) => v !== tag.label);
    if (tag.type === 'Category') updated.category = '';
    if (tag.type === 'Brand') updated.brands = updated.brands.filter((v) => v !== tag.label);
    if (tag.type === 'Material') updated.material = (updated.material ?? []).filter((v) => v !== tag.label);
    if (tag.type === 'Size') updated.sizes = (updated.sizes ?? []).filter((v) => v !== tag.label);
    if (tag.type === 'Pattern') updated.pattern = '';
    if (tag.type === 'Price') updated.priceRange = '';
    if (tag.type === 'Capacity') updated.capacities = (updated.capacities ?? []).filter((v) => v !== tag.label);
    applyFilters(updated);
  };

  const handleClearAllFilters = () => {
    applyFilters(DEFAULT_FILTERS);
    sessionStorage.removeItem(STORAGE_KEY);
    clearSearch();
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  // Drawer handlers with scroll lock
  const handleOpenDrawer = () => {
    setDrawerOpen(true);
    document.body.classList.add('filter-drawer-open');
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    document.body.classList.remove('filter-drawer-open');
  };

  // Brand existence check
  useEffect(() => {
    if (!loading && dbProducts.length > 0) {
      const incoming = location.state?.filters;
      if (incoming && incoming.brands && incoming.brands.length > 0) {
        const brandName = incoming.brands[0];
        const brandExists = dbProducts.some(
          (p) =>
            (p.brand || '').toLowerCase() === brandName.toLowerCase() ||
            (p.name || '').toLowerCase().includes(brandName.toLowerCase())
        );
        if (!brandExists) {
          applyFilters(DEFAULT_FILTERS);
          sessionStorage.removeItem(STORAGE_KEY);
          clearSearch();
        }
      }
    }
  }, [loading, dbProducts, location.state]);

  const handleBuyNowCheckout = (product) => {
    navigate("/product", { state: { product } });
  };

  const baseProducts = (shouldShowResults && searchResults.length > 0)
    ? searchResults
    : dbProducts;

  const filteredProducts = useMemo(() => {
    let products = [...baseProducts];

    if (appliedFilters.category) {
      products = products.filter((p) =>
        p.category?.toLowerCase() === appliedFilters.category.toLowerCase()
      );
    }
    if (appliedFilters.priceRange) {
      products = products.filter((p) => {
        const price = Number(p.price);
        if (appliedFilters.priceRange === 'under500') return price < 500;
        if (appliedFilters.priceRange === '500-1000') return price >= 500 && price <= 1000;
        if (appliedFilters.priceRange === '1000-2000') return price >= 1000 && price <= 2000;
        if (appliedFilters.priceRange === 'above2000') return price > 2000;
        return true;
      });
    }
    if (appliedFilters.bags && appliedFilters.bags.length > 0) {
      products = products.filter((p) => {
        const subCat = (p.subCategory || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return appliedFilters.bags.some((bag) =>
          subCat === bag.toLowerCase() || name.includes(bag.toLowerCase())
        );
      });
    }
    if (appliedFilters.brands && appliedFilters.brands.length > 0) {
      products = products.filter((p) => {
        const pBrand = (p.brand || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return appliedFilters.brands.some((brand) =>
          pBrand === brand.toLowerCase() || name.includes(brand.toLowerCase())
        );
      });
    }
    if (appliedFilters.material && appliedFilters.material.length > 0) {
      products = products.filter((p) => {
        const pMat = (p.material || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return appliedFilters.material.some((m) => {
          const baseMat = m.toLowerCase();
          return pMat === baseMat || name.includes(baseMat) || desc.includes(baseMat);
        });
      });
    }
    if (appliedFilters.sizes && appliedFilters.sizes.length > 0) {
      products = products.filter((p) => {
        const pSize = (p.size || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const sizeList = pSize.split(',').map((s) => s.trim());
        return appliedFilters.sizes.every((size) => {
          const lowerSize = size.toLowerCase();
          return sizeList.includes(lowerSize) || name.includes(lowerSize);
        });
      });
    }
    if (appliedFilters.capacities && appliedFilters.capacities.length > 0) {
      products = products.filter((p) => {
        const pCap = (p.capacity || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const capList = pCap.split(',').map((c) => c.trim());
        return appliedFilters.capacities.every((capacity) => {
          const lowerCap = capacity.toLowerCase();
          return capList.includes(lowerCap) || desc.includes(lowerCap);
        });
      });
    }

    return products;
  }, [baseProducts, appliedFilters]);

  const sortedProducts = useMemo(() => {
    if (!sortBy) return filteredProducts;
    const sorted = [...filteredProducts];
    if (sortBy === 'price-low') return sorted.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === 'price-high') return sorted.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortBy === 'rating') return sorted.sort((a, b) => Number(b.rating) - Number(a.rating));
    return sorted;
  }, [sortBy, filteredProducts]);

  const isOutOfStock = (p) =>
    p.stocks !== undefined && p.stocks !== null && parseInt(p.stocks) <= 0;

  const stockSortedProducts = useMemo(() => {
    const inStock = sortedProducts.filter((p) => !isOutOfStock(p));
    const outOfStock = sortedProducts.filter((p) => isOutOfStock(p));
    return [...inStock, ...outOfStock];
  }, [sortedProducts]);

  const hasNoResults = !loading && stockSortedProducts.length === 0;
  const displayProducts = hasNoResults ? dbProducts : stockSortedProducts;

  const sidebar = (
    <FilterSideBar
      filters={filters}
      onChange={handleFilterChange}
      activeTags={activeTags}
      onRemoveTag={handleRemoveTag}
      onClearAll={handleClearAllFilters}
    />
  );

  // Loading skeleton
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="all-products-page">
          <div className="all-products-topbar">
            <h2 className="all-products-title">All Products</h2>
          </div>
          <div className="all-products-main">
            <div className="all-products-sidebar desktop-only">{sidebar}</div>
            <div className="all-products-grid">
              <div className="ProductCard-section">
                <div className="container">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="card"
                      style={{
                        background: '#fff',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        height: '100%',
                        border: '1px solid #f0f0f0',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          borderRadius: '0 40px 0 40px',
                          background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.5s infinite',
                        }}
                      />
                      <div className="card-body" style={{ padding: '0.875rem' }}>
                        <div
                          style={{
                            height: '1.2rem',
                            width: '85%',
                            borderRadius: '4px',
                            background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            marginBottom: '0.5rem',
                          }}
                        />
                        <div
                          style={{
                            height: '0.9rem',
                            width: '45%',
                            borderRadius: '4px',
                            background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            marginBottom: '0.8rem',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <div
                            style={{
                              height: '1.4rem',
                              width: '35%',
                              borderRadius: '4px',
                              background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 1.5s infinite',
                            }}
                          />
                          <div
                            style={{
                              height: '1.1rem',
                              width: '25%',
                              borderRadius: '4px',
                              background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 1.5s infinite',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <style>{`
                @keyframes shimmer {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
              `}</style>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Navbar />
        <div
          className="all-products-page"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
        >
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <i className="bi bi-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#ef4444' }} />
            <p style={{ marginTop: '1rem', fontWeight: 500 }}>
              Failed to load products. Please try again later.
            </p>
            <small style={{ color: '#9ca3af' }}>{error}</small>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Main render
  return (
    <>
      <Navbar />
      <div className="all-products-page">
        <div className="all-products-topbar">
          <h2 className="all-products-title">All Products</h2>
          <div className="topbar-right">
            <button className="filter-toggle-btn mobile-only" onClick={handleOpenDrawer}>
              <i className="bi bi-sliders"></i> Filters
            </button>
            <SortBySelect value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        <div className="all-products-main">
          <div className="all-products-sidebar desktop-only">
            {sidebar}
          </div>

          <div className="all-products-grid">
            <ProductCard products={displayProducts} onBuyNowClick={handleBuyNowCheckout} />
          </div>
        </div>
      </div>

      {/* Mobile filter drawer with scroll lock - active tags show properly */}
      {drawerOpen && (
        <div className="filter-overlay" onClick={handleCloseDrawer}>
          <div className="filter-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="filter-drawer-header">
              <span className="filter-drawer-title">Filters</span>
              <button className="filter-drawer-close" onClick={handleCloseDrawer}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="filter-drawer-body">
              <FilterSideBar
                filters={filters}
                onChange={handleFilterChange}
                activeTags={activeTags}
                onRemoveTag={handleRemoveTag}
                onClearAll={handleClearAllFilters}
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default AllProducts;


// import { useState, useMemo, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { useSearch } from '../../context/SearchContext';
// import { useProducts } from '../../context/ProductsContext';
// import SortBySelect from '../../components/User/SortBySelect';
// import FilterSideBar, { DEFAULT_FILTERS } from '../../components/User/FilterSideBar';
// import Navbar from "../../components/User/Navbar";
// import Footer from "../../components/User/Footer";
// import ProductCard from "../../components/User/ProductCard";

// import "../../assets/styles/allproducts.css";

// const STORAGE_KEY = 'allproducts_filters';

// export const allProductsData = [];

// const saveFilters = (filters) => {
//   sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
// };

// const loadFilters = () => {
//   try {
//     const raw = sessionStorage.getItem(STORAGE_KEY);
//     return raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw) } : null;
//   } catch {
//     return null;
//   }
// };

// const buildActiveTags = (filters) => {
//   const tags = [];
//   (filters.bags ?? []).forEach((b) => tags.push({ type: 'Bag', label: b }));
//   if (filters.category === 'wallet') tags.push({ type: 'Category', label: 'Wallet' });
//   if (filters.category === 'belt')   tags.push({ type: 'Category', label: 'Belts' });
//   if (filters.category === 'bag')    tags.push({ type: 'Category', label: 'Bag' });
//   (filters.brands ?? []).forEach((b) => tags.push({ type: 'Brand', label: b }));
//   (filters.material ?? []).forEach((m) => tags.push({ type: 'Material', label: m }));
//   (filters.sizes ?? []).forEach((s) => tags.push({ type: 'Size', label: s }));
//   if (filters.priceRange) {
//     const map = {
//       under500:    'Under ₹500',
//       '500-1000':  '₹500 - ₹1000',
//       '1000-2000': '₹1000 - ₹2000',
//       above2000:   'Above ₹2000',
//     };
//     tags.push({ type: 'Price', label: map[filters.priceRange] ?? filters.priceRange });
//   }
//   (filters.capacities ?? []).forEach((c) => tags.push({ type: 'Capacity', label: c }));
//   return tags;
// };

// const AllProducts = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { searchResults, shouldShowResults, clearSearch } = useSearch();
//   const { products: dbProducts, loading, error } = useProducts();

//   const [filters, setFilters] = useState(() => {
//     const incoming = location.state?.filters;
//     if (incoming) {
//       const merged = { ...DEFAULT_FILTERS, ...incoming };
//       saveFilters(merged);
//       return merged;
//     }
//     return loadFilters() ?? DEFAULT_FILTERS;
//   });

//   const [appliedFilters, setAppliedFilters] = useState(filters);
//   const [activeTags, setActiveTags] = useState(() => buildActiveTags(filters));
//   const [sortBy, setSortBy] = useState('');
//   const [drawerOpen, setDrawerOpen] = useState(false);

//   useEffect(() => {
//     const incoming = location.state?.filters;
//     if (incoming) {
//       const merged = { ...DEFAULT_FILTERS, ...incoming };
//       applyFilters(merged);
//       window.history.replaceState({}, document.title);
//     }
//     window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
//   }, [location.state]);

//   useEffect(() => {
//     saveFilters(filters);
//   }, [filters]);

//   // Cleanup body scroll lock when component unmounts
//   useEffect(() => {
//     return () => {
//       document.body.classList.remove('filter-drawer-open');
//     };
//   }, []);

//   // Handle screen resize - close drawer if switching to desktop
//   useEffect(() => {
//     const handleResize = () => {
//       if (window.innerWidth >= 992 && drawerOpen) {
//         setDrawerOpen(false);
//         document.body.classList.remove('filter-drawer-open');
//       }
//     };

//     window.addEventListener('resize', handleResize);
//     return () => {
//       window.removeEventListener('resize', handleResize);
//     };
//   }, [drawerOpen]);

//   const applyFilters = (next) => {
//     setFilters(next);
//     setAppliedFilters(next);
//     setActiveTags(buildActiveTags(next));
//     saveFilters(next);
//   };

//   const handleFilterChange = (next) => applyFilters(next);

//   const handleRemoveTag = (index) => {
//     const tag = activeTags[index];
//     const updated = { ...filters };
//     if (tag.type === 'Bag') updated.bags = updated.bags.filter((v) => v !== tag.label);
//     if (tag.type === 'Category') updated.category = '';
//     if (tag.type === 'Brand') updated.brands = updated.brands.filter((v) => v !== tag.label);
//     if (tag.type === 'Material') updated.material = (updated.material ?? []).filter((v) => v !== tag.label);
//     if (tag.type === 'Size') updated.sizes = (updated.sizes ?? []).filter((v) => v !== tag.label);
//     if (tag.type === 'Pattern') updated.pattern = '';
//     if (tag.type === 'Price') updated.priceRange = '';
//     if (tag.type === 'Capacity') updated.capacities = (updated.capacities ?? []).filter((v) => v !== tag.label);
//     applyFilters(updated);
//   };

//   const handleClearAllFilters = () => {
//     applyFilters(DEFAULT_FILTERS);
//     sessionStorage.removeItem(STORAGE_KEY);
//     clearSearch();
//     window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
//   };

//   // Drawer handlers with scroll lock
//   const handleOpenDrawer = () => {
//     setDrawerOpen(true);
//     document.body.classList.add('filter-drawer-open');
//   };

//   const handleCloseDrawer = () => {
//     setDrawerOpen(false);
//     document.body.classList.remove('filter-drawer-open');
//   };

//   // Brand existence check
//   useEffect(() => {
//     if (!loading && dbProducts.length > 0) {
//       const incoming = location.state?.filters;
//       if (incoming && incoming.brands && incoming.brands.length > 0) {
//         const brandName = incoming.brands[0];
//         const brandExists = dbProducts.some(
//           (p) =>
//             (p.brand || '').toLowerCase() === brandName.toLowerCase() ||
//             (p.name || '').toLowerCase().includes(brandName.toLowerCase())
//         );
//         if (!brandExists) {
//           applyFilters(DEFAULT_FILTERS);
//           sessionStorage.removeItem(STORAGE_KEY);
//           clearSearch();
//         }
//       }
//     }
//   }, [loading, dbProducts, location.state]);

//   const handleBuyNowCheckout = (product) => {
//     navigate("/product", { state: { product } });
//   };

//   const baseProducts = (shouldShowResults && searchResults.length > 0)
//     ? searchResults
//     : dbProducts;

//   const filteredProducts = useMemo(() => {
//     let products = [...baseProducts];

//     if (appliedFilters.category) {
//       products = products.filter((p) =>
//         p.category?.toLowerCase() === appliedFilters.category.toLowerCase()
//       );
//     }
//     if (appliedFilters.priceRange) {
//       products = products.filter((p) => {
//         const price = Number(p.price);
//         if (appliedFilters.priceRange === 'under500') return price < 500;
//         if (appliedFilters.priceRange === '500-1000') return price >= 500 && price <= 1000;
//         if (appliedFilters.priceRange === '1000-2000') return price >= 1000 && price <= 2000;
//         if (appliedFilters.priceRange === 'above2000') return price > 2000;
//         return true;
//       });
//     }
//     if (appliedFilters.bags && appliedFilters.bags.length > 0) {
//       products = products.filter((p) => {
//         const subCat = (p.subCategory || '').toLowerCase();
//         const name = (p.name || '').toLowerCase();
//         return appliedFilters.bags.some((bag) =>
//           subCat === bag.toLowerCase() || name.includes(bag.toLowerCase())
//         );
//       });
//     }
//     if (appliedFilters.brands && appliedFilters.brands.length > 0) {
//       products = products.filter((p) => {
//         const pBrand = (p.brand || '').toLowerCase();
//         const name = (p.name || '').toLowerCase();
//         return appliedFilters.brands.some((brand) =>
//           pBrand === brand.toLowerCase() || name.includes(brand.toLowerCase())
//         );
//       });
//     }
//     if (appliedFilters.material && appliedFilters.material.length > 0) {
//       products = products.filter((p) => {
//         const pMat = (p.material || '').toLowerCase();
//         const name = (p.name || '').toLowerCase();
//         const desc = (p.description || '').toLowerCase();
//         return appliedFilters.material.some((m) => {
//           const baseMat = m.toLowerCase();
//           return pMat === baseMat || name.includes(baseMat) || desc.includes(baseMat);
//         });
//       });
//     }
//     if (appliedFilters.sizes && appliedFilters.sizes.length > 0) {
//       products = products.filter((p) => {
//         const pSize = (p.size || '').toLowerCase();
//         const name = (p.name || '').toLowerCase();
//         const sizeList = pSize.split(',').map((s) => s.trim());
//         return appliedFilters.sizes.every((size) => {
//           const lowerSize = size.toLowerCase();
//           return sizeList.includes(lowerSize) || name.includes(lowerSize);
//         });
//       });
//     }
//     if (appliedFilters.capacities && appliedFilters.capacities.length > 0) {
//       products = products.filter((p) => {
//         const pCap = (p.capacity || '').toLowerCase();
//         const desc = (p.description || '').toLowerCase();
//         const capList = pCap.split(',').map((c) => c.trim());
//         return appliedFilters.capacities.every((capacity) => {
//           const lowerCap = capacity.toLowerCase();
//           return capList.includes(lowerCap) || desc.includes(lowerCap);
//         });
//       });
//     }

//     return products;
//   }, [baseProducts, appliedFilters]);

//   const sortedProducts = useMemo(() => {
//     if (!sortBy) return filteredProducts;
//     const sorted = [...filteredProducts];
//     if (sortBy === 'price-low') return sorted.sort((a, b) => Number(a.price) - Number(b.price));
//     if (sortBy === 'price-high') return sorted.sort((a, b) => Number(b.price) - Number(a.price));
//     if (sortBy === 'rating') return sorted.sort((a, b) => Number(b.rating) - Number(a.rating));
//     return sorted;
//   }, [sortBy, filteredProducts]);

//   const isOutOfStock = (p) =>
//     p.stocks !== undefined && p.stocks !== null && parseInt(p.stocks) <= 0;

//   const stockSortedProducts = useMemo(() => {
//     const inStock = sortedProducts.filter((p) => !isOutOfStock(p));
//     const outOfStock = sortedProducts.filter((p) => isOutOfStock(p));
//     return [...inStock, ...outOfStock];
//   }, [sortedProducts]);

//   const hasNoResults = !loading && stockSortedProducts.length === 0;
//   const displayProducts = hasNoResults ? dbProducts : stockSortedProducts;

//   const sidebar = (
//     <FilterSideBar
//       filters={filters}
//       onChange={handleFilterChange}
//       activeTags={activeTags}
//       onRemoveTag={handleRemoveTag}
//       onClearAll={handleClearAllFilters}
//     />
//   );

//   // Loading skeleton
//   if (loading) {
//     return (
//       <>
//         <Navbar />
//         <div className="all-products-page">
//           <div className="all-products-topbar">
//             <h2 className="all-products-title">All Products</h2>
//           </div>
//           <div className="all-products-main">
//             <div className="all-products-sidebar desktop-only">{sidebar}</div>
//             <div className="all-products-grid">
//               <div className="ProductCard-section">
//                 <div className="container">
//                   {Array.from({ length: 8 }).map((_, i) => (
//                     <div
//                       key={i}
//                       className="card"
//                       style={{
//                         background: '#fff',
//                         borderRadius: '12px',
//                         overflow: 'hidden',
//                         height: '100%',
//                         border: '1px solid #f0f0f0',
//                       }}
//                     >
//                       <div
//                         style={{
//                           width: '100%',
//                           aspectRatio: '1 / 1',
//                           borderRadius: '0 40px 0 40px',
//                           background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
//                           backgroundSize: '200% 100%',
//                           animation: 'shimmer 1.5s infinite',
//                         }}
//                       />
//                       <div className="card-body" style={{ padding: '0.875rem' }}>
//                         <div
//                           style={{
//                             height: '1.2rem',
//                             width: '85%',
//                             borderRadius: '4px',
//                             background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
//                             backgroundSize: '200% 100%',
//                             animation: 'shimmer 1.5s infinite',
//                             marginBottom: '0.5rem',
//                           }}
//                         />
//                         <div
//                           style={{
//                             height: '0.9rem',
//                             width: '45%',
//                             borderRadius: '4px',
//                             background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
//                             backgroundSize: '200% 100%',
//                             animation: 'shimmer 1.5s infinite',
//                             marginBottom: '0.8rem',
//                           }}
//                         />
//                         <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
//                           <div
//                             style={{
//                               height: '1.4rem',
//                               width: '35%',
//                               borderRadius: '4px',
//                               background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
//                               backgroundSize: '200% 100%',
//                               animation: 'shimmer 1.5s infinite',
//                             }}
//                           />
//                           <div
//                             style={{
//                               height: '1.1rem',
//                               width: '25%',
//                               borderRadius: '4px',
//                               background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
//                               backgroundSize: '200% 100%',
//                               animation: 'shimmer 1.5s infinite',
//                             }}
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               <style>{`
//                 @keyframes shimmer {
//                   0% { background-position: -200% 0; }
//                   100% { background-position: 200% 0; }
//                 }
//               `}</style>
//             </div>
//           </div>
//         </div>
//         <Footer />
//       </>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <>
//         <Navbar />
//         <div
//           className="all-products-page"
//           style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
//         >
//           <div style={{ textAlign: 'center', color: '#6b7280' }}>
//             <i className="bi bi-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#ef4444' }} />
//             <p style={{ marginTop: '1rem', fontWeight: 500 }}>
//               Failed to load products. Please try again later.
//             </p>
//             <small style={{ color: '#9ca3af' }}>{error}</small>
//           </div>
//         </div>
//         <Footer />
//       </>
//     );
//   }

//   // Main render
//   return (
//     <>
//       <Navbar />
//       <div className="all-products-page">
//         <div className="all-products-topbar">
//           <h2 className="all-products-title">All Products</h2>
//           <div className="topbar-right">
//             <button className="filter-toggle-btn mobile-only" onClick={handleOpenDrawer}>
//               <i className="bi bi-sliders"></i> Filters
//             </button>
//             <SortBySelect value={sortBy} onChange={setSortBy} />
//           </div>
//         </div>

//         <div className="all-products-main">
//           <div className="all-products-sidebar desktop-only">
//             {sidebar}
//           </div>

//           <div className="all-products-grid">
//             <ProductCard products={displayProducts} onBuyNowClick={handleBuyNowCheckout} />
//           </div>
//         </div>
//       </div>

//       {/* Mobile filter drawer with scroll lock - active tags show properly */}
//       {drawerOpen && (
//         <div className="filter-overlay" onClick={handleCloseDrawer}>
//           <div className="filter-drawer" onClick={(e) => e.stopPropagation()}>
//             <div className="filter-drawer-header">
//               <span className="filter-drawer-title">Filters</span>
//               <button className="filter-drawer-close" onClick={handleCloseDrawer}>
//                 <i className="bi bi-x-lg"></i>
//               </button>
//             </div>
//             <div className="filter-drawer-body">
//               <FilterSideBar
//                 filters={filters}
//                 onChange={handleFilterChange}
//                 activeTags={activeTags}
//                 onRemoveTag={handleRemoveTag}
//                 onClearAll={handleClearAllFilters}
//               />
//             </div>
//           </div>
//         </div>
//       )}

//       <Footer />
//     </>
//   );
// };

// export default AllProducts;


// // import { useState, useMemo, useEffect } from 'react';
// // import { useLocation, useNavigate } from 'react-router-dom';
// // import { useSearch } from '../../context/SearchContext';
// // import { useProducts } from '../../context/ProductsContext';
// // import SortBySelect from '../../components/User/SortBySelect';
// // import FilterSideBar, { DEFAULT_FILTERS } from '../../components/User/FilterSideBar';
// // import Navbar from "../../components/User/Navbar";
// // import Footer from "../../components/User/Footer";
// // import ProductCard from "../../components/User/ProductCard";

// // import "../../assets/styles/allproducts.css";

// // const STORAGE_KEY = 'allproducts_filters';

// // // Kept as empty for legacy imports (Navbar/ProductCard fallback).
// // // Real data is supplied via ProductsContext.
// // export const allProductsData = [];

// // const saveFilters = (filters) => {
// //   sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
// // };

// // const loadFilters = () => {
// //   try {
// //     const raw = sessionStorage.getItem(STORAGE_KEY);
// //     return raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw) } : null;
// //   } catch {
// //     return null;
// //   }
// // };

// // const buildActiveTags = (filters) => {
// //   const tags = [];
// //   (filters.bags ?? []).forEach((b) => tags.push({ type: 'Bag', label: b }));
// //   if (filters.category === 'wallet') tags.push({ type: 'Category', label: 'Wallet' });
// //   if (filters.category === 'belt')   tags.push({ type: 'Category', label: 'Belt' });
// //   if (filters.category === 'bag')    tags.push({ type: 'Category', label: 'Bag' });
// //   (filters.brands ?? []).forEach((b) => tags.push({ type: 'Brand', label: b }));
// //   (filters.material ?? []).forEach((m) => tags.push({ type: 'Material', label: m }));
// //   (filters.sizes ?? []).forEach((s) => tags.push({ type: 'Size', label: s }));
// //   if (filters.priceRange) {
// //     const map = {
// //       under500:    'Under ₹500',
// //       '500-1000':  '₹500 - ₹1000',
// //       '1000-2000': '₹1000 - ₹2000',
// //       above2000:   'Above ₹2000',
// //     };
// //     tags.push({ type: 'Price', label: map[filters.priceRange] ?? filters.priceRange });
// //   }
// //   (filters.capacities ?? []).forEach((c) => tags.push({ type: 'Capacity', label: c }));
// //   return tags;
// // };

// // const AllProducts = () => {
// //   const location = useLocation();
// //   const navigate = useNavigate();
// //   const { searchResults, shouldShowResults, clearSearch } = useSearch();

// //   // ── Live Firestore products ───────────────────────────────────────────────
// //   const { products: dbProducts, loading, error } = useProducts();

// //   const [filters, setFilters] = useState(() => {
// //     const incoming = location.state?.filters;
// //     if (incoming) {
// //       const merged = { ...DEFAULT_FILTERS, ...incoming };
// //       saveFilters(merged);
// //       return merged;
// //     }
// //     return loadFilters() ?? DEFAULT_FILTERS;
// //   });

// //   const [appliedFilters, setAppliedFilters] = useState(filters);
// //   const [activeTags, setActiveTags]         = useState(() => buildActiveTags(filters));
// //   const [sortBy, setSortBy]                 = useState('');
// //   const [drawerOpen, setDrawerOpen]         = useState(false);

// //   useEffect(() => {
// //     const incoming = location.state?.filters;
// //     if (incoming) {
// //       const merged = { ...DEFAULT_FILTERS, ...incoming };
// //       applyFilters(merged);
// //       window.history.replaceState({}, document.title);
// //     }
// //     window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
// //   }, [location.state]);

// //   useEffect(() => {
// //     saveFilters(filters);
// //   }, [filters]);

// //   // Cleanup body scroll lock when component unmounts
// //   useEffect(() => {
// //     return () => {
// //       document.body.classList.remove('filter-drawer-open');
// //     };
// //   }, []);

// //   const applyFilters = (next) => {
// //     setFilters(next);
// //     setAppliedFilters(next);
// //     setActiveTags(buildActiveTags(next));
// //     saveFilters(next);
// //   };

// //   const handleFilterChange = (next) => applyFilters(next);

// //   const handleRemoveTag = (index) => {
// //     const tag     = activeTags[index];
// //     const updated = { ...filters };
// //     if (tag.type === 'Bag')      updated.bags       = updated.bags.filter((v) => v !== tag.label);
// //     if (tag.type === 'Category') updated.category   = '';
// //     if (tag.type === 'Brand')    updated.brands     = updated.brands.filter((v) => v !== tag.label);
// //     if (tag.type === 'Material') updated.material   = (updated.material ?? []).filter((v) => v !== tag.label);
// //     if (tag.type === 'Size')     updated.sizes      = (updated.sizes ?? []).filter((v) => v !== tag.label);
// //     if (tag.type === 'Pattern')  updated.pattern    = '';
// //     if (tag.type === 'Price')    updated.priceRange = '';
// //     if (tag.type === 'Capacity') updated.capacities = (updated.capacities ?? []).filter((v) => v !== tag.label);
// //     applyFilters(updated);
// //   };

// //   const handleClearAllFilters = () => {
// //     applyFilters(DEFAULT_FILTERS);
// //     sessionStorage.removeItem(STORAGE_KEY);
// //     clearSearch();
// //     window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
// //   };

// //   // Drawer handlers with scroll lock
// //   const handleOpenDrawer = () => {
// //     setDrawerOpen(true);
// //     document.body.classList.add('filter-drawer-open');
// //   };

// //   const handleCloseDrawer = () => {
// //     setDrawerOpen(false);
// //     document.body.classList.remove('filter-drawer-open');
// //   };

// //   // If brand is requested from Home but doesn't exist, fallback to all products
// //   useEffect(() => {
// //     if (!loading && dbProducts.length > 0) {
// //       const incoming = location.state?.filters;
// //       if (incoming && incoming.brands && incoming.brands.length > 0) {
// //         const brandName = incoming.brands[0];
// //         const brandExists = dbProducts.some(
// //           (p) =>
// //             (p.brand || '').toLowerCase() === brandName.toLowerCase() ||
// //             (p.name || '').toLowerCase().includes(brandName.toLowerCase())
// //         );
// //         if (!brandExists) {
// //           applyFilters(DEFAULT_FILTERS);
// //           sessionStorage.removeItem(STORAGE_KEY);
// //           clearSearch();
// //         }
// //       }
// //     }
// //   }, [loading, dbProducts, location.state]);

// //   const handleBuyNowCheckout = (product) => {
// //     navigate("/product", { state: { product } });
// //   };

// //   // ── Base: search results OR full Firestore list ───────────────────────────
// //   const baseProducts = (shouldShowResults && searchResults.length > 0)
// //     ? searchResults
// //     : dbProducts;

// //   const filteredProducts = useMemo(() => {
// //     let products = [...baseProducts];

// //     if (appliedFilters.category) {
// //       products = products.filter((p) =>
// //         p.category?.toLowerCase() === appliedFilters.category.toLowerCase()
// //       );
// //     }
// //     if (appliedFilters.priceRange) {
// //       products = products.filter((p) => {
// //         const price = Number(p.price);
// //         if (appliedFilters.priceRange === 'under500')  return price < 500;
// //         if (appliedFilters.priceRange === '500-1000')  return price >= 500  && price <= 1000;
// //         if (appliedFilters.priceRange === '1000-2000') return price >= 1000 && price <= 2000;
// //         if (appliedFilters.priceRange === 'above2000') return price > 2000;
// //         return true;
// //       });
// //     }
// //     if (appliedFilters.bags && appliedFilters.bags.length > 0) {
// //       products = products.filter((p) => {
// //         const subCat = (p.subCategory || '').toLowerCase();
// //         const name = (p.name || '').toLowerCase();
// //         return appliedFilters.bags.some((bag) =>
// //           subCat === bag.toLowerCase() || name.includes(bag.toLowerCase())
// //         );
// //       });
// //     }
// //     if (appliedFilters.brands && appliedFilters.brands.length > 0) {
// //       products = products.filter((p) => {
// //         const pBrand = (p.brand || '').toLowerCase();
// //         const name = (p.name || '').toLowerCase();
// //         return appliedFilters.brands.some((brand) =>
// //           pBrand === brand.toLowerCase() || name.includes(brand.toLowerCase())
// //         );
// //       });
// //     }
// //     if (appliedFilters.material && appliedFilters.material.length > 0) {
// //       products = products.filter((p) => {
// //         const pMat = (p.material || '').toLowerCase();
// //         const name = (p.name || '').toLowerCase();
// //         const desc = (p.description || '').toLowerCase();
// //         return appliedFilters.material.some((m) => {
// //           const baseMat = m.toLowerCase();
// //           return pMat === baseMat || name.includes(baseMat) || desc.includes(baseMat);
// //         });
// //       });
// //     }
// //     if (appliedFilters.sizes && appliedFilters.sizes.length > 0) {
// //       products = products.filter((p) => {
// //         const pSize = (p.size || '').toLowerCase();
// //         const name = (p.name || '').toLowerCase();
// //         const sizeList = pSize.split(',').map((s) => s.trim());
// //         return appliedFilters.sizes.every((size) => {
// //           const lowerSize = size.toLowerCase();
// //           return sizeList.includes(lowerSize) || name.includes(lowerSize);
// //         });
// //       });
// //     }
// //     if (appliedFilters.capacities && appliedFilters.capacities.length > 0) {
// //       products = products.filter((p) => {
// //         const pCap = (p.capacity || '').toLowerCase();
// //         const desc = (p.description || '').toLowerCase();
// //         const capList = pCap.split(',').map((c) => c.trim());
// //         return appliedFilters.capacities.every((capacity) => {
// //           const lowerCap = capacity.toLowerCase();
// //           return capList.includes(lowerCap) || desc.includes(lowerCap);
// //         });
// //       });
// //     }

// //     return products;
// //   }, [baseProducts, appliedFilters]);

// //   const sortedProducts = useMemo(() => {
// //     if (!sortBy) return filteredProducts;
// //     const sorted = [...filteredProducts];
// //     if (sortBy === 'price-low')  return sorted.sort((a, b) => Number(a.price) - Number(b.price));
// //     if (sortBy === 'price-high') return sorted.sort((a, b) => Number(b.price) - Number(a.price));
// //     if (sortBy === 'rating')     return sorted.sort((a, b) => Number(b.rating) - Number(a.rating));
// //     return sorted;
// //   }, [sortBy, filteredProducts]);

// //   // Always push out-of-stock items to the end, preserving relative order within each group
// //   const isOutOfStock = (p) =>
// //     p.stocks !== undefined && p.stocks !== null && parseInt(p.stocks) <= 0;

// //   const stockSortedProducts = useMemo(() => {
// //     const inStock = sortedProducts.filter((p) => !isOutOfStock(p));
// //     const outOfStock = sortedProducts.filter((p) => isOutOfStock(p));
// //     return [...inStock, ...outOfStock];
// //   }, [sortedProducts]);

// //   const hasNoResults    = !loading && stockSortedProducts.length === 0;
// //   const displayProducts = hasNoResults ? dbProducts : stockSortedProducts;

// //   const sidebar = (
// //     <FilterSideBar
// //       filters={filters}
// //       onChange={handleFilterChange}
// //       activeTags={activeTags}
// //       onRemoveTag={handleRemoveTag}
// //       onClearAll={handleClearAllFilters}
// //     />
// //   );

// //   // ── Loading skeleton ──────────────────────────────────────────────────────
// //   if (loading) {
// //     return (
// //       <>
// //         <Navbar />
// //         <div className="all-products-page">
// //           <div className="all-products-topbar">
// //             <h2 className="all-products-title">All Products</h2>
// //           </div>
// //           <div className="all-products-main">
// //             <div className="all-products-sidebar desktop-only">{sidebar}</div>
// //             <div className="all-products-grid">
// //               <div className="ProductCard-section">
// //                 <div className="container">
// //                   {Array.from({ length: 8 }).map((_, i) => (
// //                     <div
// //                       key={i}
// //                       className="card"
// //                       style={{
// //                         background: '#fff',
// //                         borderRadius: '12px',
// //                         overflow: 'hidden',
// //                         height: '100%',
// //                         border: '1px solid #f0f0f0',
// //                       }}
// //                     >
// //                       {/* Image area skeleton with brand custom border-radius shape */}
// //                       <div
// //                         style={{
// //                           width: '100%',
// //                           aspectRatio: '1 / 1',
// //                           borderRadius: '0 40px 0 40px',
// //                           background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// //                           backgroundSize: '200% 100%',
// //                           animation: 'shimmer 1.5s infinite',
// //                         }}
// //                       />
// //                       <div className="card-body" style={{ padding: '0.875rem' }}>
// //                         {/* Title text skeleton */}
// //                         <div
// //                           style={{
// //                             height: '1.2rem',
// //                             width: '85%',
// //                             borderRadius: '4px',
// //                             background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// //                             backgroundSize: '200% 100%',
// //                             animation: 'shimmer 1.5s infinite',
// //                             marginBottom: '0.5rem',
// //                           }}
// //                         />
// //                         {/* Rating stars skeleton */}
// //                         <div
// //                           style={{
// //                             height: '0.9rem',
// //                             width: '45%',
// //                             borderRadius: '4px',
// //                             background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// //                             backgroundSize: '200% 100%',
// //                             animation: 'shimmer 1.5s infinite',
// //                             marginBottom: '0.8rem',
// //                           }}
// //                         />
// //                         {/* Prices row skeleton */}
// //                         <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
// //                           <div
// //                             style={{
// //                               height: '1.4rem',
// //                               width: '35%',
// //                               borderRadius: '4px',
// //                               background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// //                               backgroundSize: '200% 100%',
// //                               animation: 'shimmer 1.5s infinite',
// //                             }}
// //                           />
// //                           <div
// //                             style={{
// //                               height: '1.1rem',
// //                               width: '25%',
// //                               borderRadius: '4px',
// //                               background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// //                               backgroundSize: '200% 100%',
// //                               animation: 'shimmer 1.5s infinite',
// //                             }}
// //                           />
// //                         </div>
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //               <style>{`
// //                 @keyframes shimmer {
// //                   0%   { background-position: -200% 0; }
// //                   100% { background-position:  200% 0; }
// //                 }
// //               `}</style>
// //             </div>
// //           </div>
// //         </div>
// //         <Footer />
// //       </>
// //     );
// //   }

// //   // ── Error state ───────────────────────────────────────────────────────────
// //   if (error) {
// //     return (
// //       <>
// //         <Navbar />
// //         <div
// //           className="all-products-page"
// //           style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
// //         >
// //           <div style={{ textAlign: 'center', color: '#6b7280' }}>
// //             <i className="bi bi-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#ef4444' }} />
// //             <p style={{ marginTop: '1rem', fontWeight: 500 }}>
// //               Failed to load products. Please try again later.
// //             </p>
// //             <small style={{ color: '#9ca3af' }}>{error}</small>
// //           </div>
// //         </div>
// //         <Footer />
// //       </>
// //     );
// //   }

// //   // ── Main render ───────────────────────────────────────────────────────────
// //   return (
// //     <>
// //       <Navbar />
// //       <div className="all-products-page">
// //         <div className="all-products-topbar">
// //           <h2 className="all-products-title">All Products</h2>
// //           <div className="topbar-right">
// //             {/* Filter button — only visible on tablet/mobile */}
// //             <button className="filter-toggle-btn mobile-only" onClick={handleOpenDrawer}>
// //               <i className="bi bi-sliders"></i> Filters
// //             </button>
// //             <SortBySelect value={sortBy} onChange={setSortBy} />
// //           </div>
// //         </div>

// //         <div className="all-products-main">
// //           <div className="all-products-sidebar desktop-only">
// //             {sidebar}
// //           </div>

// //           <div className="all-products-grid">
// //             <ProductCard products={displayProducts} onBuyNowClick={handleBuyNowCheckout} />
// //           </div>
// //         </div>
// //       </div>

// //       {/* ── Mobile filter drawer with scroll lock only ── */}
// //       {drawerOpen && (
// //         <div className="filter-overlay" onClick={handleCloseDrawer}>
// //           <div className="filter-drawer" onClick={(e) => e.stopPropagation()}>
// //             <div className="filter-drawer-header">
// //               <span className="filter-drawer-title">Filters</span>
// //               <button className="filter-drawer-close" onClick={handleCloseDrawer}>
// //                 <i className="bi bi-x-lg"></i>
// //               </button>
// //             </div>
// //             <div className="filter-drawer-body">
// //               {/* FilterSideBar unchanged - renders exactly as on desktop */}
// //               <FilterSideBar
// //                 filters={filters}
// //                 onChange={handleFilterChange}
// //                 activeTags={activeTags}
// //                 onRemoveTag={handleRemoveTag}
// //                 onClearAll={handleClearAllFilters}
// //               />
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       <Footer />
// //     </>
// //   );
// // };

// // export default AllProducts;

// // // import { useState, useMemo, useEffect } from 'react';
// // // import { useLocation, useNavigate } from 'react-router-dom';
// // // import { useSearch } from '../../context/SearchContext';
// // // import { useProducts } from '../../context/ProductsContext';
// // // import SortBySelect from '../../components/User/SortBySelect';
// // // import FilterSideBar, { DEFAULT_FILTERS } from '../../components/User/FilterSideBar';
// // // import Navbar from "../../components/User/Navbar";
// // // import Footer from "../../components/User/Footer";
// // // import ProductCard from "../../components/User/ProductCard";

// // // import "../../assets/styles/allproducts.css";

// // // const STORAGE_KEY = 'allproducts_filters';

// // // export const allProductsData = [];

// // // const saveFilters = (filters) => {
// // //   sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
// // // };

// // // const loadFilters = () => {
// // //   try {
// // //     const raw = sessionStorage.getItem(STORAGE_KEY);
// // //     return raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw) } : null;
// // //   } catch {
// // //     return null;
// // //   }
// // // };

// // // const buildActiveTags = (filters) => {
// // //   const tags = [];
// // //   (filters.bags ?? []).forEach((b) => tags.push({ type: 'Bag', label: b }));
// // //   if (filters.category === 'wallet') tags.push({ type: 'Category', label: 'Wallet' });
// // //   if (filters.category === 'belt')   tags.push({ type: 'Category', label: 'Belt' });
// // //   if (filters.category === 'bag')    tags.push({ type: 'Category', label: 'Bag' });
// // //   (filters.brands ?? []).forEach((b) => tags.push({ type: 'Brand', label: b }));
// // //   (filters.material ?? []).forEach((m) => tags.push({ type: 'Material', label: m }));
// // //   (filters.sizes ?? []).forEach((s) => tags.push({ type: 'Size', label: s }));
// // //   if (filters.priceRange) {
// // //     const map = {
// // //       under500:    'Under ₹500',
// // //       '500-1000':  '₹500 - ₹1000',
// // //       '1000-2000': '₹1000 - ₹2000',
// // //       above2000:   'Above ₹2000',
// // //     };
// // //     tags.push({ type: 'Price', label: map[filters.priceRange] ?? filters.priceRange });
// // //   }
// // //   (filters.capacities ?? []).forEach((c) => tags.push({ type: 'Capacity', label: c }));
// // //   return tags;
// // // };

// // // const AllProducts = () => {
// // //   const location = useLocation();
// // //   const navigate = useNavigate();
// // //   const { searchResults, shouldShowResults, clearSearch } = useSearch();
// // //   const { products: dbProducts, loading, error } = useProducts();

// // //   const [filters, setFilters] = useState(() => {
// // //     const incoming = location.state?.filters;
// // //     if (incoming) {
// // //       const merged = { ...DEFAULT_FILTERS, ...incoming };
// // //       saveFilters(merged);
// // //       return merged;
// // //     }
// // //     return loadFilters() ?? DEFAULT_FILTERS;
// // //   });

// // //   const [appliedFilters, setAppliedFilters] = useState(filters);
// // //   const [activeTags, setActiveTags] = useState(() => buildActiveTags(filters));
// // //   const [sortBy, setSortBy] = useState('');
// // //   const [drawerOpen, setDrawerOpen] = useState(false);
// // //   const [tempFilters, setTempFilters] = useState(null);

// // //   useEffect(() => {
// // //     const incoming = location.state?.filters;
// // //     if (incoming) {
// // //       const merged = { ...DEFAULT_FILTERS, ...incoming };
// // //       applyFilters(merged);
// // //       window.history.replaceState({}, document.title);
// // //     }
// // //     window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
// // //   }, [location.state]);

// // //   useEffect(() => {
// // //     saveFilters(filters);
// // //   }, [filters]);

// // //   // Cleanup body scroll lock when component unmounts
// // //   useEffect(() => {
// // //     return () => {
// // //       document.body.classList.remove('filter-drawer-open');
// // //     };
// // //   }, []);

// // //   const applyFilters = (next) => {
// // //     setFilters(next);
// // //     setAppliedFilters(next);
// // //     setActiveTags(buildActiveTags(next));
// // //     saveFilters(next);
// // //   };

// // //   const handleFilterChange = (next) => applyFilters(next);

// // //   const handleRemoveTag = (index) => {
// // //     const tag = activeTags[index];
// // //     const updated = { ...filters };
// // //     if (tag.type === 'Bag') updated.bags = updated.bags.filter((v) => v !== tag.label);
// // //     if (tag.type === 'Category') updated.category = '';
// // //     if (tag.type === 'Brand') updated.brands = updated.brands.filter((v) => v !== tag.label);
// // //     if (tag.type === 'Material') updated.material = (updated.material ?? []).filter((v) => v !== tag.label);
// // //     if (tag.type === 'Size') updated.sizes = (updated.sizes ?? []).filter((v) => v !== tag.label);
// // //     if (tag.type === 'Pattern') updated.pattern = '';
// // //     if (tag.type === 'Price') updated.priceRange = '';
// // //     if (tag.type === 'Capacity') updated.capacities = (updated.capacities ?? []).filter((v) => v !== tag.label);
// // //     applyFilters(updated);
// // //   };

// // //   const handleClearAllFilters = () => {
// // //     applyFilters(DEFAULT_FILTERS);
// // //     sessionStorage.removeItem(STORAGE_KEY);
// // //     clearSearch();
// // //     window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
// // //   };

// // //   // Drawer handlers with scroll lock - auto apply filters
// // //   const handleOpenDrawer = () => {
// // //     setTempFilters({ ...filters });
// // //     setDrawerOpen(true);
// // //     document.body.classList.add('filter-drawer-open');
// // //   };

// // //   const handleCloseDrawer = () => {
// // //     setDrawerOpen(false);
// // //     setTempFilters(null);
// // //     document.body.classList.remove('filter-drawer-open');
// // //   };

// // //   const handleTempFilterChange = (newFilters) => {
// // //     setTempFilters(newFilters);
// // //     // Auto-apply filters immediately when changed in mobile drawer
// // //     applyFilters(newFilters);
// // //   };

// // //   const handleClearFiltersInDrawer = () => {
// // //     const clearedFilters = { ...DEFAULT_FILTERS };
// // //     setTempFilters(clearedFilters);
// // //     applyFilters(clearedFilters);
// // //   };

// // //   const handleTempRemoveTag = (index) => {
// // //     const currentFilters = tempFilters || filters;
// // //     const tags = buildActiveTags(currentFilters);
// // //     const tag = tags[index];
// // //     const updated = { ...currentFilters };
// // //     if (tag.type === 'Bag') updated.bags = updated.bags.filter((v) => v !== tag.label);
// // //     if (tag.type === 'Category') updated.category = '';
// // //     if (tag.type === 'Brand') updated.brands = updated.brands.filter((v) => v !== tag.label);
// // //     if (tag.type === 'Material') updated.material = (updated.material ?? []).filter((v) => v !== tag.label);
// // //     if (tag.type === 'Size') updated.sizes = (updated.sizes ?? []).filter((v) => v !== tag.label);
// // //     if (tag.type === 'Price') updated.priceRange = '';
// // //     if (tag.type === 'Capacity') updated.capacities = (updated.capacities ?? []).filter((v) => v !== tag.label);
// // //     setTempFilters(updated);
// // //     applyFilters(updated);
// // //   };

// // //   // Brand existence check
// // //   useEffect(() => {
// // //     if (!loading && dbProducts.length > 0) {
// // //       const incoming = location.state?.filters;
// // //       if (incoming && incoming.brands && incoming.brands.length > 0) {
// // //         const brandName = incoming.brands[0];
// // //         const brandExists = dbProducts.some(
// // //           (p) =>
// // //             (p.brand || '').toLowerCase() === brandName.toLowerCase() ||
// // //             (p.name || '').toLowerCase().includes(brandName.toLowerCase())
// // //         );
// // //         if (!brandExists) {
// // //           applyFilters(DEFAULT_FILTERS);
// // //           sessionStorage.removeItem(STORAGE_KEY);
// // //           clearSearch();
// // //         }
// // //       }
// // //     }
// // //   }, [loading, dbProducts, location.state]);

// // //   const handleBuyNowCheckout = (product) => {
// // //     navigate("/product", { state: { product } });
// // //   };

// // //   const baseProducts = (shouldShowResults && searchResults.length > 0)
// // //     ? searchResults
// // //     : dbProducts;

// // //   const filteredProducts = useMemo(() => {
// // //     let products = [...baseProducts];

// // //     if (appliedFilters.category) {
// // //       products = products.filter((p) =>
// // //         p.category?.toLowerCase() === appliedFilters.category.toLowerCase()
// // //       );
// // //     }
// // //     if (appliedFilters.priceRange) {
// // //       products = products.filter((p) => {
// // //         const price = Number(p.price);
// // //         if (appliedFilters.priceRange === 'under500') return price < 500;
// // //         if (appliedFilters.priceRange === '500-1000') return price >= 500 && price <= 1000;
// // //         if (appliedFilters.priceRange === '1000-2000') return price >= 1000 && price <= 2000;
// // //         if (appliedFilters.priceRange === 'above2000') return price > 2000;
// // //         return true;
// // //       });
// // //     }
// // //     if (appliedFilters.bags && appliedFilters.bags.length > 0) {
// // //       products = products.filter((p) => {
// // //         const subCat = (p.subCategory || '').toLowerCase();
// // //         const name = (p.name || '').toLowerCase();
// // //         return appliedFilters.bags.some((bag) =>
// // //           subCat === bag.toLowerCase() || name.includes(bag.toLowerCase())
// // //         );
// // //       });
// // //     }
// // //     if (appliedFilters.brands && appliedFilters.brands.length > 0) {
// // //       products = products.filter((p) => {
// // //         const pBrand = (p.brand || '').toLowerCase();
// // //         const name = (p.name || '').toLowerCase();
// // //         return appliedFilters.brands.some((brand) =>
// // //           pBrand === brand.toLowerCase() || name.includes(brand.toLowerCase())
// // //         );
// // //       });
// // //     }
// // //     if (appliedFilters.material && appliedFilters.material.length > 0) {
// // //       products = products.filter((p) => {
// // //         const pMat = (p.material || '').toLowerCase();
// // //         const name = (p.name || '').toLowerCase();
// // //         const desc = (p.description || '').toLowerCase();
// // //         return appliedFilters.material.some((m) => {
// // //           const baseMat = m.toLowerCase();
// // //           return pMat === baseMat || name.includes(baseMat) || desc.includes(baseMat);
// // //         });
// // //       });
// // //     }
// // //     if (appliedFilters.sizes && appliedFilters.sizes.length > 0) {
// // //       products = products.filter((p) => {
// // //         const pSize = (p.size || '').toLowerCase();
// // //         const name = (p.name || '').toLowerCase();
// // //         const sizeList = pSize.split(',').map((s) => s.trim());
// // //         return appliedFilters.sizes.every((size) => {
// // //           const lowerSize = size.toLowerCase();
// // //           return sizeList.includes(lowerSize) || name.includes(lowerSize);
// // //         });
// // //       });
// // //     }
// // //     if (appliedFilters.capacities && appliedFilters.capacities.length > 0) {
// // //       products = products.filter((p) => {
// // //         const pCap = (p.capacity || '').toLowerCase();
// // //         const desc = (p.description || '').toLowerCase();
// // //         const capList = pCap.split(',').map((c) => c.trim());
// // //         return appliedFilters.capacities.every((capacity) => {
// // //           const lowerCap = capacity.toLowerCase();
// // //           return capList.includes(lowerCap) || desc.includes(lowerCap);
// // //         });
// // //       });
// // //     }

// // //     return products;
// // //   }, [baseProducts, appliedFilters]);

// // //   const sortedProducts = useMemo(() => {
// // //     if (!sortBy) return filteredProducts;
// // //     const sorted = [...filteredProducts];
// // //     if (sortBy === 'price-low') return sorted.sort((a, b) => Number(a.price) - Number(b.price));
// // //     if (sortBy === 'price-high') return sorted.sort((a, b) => Number(b.price) - Number(a.price));
// // //     if (sortBy === 'rating') return sorted.sort((a, b) => Number(b.rating) - Number(a.rating));
// // //     return sorted;
// // //   }, [sortBy, filteredProducts]);

// // //   const isOutOfStock = (p) =>
// // //     p.stocks !== undefined && p.stocks !== null && parseInt(p.stocks) <= 0;

// // //   const stockSortedProducts = useMemo(() => {
// // //     const inStock = sortedProducts.filter((p) => !isOutOfStock(p));
// // //     const outOfStock = sortedProducts.filter((p) => isOutOfStock(p));
// // //     return [...inStock, ...outOfStock];
// // //   }, [sortedProducts]);

// // //   const hasNoResults = !loading && stockSortedProducts.length === 0;
// // //   const displayProducts = hasNoResults ? dbProducts : stockSortedProducts;

// // //   const sidebar = (
// // //     <FilterSideBar
// // //       filters={filters}
// // //       onChange={handleFilterChange}
// // //       activeTags={activeTags}
// // //       onRemoveTag={handleRemoveTag}
// // //       onClearAll={handleClearAllFilters}
// // //     />
// // //   );

// // //   // Loading skeleton
// // //   if (loading) {
// // //     return (
// // //       <>
// // //         <Navbar />
// // //         <div className="all-products-page">
// // //           <div className="all-products-topbar">
// // //             <h2 className="all-products-title">All Products</h2>
// // //           </div>
// // //           <div className="all-products-main">
// // //             <div className="all-products-sidebar desktop-only">{sidebar}</div>
// // //             <div className="all-products-grid">
// // //               <div className="ProductCard-section">
// // //                 <div className="container">
// // //                   {Array.from({ length: 8 }).map((_, i) => (
// // //                     <div
// // //                       key={i}
// // //                       className="card"
// // //                       style={{
// // //                         background: '#fff',
// // //                         borderRadius: '12px',
// // //                         overflow: 'hidden',
// // //                         height: '100%',
// // //                         border: '1px solid #f0f0f0',
// // //                       }}
// // //                     >
// // //                       <div
// // //                         style={{
// // //                           width: '100%',
// // //                           aspectRatio: '1 / 1',
// // //                           borderRadius: '0 40px 0 40px',
// // //                           background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// // //                           backgroundSize: '200% 100%',
// // //                           animation: 'shimmer 1.5s infinite',
// // //                         }}
// // //                       />
// // //                       <div className="card-body" style={{ padding: '0.875rem' }}>
// // //                         <div
// // //                           style={{
// // //                             height: '1.2rem',
// // //                             width: '85%',
// // //                             borderRadius: '4px',
// // //                             background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// // //                             backgroundSize: '200% 100%',
// // //                             animation: 'shimmer 1.5s infinite',
// // //                             marginBottom: '0.5rem',
// // //                           }}
// // //                         />
// // //                         <div
// // //                           style={{
// // //                             height: '0.9rem',
// // //                             width: '45%',
// // //                             borderRadius: '4px',
// // //                             background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// // //                             backgroundSize: '200% 100%',
// // //                             animation: 'shimmer 1.5s infinite',
// // //                             marginBottom: '0.8rem',
// // //                           }}
// // //                         />
// // //                         <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
// // //                           <div
// // //                             style={{
// // //                               height: '1.4rem',
// // //                               width: '35%',
// // //                               borderRadius: '4px',
// // //                               background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// // //                               backgroundSize: '200% 100%',
// // //                               animation: 'shimmer 1.5s infinite',
// // //                             }}
// // //                           />
// // //                           <div
// // //                             style={{
// // //                               height: '1.1rem',
// // //                               width: '25%',
// // //                               borderRadius: '4px',
// // //                               background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// // //                               backgroundSize: '200% 100%',
// // //                               animation: 'shimmer 1.5s infinite',
// // //                             }}
// // //                           />
// // //                         </div>
// // //                       </div>
// // //                     </div>
// // //                   ))}
// // //                 </div>
// // //               </div>
// // //               <style>{`
// // //                 @keyframes shimmer {
// // //                   0% { background-position: -200% 0; }
// // //                   100% { background-position: 200% 0; }
// // //                 }
// // //               `}</style>
// // //             </div>
// // //           </div>
// // //         </div>
// // //         <Footer />
// // //       </>
// // //     );
// // //   }

// // //   // Error state
// // //   if (error) {
// // //     return (
// // //       <>
// // //         <Navbar />
// // //         <div
// // //           className="all-products-page"
// // //           style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
// // //         >
// // //           <div style={{ textAlign: 'center', color: '#6b7280' }}>
// // //             <i className="bi bi-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#ef4444' }} />
// // //             <p style={{ marginTop: '1rem', fontWeight: 500 }}>
// // //               Failed to load products. Please try again later.
// // //             </p>
// // //             <small style={{ color: '#9ca3af' }}>{error}</small>
// // //           </div>
// // //         </div>
// // //         <Footer />
// // //       </>
// // //     );
// // //   }

// // //   // Main render
// // //   return (
// // //     <>
// // //       <Navbar />
// // //       <div className="all-products-page">
// // //         <div className="all-products-topbar">
// // //           <h2 className="all-products-title">All Products</h2>
// // //           <div className="topbar-right">
// // //             <button className="filter-toggle-btn mobile-only" onClick={handleOpenDrawer}>
// // //               <i className="bi bi-sliders"></i> Filters
// // //             </button>
// // //             <SortBySelect value={sortBy} onChange={setSortBy} />
// // //           </div>
// // //         </div>

// // //         <div className="all-products-main">
// // //           <div className="all-products-sidebar desktop-only">
// // //             {sidebar}
// // //           </div>

// // //           <div className="all-products-grid">
// // //             <ProductCard products={displayProducts} onBuyNowClick={handleBuyNowCheckout} />
// // //           </div>
// // //         </div>
// // //       </div>

// // //       {/* Mobile filter drawer with scroll lock - FilterSideBar handles all filtering */}
// // //       {drawerOpen && (
// // //         <div className="filter-overlay" onClick={handleCloseDrawer}>
// // //           <div className="filter-drawer" onClick={(e) => e.stopPropagation()}>
// // //             <div className="filter-drawer-header">
// // //               <span className="filter-drawer-title">
// // //                 <i className="bi bi-funnel"></i> Filters
// // //               </span>
// // //               <button className="filter-drawer-close" onClick={handleCloseDrawer}>
// // //                 <i className="bi bi-x-lg"></i>
// // //               </button>
// // //             </div>
// // //             <div className="filter-drawer-body">
// // //               <FilterSideBar
// // //                 filters={tempFilters || filters}
// // //                 onChange={handleTempFilterChange}
// // //                 activeTags={buildActiveTags(tempFilters || filters)}
// // //                 onRemoveTag={handleTempRemoveTag}
// // //                 onClearAll={handleClearFiltersInDrawer}
// // //               />
// // //             </div>
// // //           </div>
// // //         </div>
// // //       )}

// // //       <Footer />
// // //     </>
// // //   );
// // // };

// // // export default AllProducts;

// // import { useState, useMemo, useEffect } from 'react';
// // import { useLocation, useNavigate } from 'react-router-dom';
// // import { useSearch } from '../../context/SearchContext';
// // import { useProducts } from '../../context/ProductsContext';
// // import SortBySelect from '../../components/User/SortBySelect';
// // import FilterSideBar, { DEFAULT_FILTERS } from '../../components/User/FilterSideBar';
// // import Navbar from "../../components/User/Navbar";
// // import Footer from "../../components/User/Footer";
// // import ProductCard from "../../components/User/ProductCard";

// // import "../../assets/styles/allproducts.css";

// // const STORAGE_KEY = 'allproducts_filters';

// // // Kept as empty for legacy imports (Navbar/ProductCard fallback).
// // // Real data is supplied via ProductsContext.
// // export const allProductsData = [];

// // const saveFilters = (filters) => {
// //   sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
// // };

// // const loadFilters = () => {
// //   try {
// //     const raw = sessionStorage.getItem(STORAGE_KEY);
// //     return raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw) } : null;
// //   } catch {
// //     return null;
// //   }
// // };

// // const buildActiveTags = (filters) => {
// //   const tags = [];
// //   (filters.bags ?? []).forEach((b) => tags.push({ type: 'Bag', label: b }));
// //   if (filters.category === 'wallet') tags.push({ type: 'Category', label: 'Wallet' });
// //   if (filters.category === 'belt')   tags.push({ type: 'Category', label: 'Belt' });
// //   if (filters.category === 'bag')    tags.push({ type: 'Category', label: 'Bag' });
// //   (filters.brands ?? []).forEach((b) => tags.push({ type: 'Brand', label: b }));
// //   (filters.material ?? []).forEach((m) => tags.push({ type: 'Material', label: m }));
// //   (filters.sizes ?? []).forEach((s) => tags.push({ type: 'Size', label: s }));
// //   if (filters.priceRange) {
// //     const map = {
// //       under500:    'Under ₹500',
// //       '500-1000':  '₹500 - ₹1000',
// //       '1000-2000': '₹1000 - ₹2000',
// //       above2000:   'Above ₹2000',
// //     };
// //     tags.push({ type: 'Price', label: map[filters.priceRange] ?? filters.priceRange });
// //   }
// //   (filters.capacities ?? []).forEach((c) => tags.push({ type: 'Capacity', label: c }));
// //   return tags;
// // };

// // const AllProducts = () => {
// //   const location = useLocation();
// //   const navigate = useNavigate();
// //   const { searchResults, shouldShowResults, clearSearch } = useSearch();

// //   // ── Live Firestore products ───────────────────────────────────────────────
// //   const { products: dbProducts, loading, error } = useProducts();

// //   const [filters, setFilters] = useState(() => {
// //     const incoming = location.state?.filters;
// //     if (incoming) {
// //       const merged = { ...DEFAULT_FILTERS, ...incoming };
// //       saveFilters(merged);
// //       return merged;
// //     }
// //     return loadFilters() ?? DEFAULT_FILTERS;
// //   });

// //   const [appliedFilters, setAppliedFilters] = useState(filters);
// //   const [activeTags, setActiveTags]         = useState(() => buildActiveTags(filters));
// //   const [sortBy, setSortBy]                 = useState('');
// //   const [drawerOpen, setDrawerOpen]         = useState(false);

// //   useEffect(() => {
// //     const incoming = location.state?.filters;
// //     if (incoming) {
// //       const merged = { ...DEFAULT_FILTERS, ...incoming };
// //       applyFilters(merged);
// //       window.history.replaceState({}, document.title);
// //     }
// //     window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
// //   }, [location.state]);

// //   useEffect(() => {
// //     saveFilters(filters);
// //   }, [filters]);

// //   const applyFilters = (next) => {
// //     setFilters(next);
// //     setAppliedFilters(next);
// //     setActiveTags(buildActiveTags(next));
// //     saveFilters(next);
// //   };

// //   const handleFilterChange = (next) => applyFilters(next);

// //   const handleRemoveTag = (index) => {
// //     const tag     = activeTags[index];
// //     const updated = { ...filters };
// //     if (tag.type === 'Bag')      updated.bags       = updated.bags.filter((v) => v !== tag.label);
// //     if (tag.type === 'Category') updated.category   = '';
// //     if (tag.type === 'Brand')    updated.brands     = updated.brands.filter((v) => v !== tag.label);
// //     if (tag.type === 'Material') updated.material   = (updated.material ?? []).filter((v) => v !== tag.label);
// //     if (tag.type === 'Size')     updated.sizes      = (updated.sizes ?? []).filter((v) => v !== tag.label);
// //     if (tag.type === 'Pattern')  updated.pattern    = '';
// //     if (tag.type === 'Price')    updated.priceRange = '';
// //     if (tag.type === 'Capacity') updated.capacities = (updated.capacities ?? []).filter((v) => v !== tag.label);
// //     applyFilters(updated);
// //   };

// //   const handleClearAllFilters = () => {
// //     applyFilters(DEFAULT_FILTERS);
// //     sessionStorage.removeItem(STORAGE_KEY);
// //     clearSearch();
// //     window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
// //   };

// //   // If brand is requested from Home but doesn't exist, fallback to all products
// //   useEffect(() => {
// //     if (!loading && dbProducts.length > 0) {
// //       const incoming = location.state?.filters;
// //       if (incoming && incoming.brands && incoming.brands.length > 0) {
// //         const brandName = incoming.brands[0];
// //         const brandExists = dbProducts.some(
// //           (p) =>
// //             (p.brand || '').toLowerCase() === brandName.toLowerCase() ||
// //             (p.name || '').toLowerCase().includes(brandName.toLowerCase())
// //         );
// //         if (!brandExists) {
// //           applyFilters(DEFAULT_FILTERS);
// //           sessionStorage.removeItem(STORAGE_KEY);
// //           clearSearch();
// //         }
// //       }
// //     }
// //   }, [loading, dbProducts, location.state]);

// //   const handleBuyNowCheckout = (product) => {
// //     navigate("/product", { state: { product } });
// //   };

// //   // ── Base: search results OR full Firestore list ───────────────────────────
// //   const baseProducts = (shouldShowResults && searchResults.length > 0)
// //     ? searchResults
// //     : dbProducts;

// //   const filteredProducts = useMemo(() => {
// //     let products = [...baseProducts];

// //     if (appliedFilters.category) {
// //       products = products.filter((p) =>
// //         p.category?.toLowerCase() === appliedFilters.category.toLowerCase()
// //       );
// //     }
// //     if (appliedFilters.priceRange) {
// //       products = products.filter((p) => {
// //         const price = Number(p.price);
// //         if (appliedFilters.priceRange === 'under500')  return price < 500;
// //         if (appliedFilters.priceRange === '500-1000')  return price >= 500  && price <= 1000;
// //         if (appliedFilters.priceRange === '1000-2000') return price >= 1000 && price <= 2000;
// //         if (appliedFilters.priceRange === 'above2000') return price > 2000;
// //         return true;
// //       });
// //     }
// //     if (appliedFilters.bags && appliedFilters.bags.length > 0) {
// //       products = products.filter((p) => {
// //         const subCat = (p.subCategory || '').toLowerCase();
// //         const name = (p.name || '').toLowerCase();
// //         return appliedFilters.bags.some((bag) =>
// //           subCat === bag.toLowerCase() || name.includes(bag.toLowerCase())
// //         );
// //       });
// //     }
// //     if (appliedFilters.brands && appliedFilters.brands.length > 0) {
// //       products = products.filter((p) => {
// //         const pBrand = (p.brand || '').toLowerCase();
// //         const name = (p.name || '').toLowerCase();
// //         return appliedFilters.brands.some((brand) =>
// //           pBrand === brand.toLowerCase() || name.includes(brand.toLowerCase())
// //         );
// //       });
// //     }
// //     if (appliedFilters.material && appliedFilters.material.length > 0) {
// //       products = products.filter((p) => {
// //         const pMat = (p.material || '').toLowerCase();
// //         const name = (p.name || '').toLowerCase();
// //         const desc = (p.description || '').toLowerCase();
// //         return appliedFilters.material.some((m) => {
// //           const baseMat = m.toLowerCase();
// //           return pMat === baseMat || name.includes(baseMat) || desc.includes(baseMat);
// //         });
// //       });
// //     }
// //     if (appliedFilters.sizes && appliedFilters.sizes.length > 0) {
// //       products = products.filter((p) => {
// //         const pSize = (p.size || '').toLowerCase();
// //         const name = (p.name || '').toLowerCase();
// //         const sizeList = pSize.split(',').map((s) => s.trim());
// //         return appliedFilters.sizes.every((size) => {
// //           const lowerSize = size.toLowerCase();
// //           return sizeList.includes(lowerSize) || name.includes(lowerSize);
// //         });
// //       });
// //     }
// //     if (appliedFilters.capacities && appliedFilters.capacities.length > 0) {
// //       products = products.filter((p) => {
// //         const pCap = (p.capacity || '').toLowerCase();
// //         const desc = (p.description || '').toLowerCase();
// //         const capList = pCap.split(',').map((c) => c.trim());
// //         return appliedFilters.capacities.every((capacity) => {
// //           const lowerCap = capacity.toLowerCase();
// //           return capList.includes(lowerCap) || desc.includes(lowerCap);
// //         });
// //       });
// //     }

// //     return products;
// //   }, [baseProducts, appliedFilters]);

// //   const sortedProducts = useMemo(() => {
// //     if (!sortBy) return filteredProducts;
// //     const sorted = [...filteredProducts];
// //     if (sortBy === 'price-low')  return sorted.sort((a, b) => Number(a.price) - Number(b.price));
// //     if (sortBy === 'price-high') return sorted.sort((a, b) => Number(b.price) - Number(a.price));
// //     if (sortBy === 'rating')     return sorted.sort((a, b) => Number(b.rating) - Number(a.rating));
// //     return sorted;
// //   }, [sortBy, filteredProducts]);

// //   // Always push out-of-stock items to the end, preserving relative order within each group
// //   const isOutOfStock = (p) =>
// //     p.stocks !== undefined && p.stocks !== null && parseInt(p.stocks) <= 0;

// //   const stockSortedProducts = useMemo(() => {
// //     const inStock = sortedProducts.filter((p) => !isOutOfStock(p));
// //     const outOfStock = sortedProducts.filter((p) => isOutOfStock(p));
// //     return [...inStock, ...outOfStock];
// //   }, [sortedProducts]);

// //   const hasNoResults    = !loading && stockSortedProducts.length === 0;
// //   const displayProducts = hasNoResults ? dbProducts : stockSortedProducts;

// //   const sidebar = (
// //     <FilterSideBar
// //       filters={filters}
// //       onChange={handleFilterChange}
// //       activeTags={activeTags}
// //       onRemoveTag={handleRemoveTag}
// //       onClearAll={handleClearAllFilters}
// //     />
// //   );

// //   // ── Loading skeleton ──────────────────────────────────────────────────────
// //   if (loading) {
// //     return (
// //       <>
// //         <Navbar />
// //         <div className="all-products-page">
// //           <div className="all-products-topbar">
// //             <h2 className="all-products-title">All Products</h2>
// //           </div>
// //           <div className="all-products-main">
// //             <div className="all-products-sidebar desktop-only">{sidebar}</div>
// //             <div className="all-products-grid">
// //               <div className="ProductCard-section">
// //                 <div className="container">
// //                   {Array.from({ length: 8 }).map((_, i) => (
// //                     <div
// //                       key={i}
// //                       className="card"
// //                       style={{
// //                         background: '#fff',
// //                         borderRadius: '12px',
// //                         overflow: 'hidden',
// //                         height: '100%',
// //                         border: '1px solid #f0f0f0',
// //                       }}
// //                     >
// //                       {/* Image area skeleton with brand custom border-radius shape */}
// //                       <div
// //                         style={{
// //                           width: '100%',
// //                           aspectRatio: '1 / 1',
// //                           borderRadius: '0 40px 0 40px',
// //                           background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// //                           backgroundSize: '200% 100%',
// //                           animation: 'shimmer 1.5s infinite',
// //                         }}
// //                       />
// //                       <div className="card-body" style={{ padding: '0.875rem' }}>
// //                         {/* Title text skeleton */}
// //                         <div
// //                           style={{
// //                             height: '1.2rem',
// //                             width: '85%',
// //                             borderRadius: '4px',
// //                             background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// //                             backgroundSize: '200% 100%',
// //                             animation: 'shimmer 1.5s infinite',
// //                             marginBottom: '0.5rem',
// //                           }}
// //                         />
// //                         {/* Rating stars skeleton */}
// //                         <div
// //                           style={{
// //                             height: '0.9rem',
// //                             width: '45%',
// //                             borderRadius: '4px',
// //                             background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// //                             backgroundSize: '200% 100%',
// //                             animation: 'shimmer 1.5s infinite',
// //                             marginBottom: '0.8rem',
// //                           }}
// //                         />
// //                         {/* Prices row skeleton */}
// //                         <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
// //                           <div
// //                             style={{
// //                               height: '1.4rem',
// //                               width: '35%',
// //                               borderRadius: '4px',
// //                               background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// //                               backgroundSize: '200% 100%',
// //                               animation: 'shimmer 1.5s infinite',
// //                             }}
// //                           />
// //                           <div
// //                             style={{
// //                               height: '1.1rem',
// //                               width: '25%',
// //                               borderRadius: '4px',
// //                               background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
// //                               backgroundSize: '200% 100%',
// //                               animation: 'shimmer 1.5s infinite',
// //                             }}
// //                           />
// //                         </div>
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //               <style>{`
// //                 @keyframes shimmer {
// //                   0%   { background-position: -200% 0; }
// //                   100% { background-position:  200% 0; }
// //                 }
// //               `}</style>
// //             </div>
// //           </div>
// //         </div>
// //         <Footer />
// //       </>
// //     );
// //   }

// //   // ── Error state ───────────────────────────────────────────────────────────
// //   if (error) {
// //     return (
// //       <>
// //         <Navbar />
// //         <div
// //           className="all-products-page"
// //           style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
// //         >
// //           <div style={{ textAlign: 'center', color: '#6b7280' }}>
// //             <i className="bi bi-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#ef4444' }} />
// //             <p style={{ marginTop: '1rem', fontWeight: 500 }}>
// //               Failed to load products. Please try again later.
// //             </p>
// //             <small style={{ color: '#9ca3af' }}>{error}</small>
// //           </div>
// //         </div>
// //         <Footer />
// //       </>
// //     );
// //   }

// //   // ── Main render ───────────────────────────────────────────────────────────
// //   return (
// //     <>
// //       <Navbar />
// //       <div className="all-products-page">
// //         <div className="all-products-topbar">
// //           <h2 className="all-products-title">All Products</h2>
// //           <div className="topbar-right">
// //             {/* Filter button — only visible on tablet/mobile */}
// //             <button className="filter-toggle-btn mobile-only" onClick={() => setDrawerOpen(true)}>
// //               <i className="bi bi-sliders"></i> Filters
// //             </button>
// //             <SortBySelect value={sortBy} onChange={setSortBy} />
// //           </div>
// //         </div>

// //         <div className="all-products-main">
// //           <div className="all-products-sidebar desktop-only">
// //             {sidebar}
// //           </div>

// //           <div className="all-products-grid">
// //             <ProductCard products={displayProducts} onBuyNowClick={handleBuyNowCheckout} />
// //           </div>
// //         </div>
// //       </div>

// //       {/* ── Mobile filter drawer ── */}
// //       {drawerOpen && (
// //         <div className="filter-overlay" onClick={() => setDrawerOpen(false)}>
// //           <div className="filter-drawer" onClick={(e) => e.stopPropagation()}>
// //             <div className="filter-drawer-header">
// //               <span className="filter-drawer-title">Filters</span>
// //               <button className="filter-drawer-close" onClick={() => setDrawerOpen(false)}>
// //                 <i className="bi bi-x-lg"></i>
// //               </button>
// //             </div>
// //             <div className="filter-drawer-body">
// //               {sidebar}
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       <Footer />
// //     </>
// //   );
// // };

// // export default AllProducts;