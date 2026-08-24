"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CodingProblemForm,
  CodingProblemFormFooter,
  emptyCodingProblemForm,
  formToUpsertBody,
  hiddenTestsWarning,
  validateCodingProblemForm,
  type CodingProblemFormValues,
} from "@/components/coding-admin/CodingProblemForm";
import { appCard } from "@/lib/app-theme";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import { adminCodingProblemApi, userApi } from "@/lib/api";

export default function NewCodingProblemPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [form, setForm] = useState<CodingProblemFormValues>(
    emptyCodingProblemForm(),
  );
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

  const save = async () => {
    const err = validateCodingProblemForm(form, "create");
    if (err) {
      toast.error(err);
      return;
    }
    const warn = hiddenTestsWarning(form);
    if (warn && !window.confirm(warn)) return;

    setSaving(true);
    try {
      const created = await adminCodingProblemApi.create(formToUpsertBody(form));
      toast.success("Problem created");
      router.push(
        `/dashboard/super-admin/coding-problems/${encodeURIComponent(created.problemId)}/edit`,
      );
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Create failed";
      toast.error(msg);
    } finally {
      setSaving(false);
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
        title="New coding problem"
        description="Create a problem with public and hidden test cases."
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/super-admin/coding-problems">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />
      <Card className={appCard}>
        <CardContent className="space-y-6 pt-6">
          <CodingProblemForm
            mode="create"
            value={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            categories={[]}
          />
          <CodingProblemFormFooter
            saving={saving}
            onSave={() => void save()}
            onCancel={() => router.push("/dashboard/super-admin/coding-problems")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
