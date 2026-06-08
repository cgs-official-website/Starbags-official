import React from 'react';
import '../../assets/styles/ActiveFilterTags.css';

const ActiveFilterTags = ({ filters, onRemove }) => {
  if (!filters || filters.length === 0) return null;

  return (
    <div className="active-filter-tags">
      {filters.map((filter, index) => (
        <div key={index} className="filter-tag-group">
          <span className="filter-tag-type">{filter.type}</span>
          <div className="filter-tag">
            <span>{filter.label}</span>
            <button onClick={() => onRemove(index)} aria-label={`Remove ${filter.label} filter`}>
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActiveFilterTags;