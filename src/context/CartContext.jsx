import React, { createContext, useReducer, useContext, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'megafoot_cart';

const loadCart = () => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return { items: parsed };
      }
    }
  } catch (e) {
    console.error('Failed to load cart from localStorage:', e);
  }
  return { items: [] };
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.product.id === action.payload.product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.product.id === existing.product.id
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(i => i.product.id !== action.payload),
      };
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity < 1) {
        return {
          ...state,
          items: state.items.filter(i => i.product.id !== action.payload.productId),
        };
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.product.id === action.payload.productId
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'LOAD_CART':
      return { ...action.payload };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, null, loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [state.items]);

  const addToCart = (product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  };

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + parseFloat(i.product.price) * i.quantity, 0);

  const value = {
    items: state.items,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
