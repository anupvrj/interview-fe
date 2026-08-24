"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
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
  detailToFormValues,
  emptyBlogForm,
  formToUpsertBody,
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

export default function EditBlogPage() {
  const params = useParams<{ blogId: string }>();
  const blogId = decodeURIComponent(params.blogId);
  const { isLoaded } = useUser();
  const router = useRouter();
  const adminAccess = useRequirePlatformAdmin();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [form, setForm] = useState<BlogFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const autoSave = useBlogAutoSave({
    form: form ?? emptyBlogForm(),
    setForm: (updater) => setForm((current) => (current ? updater(current) : current)),
    blogId,
    setBlogId: () => {},
    enabled: adminAccess.authorized && !loading && Boolean(form),
  });

  useEffect(() => {
    if (!adminAccess.authorized) return;
    void (async () => {
      setLoading(true);
      try {
        const [detail, cats] = await Promise.all([
          adminBlogApi.get(blogId),
          adminBlogApi.listCategories(),
        ]);
        setForm(detailToFormValues(detail));
        setCategories(cats);
      } catch {
        toast.error("Blog not found");
        router.replace("/dashboard/super-admin/blogs");
      } finally {
        setLoading(false);
      }
    })();
  }, [adminAccess.authorized, blogId, router]);

  const save = async () => {
    if (!form) return;
    const err = validateBlogForm(form);
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    autoSave.markManualSaveStart();
    try {
      const updated = await adminBlogApi.update(blogId, formToUpsertBody(form));
      const nextForm = { ...form, slug: updated.slug };
      setForm(nextForm);
      autoSave.markManualSaveEnd(nextForm);
      toast.success("Blog saved");
    } catch (e: unknown) {
      autoSave.markManualSaveFailed();
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!form) return;
    const publishForm = { ...form, status: "published" as const };
    const err = validateBlogForm(publishForm);
    if (err) {
      toast.error(err);
      return;
    }

    setPublishing(true);
    autoSave.markManualSaveStart();
    try {
      await adminBlogApi.update(blogId, formToUpsertBody(publishForm));
      await adminBlogApi.publish(blogId);
      setForm(publishForm);
      autoSave.markManualSaveEnd(publishForm);
      toast.success("Blog published");
    } catch (e: unknown) {
      autoSave.markManualSaveFailed();
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Publish failed";
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  const deactivate = async () => {
    if (!window.confirm("Delete this blog post?")) return;
    try {
      await adminBlogApi.remove(blogId);
      toast.success("Blog deleted");
      router.push("/dashboard/super-admin/blogs");
    } catch {
      toast.error("Delete failed");
    }
  };

  const restore = async () => {
    try {
      const detail = await adminBlogApi.restore(blogId);
      setForm(detailToFormValues(detail));
      toast.success("Blog restored");
    } catch {
      toast.error("Restore failed");
    }
  };

  if (!isLoaded || adminAccess.loading || !adminAccess.authorized || loading || !form) {
    if (!adminAccess.loading && !adminAccess.authorized && adminAccess.error) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
          <p>{adminAccess.error}</p>
          <Button type="button" variant="outline" onClick={adminAccess.retry}>
            Try again
          </Button>
        </div>
      );
    }

    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={form.title || "Edit blog post"}
        description={form.slug ? `/blogs/${form.slug}` : blogId}
        actions={
          <div className="flex gap-2">
            {!form.isActive ? (
              <Button variant="outline" onClick={() => void restore()}>
                Restore
              </Button>
            ) : null}
            {form.status === "published" && form.slug ? (
              <Button variant="outline" asChild>
                <Link href={`/blogs/${form.slug}`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View live
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href="/dashboard/super-admin/blogs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        }
      />
      <Card className={appCard}>
        <CardContent className="space-y-6 p-4 pt-5 sm:p-6 sm:pt-6">
          <BlogForm
            mode="edit"
            value={form}
            onChange={(patch) => setForm((f) => (f ? { ...f, ...patch } : f))}
            categories={categories}
          />
          <BlogFormFooter
            saving={saving}
            publishing={publishing}
            autoSaveLabel={formatAutoSaveStatus(
              autoSave.status,
              autoSave.lastSavedAt,
              autoSave.errorMessage,
            )}
            onSave={() => void save()}
            onPublish={form.status !== "published" ? () => void publish() : undefined}
            onCancel={() => router.push("/dashboard/super-admin/blogs")}
            onDelete={form.isActive ? () => void deactivate() : undefined}
            onPreview={() => setPreviewOpen(true)}
          />
        </CardContent>
      </Card>
      <BlogPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} form={form} />
    </div>
  );
}
