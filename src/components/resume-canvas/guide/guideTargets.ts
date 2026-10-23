/**
 * Finds the editor's own buttons by their labels, so the guide needs no hooks inside the
 * editor's components. A step whose button isn't on screen is simply skipped.
 */

const visible = (el: Element | null | undefined): el is HTMLElement =>
  !!el && (el as HTMLElement).getClientRects().length > 0;

/** A button in the studio (left rail on desktop, bottom tab bar on phones). */
export function studioButton(label: string): HTMLElement | null {
  const navs = Array.from(document.querySelectorAll<HTMLElement>('nav[aria-label="Resume studio"]')).filter(visible);
  for (const nav of navs) {
    const btn = Array.from(nav.querySelectorAll<HTMLElement>("button")).find(
      (b) => b.getAttribute("aria-label") === label || b.textContent?.trim().endsWith(label),
    );
    if (btn) return btn;
  }
  // Desktop "+ Section" sits under the rail, outside its list.
  return (
    Array.from(document.querySelectorAll<HTMLElement>(`button[aria-label="${label}"]`)).find(visible) ?? null
  );
}

export function resumePage(): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>(".resume-page")).find(visible) ?? null;
}

export function exportButton(): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>("button")).find(
      (b) => visible(b) && !!b.querySelector(".lucide-download") && !b.closest('[role="dialog"]'),
    ) ?? null
  );
}

export function hackathonSubmitButton(): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>("button")).find(
      (b) => visible(b) && /Submit to Hackathon/.test(b.textContent ?? "") && !b.closest('[role="dialog"]'),
    ) ?? null
  );
}

/** On-screen box of an element, clipped to the viewport (the page is taller than the screen). */
export function boxOf(el: HTMLElement): { left: number; top: number; width: number; height: number } {
  const r = el.getBoundingClientRect();
  const top = Math.max(r.top, 8);
  const bottom = Math.min(r.bottom, window.innerHeight - 8);
  const left = Math.max(r.left, 4);
  const right = Math.min(r.right, window.innerWidth - 4);
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

export type GuideStep = {
  id: string;
  emoji: string;
  title: string;
  body: string;
  find: () => HTMLElement | null;
  /** Bring it on screen first (the phone tab bar scrolls sideways). */
  reveal?: boolean;
};

export function tourSteps(isMobile: boolean, hackathon: boolean): GuideStep[] {
  const tap = isMobile ? "Tap" : "Click";
  const steps: GuideStep[] = [
    { id: "page", emoji: "✍️", title: "This is your resume", body: isMobile ? "Tap any text to edit it. Pinch to zoom in." : "Click any text to edit it right on the page.", find: resumePage },
    { id: "section", emoji: "➕", title: "Add sections", body: "Experience, projects, skills, certificates — add what you need.", find: () => studioButton(isMobile ? "Section" : "Insert section"), reveal: true },
    { id: "fix", emoji: "📊", title: "Check your ATS score", body: `See what screening software flags. ${tap} an issue to jump to it on the page.`, find: () => studioButton("ATS score"), reveal: true },
    { id: "ai", emoji: "✨", title: "Stuck on a line?", body: "AI Coach rewrites weak bullets and answers questions.", find: () => studioButton("AI Coach"), reveal: true },
    { id: "templates", emoji: "🎨", title: "Change the look any time", body: isMobile ? "Swap designs any time — your content stays." : "Swap templates in Designs, colours and fonts in Style — your content stays.", find: () => studioButton("Designs"), reveal: true },
  ];
  steps.push(
    hackathon
      ? { id: "submit", emoji: "🏁", title: "Submit when ready", body: `${tap} Submit to Hackathon — you can update it later.`, find: () => hackathonSubmitButton() ?? exportButton() }
      : { id: "export", emoji: "📄", title: "Download when ready", body: "Get a recruiter-ready PDF any time.", find: exportButton },
  );
  return steps;
}
