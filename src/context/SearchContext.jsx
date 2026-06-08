import React, { createContext, useState, useContext } from 'react';

const SearchContext = createContext();

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [shouldShowResults, setShouldShowResults] = useState(false);

  const performSearch = (query, allProducts) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShouldShowResults(false);
      return;
    }

    // Filter products based on search query
    const filtered = allProducts.filter(product => 
      product.name?.toLowerCase().includes(query.toLowerCase()) ||
      product.category?.toLowerCase().includes(query.toLowerCase()) ||
      product.description?.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(filtered);
    setShouldShowResults(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShouldShowResults(false);
  };

  return (
    <SearchContext.Provider value={{
      searchQuery,
      searchResults,
      shouldShowResults,
      performSearch,
      clearSearch
    }}>
      {children}
    </SearchContext.Provider>
  );
};