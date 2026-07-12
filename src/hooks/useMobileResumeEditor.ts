"use client";

import { useCallback, useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

export function useMobileResumeEditor() {
  const [isMobile, setIsMobile] = useState(false);
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingLayout, setEditingLayout] = useState(false);
  const [editingAddSections, setEditingAddSections] = useState(false);

  const mobileEditOpen =
    editingSectionId !== null || editingLayout || editingAddSections;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const openSectionPicker = useCallback(() => {
    setEditingSectionId(null);
    setEditingLayout(false);
    setEditingAddSections(false);
    setSectionPickerOpen(true);
  }, []);

  const closeSectionPicker = useCallback(() => {
    setSectionPickerOpen(false);
  }, []);

  const returnToSectionPicker = useCallback(() => {
    setEditingSectionId(null);
    setEditingLayout(false);
    setEditingAddSections(false);
    setSectionPickerOpen(true);
  }, []);

  const closeMobileEditing = useCallback(() => {
    setEditingSectionId(null);
    setEditingLayout(false);
    setEditingAddSections(false);
    setSectionPickerOpen(false);
  }, []);

  const startSectionEdit = useCallback((sectionId: string) => {
    setEditingLayout(false);
    setEditingAddSections(false);
    setEditingSectionId(sectionId);
    setSectionPickerOpen(false);
  }, []);

  const startLayoutEdit = useCallback(() => {
    setEditingSectionId(null);
    setEditingAddSections(false);
    setEditingLayout(true);
    setSectionPickerOpen(false);
  }, []);

  const startAddSectionsEdit = useCallback(() => {
    setEditingSectionId(null);
    setEditingLayout(false);
    setEditingAddSections(true);
    setSectionPickerOpen(false);
  }, []);

  const finishMobileEdit = useCallback(() => {
    setEditingSectionId(null);
    setEditingLayout(false);
    setEditingAddSections(false);
  }, []);

  return {
    isMobile,
    sectionPickerOpen,
    setSectionPickerOpen,
    editingSectionId,
    editingLayout,
    editingAddSections,
    mobileEditOpen,
    openSectionPicker,
    closeSectionPicker,
    startSectionEdit,
    startLayoutEdit,
    startAddSectionsEdit,
    finishMobileEdit,
    returnToSectionPicker,
    closeMobileEditing,
  };
}
