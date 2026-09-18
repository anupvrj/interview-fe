"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import {
  SystemDesignProblemForm,
  SystemDesignProblemFormFooter,
  emptySystemDesignProblemForm,
  validateSystemDesignProblemForm,
  type SystemDesignProblemFormValues,
} from "@/components/system-design-admin/SystemDesignProblemForm";
import { appCard } from "@/lib/app-theme";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import { adminSystemDesignApi, userApi } from "@/lib/api";

export default function NewSystemDesignProblemPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [form, setForm] = useState<SystemDesignProblemFormValues>(
    emptySystemDesignProblemForm(),
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

  useEffect(() => {
    if (!authorized) return;
    void adminSystemDesignApi.listCategories().then(setCategories).catch(() => {});
  }, [authorized]);

  const save = async () => {
    const err = validateSystemDesignProblemForm(form, "create");
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const created = await adminSystemDesignApi.create(form);
      toast.success("Problem created");
      router.push(
        `/super-admin/system-design-problems/${created.problemId}/edit`,
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
      <SuperAdminPageHeader />

      <Card className={appCard}>
        <CardContent className="space-y-6 pt-6">
          <SystemDesignProblemForm
            mode="create"
            value={form}
            categories={categories}
            onChange={setForm}
          />
          <SystemDesignProblemFormFooter
            saving={saving}
            onSave={() => void save()}
            onCancel={() =>
              router.push("/super-admin/system-design-problems")
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
