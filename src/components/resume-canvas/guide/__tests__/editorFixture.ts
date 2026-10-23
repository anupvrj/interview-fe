/** A stand-in for the editor's DOM: the buttons the guide looks for, with fake layout. */
export function mountEditorFixture({ hackathon = false, withoutCoach = false } = {}): void {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div id="editor-fixture">
      <a href="/dashboard/resumes" data-editor-back>←</a>
      <button id="export"><svg class="lucide-download"></svg>Export</button>
      <div class="resume-page"></div>
      <nav aria-label="Resume studio">
        <button>Outline</button><button>ATS score</button><button>Job match</button>
        ${withoutCoach ? "" : "<button>AI Coach</button>"}<button>Designs</button>
        <button aria-label="Insert section"></button>
      </nav>
      ${hackathon ? "<button>Submit to Hackathon</button>" : ""}
    </div>`,
  );
}

/** jsdom has no layout: give every element a box so the guide treats it as on screen. */
export function fakeLayout(): () => void {
  const rects = Element.prototype.getClientRects;
  const box = Element.prototype.getBoundingClientRect;
  Element.prototype.getClientRects = () => [{}] as unknown as DOMRectList;
  Element.prototype.getBoundingClientRect = () =>
    ({ left: 10, top: 20, width: 60, height: 40, right: 70, bottom: 60, x: 10, y: 20, toJSON: () => ({}) }) as DOMRect;
  return () => {
    Element.prototype.getClientRects = rects;
    Element.prototype.getBoundingClientRect = box;
  };
}
