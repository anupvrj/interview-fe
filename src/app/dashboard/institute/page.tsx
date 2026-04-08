"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { userApi, adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2 } from "lucide-react";

/**
 * Entry: institution admins redirect to their org dashboard;
 * super admins see a picker to open any institution dashboard.
 */
export default function InstituteHubPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      try {
        const p = await userApi.getMyProfile();
        if (p.accessRole === "institution_admin" && p.institutionId) {
          router.replace(`/dashboard/institute/${p.institutionId}`);
          return;
        }
        if (p.accessRole === "super_admin") {
          const list = await adminApi.listInstitutions();
          setInstitutions(list);
          setLoading(false);
          return;
        }
        router.replace("/dashboard");
        setLoading(false);
      } catch {
        router.replace("/dashboard");
        setLoading(false);
      }
    })();
  }, [isLoaded, user, router]);

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Institution dashboards</h1>
        <p className="mt-1 text-slate-600">
          Super admin: choose an institution to manage candidates, schedules, and settings.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Institutions
          </CardTitle>
          <CardDescription>Open the full dashboard for that organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {institutions.length === 0 ? (
            <p className="text-slate-500">No institutions yet.</p>
          ) : (
            institutions.map((inst) => (
              <div
                key={inst._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-slate-900">{inst.name}</p>
                  <p className="text-xs text-slate-500">{inst.slug}</p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/dashboard/institute/${inst._id}`}>Open dashboard</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
