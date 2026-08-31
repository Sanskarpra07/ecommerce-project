import React, { useEffect, useState, createContext, useContext } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' && <span className="toast-icon">&#10003;</span>}
            {t.type === 'error' && <span className="toast-icon">&#10007;</span>}
            {t.type === 'info' && <span className="toast-icon">&#8505;</span>}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
