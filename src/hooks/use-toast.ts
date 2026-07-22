import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

interface UseToastReturn {
  showToast: (title: string, description?: string, variant?: Toast['variant']) => void;
  dismissToast: (id: string) => void;
}

let toastCount = 0;

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, description?: string, variant: Toast['variant'] = 'default') => {
    const id = `toast-${toastCount++}`;
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration: 5000,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, newToast.duration || 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    showToast,
    dismissToast,
  };
}
