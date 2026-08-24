"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Info, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BlogsTable,
  type BlogActiveFilter,
  type BlogStatusFilter,
} from "@/components/blog-admin/BlogsTable";
import { BlogPreviewDialog } from "@/components/blog-admin/BlogPreviewDialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  detailToFormValues,
  emptyBlogForm,
} from "@/components/blog-admin/form-utils";
import { appCard } from "@/lib/app-theme";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import {
  adminBlogApi,
  userApi,
  type AdminBlogDetail,
  type AdminBlogListItem,
} from "@/lib/api";

export default function AdminBlogsPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const [items, setItems] = useState<AdminBlogListItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState<BlogStatusFilter>("all");
  const [activeFilter, setActiveFilter] = useState<BlogActiveFilter>("active");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewBlog, setViewBlog] = useState<AdminBlogDetail | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminBlogListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const p = await userApi.getMyProfile();
        if (!isPlatformAdmin(p.accessRole ?? null)) {
          router.replace("/dashboard");
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace("/dashboard");
      }
    })();
  }, [isLoaded, router]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, cats] = await Promise.all([
        adminBlogApi.list({
          search: searchDebounced || undefined,
          category: category || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          isActive:
            activeFilter === "active"
              ? true
              : activeFilter === "inactive"
                ? false
                : undefined,
          page,
          limit: PAGE_SIZE,
          sortBy: "updatedAt",
          sortDir: "desc",
        }),
        adminBlogApi.listCategories(),
      ]);
      setItems(listRes.items);
      setTotal(listRes.total);
      setCategories(cats);
    } catch {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, category, statusFilter, activeFilter, page]);

  useEffect(() => {
    if (!authorized) return;
    void load();
  }, [authorized, load]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounced, category, statusFilter, activeFilter]);

  const openView = async (id: string) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const detail = await adminBlogApi.get(id);
      setViewBlog(detail);
    } catch {
      toast.error("Failed to load blog");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminBlogApi.remove(deleteTarget.id);
      toast.success("Blog deleted");
      setDeleteOpen(false);
      setDeleteTarget(null);
      void load();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (!isLoaded || !authorized) {
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
        title="Blog CMS"
        description="Create and manage SEO-optimized blog posts for Interview Trix."
        actions={
          <Button asChild>
            <Link href="/dashboard/super-admin/blogs/new">
              <Plus className="mr-2 h-4 w-4" />
              New post
            </Link>
          </Button>
        }
      />

      <Card className={appCard}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-muted-foreground" />
            Published posts appear at /blogs
          </CardTitle>
          <CardDescription>
            Use the SEO panel when editing to optimize titles, meta descriptions, and keywords before publishing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BlogsTable
            items={items}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            categories={categories}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            activeFilter={activeFilter}
            onActiveFilterChange={setActiveFilter}
            onView={(id) => void openView(id)}
            onDelete={(item) => {
              setDeleteTarget(item);
              setDeleteOpen(true);
            }}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <BlogPreviewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        form={
          viewBlog
            ? detailToFormValues(viewBlog)
            : emptyBlogForm()
        }
      />
      {viewLoading && viewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : null}

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete blog post?"
        description={`This will remove "${deleteTarget?.title}". You can restore it later.`}
        confirmText="Delete"
        variant="destructive"
        isLoading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
