'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '@/components/ui/Toast';

const ToastContext = createContext({
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const showSuccess = useCallback((message, duration) => showToast({ message, type: 'success', duration }), [showToast]);
  const showError = useCallback((message, duration) => showToast({ message, type: 'error', duration }), [showToast]);
  const showWarning = useCallback((message, duration) => showToast({ message, type: 'warning', duration }), [showToast]);
  const showInfo = useCallback((message, duration) => showToast({ message, type: 'info', duration }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
