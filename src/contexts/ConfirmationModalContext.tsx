import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmButtonVariant?: 'gradient' | 'default';
  cancelButtonVariant?: 'gradient' | 'default';
}

interface ConfirmationModalContextType {
  showConfirmation: (options: ConfirmationOptions) => void;
}

const ConfirmationModalContext = createContext<ConfirmationModalContextType | undefined>(undefined);

export function ConfirmationModalProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);

  const showConfirmation = useCallback((newOptions: ConfirmationOptions) => {
    setOptions(newOptions);
    setVisible(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (options?.onConfirm) {
      options.onConfirm();
    }
    setVisible(false);
    setOptions(null);
  }, [options]);

  const handleCancel = useCallback(() => {
    if (options?.onCancel) {
      options.onCancel();
    }
    setVisible(false);
    setOptions(null);
  }, [options]);

  return (
    <ConfirmationModalContext.Provider value={{ showConfirmation }}>
      {children}
      {options && (
        <ConfirmationModal
          visible={visible}
          title={options.title}
          message={options.message}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmButtonVariant={options.confirmButtonVariant}
          cancelButtonVariant={options.cancelButtonVariant}
        />
      )}
    </ConfirmationModalContext.Provider>
  );
}

export function useConfirmationModal() {
  const context = useContext(ConfirmationModalContext);
  if (context === undefined) {
    throw new Error('useConfirmationModal must be used within a ConfirmationModalProvider');
  }
  return context;
}

