import React from 'react';
import '../../assets/styles/SortBySelect.css';


const SortBySelect = ({ value, onChange }) => {
  return (
    <select
      className="sortby-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Sort by</option>
      <option value="price-low">Low to High</option>
      <option value="price-high">High to Low</option>
  
    </select>
  );
};

export default SortBySelect;