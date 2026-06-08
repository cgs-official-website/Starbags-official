import { useState, useEffect, useRef } from "react";
import { IoSearch } from "react-icons/io5";
import { FiClock, FiArrowLeft } from "react-icons/fi";
import { useSearch } from "../../context/SearchContext";
import '../../assets/styles/SearchModal.css';

const defaultProducts = [
  { name: "American tourist bag",         category: "bag",    price: "1299" },
  { name: "Schools bags small for child",  category: "bag",    price: "499"  },
  { name: "Travel bags",                   category: "bag",    price: "899"  },
  { name: "Trolly Tour bag",               category: "bag",    price: "1599" },
];

const SearchModal = ({
  products = [],
  onSearch,
  placeholder = "Search your products",
}) => {
  const { searchQuery } = useSearch();
  const [isOpen,    setIsOpen]    = useState(false);
  const [query,     setQuery]     = useState(searchQuery || "");
  const [isMobile,  setIsMobile]  = useState(false);
  const [recent,    setRecent]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("sm_recent") || "[]"); }
    catch { return []; }
  });

  const wrapperRef = useRef(null);
  const inputRef   = useRef(null);

  const list = products.length > 0 ? products : defaultProducts;

  const filtered = query.trim()
    ? list.filter(
        (p) =>
          p.name?.toLowerCase().includes(query.toLowerCase()) ||
          p.category?.toLowerCase().includes(query.toLowerCase()) ||
          p.description?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const isEmptyQuery = !query.trim();

  /* Sync local query state with context search query when it changes externally */
  useEffect(() => {
    setQuery(searchQuery || "");
  }, [searchQuery]);

  /* detect mobile */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* lock body scroll when mobile overlay is open */
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, isOpen]);

  /* close on outside click */
  useEffect(() => {
    const onOut = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const onEsc = (e) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("mousedown", onOut);
    document.addEventListener("keydown",   onEsc);
    return () => {
      document.removeEventListener("mousedown", onOut);
      document.removeEventListener("keydown",   onEsc);
    };
  }, []);

  /* auto-focus input when mobile overlay opens */
  useEffect(() => {
    if (isMobile && isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isMobile, isOpen]);

  const saveRecent = (text) => {
    const updated = [text, ...recent.filter((r) => r !== text)].slice(0, 6);
    setRecent(updated);
    localStorage.setItem("sm_recent", JSON.stringify(updated));
  };

  const deleteRecent = (e, text) => {
    e.stopPropagation();
    const updated = recent.filter((r) => r !== text);
    setRecent(updated);
    localStorage.setItem("sm_recent", JSON.stringify(updated));
  };

  const handleSelect = (product) => {
    saveRecent(product.name);
    setQuery(product.name);
    setIsOpen(false);
    if (onSearch) onSearch(product.name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecent(query.trim());
      setIsOpen(false);
      if (onSearch) onSearch(query.trim());
    } else {
      setIsOpen(false);
      if (onSearch) onSearch("");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  const highlight = (text, q) => {
    if (!q) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <span>{text}</span>;
    return (
      <span>
        {text.slice(0, idx)}
        <strong>{text.slice(idx, idx + q.length)}</strong>
        {text.slice(idx + q.length)}
      </span>
    );
  };

  const isOverlay = isMobile && isOpen;

  return (
    <>
      {/* ── Mobile full-screen backdrop ── */}
      {isOverlay && (
        <div className="sm-overlay-backdrop" onMouseDown={handleClose} />
      )}

      <div
        className={`sm-wrapper${isOverlay ? ' sm-mobile-open' : ''}`}
        ref={wrapperRef}
      >
        {/* ── Search bar (back button + bar inline on overlay) ── */}
        <div className={isOverlay ? 'sm-overlay-row' : ''}>
          {isOverlay && (
            <button
              className="sm-back-btn"
              onMouseDown={handleClose}
              aria-label="Close search"
              type="button"
            >
              <FiArrowLeft size={20} />
            </button>
          )}
          <form className="sm-bar" onSubmit={handleSubmit} style={isOverlay ? { flex: 1, minWidth: 0 } : {}}>
            <input
              ref={inputRef}
              type="text"
              className="sm-bar-input"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="sm-bar-clear"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery("");
                  if (onSearch) onSearch("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear"
              >
                ✕
              </button>
            )}
            <button type="submit" className="sm-bar-btn">
              <IoSearch size={17} />
            </button>
          </form>
        </div>

        {/* ── Dropdown ── */}
        {isOpen && (
          <div className="sm-dropdown">

            {/* State 1 — empty query: recent + suggestions */}
            {isEmptyQuery && (
              <>
                {recent.length > 0 && (
                  <div className="sm-recent-section">
                    <div className="sm-section-header">Recent searches</div>
                    <ul className="sm-list">
                      {recent.map((item, i) => (
                        <li key={i} className="sm-item sm-recent-item">
                          <span className="sm-clock-wrap">
                            <FiClock size={16} />
                          </span>
                          <span
                            className="sm-recent-text"
                            onMouseDown={() => handleSelect({ name: item })}
                          >
                            {item}
                          </span>
                          <button
                            className="sm-remove-btn"
                            onMouseDown={(e) => deleteRecent(e, item)}
                            aria-label={`Remove ${item}`}
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="sm-section-header">Suggestions</div>
                <ul className="sm-list">
                  {list.slice(0, 6).map((product, i) => (
                    <li
                      key={i}
                      className="sm-item"
                      onMouseDown={() => handleSelect(product)}
                    >
                      <div className="sm-thumb">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        ) : (
                          <span className="sm-thumb-fallback">🛍</span>
                        )}
                      </div>
                      <div className="sm-item-info">
                        <span className="sm-item-name">{product.name}</span>
                        {product.category && (
                          <span className="sm-item-category">{product.category}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* State 2 — typing: filtered results */}
            {!isEmptyQuery && filtered.length > 0 && (
              <ul className="sm-list">
                {filtered.slice(0, 6).map((product, i) => (
                  <li
                    key={i}
                    className="sm-item"
                    onMouseDown={() => handleSelect(product)}
                  >
                    <div className="sm-thumb">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      ) : (
                        <span className="sm-thumb-fallback">🛍</span>
                      )}
                    </div>
                    <div className="sm-item-info">
                      <span className="sm-item-name">
                        {highlight(product.name, query)}
                      </span>
                      {product.category && (
                        <span className="sm-item-category">{product.category}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* No results */}
            {!isEmptyQuery && filtered.length === 0 && (
              <div className="sm-empty-msg">
                No results for "<strong>{query}</strong>"
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
};

export default SearchModal;