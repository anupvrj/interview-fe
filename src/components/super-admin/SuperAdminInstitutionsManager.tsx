"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Pencil, LayoutDashboard } from "lucide-react";
import { adminApi } from "@/lib/api";
import {
  defaultInstitutionProducts,
  INSTITUTION_PRODUCT_KEYS,
  INSTITUTION_PRODUCT_LABELS,
} from "@/lib/institution-flags";
import {
  InstitutionIntegrityFields,
  integrityFromInstitution,
} from "@/components/super-admin/InstitutionIntegrityFields";
import type { IntegritySettings } from "@/lib/integrity/settings";
import { DEFAULT_INTEGRITY_SETTINGS } from "@/lib/integrity/settings";

export function SuperAdminInstitutionsManager() {
  const router = useRouter();
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [instOpen, setInstOpen] = useState(false);
  const [instName, setInstName] = useState("");
  const [instSlug, setInstSlug] = useState("");
  const [instDomain, setInstDomain] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [instMaxUsers, setInstMaxUsers] = useState("");
  const [instTechBasicSeats, setInstTechBasicSeats] = useState("");
  const [instTechProSeats, setInstTechProSeats] = useState("");
  const [instBiometric, setInstBiometric] = useState(false);
  const [instIntegrity, setInstIntegrity] = useState<IntegritySettings>(
    DEFAULT_INTEGRITY_SETTINGS,
  );
  const [instProducts, setInstProducts] = useState(defaultInstitutionProducts);
  const [instSubmitting, setInstSubmitting] = useState(false);

  const [editInst, setEditInst] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMaxUsers, setEditMaxUsers] = useState("");
  const [editTechBasicSeats, setEditTechBasicSeats] = useState("");
  const [editTechProSeats, setEditTechProSeats] = useState("");
  const [editBiometric, setEditBiometric] = useState(false);
  const [editIntegrity, setEditIntegrity] = useState<IntegritySettings>(
    DEFAULT_INTEGRITY_SETTINGS,
  );
  const [editProducts, setEditProducts] = useState(defaultInstitutionProducts);
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    void loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.listInstitutions();
      setInstitutions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstitution = async () => {
    if (!instName.trim()) return;
    const payload: Parameters<typeof adminApi.createInstitution>[0] = {
      name: instName.trim(),
      slug: instSlug.trim() || undefined,
      domain: instDomain.trim() || undefined,
      contactEmail: instEmail.trim() || undefined,
      platformFlags: {
        biometricVerification: instBiometric,
        products: instProducts,
        integrity: instIntegrity,
      },
    };
    const mu = instMaxUsers.trim();
    if (mu !== "") {
      const n = Number.parseInt(mu, 10);
      if (!Number.isFinite(n) || n < 1) {
        alert("Max users must be a positive number, or leave empty for unlimited.");
        return;
      }
      payload.maxUsers = n;
    }
    try {
      setInstSubmitting(true);
      const created = await adminApi.createInstitution(payload);
      const seats: Array<{ planId: string; purchased: number }> = [];
      const tb = instTechBasicSeats.trim();
      const tp = instTechProSeats.trim();
      if (tb) seats.push({ planId: "tech_basic", purchased: Number.parseInt(tb, 10) });
      if (tp) seats.push({ planId: "tech_pro", purchased: Number.parseInt(tp, 10) });
      if (seats.length && created?._id) {
        await adminApi.updateInstitutionSeats(String(created._id), seats);
      }
      setInstOpen(false);
      setInstName("");
      setInstSlug("");
      setInstDomain("");
      setInstEmail("");
      setInstMaxUsers("");
      setInstTechBasicSeats("");
      setInstTechProSeats("");
      setInstBiometric(false);
      setInstIntegrity(DEFAULT_INTEGRITY_SETTINGS);
      setInstProducts(defaultInstitutionProducts());
      await loadInstitutions();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create institution");
    } finally {
      setInstSubmitting(false);
    }
  };

  const openEditInstitution = (inst: any) => {
    setEditInst(inst);
    setEditName(inst.name ?? "");
    setEditSlug(inst.slug ?? "");
    setEditDomain(inst.domain ?? "");
    setEditEmail(inst.contactEmail ?? "");
    setEditMaxUsers(
      inst.maxUsers != null && inst.maxUsers !== "" ? String(inst.maxUsers) : "",
    );
    const seatRows = (inst.planSeats || []) as Array<{ planId: string; purchased: number }>;
    setEditTechBasicSeats(
      String(seatRows.find((s) => s.planId === "tech_basic")?.purchased ?? ""),
    );
    setEditTechProSeats(
      String(seatRows.find((s) => s.planId === "tech_pro")?.purchased ?? ""),
    );
    setEditBiometric(Boolean(inst.platformFlags?.biometricVerification));
    setEditIntegrity(integrityFromInstitution(inst.platformFlags?.integrity));
    setEditProducts({
      ...defaultInstitutionProducts(),
      ...(inst.platformFlags?.products ?? {}),
    });
  };

  const handleUpdateInstitution = async () => {
    if (!editInst?._id || !editName.trim()) return;
    const mu = editMaxUsers.trim();
    let maxUsers: number | null | undefined = undefined;
    if (mu === "") {
      maxUsers = null;
    } else {
      const n = Number.parseInt(mu, 10);
      if (!Number.isFinite(n) || n < 1) {
        alert("Max users must be a positive number, or leave empty for unlimited.");
        return;
      }
      maxUsers = n;
    }
    try {
      setEditSubmitting(true);
      await adminApi.updateInstitution(String(editInst._id), {
        name: editName.trim(),
        slug: editSlug.trim(),
        domain: editDomain.trim() || null,
        contactEmail: editEmail.trim() || null,
        maxUsers,
        platformFlags: {
          biometricVerification: editBiometric,
          products: editProducts,
          integrity: editIntegrity,
        },
      });
      const seats: Array<{ planId: string; purchased: number }> = [];
      const tb = editTechBasicSeats.trim();
      const tp = editTechProSeats.trim();
      if (tb) seats.push({ planId: "tech_basic", purchased: Number.parseInt(tb, 10) });
      if (tp) seats.push({ planId: "tech_pro", purchased: Number.parseInt(tp, 10) });
      if (seats.length) {
        await adminApi.updateInstitutionSeats(String(editInst._id), seats);
      }
      setEditInst(null);
      await loadInstitutions();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update institution");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteInstitution = async (inst: any) => {
    if (
      !confirm(
        `Delete institution "${inst.name}"? Deletion is only allowed when no users are assigned. This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await adminApi.deleteInstitution(String(inst._id));
      await loadInstitutions();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete institution");
    }
  };

  return (
    <>
      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
          <CardTitle className="text-base sm:text-lg">Partner institutions</CardTitle>
          <CardDescription>
            Create colleges and companies, then open their dashboards
          </CardDescription>
          <Button className="mt-2 h-11 w-full sm:w-fit" onClick={() => setInstOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Institution
          </Button>
        </CardHeader>
        <CardContent className="px-4 py-4 sm:px-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : null}
          {!loading && institutions.length === 0 ? (
            <p className="text-muted-foreground">No institutions yet</p>
          ) : null}
          {!loading && institutions.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[720px] border-collapse text-left">
                <TableHeader>
                  <TableRow className="border-b border-border/70 hover:bg-transparent">
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Name
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Slug
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Domain
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Contact
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Users
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Max users
                    </TableHead>
                    <TableHead className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Dashboard & actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institutions.map((inst) => (
                    <TableRow
                      key={inst._id}
                      className="border-b border-border/60 hover:bg-muted/30"
                    >
                      <TableCell className="font-medium">{inst.name}</TableCell>
                      <TableCell>{inst.slug}</TableCell>
                      <TableCell>{inst.domain || "—"}</TableCell>
                      <TableCell className="break-all">{inst.contactEmail || "—"}</TableCell>
                      <TableCell>{inst.userCount ?? 0}</TableCell>
                      <TableCell>{inst.maxUsers ?? "Unlimited"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/institute/${String(inst._id)}`)
                            }
                            title="Open institution dashboard"
                            aria-label="Open institution dashboard"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditInstitution(inst)}
                            title="Edit institution"
                            aria-label="Edit institution"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteInstitution(inst)}
                            title="Delete institution"
                            aria-label="Delete institution"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={instOpen} onOpenChange={setInstOpen}>
        <DialogContent className="max-h-[min(90vh,760px)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Institution</DialogTitle>
            <DialogDescription>
              Add a new institution (college, company) to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="inst-name">Name</Label>
              <Input
                id="inst-name"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="Acme University"
              />
            </div>
            <div>
              <Label htmlFor="inst-slug">Slug (optional)</Label>
              <Input
                id="inst-slug"
                value={instSlug}
                onChange={(e) => setInstSlug(e.target.value)}
                placeholder="acme-university"
              />
            </div>
            <div>
              <Label htmlFor="inst-domain">Domain (optional)</Label>
              <Input
                id="inst-domain"
                value={instDomain}
                onChange={(e) => setInstDomain(e.target.value)}
                placeholder="acme.edu"
              />
            </div>
            <div>
              <Label htmlFor="inst-email">Contact Email (optional)</Label>
              <Input
                id="inst-email"
                type="email"
                value={instEmail}
                onChange={(e) => setInstEmail(e.target.value)}
                placeholder="admin@acme.edu"
              />
            </div>
            <div>
              <Label htmlFor="inst-max-users">Max users (optional)</Label>
              <Input
                id="inst-max-users"
                type="number"
                min={1}
                step={1}
                value={instMaxUsers}
                onChange={(e) => setInstMaxUsers(e.target.value)}
                placeholder="Unlimited if empty"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Caps how many users can be added to this institution. Leave empty
                for no limit.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="inst-tech-basic">Tech Basic seats</Label>
                <Input
                  id="inst-tech-basic"
                  type="number"
                  min={0}
                  value={instTechBasicSeats}
                  onChange={(e) => setInstTechBasicSeats(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="inst-tech-pro">Tech Pro seats</Label>
                <Input
                  id="inst-tech-pro"
                  type="number"
                  min={0}
                  value={instTechProSeats}
                  onChange={(e) => setInstTechProSeats(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={instBiometric}
                onChange={(e) => setInstBiometric(e.target.checked)}
              />
              <span>
                Require biometric identity verification before interviews
                (institute candidates only)
              </span>
            </label>
            <InstitutionIntegrityFields
              settings={instIntegrity}
              onChange={setInstIntegrity}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">Product tabs</p>
              <p className="text-xs text-muted-foreground">
                Uncheck to hide a product from institute candidates.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {INSTITUTION_PRODUCT_KEYS.map((key) => (
                  <label key={key} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={instProducts[key] !== false}
                      onChange={(e) =>
                        setInstProducts((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                    />
                    <span>{INSTITUTION_PRODUCT_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setInstOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateInstitution}
              disabled={!instName.trim() || instSubmitting}
            >
              {instSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editInst} onOpenChange={(o) => !o && setEditInst(null)}>
        <DialogContent className="max-h-[min(90vh,760px)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit institution</DialogTitle>
            <DialogDescription>
              Update name, slug, domain, contact, and user cap
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-inst-name">Name</Label>
              <Input
                id="edit-inst-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Institution name"
              />
            </div>
            <div>
              <Label htmlFor="edit-inst-slug">Slug</Label>
              <Input
                id="edit-inst-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                placeholder="url-safe-slug"
              />
            </div>
            <div>
              <Label htmlFor="edit-inst-domain">Domain (optional)</Label>
              <Input
                id="edit-inst-domain"
                value={editDomain}
                onChange={(e) => setEditDomain(e.target.value)}
                placeholder="college.edu"
              />
            </div>
            <div>
              <Label htmlFor="edit-inst-email">Contact email (optional)</Label>
              <Input
                id="edit-inst-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="admin@example.edu"
              />
            </div>
            <div>
              <Label htmlFor="edit-inst-max">Max users</Label>
              <Input
                id="edit-inst-max"
                type="number"
                min={1}
                step={1}
                value={editMaxUsers}
                onChange={(e) => setEditMaxUsers(e.target.value)}
                placeholder="Unlimited if empty"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Empty = unlimited. Existing users are not removed if you lower the
                cap.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-tech-basic">Tech Basic seats</Label>
                <Input
                  id="edit-tech-basic"
                  type="number"
                  min={0}
                  value={editTechBasicSeats}
                  onChange={(e) => setEditTechBasicSeats(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-tech-pro">Tech Pro seats</Label>
                <Input
                  id="edit-tech-pro"
                  type="number"
                  min={0}
                  value={editTechProSeats}
                  onChange={(e) => setEditTechProSeats(e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={editBiometric}
                onChange={(e) => setEditBiometric(e.target.checked)}
              />
              <span>
                Require biometric identity verification before interviews
              </span>
            </label>
            <InstitutionIntegrityFields
              settings={editIntegrity}
              onChange={setEditIntegrity}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">Product tabs</p>
              <p className="text-xs text-muted-foreground">
                Uncheck to hide a product from institute candidates.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {INSTITUTION_PRODUCT_KEYS.map((key) => (
                  <label key={key} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={editProducts[key] !== false}
                      onChange={(e) =>
                        setEditProducts((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                    />
                    <span>{INSTITUTION_PRODUCT_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setEditInst(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateInstitution}
              disabled={!editName.trim() || editSubmitting}
            >
              {editSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
