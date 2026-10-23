// @vitest-environment jsdom
import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useResumePreviewPinchZoom } from "../useResumePreviewPinchZoom";
import { act, cleanup, render } from "@/test-utils/render";

afterEach(cleanup);

const zooms: number[] = [];
function Harness() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(50);
  useResumePreviewPinchZoom({
    containerRef,
    contentRef,
    zoomLevel: zoom,
    onZoom: (z) => {
      zooms.push(z);
      setZoom(z);
    },
    minZoom: 30,
    maxZoom: 200,
  });
  return (
    <div ref={containerRef} id="scroller">
      <div ref={contentRef} id="content" data-zoom={zoom} />
    </div>
  );
}

function touch(target: Element, type: string, points: Array<[number, number]>) {
  const touches = points.map(([clientX, clientY], identifier) => ({ identifier, clientX, clientY, target }));
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", { value: touches });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

describe("pinch zoom on the resume preview", () => {
  it("previews with a transform while pinching, then applies the zoom once on release", async () => {
    zooms.length = 0;
    render(<Harness />);
    const scroller = document.getElementById("scroller")!;
    const content = document.getElementById("content")!;
    scroller.getBoundingClientRect = () => ({ left: 0, top: 0, width: 375, height: 700, right: 375, bottom: 700 }) as DOMRect;
    content.getBoundingClientRect = () => ({ left: 0, top: 0, width: 375, height: 1000, right: 375, bottom: 1000 }) as DOMRect;
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    touch(scroller, "touchstart", [[150, 300], [210, 300]]); // 60px apart, midpoint (180, 300)
    const move = touch(scroller, "touchmove", [[120, 300], [240, 300]]); // 120px apart → 2×
    expect(move.defaultPrevented).toBe(true); // the browser's own page zoom is blocked
    expect(content.style.transform).toContain("scale(2)");
    expect(content.style.transformOrigin).toBe("180px 300px");
    expect(zooms).toEqual([]); // no React zoom updates mid-gesture (that's what made it janky)

    touch(scroller, "touchend", []);
    expect(zooms).toEqual([100]); // 50% × 2, once
    expect(content.style.transform).toBe("");
    // The pinched spot (180, 300) stays under the fingers: content point × 2 − finger position.
    expect(scroller.scrollLeft).toBe(180);
    expect(scroller.scrollTop).toBe(300);
    raf.mockRestore();
  });

  it("clamps to the allowed range and ignores one-finger drags", () => {
    zooms.length = 0;
    render(<Harness />);
    const scroller = document.getElementById("scroller")!;
    scroller.getBoundingClientRect = () => ({ left: 0, top: 0, width: 375, height: 700 }) as DOMRect;
    touch(scroller, "touchstart", [[100, 100]]);
    const drag = touch(scroller, "touchmove", [[120, 100]]);
    expect(drag.defaultPrevented).toBe(false);
    touch(scroller, "touchstart", [[180, 300], [190, 300]]);
    touch(scroller, "touchmove", [[100, 300], [270, 300]]); // 17× → clamped to 200%
    touch(scroller, "touchend", []);
    expect(zooms).toEqual([200]);
  });
});
