"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { userApi, adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  InstituteLoader,
  InstitutePageHeader,
  institutePanelClass,
  institutePrimaryClass,
} from "@/components/institute/InstituteChrome";

export default function InstituteSettingsPage() {
  const params = useParams();
  const institutionId = params.institutionId as string;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    userApi.getMyProfile().then(setProfile).catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    adminApi
      .getInstitutionDashboard(institutionId)
      .then((d) => {
        const inst = d.institution as {
          name?: string;
          slug?: string;
          domain?: string | null;
        };
        setName(inst.name ?? "");
        setSlug(inst.slug ?? "");
        setDomain(inst.domain ?? "");
      })
      .catch(() => setMessage("Failed to load institution"))
      .finally(() => setLoading(false));
  }, [profile, institutionId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await adminApi.updateInstitution(institutionId, {
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        domain: domain.trim() || undefined,
      });
      setMessage("Saved.");
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!profile || loading) {
    return <InstituteLoader />;
  }

  return (
    <div className="space-y-8">
      <InstitutePageHeader
        badge="Institution"
        title="Institution settings"
        description="Name, URL slug, and optional custom domain."
      />

      <Card className={cn(institutePanelClass, "overflow-hidden shadow-xl")}>
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/40 to-card">
          <CardTitle>Details</CardTitle>
          <CardDescription>Visible to candidates on sign-up and in emails where used</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inst-name">Name</Label>
              <Input
                id="inst-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inst-slug">Slug</Label>
              <Input
                id="inst-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-institute"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inst-domain">Custom domain (optional)</Label>
              <Input
                id="inst-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="interviews.example.com"
              />
            </div>
            {message && (
              <p className={`text-sm ${message === "Saved." ? "text-green-600" : "text-red-600"}`}>
                {message}
              </p>
            )}
            <Button type="submit" disabled={saving} className={institutePrimaryClass}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
