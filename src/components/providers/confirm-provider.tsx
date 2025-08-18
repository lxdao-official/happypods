"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useConfirm } from "~/hooks/useConfirm";
import ConfirmModal from "~/components/confirm-modal";

interface ConfirmContextType {
  confirm: (
    onConfirm: () => void | Promise<void>,
    options?: {
      title?: string;
      content?: string;
      confirmText?: string;
      cancelText?: string;
      confirmColor?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
    },
    onCancel?: () => void
  ) => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { confirm, confirmState } = useConfirm();

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmState.isOpen && (
        <ConfirmModal
          isOpen={confirmState.isOpen}
          onClose={confirmState.onCancel || (() => {})}
          onConfirm={confirmState.onConfirm || (() => {})}
          title={confirmState.title}
          content={confirmState.content}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          confirmColor={confirmState.confirmColor}
          isLoading={confirmState.isLoading}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirmModal() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirmModal must be used within a ConfirmProvider");
  }
  return context;
}
