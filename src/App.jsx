import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './admin/AdminLayout';
import DashboardOverview from './admin/DashboardOverview';
import ProductList from './admin/ProductList';
import ProductForm from './admin/ProductForm';
import CategoryList from './admin/CategoryList';
import StockLog from './admin/StockLog';
import OrderList from './admin/OrderList';
import UserList from './admin/UserList';
import Settings from './admin/Settings';

function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  return (
    <>
      {!isAdmin && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/add" element={<ProductForm />} />
          <Route path="products/edit/:id" element={<ProductForm />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="stock-log" element={<StockLog />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="users" element={<UserList />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      {!isAdmin && <Footer />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppShell />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
