"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import { skillGraphApi } from "@/features/skill-graph/api";
import { SkillGraphExplorer } from "@/features/skill-graph/SkillGraphExplorer";
import { Eyebrow, dash2026Scope } from "./ui";

const ME = "me";

/** /dashboard/skill-graph: the candidate's skill graph, presented as the graph itself. */
export function SkillGraphHome() {
  const queryClient = useQueryClient();
  const [building, setBuilding] = useState(false);

  const build = async () => {
    setBuilding(true);
    try {
      const summary = await skillGraphApi.parseResume(ME);
      toast.success(`Found ${summary.claimed_nodes.length} skills on your resume`);
      await queryClient.invalidateQueries({ queryKey: ["skill-graph", ME] });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't read your resume"));
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5")}>
      <div>
        <Eyebrow>iX SKILL GRAPH</Eyebrow>
        <h1 className="mt-3 text-[28px] font-black leading-[1.05] tracking-[-0.045em] text-foreground sm:text-[36px]">
          Your{" "}
          <span className="bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] bg-clip-text text-transparent">Skill Graph</span>
        </h1>
      </div>

      <SkillGraphExplorer
        candidateId={ME}
        actions={
          <Button type="button" variant="outline" disabled={building} onClick={build} className="h-10 rounded-xl" title="Rebuild from your resume">
            {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="max-sm:hidden">From resume</span>
          </Button>
        }
        emptyState={
          <section className="flex flex-col items-center gap-4 rounded-[26px] border border-border bg-card px-6 py-16 text-center">
            <div className="grid size-16 place-items-center rounded-2xl bg-primary text-[15px] font-extrabold text-primary-foreground">YOU</div>
            <p className="max-w-[44ch] text-[14px] text-muted-foreground">
              Start from your resume. Scores come from your practice rounds.{" "}
              <Link href="/dashboard/profile" className="text-primary hover:underline">Upload a resume</Link>
            </p>
            <Button type="button" disabled={building} onClick={build} className="h-11 rounded-xl px-5">
              {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Build my skill graph
            </Button>
          </section>
        }
      />
    </div>
  );
}
