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
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
  });

  const confirm = useCallback((
    onConfirm: () => void | Promise<void>,
    options: ConfirmOptions = {},
    onCancel?: () => void
  ) => {
    setConfirmState({
      isOpen: true,
      onConfirm,
      onCancel,
      ...options,
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (confirmState.onConfirm) {
      try {
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
