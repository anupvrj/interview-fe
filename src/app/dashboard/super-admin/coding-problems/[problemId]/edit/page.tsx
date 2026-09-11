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
import {
  CodingProblemForm,
  CodingProblemFormFooter,
  detailToFormValues,
  formToUpsertBody,
  hiddenTestsWarning,
  validateCodingProblemForm,
  type CodingProblemFormValues,
} from "@/components/coding-admin/CodingProblemForm";
import { appCard } from "@/lib/app-theme";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import { adminCodingProblemApi, userApi } from "@/lib/api";

export default function EditCodingProblemPage() {
  const params = useParams<{ problemId: string }>();
  const problemId = decodeURIComponent(params.problemId);
  const { isLoaded } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [form, setForm] = useState<CodingProblemFormValues | null>(null);
  const [saving, setSaving] = useState(false);

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
    if (!authorized) return;
    void (async () => {
      setLoading(true);
      try {
        const [detail, cats] = await Promise.all([
          adminCodingProblemApi.get(problemId),
          adminCodingProblemApi.listCategories(),
        ]);
        setForm(detailToFormValues(detail));
        setCategories(cats);
      } catch {
        toast.error("Problem not found");
        router.replace("/dashboard/super-admin/coding-problems");
      } finally {
        setLoading(false);
      }
    })();
  }, [authorized, problemId, router]);

  const save = async () => {
    if (!form) return;
    const err = validateCodingProblemForm(form, "edit");
    if (err) {
      toast.error(err);
      return;
    }
    const warn = hiddenTestsWarning(form);
    if (warn && !window.confirm(warn)) return;

    setSaving(true);
    try {
      await adminCodingProblemApi.update(problemId, formToUpsertBody(form));
      toast.success("Problem saved");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const deleteProblem = async () => {
    if (
      !window.confirm(
        "Delete this problem permanently? This cannot be undone.",
      )
    )
      return;
    try {
      await adminCodingProblemApi.remove(problemId);
      toast.success("Problem deleted");
      router.push("/dashboard/super-admin/coding-problems");
    } catch {
      toast.error("Delete failed");
    }
  };

  const restore = async () => {
    try {
      const detail = await adminCodingProblemApi.restore(problemId);
      setForm(detailToFormValues(detail));
      toast.success("Problem restored");
    } catch {
      toast.error("Restore failed");
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
        title={form.title || "Edit problem"}
        description={form.problemId}
        actions={
          <div className="flex gap-2">
            {!form.isActive ? (
              <Button variant="outline" onClick={() => void restore()}>
                Restore
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href="/dashboard/super-admin/coding-problems">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        }
      />
      <Card className={appCard}>
        <CardContent className="space-y-6 pt-6">
          <CodingProblemForm
            mode="edit"
            value={form}
            onChange={(patch) => setForm((f) => (f ? { ...f, ...patch } : f))}
            categories={categories}
          />
          <CodingProblemFormFooter
            saving={saving}
            onSave={() => void save()}
            onCancel={() => router.push("/dashboard/super-admin/coding-problems")}
            onDelete={form.isActive ? () => void deleteProblem() : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
