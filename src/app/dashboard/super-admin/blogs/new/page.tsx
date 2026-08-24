"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BlogForm,
  BlogFormFooter,
} from "@/components/blog-admin/BlogForm";
import { BlogPreviewDialog } from "@/components/blog-admin/BlogPreviewDialog";
import {
  emptyBlogForm,
  formToUpsertBody,
  loadNewBlogDraftLocal,
  validateBlogForm,
  type BlogFormValues,
} from "@/components/blog-admin/form-utils";
import {
  formatAutoSaveStatus,
  useBlogAutoSave,
} from "@/components/blog-admin/useBlogAutoSave";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { appCard } from "@/lib/app-theme";
import { adminBlogApi } from "@/lib/api";

export default function NewBlogPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const adminAccess = useRequirePlatformAdmin();
  const [form, setForm] = useState<BlogFormValues>(() => loadNewBlogDraftLocal() ?? emptyBlogForm());
  const [blogId, setBlogId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const autoSave = useBlogAutoSave({
    form,
    setForm,
    blogId,
    setBlogId,
    enabled: adminAccess.authorized,
  });

  const save = async () => {
    const err = validateBlogForm(form);
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    autoSave.markManualSaveStart();
    try {
      const body = formToUpsertBody(form);
      if (blogId) {
        const updated = await adminBlogApi.update(blogId, body);
        setForm((current) => ({ ...current, ...form, slug: updated.slug }));
        autoSave.markManualSaveEnd(form);
        toast.success("Blog saved");
      } else {
        const created = await adminBlogApi.create(body);
        setBlogId(created.id);
        autoSave.markManualSaveEnd(form);
        toast.success("Blog created");
        router.push(
          `/dashboard/super-admin/blogs/${encodeURIComponent(created.id)}/edit`,
        );
      }
    } catch (e: unknown) {
      autoSave.markManualSaveFailed();
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Create failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || adminAccess.loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  if (!adminAccess.authorized) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <p>{adminAccess.error ?? "Admin access required."}</p>
        <Button type="button" variant="outline" onClick={adminAccess.retry}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New blog post"
        description="Write SEO-optimized content for the Interview Trix blog. Drafts auto-save."
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/super-admin/blogs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />
      <Card className={appCard}>
        <CardContent className="space-y-6 p-4 pt-5 sm:p-6 sm:pt-6">
          <BlogForm
            mode="create"
            value={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            categories={[]}
          />
          <BlogFormFooter
            saving={saving}
            autoSaveLabel={formatAutoSaveStatus(
              autoSave.status,
              autoSave.lastSavedAt,
              autoSave.errorMessage,
            )}
            onSave={() => void save()}
            onCancel={() => router.push("/dashboard/super-admin/blogs")}
            onPreview={() => setPreviewOpen(true)}
          />
        </CardContent>
      </Card>
      <BlogPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} form={form} />
    </div>
  );
}
