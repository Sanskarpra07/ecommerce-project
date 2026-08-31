import React, { useState, useEffect } from 'react';
import '../pages/Shop.css';

export default function FilterSidebar({ setFilters, initialCategory = '' }) {
  const [category, setCategory] = useState(initialCategory);
  const [size, setSize] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  const applyFilters = () => {
    setFilters({ category, size, minPrice, maxPrice });
  };

  const resetFilters = () => {
    setCategory('');
    setSize('');
    setMinPrice('');
    setMaxPrice('');
    setFilters({ category: '', size: '', minPrice: '', maxPrice: '', search: '' });
  };

  return (
    <aside className="filter-sidebar">
      <h3>Filters</h3>

      <div className="filter-group">
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="1">Running</option>
          <option value="2">Casual</option>
          <option value="3">Formal</option>
          <option value="4">Sneakers</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Size</label>
        <select value={size} onChange={(e) => setSize(e.target.value)}>
          <option value="">All Sizes</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
          <option value="11">11</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Min Price ($)</label>
        <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" />
      </div>

      <div className="filter-group">
        <label>Max Price ($)</label>
        <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="999" />
      </div>

      <button onClick={applyFilters} className="btn-filter">Apply Filters</button>
      <button onClick={resetFilters} className="btn-filter btn-reset">Reset</button>
    </aside>
  );
}
