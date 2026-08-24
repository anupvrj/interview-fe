"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  SystemDesignProblemForm,
  SystemDesignProblemFormFooter,
  detailToFormValues,
  validateSystemDesignProblemForm,
  type SystemDesignProblemFormValues,
} from "@/components/system-design-admin/SystemDesignProblemForm";
import { appCard } from "@/lib/app-theme";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import {
  adminSystemDesignApi,
  userApi,
  type AdminSystemDesignProblemDetail,
} from "@/lib/api";

export default function EditSystemDesignProblemPage() {
  const params = useParams<{ problemId: string }>();
  const problemId = decodeURIComponent(params.problemId);
  const { isLoaded } = useUser();
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminSystemDesignProblemDetail | null>(
    null,
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [form, setForm] = useState<SystemDesignProblemFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
    if (!authorized || !problemId) return;
    void (async () => {
      setLoading(true);
      try {
        const [d, cats] = await Promise.all([
          adminSystemDesignApi.get(problemId),
          adminSystemDesignApi.listCategories(),
        ]);
        setDetail(d);
        setForm(detailToFormValues(d));
        setCategories(cats);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "Failed to load problem";
        toast.error(msg);
        router.push("/dashboard/super-admin/system-design-problems");
      } finally {
        setLoading(false);
      }
    })();
  }, [authorized, problemId, router]);

  const save = async () => {
    if (!form) return;
    const err = validateSystemDesignProblemForm(form, "edit");
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const updated = await adminSystemDesignApi.update(problemId, form);
      setDetail(updated);
      setForm(detailToFormValues(updated));
      toast.success("Saved");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminSystemDesignApi.remove(problemId);
      toast.success("Problem deactivated");
      router.push("/dashboard/super-admin/system-design-problems");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Delete failed";
      toast.error(msg);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const restore = async () => {
    setSaving(true);
    try {
      const updated = await adminSystemDesignApi.restore(problemId);
      setDetail(updated);
      setForm(detailToFormValues(updated));
      toast.success("Problem restored");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Restore failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || !authorized || loading || !form) {
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
        title={detail?.title ?? "Edit problem"}
        description={detail?.shortTitle}
        actions={
          <div className="flex flex-wrap gap-2">
            {!detail?.isActive ? (
              <Button variant="outline" onClick={() => void restore()} disabled={saving}>
                Restore
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href="/dashboard/super-admin/system-design-problems">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to list
              </Link>
            </Button>
          </div>
        }
      />

      <Card className={appCard}>
        <CardContent className="space-y-6 pt-6">
          <SystemDesignProblemForm
            mode="edit"
            value={form}
            categories={categories}
            sourcePath={detail?.sourcePath}
            corpusVersion={detail?.corpusVersion}
            onChange={setForm}
          />
          <SystemDesignProblemFormFooter
            saving={saving}
            onSave={() => void save()}
            onCancel={() =>
              router.push("/dashboard/super-admin/system-design-problems")
            }
            onDelete={() => setDeleteOpen(true)}
            deleteLabel={detail?.isActive ? "Deactivate" : "Deactivate"}
          />
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="destructive"
        title="Deactivate problem?"
        description={`"${detail?.title}" will be hidden from the candidate hub.`}
        confirmText="Deactivate"
        isLoading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
