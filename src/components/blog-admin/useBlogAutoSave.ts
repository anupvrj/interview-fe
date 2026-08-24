"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminBlogApi } from "@/lib/api";
import {
  blogFormHasDraftContent,
  clearNewBlogDraftLocal,
  detailToFormValues,
  ensureFormDraftSlug,
  formToAutoSaveBody,
  saveNewBlogDraftLocal,
  serializeBlogFormForSave,
  type BlogFormValues,
} from "@/components/blog-admin/form-utils";

export type BlogAutoSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

type UseBlogAutoSaveOptions = {
  form: BlogFormValues;
  setForm: (updater: (current: BlogFormValues) => BlogFormValues) => void;
  blogId: string | null;
  setBlogId: (id: string) => void;
  enabled: boolean;
  debounceMs?: number;
};

export function useBlogAutoSave({
  form,
  setForm,
  blogId,
  setBlogId,
  enabled,
  debounceMs = 2000,
}: UseBlogAutoSaveOptions) {
  const router = useRouter();
  const [status, setStatus] = useState<BlogAutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const blogIdRef = useRef(blogId);
  const lastSavedSnapshotRef = useRef("");
  const manualSaveLockRef = useRef(false);
  const createInFlightRef = useRef(false);
  const formRef = useRef(form);
  const initializedRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    blogIdRef.current = blogId;
  }, [blogId]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    if (!enabled || initializedRef.current) return;
    initializedRef.current = true;
    lastSavedSnapshotRef.current = serializeBlogFormForSave(form);
  }, [enabled, form]);

  useEffect(() => {
    if (!enabled || !blogFormHasDraftContent(form)) return;
    if (!blogId) saveNewBlogDraftLocal(form);
  }, [enabled, form, blogId]);

  useEffect(() => {
    if (!enabled || manualSaveLockRef.current) return;
    if (!blogFormHasDraftContent(form)) {
      setStatus("idle");
      return;
    }

    const snapshot = serializeBlogFormForSave(form);
    if (snapshot === lastSavedSnapshotRef.current) return;

    setStatus("pending");
    const timer = window.setTimeout(() => {
      void (async () => {
        let currentForm = formRef.current;
        if (!blogFormHasDraftContent(currentForm)) return;

        if (!blogIdRef.current) {
          const withSlug = ensureFormDraftSlug(currentForm);
          if (withSlug.slug !== currentForm.slug) {
            currentForm = withSlug;
            formRef.current = withSlug;
            setForm((prev) => ({ ...prev, slug: withSlug.slug }));
          }
        }

        const body = formToAutoSaveBody(currentForm);
        const nextSnapshot = serializeBlogFormForSave(currentForm);
        if (nextSnapshot === lastSavedSnapshotRef.current) return;

        if (!blogIdRef.current && createInFlightRef.current) return;

        setStatus("saving");
        setErrorMessage(null);
        try {
          if (blogIdRef.current) {
            const updated = await adminBlogApi.update(blogIdRef.current, body);
            setForm((current) => ({
              ...current,
              slug: updated.slug,
            }));
          } else {
            createInFlightRef.current = true;
            const created = await adminBlogApi.create(body);
            blogIdRef.current = created.id;
            setBlogId(created.id);
            setForm(() => detailToFormValues(created));
            clearNewBlogDraftLocal();
            router.replace(
              `/dashboard/super-admin/blogs/${encodeURIComponent(created.id)}/edit`,
            );
          }
          lastSavedSnapshotRef.current = nextSnapshot;
          setLastSavedAt(new Date());
          setStatus("saved");
        } catch (e: unknown) {
          const msg =
            (e as { response?: { data?: { message?: string } } })?.response?.data
              ?.message || "Auto-save failed";
          setErrorMessage(msg);
          setStatus("error");
        } finally {
          createInFlightRef.current = false;
        }
      })();
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [enabled, form, debounceMs, router, setBlogId, setForm]);

  const markManualSaveStart = () => {
    manualSaveLockRef.current = true;
  };

  const markManualSaveEnd = (formValues: BlogFormValues) => {
    lastSavedSnapshotRef.current = serializeBlogFormForSave(formValues);
    setLastSavedAt(new Date());
    setStatus("saved");
    clearNewBlogDraftLocal();
    manualSaveLockRef.current = false;
  };

  const markManualSaveFailed = () => {
    manualSaveLockRef.current = false;
  };

  const syncSavedSnapshot = (formValues: BlogFormValues) => {
    lastSavedSnapshotRef.current = serializeBlogFormForSave(formValues);
  };

  return {
    status,
    lastSavedAt,
    errorMessage,
    markManualSaveStart,
    markManualSaveEnd,
    markManualSaveFailed,
    syncSavedSnapshot,
  };
}

export function formatAutoSaveStatus(
  status: BlogAutoSaveStatus,
  lastSavedAt: Date | null,
  errorMessage?: string | null,
): string {
  switch (status) {
    case "pending":
      return "Unsaved changes…";
    case "saving":
      return "Saving draft…";
    case "saved":
      return lastSavedAt
        ? `Draft saved ${lastSavedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
        : "Draft saved";
    case "error":
      return errorMessage
        ? `Auto-save failed — ${errorMessage}`
        : "Auto-save failed — use Save draft";
    default:
      return "Auto-save on";
  }
}
