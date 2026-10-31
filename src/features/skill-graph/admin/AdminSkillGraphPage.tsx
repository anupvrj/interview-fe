"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { skillGraphAdminApi, skillGraphApi, skillGraphKeys } from "../api";
import { SkillGraphExplorer } from "../SkillGraphExplorer";
import type { SkillReviewItem, TaxonomyNode } from "../types";

const selectClass = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

/** Accept (as a new node or onto an existing one) or reject one queued phrase. */
function ReviewRow({ item, taxonomy, onResolved }: { item: SkillReviewItem; taxonomy: TaxonomyNode[]; onResolved: () => void }) {
  const domains = taxonomy.filter((n) => n.is_main);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [domain, setDomain] = useState(item.suggested_domain ?? domains[0]?.id ?? "");
  const [name, setName] = useState(item.raw_phrase);
  const [nodeId, setNodeId] = useState("");
  const [busy, setBusy] = useState(false);
  const leaves = useMemo(() => taxonomy.filter((n) => !n.is_main).sort((a, b) => a.id.localeCompare(b.id)), [taxonomy]);

  const resolve = async (action: "accept" | "reject") => {
    setBusy(true);
    try {
      const input =
        action === "reject"
          ? { action }
          : mode === "existing"
            ? { action, nodeId }
            : { action, domain, name: name.trim() || item.raw_phrase };
      const result = await skillGraphAdminApi.resolve(item.id, input);
      toast.success(action === "reject" ? `Rejected “${item.raw_phrase}”` : `Added as ${result.node_id}`);
      onResolved();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't resolve this item"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <TableRow>
      <TableCell className="align-top">
        <p className="font-medium">{item.raw_phrase}</p>
        {item.quote_text && <p className="mt-1 max-w-[42ch] text-xs text-muted-foreground">“{item.quote_text}”</p>}
      </TableCell>
      <TableCell className="align-top text-xs">
        <Badge variant={item.origin === "resume" ? "info" : "default"}>{item.origin.replace("_", " ")}</Badge>
        <p className="mt-1 max-w-[18ch] truncate font-mono text-muted-foreground" title={item.candidate_id}>{item.candidate_id}</p>
      </TableCell>
      <TableCell className="min-w-[260px] space-y-2 align-top">
        <select aria-label="Resolve as" className={selectClass} value={mode} onChange={(e) => setMode(e.target.value as "new" | "existing")}>
          <option value="new">New skill under a domain</option>
          <option value="existing">Alias of an existing skill</option>
        </select>
        {mode === "new" ? (
          <>
            <select aria-label="Domain" className={selectClass} value={domain} onChange={(e) => setDomain(e.target.value)}>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <Input aria-label="Skill name" value={name} onChange={(e) => setName(e.target.value)} />
          </>
        ) : (
          <select aria-label="Existing skill" className={selectClass} value={nodeId} onChange={(e) => setNodeId(e.target.value)}>
            <option value="">Pick a skill…</option>
            {leaves.map((n) => (
              <option key={n.id} value={n.id}>{n.name} — {n.id}</option>
            ))}
          </select>
        )}
      </TableCell>
      <TableCell className="align-top">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="sm" disabled={busy || (mode === "existing" && !nodeId)} onClick={() => resolve("accept")}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accept
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => resolve("reject")}>
            <X className="h-4 w-4" /> Reject
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

/** Manual skill edits for one candidate (spec §4.4) plus their graph. */
function CandidateTools({ taxonomy }: { taxonomy: TaxonomyNode[] }) {
  const queryClient = useQueryClient();
  const [draftId, setDraftId] = useState("");
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const domains = taxonomy.filter((n) => n.is_main);

  const edit = async (input: Parameters<typeof skillGraphAdminApi.editSkill>[1]) => {
    if (!candidateId) return;
    setBusy(true);
    try {
      const result = await skillGraphAdminApi.editSkill(candidateId, input);
      toast.success(`${result.node_created ? "Created and added" : "Updated"} ${result.node_id}`);
      setName("");
      await queryClient.invalidateQueries({ queryKey: ["skill-graph", candidateId] });
      await queryClient.invalidateQueries({ queryKey: skillGraphKeys.taxonomy });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't update the skill"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div>
          <h2 className="text-base font-semibold">Candidate skills</h2>
          <p className="text-sm text-muted-foreground">Add or hide skills on a candidate&apos;s graph. Edits change structure and claims only; scores still come from interview evidence.</p>
        </div>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setCandidateId(draftId.trim() || null);
          }}
        >
          <Input placeholder="Candidate Clerk user id (user_…)" value={draftId} onChange={(e) => setDraftId(e.target.value)} />
          <Button type="submit" variant="outline"><Search className="h-4 w-4" /> Open graph</Button>
        </form>

        {candidateId && (
          <>
            <form
              className="grid gap-2 sm:grid-cols-[1fr_220px_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) void edit({ action: "add", name: name.trim(), domain: domain || undefined });
              }}
            >
              <Input aria-label="Skill to add" placeholder="Skill to add (e.g. Elixir)" value={name} onChange={(e) => setName(e.target.value)} />
              <select aria-label="Domain for a new skill" className={selectClass} value={domain} onChange={(e) => setDomain(e.target.value)}>
                <option value="">Domain (only for new skills)</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <Button type="submit" disabled={busy || !name.trim()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Add skill</Button>
            </form>
            <HideRestore taxonomy={taxonomy} busy={busy} onEdit={edit} />
            <SkillGraphExplorer candidateId={candidateId} emptyState={<p className="text-sm text-muted-foreground">This candidate has no skill graph yet.</p>} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function HideRestore({ taxonomy, busy, onEdit }: { taxonomy: TaxonomyNode[]; busy: boolean; onEdit: (input: { action: "remove" | "restore"; nodeId: string }) => void }) {
  const [nodeId, setNodeId] = useState("");
  const leaves = taxonomy.filter((n) => !n.is_main).sort((a, b) => a.id.localeCompare(b.id));
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
      <select aria-label="Skill to hide or restore" className={selectClass} value={nodeId} onChange={(e) => setNodeId(e.target.value)}>
        <option value="">Skill to hide or restore…</option>
        {leaves.map((n) => (
          <option key={n.id} value={n.id}>{n.name} — {n.id}</option>
        ))}
      </select>
      <Button variant="outline" disabled={busy || !nodeId} onClick={() => onEdit({ action: "remove", nodeId })}>Hide</Button>
      <Button variant="outline" disabled={busy || !nodeId} onClick={() => onEdit({ action: "restore", nodeId })}>Restore</Button>
    </div>
  );
}

/** /super-admin/skill-graph: review queue for unmapped skills + manual candidate edits. */
export function AdminSkillGraphPage() {
  const { authorized, loading } = useRequirePlatformAdmin();
  const queryClient = useQueryClient();
  const queue = useQuery({ queryKey: skillGraphKeys.queue("pending"), queryFn: () => skillGraphAdminApi.listQueue("pending"), enabled: authorized });
  const taxonomy = useQuery({ queryKey: skillGraphKeys.taxonomy, queryFn: skillGraphApi.getTaxonomy, enabled: authorized });

  if (loading || !authorized) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: skillGraphKeys.queue("pending") });
    void queryClient.invalidateQueries({ queryKey: skillGraphKeys.taxonomy });
  };

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader />
      <Card>
        <CardContent className="px-0 py-0 sm:px-0">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">Review queue</h2>
            <p className="text-sm text-muted-foreground">Skills from resumes and interviews that didn&apos;t match the taxonomy. Accepting creates the skill (or an alias) and attaches the evidence.</p>
          </div>
          {queue.isLoading || taxonomy.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : queue.error ? (
            <p className="px-5 py-6 text-sm text-destructive">{getApiErrorMessage(queue.error, "Couldn't load the queue")}</p>
          ) : (queue.data ?? []).length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nothing to review.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Phrase</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Resolve as</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(queue.data ?? []).map((item) => (
                    <ReviewRow key={item.id} item={item} taxonomy={taxonomy.data ?? []} onResolved={refresh} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <CandidateTools taxonomy={taxonomy.data ?? []} />
    </div>
  );
}
