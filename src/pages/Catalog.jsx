import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import './Shop.css';

export default function Catalog() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [filterSidebar, setFilterSidebar] = useState(false);
  const [sort, setSort] = useState('default');
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

  const sortedProducts = [...products];
  if (sort === 'price-asc') sortedProducts.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') sortedProducts.sort((a, b) => b.price - a.price);
  if (sort === 'name') sortedProducts.sort((a, b) => a.name.localeCompare(b.name));

  const activeCategoryName =
    filters.category === '1' ? 'Running'
    : filters.category === '2' ? 'Casual'
    : filters.category === '3' ? 'Formal'
    : filters.category === '4' ? 'Sneakers'
    : null;

  const heading = filters.search
    ? `"${filters.search}"`
    : activeCategoryName || 'All Products';

  return (
    <div className="catalog-layout">
      <div className="catalog-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <span>Shop</span>
        {activeCategoryName && <><span>/</span><span>{activeCategoryName}</span></>}
      </div>

      <div className="catalog">
        <button className="mobile-filter-toggle" onClick={() => setFilterSidebar(!filterSidebar)}>
          {filterSidebar ? 'Hide Filters' : 'Show Filters'}
        </button>

        <aside className={filterSidebar ? 'visible' : ''}>
          <FilterSidebar setFilters={setFilters} initialCategory={filters.category} />
        </aside>

        <main className="product-list">
          <div className="catalog-toolbar">
            <div>
              <h2>{heading}</h2>
              <p className="product-count">{sortedProducts.length} {sortedProducts.length === 1 ? 'Product' : 'Products'}</p>
            </div>
            <div className="sort-wrap">
              <label htmlFor="sort">Sort:</label>
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="default">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading awesome shoes...</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">&#128717;</span>
              <p>No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="product-grid">
              {sortedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
