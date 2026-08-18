"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { BarChart3, Info, Loader2, Plus } from "lucide-react";
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
  SystemDesignProblemsTable,
  type SystemDesignActiveFilter,
  type SystemDesignDifficultyFilter,
} from "@/components/system-design-admin/SystemDesignProblemsTable";
import { SystemDesignProblemViewDialog } from "@/components/system-design-admin/SystemDesignProblemViewDialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { appCard } from "@/lib/app-theme";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import {
  adminSystemDesignApi,
  userApi,
  type AdminSystemDesignProblemDetail,
  type AdminSystemDesignProblemListItem,
} from "@/lib/api";

export default function AdminSystemDesignProblemsPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const [items, setItems] = useState<AdminSystemDesignProblemListItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState<SystemDesignDifficultyFilter>("all");
  const [activeFilter, setActiveFilter] =
    useState<SystemDesignActiveFilter>("active");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewProblem, setViewProblem] =
    useState<AdminSystemDesignProblemDetail | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<AdminSystemDesignProblemListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      const isActive =
        activeFilter === "all"
          ? undefined
          : activeFilter === "active";
      const res = await adminSystemDesignApi.list({
        search: searchDebounced || undefined,
        category: category || undefined,
        difficulty: difficulty === "all" ? undefined : difficulty,
        isActive,
        limit: 200,
        sortBy: "updatedAt",
        sortDir: "desc",
      });
      setItems(res.items);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load problems";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, category, difficulty, searchDebounced]);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await adminSystemDesignApi.listCategories();
      setCategories(cats);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    void load();
  }, [authorized, load]);

  useEffect(() => {
    if (!authorized) return;
    void loadCategories();
  }, [authorized, loadCategories]);

  const openView = async (problemId: string) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewProblem(null);
    try {
      const detail = await adminSystemDesignApi.get(problemId);
      setViewProblem(detail);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load problem";
      toast.error(msg);
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const confirmDelete = (item: AdminSystemDesignProblemListItem) => {
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminSystemDesignApi.remove(deleteTarget.problemId);
      toast.success(`"${deleteTarget.title}" deactivated`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Delete failed";
      toast.error(msg);
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
        title="System Design Problems"
        description="Manage the practice problem catalog, company tags, and admin ratings."
        actions={
          <Button asChild>
            <Link href="/dashboard/super-admin/system-design-problems/new">
              <Plus className="mr-2 h-4 w-4" />
              Add problem
            </Link>
          </Button>
        }
      />

      <Card className={appCard}>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <CardDescription className="text-sm">
              Problems can be seeded from markdown or managed here. The seed script
              updates existing rows by problem ID; UI edits are preserved when the
              content hash differs. Re-embed knowledge vectors manually with{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                npm run seed:system-design-kb -- --doc=&lt;knowledgeDocId&gt;
              </code>
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className={appCard}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Problem matrix
          </CardTitle>
          <CardDescription>
            Attempt and score stats are computed live from practice sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <SystemDesignProblemsTable
            items={items}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            categories={categories}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            activeFilter={activeFilter}
            onActiveFilterChange={setActiveFilter}
            onView={openView}
            onDelete={confirmDelete}
          />
        </CardContent>
      </Card>

      <SystemDesignProblemViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        loading={viewLoading}
        problem={viewProblem}
      />

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="destructive"
        title="Deactivate problem?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be hidden from the candidate hub. Existing sessions are unaffected.`
            : ""
        }
        confirmText="Deactivate"
        isLoading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
