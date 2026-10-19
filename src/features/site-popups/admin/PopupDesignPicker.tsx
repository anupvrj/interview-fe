"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PopupDesign } from "../types";
import { DESIGN_OPTIONS } from "./presets";

/** Tiny wireframe of each layout on a page. */
function Thumb({ design }: Readonly<{ design: PopupDesign }>) {
  const card = "absolute rounded-[5px] border border-[#4fd2ff]/70 bg-[#0b1d38] shadow-[0_0_10px_rgba(43,210,255,0.35)]";
  const line = (w: string, extra = "") => <span className={cn("block h-1 rounded-full bg-white/80", w, extra)} />;
  const btn = <span className="mt-1 block h-1.5 w-8 rounded-full bg-gradient-to-r from-[#1677ff] to-[#2bd2ff]" />;
  return (
    <div className="relative h-20 overflow-hidden rounded-md bg-slate-100">
      <div className="absolute inset-x-2 top-2 h-1.5 rounded bg-slate-300" />
      <div className="absolute left-2 top-5 h-1 w-1/2 rounded bg-slate-200" />
      <div className="absolute left-2 top-7 h-1 w-1/3 rounded bg-slate-200" />
      {design === "spotlight" || design === "minimal" || design === "split" ? <div className="absolute inset-0 bg-slate-900/40" /> : null}
      {design === "spotlight" ? (
        <div className={cn(card, "left-1/2 top-1/2 flex w-[52%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 p-1.5")}>
          {line("w-3/4")}
          {line("w-1/2", "bg-[#2bd2ff]")}
          <span className="mt-0.5 flex gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-1.5 w-2 rounded-[2px] border border-[#4fd2ff]/60" />
            ))}
          </span>
          {btn}
        </div>
      ) : null}
      {design === "split" ? (
        <div className={cn(card, "left-1/2 top-1/2 flex h-[64%] w-[72%] -translate-x-1/2 -translate-y-1/2 overflow-hidden")}>
          <span className="flex w-2/5 items-center justify-center bg-[#ffc44d]/20">
            <span className="h-3 w-3 rounded-full bg-[#ffc44d]" />
          </span>
          <span className="flex flex-1 flex-col justify-center gap-0.5 p-1.5">
            {line("w-3/4")}
            {line("w-1/2", "bg-[#2bd2ff]")}
            {btn}
          </span>
        </div>
      ) : null}
      {design === "banner" ? (
        <div className={cn(card, "inset-x-0 bottom-0 flex h-5 items-center justify-between gap-1 rounded-b-none px-2")}>
          {line("w-1/3")}
          <span className="h-1.5 w-1/5 rounded bg-white/40" />
          {btn}
        </div>
      ) : null}
      {design === "sheet" ? (
        <>
          <div className="absolute inset-0 bg-slate-900/30" />
          <div className={cn(card, "inset-x-3 bottom-0 flex h-[55%] flex-col gap-0.5 rounded-b-none p-1.5")}>
            <span className="mx-auto mb-0.5 block h-0.5 w-4 rounded bg-white/50" />
            {line("w-2/3")}
            {line("w-1/2", "bg-[#2bd2ff]")}
            <span className="mt-auto block h-1.5 w-full rounded-full bg-gradient-to-r from-[#1677ff] to-[#2bd2ff]" />
          </div>
        </>
      ) : null}
      {design === "corner" ? (
        <div className={cn(card, "bottom-1.5 right-1.5 flex w-[40%] flex-col gap-0.5 p-1.5")}>
          {line("w-3/4")}
          {line("w-1/2", "bg-[#2bd2ff]")}
          {btn}
        </div>
      ) : null}
      {design === "minimal" ? (
        <div className={cn(card, "left-1/2 top-1/2 flex w-[42%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 p-1.5")}>
          {line("w-3/4")}
          {line("w-1/2", "bg-white/40")}
          {btn}
        </div>
      ) : null}
    </div>
  );
}

export function PopupDesignPicker({ value, onChange }: Readonly<{ value: PopupDesign; onChange: (design: PopupDesign) => void }>) {
  return (
    <div role="radiogroup" aria-label="Popup design" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {DESIGN_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative rounded-xl border p-2.5 text-left transition-all hover:border-[#7367F0]/60",
              active ? "border-[#7367F0] bg-[#7367F0]/[0.06] ring-2 ring-[#7367F0]/20" : "border-border bg-card",
            )}
          >
            {active ? (
              <span className="absolute right-2 top-2 z-10 grid size-5 place-items-center rounded-full bg-[#7367F0] text-white">
                <Check className="size-3" />
              </span>
            ) : null}
            <Thumb design={option.value} />
            <p className="mt-2 text-sm font-medium text-foreground">{option.label}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{option.description}</p>
          </button>
        );
      })}
    </div>
  );
}
