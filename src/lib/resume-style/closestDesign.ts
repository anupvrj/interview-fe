/**
 * Our designs ordered by how close they are to someone's old resume (PDF upload), with the
 * closest one to preselect. Free in the browser; one small AI call only when the free reading
 * isn't sure. Never blocks the flow: any failure just keeps the usual order.
 */
import { resumeApi } from "@/lib/api";
import { mergeDesignStyles, rankDesigns, type DesignStyle } from "./designStyle";
import { readResumeDesign } from "./pdfDesign";
import fingerprints from "./template-fingerprints.json";

/** Out of ~14.5: below this nothing is really alike, so no design is called "closest". */
const MIN_SCORE = 8;

export type ClosestDesigns = {
  /** Template ids, closest first. */
  order: string[];
  /** Preselected and badged; null when nothing is close enough. */
  closest: string | null;
  style: DesignStyle;
  usedAi: boolean;
};

export async function findClosestDesigns(file: File, templateIds: string[]): Promise<ClosestDesigns> {
  const reading = await readResumeDesign(file);
  let style = reading.style;
  let usedAi = false;
  if (!reading.confident && reading.image) {
    try {
      style = mergeDesignStyles(reading.style, await resumeApi.designFeatures(reading.image));
      usedAi = true;
    } catch {
      // the free reading is still a good guess
    }
  }
  const ranked = rankDesigns(style, templateIds, fingerprints as Record<string, DesignStyle>);
  const top = ranked[0];
  return {
    order: ranked.map((r) => r.templateId),
    closest: top && top.score >= MIN_SCORE ? top.templateId : null,
    style,
    usedAi,
  };
}
