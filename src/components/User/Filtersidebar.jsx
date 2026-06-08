import { useState, useCallback, memo } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "../../assets/styles/FilterSidebar.css";

// ── Static Data ───────────────────────────────────────────────────────────────

export const BAG_TYPES  = ['College Bag', 'Hand Bag', 'Lunch Bag', 'Office Bag', 'School Bag', 'Travel Bag', 'Trolley Bag'];
export const BRANDS     = ['American Tourister', 'Puma', 'Rubee bags', 'Safari', 'Sky bags', 'VIP', 'Wildcraft'];
export const MATERIALS  = ['Leather', 'Canvas'];
export const SIZES      = ['Small', 'Medium', 'Large'];
export const PATTERNS   = ['Plain', 'Snake Leather', 'Crocodile', 'Ostrich'];
export const CAPACITIES = ['20L', '30L', '40L'];
export const BELT_SIZES = ['Small', 'Medium', 'Large'];

export const PRICE_RANGES = [
  { label: 'Under ₹500',    value: 'under500',   min: 0,    max: 500      },
  { label: '₹500 - ₹1000',  value: '500-1000',   min: 500,  max: 1000     },
  { label: '₹1000 - ₹2000', value: '1000-2000',  min: 1000, max: 2000     },
  { label: 'Above ₹2000',   value: 'above2000',  min: 2000, max: Infinity },
];

export const DEFAULT_FILTERS = {
  category:   '',
  bags:       [],
  brands:     [],
  material:   [],
  sizes:      [],
  priceRange: '',
  capacities: [],
};

// ── Collapsible Section ────────────────────────────────────────────────────────
const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="filter-section">
      <div className="filter-section-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="filter-section-title">{title}</span>
        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </div>
      {isOpen && <div className="filter-section-content">{children}</div>}
    </div>
  );
};

