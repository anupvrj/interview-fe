"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type PaletteAction = { id: string; label: string; hint?: string; keywords?: string; run: () => void };

/**
 * ⌘K / Ctrl+K: every editor action one keystroke away (fix all, rewrite a section, tailor, cover
 * letter, download…). Type to filter, ↑↓ to move, Enter to run.
 */
export function CommandPalette({ actions }: { actions: PaletteAction[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (open) {
      setQ("");
      setI(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return actions.filter((a) => words.every((w) => `${a.label} ${a.keywords ?? ""}`.toLowerCase().includes(w)));
  }, [actions, q]);

  const run = (a: PaletteAction | undefined) => {
    if (!a) return;
    setOpen(false);
    setTimeout(a.run, 0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0" data-testid="command-palette">
        <DialogTitle className="sr-only">Quick actions</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            aria-label="Search actions"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setI(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setI((x) => Math.min(list.length - 1, x + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setI((x) => Math.max(0, x - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                run(list[i]);
              }
            }}
            placeholder="What do you want to do? e.g. rewrite summary, cover letter"
            className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none"
          />
          <kbd className="rounded border border-border px-1.5 text-[10px] text-muted-foreground">esc</kbd>
        </div>
        <ul role="listbox" className="max-h-80 overflow-y-auto p-1.5">
          {list.map((a, k) => (
            <li key={a.id} role="option" aria-selected={k === i}>
              <button
                type="button"
                onMouseEnter={() => setI(k)}
                onClick={() => run(a)}
                className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm", k === i ? "bg-primary/10 text-foreground" : "text-foreground/90")}
              >
                <span>{a.label}</span>
                {a.hint ? <span className="text-[11px] text-muted-foreground">{a.hint}</span> : null}
              </button>
            </li>
          ))}
          {!list.length ? <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matching action</li> : null}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
