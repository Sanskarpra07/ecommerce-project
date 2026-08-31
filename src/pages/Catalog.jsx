import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import './Shop.css';

export default function Catalog() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: initialCategory,
    size: '',
    minPrice: '',
    maxPrice: '',
    search: initialSearch,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: searchParams.get('category') || '',
      search: searchParams.get('search') || '',
    }));
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.size) params.size = filters.size;
      if (filters.minPrice) params.min_price = filters.minPrice;
      if (filters.maxPrice) params.max_price = filters.maxPrice;
      if (filters.search) params.search = filters.search;

      const response = await api.get('/products.php', { params });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="catalog">
      <aside>
        <FilterSidebar setFilters={setFilters} initialCategory={filters.category} />
      </aside>
      <main className="product-list">
        <h2>
          {filters.search
            ? `Search Results for "${filters.search}"`
            : filters.category
            ? 'Filtered Products'
            : 'All Products'}
        </h2>
        {loading ? (
          <p className="loading-text">Loading awesome shoes...</p>
        ) : products.length === 0 ? (
          <p className="loading-text">No products found. Try adjusting filters.</p>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
