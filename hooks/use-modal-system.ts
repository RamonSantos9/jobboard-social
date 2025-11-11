"use client";

import { useState, useCallback } from "react";

export interface ModalState {
  isOpen: boolean;
  activeItem?: string;
  data?: unknown;
}

export interface ModalConfig {
  id: string;
  title: string;
  subtitle?: string;
  sidebarItems: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    description?: string;
    badge?: string;
    badgeColor?: string;
  }>;
}

export function useModalSystem() {
  const [modals, setModals] = useState<Record<string, ModalState>>({});

  const openModal = useCallback(
    (modalId: string, activeItem?: string, data?: unknown) => {
      setModals((prev) => ({
        ...prev,
        [modalId]: {
          isOpen: true,
          activeItem,
          data,
        },
      }));
    },
    []
  );

  const closeModal = useCallback((modalId: string) => {
    setModals((prev) => ({
      ...prev,
      [modalId]: {
        isOpen: false,
        activeItem: undefined,
        data: undefined,
      },
    }));
  }, []);

  const setActiveItem = useCallback((modalId: string, itemId: string) => {
    setModals((prev) => ({
      ...prev,
      [modalId]: {
        ...prev[modalId],
        activeItem: itemId,
      },
    }));
  }, []);

  const isModalOpen = useCallback(
    (modalId: string) => {
      return modals[modalId]?.isOpen || false;
    },
    [modals]
  );

  const getActiveItem = useCallback(
    (modalId: string) => {
      return modals[modalId]?.activeItem;
    },
    [modals]
  );

  const getModalData = useCallback(
    (modalId: string) => {
      return modals[modalId]?.data;
    },
    [modals]
  );

  const closeAllModals = useCallback(() => {
    setModals({});
  }, []);

  return {
    openModal,
    closeModal,
    setActiveItem,
    isModalOpen,
    getActiveItem,
    getModalData,
    closeAllModals,
  };
}
