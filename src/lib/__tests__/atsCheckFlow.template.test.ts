// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const update = vi.fn();
const build = vi.fn();
vi.mock("@/lib/api", () => ({
  atsGuestApi: {},
  isATSReportV3: () => true,
  resumeApi: { get: (...a: unknown[]) => get(...a), update: (...a: unknown[]) => update(...a) },
  resumeDataExtractionApi: {},
}));
vi.mock("@/lib/applyResumeTemplate", () => ({ buildResumeTemplateApplication: (...a: unknown[]) => build(...a) }));
vi.mock("@/lib/pdf-utils", () => ({ extractTextFromPDF: vi.fn() }));
vi.mock("@/lib/pdf-snapshot", () => ({ sha256OfFile: vi.fn() }));
vi.mock("@/lib/query-client", () => ({ getQueryClient: vi.fn() }));
vi.mock("@/lib/invalidate-queries", () => ({ invalidateResumes: vi.fn() }));
vi.mock("@/lib/atsReportNormalize", () => ({ applyPersistedJobMatchScore: vi.fn() }));
vi.mock("@/lib/resume-data-import", () => ({ mapExtractedSectionsToContent: vi.fn(), sectionOrderForExtractedContent: vi.fn() }));

import { applyGuestATSTemplate, ATS_RESUME_TEMPLATE_ID, rememberGuestATSTemplate } from "../atsCheckFlow";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("applyGuestATSTemplate", () => {
  it("opens the claimed resume in the design they tried on, once", async () => {
    const resume = { content: {}, sectionOrder: [] };
    const application = { templateId: "harvard", sectionOrder: [], layout: {} };
    get.mockResolvedValue(resume);
    build.mockResolvedValue(application);
    rememberGuestATSTemplate("harvard");

    await applyGuestATSTemplate("res_1");
    expect(build).toHaveBeenCalledWith("harvard", resume);
    expect(update).toHaveBeenCalledWith("res_1", application);

    await applyGuestATSTemplate("res_1");
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("changes nothing when they stayed on the default design or picked nothing", async () => {
    await applyGuestATSTemplate("res_1");
    rememberGuestATSTemplate(ATS_RESUME_TEMPLATE_ID);
    await applyGuestATSTemplate("res_1");
    expect(update).not.toHaveBeenCalled();
  });

  it("still opens the resume if applying the design fails", async () => {
    get.mockRejectedValue(new Error("down"));
    rememberGuestATSTemplate("harvard");
    await expect(applyGuestATSTemplate("res_1")).resolves.toBeUndefined();
  });
});
