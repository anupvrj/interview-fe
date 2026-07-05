"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { DismissableLayerBranch } from "@radix-ui/react-dismissable-layer";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  filterSkillSuggestions,
  skillAlreadySelected,
} from "@/lib/skill-catalog";
import { cn } from "@/lib/utils";

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

/** Portaled list selector — use with Dialog onPointerDownOutside / onInteractOutside. */
export const PROFILE_SKILLS_DROPDOWN_SELECTOR = "[data-profile-skills-dropdown]";

export function isProfileSkillsDropdownTarget(
  target: EventTarget | null,
): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest(PROFILE_SKILLS_DROPDOWN_SELECTOR))
  );
}

type OutsideEvent = {
  preventDefault: () => void;
  target: EventTarget | null;
  detail?: { originalEvent?: { target?: EventTarget | null } };
};

function outsideEventTarget(event: OutsideEvent): EventTarget | null {
  return event.detail?.originalEvent?.target ?? event.target;
}

/** Spread onto DialogContent when ProfileSkillsEditor is used inside a modal. */
export const profileSkillsDialogOutsideHandlers = {
  onPointerDownOutside: (event: OutsideEvent) => {
    if (isProfileSkillsDropdownTarget(outsideEventTarget(event))) {
      event.preventDefault();
    }
  },
  onInteractOutside: (event: OutsideEvent) => {
    if (isProfileSkillsDropdownTarget(outsideEventTarget(event))) {
      event.preventDefault();
    }
  },
  onFocusOutside: (event: OutsideEvent) => {
    if (isProfileSkillsDropdownTarget(outsideEventTarget(event))) {
      event.preventDefault();
    }
  },
};

export function ProfileSkillsEditor({
  skills,
  onChange,
  industry,
  disabled = false,
  inputClassName,
  placeholder = "Search or type a skill (e.g. JavaScript, AWS)",
  emptyHint = "No skills added yet. Pick from the list, or type one and press Enter.",
  suggestionLimit = 8,
}: Readonly<{
  skills: string[];
  onChange: (skills: string[]) => void;
  industry?: string;
  disabled?: boolean;
  inputClassName?: string;
  placeholder?: string;
  emptyHint?: string;
  suggestionLimit?: number;
}>) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
  });
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const suggestions = useMemo(
    () => filterSkillSuggestions(draft, skills, industry, suggestionLimit),
    [draft, skills, industry, suggestionLimit],
  );
  const trimmedDraft = draft.trim();
  const canAddCustom =
    trimmedDraft.length > 0 &&
    !skillAlreadySelected(trimmedDraft, skills) &&
    !suggestions.some(
      (skill) => skill.toLowerCase() === trimmedDraft.toLowerCase(),
    );

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateDropdownPosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const openSuggestions = useCallback(() => {
    updateDropdownPosition();
    setOpen(true);
  }, [updateDropdownPosition]);

  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();
    const onScrollOrResize = () => updateDropdownPosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updateDropdownPosition]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (wrapRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest(PROFILE_SKILLS_DROPDOWN_SELECTOR)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectSuggestion = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || skillAlreadySelected(trimmed, skills)) {
      setDraft("");
      setOpen(false);
      return;
    }
    onChange([...skills, trimmed]);
    setDraft("");
    setOpen(false);
  };

  const removeSkill = (skill: string) => {
    onChange(skills.filter((item) => item !== skill));
  };

  const showDropdown =
    open && !disabled && (suggestions.length > 0 || canAddCustom);

  const dropdown =
    mounted && showDropdown ? (
      <DismissableLayerBranch
        data-profile-skills-dropdown
        className="pointer-events-auto fixed z-[10050]"
        style={{
          top: dropdownPos.top,
          left: dropdownPos.left,
          width: dropdownPos.width,
        }}
      >
        <ul
          ref={listRef}
          className="max-h-52 overflow-auto rounded-xl border border-border/60 bg-card text-sm text-foreground shadow-lg"
        >
          {suggestions.map((skill) => (
            <li key={skill}>
              <button
                type="button"
                className="pointer-events-auto w-full px-4 py-2.5 text-left transition-colors hover:bg-muted"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectSuggestion(skill);
                }}
              >
                {skill}
              </button>
            </li>
          ))}
          {canAddCustom ? (
            <li>
              <button
                type="button"
                className="pointer-events-auto w-full border-t border-border/60 px-4 py-2.5 text-left font-medium text-[#7367F0] transition-colors hover:bg-[#7367F0]/[0.06]"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectSuggestion(trimmedDraft);
                }}
              >
                Add &quot;{trimmedDraft}&quot;
              </button>
            </li>
          ) : null}
        </ul>
      </DismissableLayerBranch>
    ) : null;

  return (
    <div className="space-y-3">
      <div ref={wrapRef} className="relative">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={draft}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete="off"
            className={cn("h-11 min-w-0 !pl-10 pr-4", inputClassName)}
            onChange={(event) => {
              setDraft(event.target.value);
              openSuggestions();
            }}
            onFocus={openSuggestions}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                selectSuggestion(draft);
              }
              if (event.key === "Escape") {
                setOpen(false);
              }
            }}
          />
        </div>
      </div>
      {mounted && dropdown ? createPortal(dropdown, document.body) : null}

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full border border-[#7367F0]/20 bg-[#7367F0]/10 px-2.5 py-1 text-xs font-medium text-[#7367F0]"
            >
              {skill}
              {!disabled ? (
                <button
                  type="button"
                  aria-label={`Remove ${skill}`}
                  className="rounded-full p-0.5 hover:bg-[#7367F0]/15"
                  onClick={() => removeSkill(skill)}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      )}
    </div>
  );
}
