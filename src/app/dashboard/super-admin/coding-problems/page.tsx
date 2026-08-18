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
  CodingProblemsTable,
  type CodingActiveFilter,
  type CodingDifficultyFilter,
} from "@/components/coding-admin/CodingProblemsTable";
import { CodingProblemViewDialog } from "@/components/coding-admin/CodingProblemViewDialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { appCard } from "@/lib/app-theme";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import {
  adminCodingProblemApi,
  userApi,
  type AdminCodingProblemDetail,
  type AdminCodingProblemListItem,
} from "@/lib/api";

export default function AdminCodingProblemsPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const [items, setItems] = useState<AdminCodingProblemListItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState<CodingDifficultyFilter>("all");
  const [activeFilter, setActiveFilter] = useState<CodingActiveFilter>("active");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewProblem, setViewProblem] =
    useState<AdminCodingProblemDetail | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<AdminCodingProblemListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 50;

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

  useEffect(() => {
    setPage(1);
  }, [searchDebounced, category, difficulty, activeFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCodingProblemApi.list({
        search: searchDebounced || undefined,
        category: category || undefined,
        difficulty: difficulty === "all" ? undefined : difficulty,
        isActive:
          activeFilter === "all"
            ? undefined
            : activeFilter === "active",
        page,
        limit: PAGE_SIZE,
        sortBy: "updatedAt",
        sortDir: "desc",
      });
      setItems(data.items);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load coding problems");
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, category, difficulty, activeFilter, page]);

  useEffect(() => {
    if (!authorized) return;
    void load();
  }, [authorized, load]);

  useEffect(() => {
    if (!authorized) return;
    void adminCodingProblemApi.listCategories().then(setCategories).catch(() => {});
  }, [authorized]);

  const openView = async (problemId: string) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewProblem(null);
    try {
      const detail = await adminCodingProblemApi.get(problemId);
      setViewProblem(detail);
    } catch {
      toast.error("Failed to load problem");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminCodingProblemApi.remove(deleteTarget.problemId);
      toast.success("Problem deactivated");
      setDeleteOpen(false);
      setDeleteTarget(null);
      void load();
    } catch {
      toast.error("Deactivate failed");
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
        title="Coding problems"
        description="Manage the coding practice problem bank, test cases, and starter code."
        actions={
          <Button asChild>
            <Link href="/dashboard/super-admin/coding-problems/new">
              <Plus className="mr-2 h-4 w-4" />
              Add problem
            </Link>
          </Button>
        }
      />

      <Card className={appCard}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            Notes
          </CardTitle>
          <CardDescription>
            Public tests appear on Run; hidden tests are used only on Submit.
            Reference solutions are admin-only and power validate-tests via
            Judge0.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className={appCard}>
        <CardContent className="p-0 pt-0">
          <CodingProblemsTable
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

      <CodingProblemViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        problem={viewProblem}
        loading={viewLoading}
      />

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Deactivate problem?"
        description={`"${deleteTarget?.title}" will be excluded from interview selection.`}
        confirmText="Deactivate"
        onConfirm={() => void confirmDelete()}
        isLoading={deleting}
        variant="destructive"
      />
    </div>
  );
}
