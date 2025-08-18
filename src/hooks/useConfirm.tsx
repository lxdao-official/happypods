"use client";

import { useState, useCallback } from "react";

interface ConfirmOptions {
  title?: string;
  content?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    isLoading: false,
  });

  const confirm = useCallback((
    onConfirm: () => void | Promise<void>,
    options: ConfirmOptions = {},
    onCancel?: () => void
  ) => {
    setConfirmState({
      isOpen: true,
      isLoading: false,
      onConfirm,
      onCancel,
      ...options,
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({
      ...prev,
      isOpen: false,
      isLoading: false,
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (confirmState.onConfirm) {
      try {
        // 设置加载状态
        setConfirmState(prev => ({
          ...prev,
          isLoading: true,
        }));
        
        await confirmState.onConfirm();
      } finally {
        closeConfirm();
      }
    }
  }, [confirmState.onConfirm, closeConfirm]);

  const handleCancel = useCallback(() => {
    if (confirmState.onCancel) {
      confirmState.onCancel();
    }
    closeConfirm();
  }, [confirmState.onCancel, closeConfirm]);

  return {
    confirm,
    closeConfirm,
    confirmState: {
      ...confirmState,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}