// ── Checkbox List ──────────────────────────────────────────────────────────────
const CheckboxList = ({ options, selected, onChange, color = '#8b5cf6', initialLimit = 4 }) => {
  const [showAll, setShowAll] = useState(false);
  const visibleOptions = showAll ? options : options.slice(0, initialLimit);
  const hasMore = options.length > initialLimit;
  return (
    <div className="checkbox-list-wrapper">
      <div className="checkbox-list">
        {visibleOptions.map((option) => (
          <label key={option} className="checkbox-item">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onChange(option)}
              style={{ accentColor: color }}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {hasMore && (
        <button className="show-more-btn" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show Less' : `+ ${options.length - initialLimit} more`}
        </button>
      )}
    </div>
  );
};

// ── Size Buttons ───────────────────────────────────────────────────────────────
const SizeButtons = ({ options, selected = [], onChange, initialLimit = 3 }) => {
  const [showAll, setShowAll] = useState(false);
  const visibleOptions = showAll ? options : options.slice(0, initialLimit);
  const hasMore = options.length > initialLimit;
  return (
    <div className="size-wrapper">
      <div className="size-buttons">
        {visibleOptions.map((size) => {
          const isActive = selected.includes(size);
          return (
            <button
              key={size}
              className={`size-btn ${isActive ? 'active' : ''}`}
              onClick={() => onChange(isActive ? selected.filter((s) => s !== size) : [...selected, size])}
            >
              {size}
            </button>
          );
        })}
      </div>
      {hasMore && (
        <button className="show-more-btn" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show Less' : `+ ${options.length - initialLimit} more`}
        </button>
      )}
    </div>
  );
};

// ── Capacity Cards ─────────────────────────────────────────────────────────────
const CapacityCards = ({ options, selected = [], onChange, initialLimit = 3 }) => {
  const [showAll, setShowAll] = useState(false);
  const visibleOptions = showAll ? options : options.slice(0, initialLimit);
  const hasMore = options.length > initialLimit;
  return (
    <div className="capacity-cards-wrapper">
      <div className="capacity-cards">
        {visibleOptions.map((option) => {
          const isActive = selected.includes(option);
          return (
            <button
              key={option}
              className={`capacity-card ${isActive ? 'active' : ''}`}
              onClick={() => onChange(isActive ? selected.filter((c) => c !== option) : [...selected, option])}
            >
              {isActive && (
                <span className="capacity-check">
                  <i className="bi bi-check2"></i>
                </span>
              )}
              <span className="capacity-value">{option}</span>
              <span className="capacity-label">Capacity</span>
            </button>
          );
        })}
      </div>
      {hasMore && (
        <button className="show-more-btn" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show Less' : `+ ${options.length - initialLimit} more`}
        </button>
      )}
    </div>
  );
};

// ── Active Filter Tags ─────────────────────────────────────────────────────────
const ActiveFilterTags = ({ filters, onRemove }) => {
  if (!filters || filters.length === 0) return null;
  return (
    <div className="active-filters-tags">
      {filters.map((filter, index) => (
        <div key={index} className="active-filter-tag">
          <span className="filter-tag-label">{filter.type}: {filter.label}</span>
          <button onClick={() => onRemove(index)} className="remove-filter-btn" aria-label={`Remove ${filter.label} filter`}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

// ── Price Range Selector ───────────────────────────────────────────────────────
const PriceRangeSelector = ({ ranges, selected, onChange }) => (
  <div className="price-options">
    {ranges.map((range) => {
      const isActive = selected === range.value;
      return (
        <div
          key={range.value}
          className="price-option"
          onClick={() => onChange(range.value)}
        >

          <span
            className="custom-radio"
            style={isActive ? { borderColor: '#8b5cf6', backgroundColor: '#8b5cf6' } : {}}
          >
            {isActive && (
              <span style={{
                display: 'block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#fff',
                flexShrink: 0,
              }} />
            )}
          </span>
          <span className="price-label">{range.label}</span>
        </div>
      );
    })}
  </div>
);

// ── Main FilterSideBar ─────────────────────────────────────────────────────────
const FilterSideBar = memo(({ filters = {}, onChange, activeTags = [], onRemoveTag, onClearAll, hideHeader = false }) => {
  const category   = filters.category   ?? '';
  const bags       = filters.bags       ?? [];
  const brands     = filters.brands     ?? [];
  const material   = filters.material   ?? [];
  const sizes      = filters.sizes      ?? [];
  const priceRange = filters.priceRange ?? '';
  const capacities = filters.capacities ?? [];

  const update = useCallback((key, value) => {
    onChange({ ...DEFAULT_FILTERS, ...filters, [key]: value });
  }, [filters, onChange]);

  const handleBagToggle = useCallback((type) => {
    update('bags', bags.includes(type) ? bags.filter((t) => t !== type) : [...bags, type]);
  }, [bags, update]);

  const handleBrandToggle = useCallback((brand) => {
    update('brands', brands.includes(brand) ? brands.filter((b) => b !== brand) : [...brands, brand]);
  }, [brands, update]);

  const handleMaterialToggle = useCallback((materialItem) => {
    update('material', material.includes(materialItem)
      ? material.filter((m) => m !== materialItem)
      : [...material, materialItem]);
  }, [material, update]);

  const handleCategoryClick = useCallback((cat) => {
    onChange({ ...DEFAULT_FILTERS, category: category === cat ? '' : cat });
  }, [category, onChange]);

  const handlePriceRangeSelect = useCallback((rangeValue) => {
    update('priceRange', rangeValue);
  }, [update]);

  const handleClearAll = () => {
    if (onClearAll) onClearAll();
    else onChange(DEFAULT_FILTERS);
  };

  const hasActiveFilters =
    category !== '' || bags.length > 0 || brands.length > 0 ||
    material.length > 0 || sizes.length > 0 || priceRange !== '' || capacities.length > 0;

  return (
    <aside className="filter-sidebar-flipkart">
      {!hideHeader && (
        <div className="filter-header">
          <h3 className="filter-title">Filters</h3>
          {hasActiveFilters && (
            <button className="clear-all-btn" onClick={handleClearAll}>CLEAR ALL</button>
          )}
        </div>
      )}
      {hideHeader && hasActiveFilters && (
        <div className="filter-header" style={{ paddingTop: 0 }}>
          <span />
          <button className="clear-all-btn" onClick={handleClearAll}>CLEAR ALL</button>
        </div>
      )}

      {activeTags && activeTags.length > 0 && (
        <ActiveFilterTags filters={activeTags} onRemove={onRemoveTag} />
      )}

      <FilterSection title="CATEGORIES">
        <div className="category-buttons">
          {['wallet', 'belt', 'bag'].map((cat) => (
            <button
              key={cat}
              className={`category-btn ${category === cat ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}s
            </button>
          ))}
        </div>
      </FilterSection>

      {category !== '' && (
        <>
          <FilterSection title="PRICE">
            <PriceRangeSelector
              ranges={PRICE_RANGES}
              selected={priceRange}
              onChange={handlePriceRangeSelect}
            />
          </FilterSection>

          {category === 'bag' && (
            <>
              <FilterSection title="BAG TYPES">
                <CheckboxList options={BAG_TYPES} selected={bags} onChange={handleBagToggle} initialLimit={4} />
              </FilterSection>
              <FilterSection title="BRANDS">
                <CheckboxList options={BRANDS} selected={brands} onChange={handleBrandToggle} initialLimit={4} />
              </FilterSection>
              <FilterSection title="MATERIAL">
                <CheckboxList options={MATERIALS} selected={material} onChange={handleMaterialToggle} initialLimit={3} />
              </FilterSection>
              <FilterSection title="CAPACITY">
                <CapacityCards options={CAPACITIES} selected={capacities} onChange={(v) => update('capacities', v)} initialLimit={3} />
              </FilterSection>
            </>
          )}

          {category === 'wallet' && (
            <FilterSection title="MATERIAL">
              <CheckboxList options={MATERIALS} selected={material} onChange={handleMaterialToggle} initialLimit={3} />
            </FilterSection>
          )}

          {category === 'belt' && (
            <>
              <FilterSection title="MATERIAL">
                <CheckboxList options={MATERIALS} selected={material} onChange={handleMaterialToggle} initialLimit={3} />
              </FilterSection>
              <FilterSection title="SIZE">
                <SizeButtons options={BELT_SIZES} selected={sizes} onChange={(v) => update('sizes', v)} initialLimit={3} />
              </FilterSection>
            </>
          )}
        </>
      )}
    </aside>
  );
});


export default FilterSideBar;
