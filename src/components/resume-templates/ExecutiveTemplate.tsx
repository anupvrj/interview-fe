/**
 * Executive Resume Template Component
 * Clean, professional design with thick underlines and simple icons
 * Matches the executive-template-design.webp
 */

import { useState, useEffect, useRef } from "react";
import { Resume } from "@/lib/api";

interface ExecutiveTemplateProps {
  resume: Resume;
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

interface PageBreak {
  sections: string[]; // Section IDs on this page
}

export function ExecutiveTemplate({ resume, padding }: ExecutiveTemplateProps) {
  const content: any = resume.content;
  const personalInfo = content.personalInfo;
  const [pages, setPages] = useState<PageBreak[]>([{ sections: [] }]);
  const measureRef = useRef<HTMLDivElement>(null);
  const visibleContainerRef = useRef<HTMLDivElement>(null);

  // Default padding (in mm, converted to px: 1mm ≈ 3.78px at 96dpi)
  const defaultPadding = padding || {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  };
  const paddingPx = {
    top: defaultPadding.top * 3.78,
    bottom: defaultPadding.bottom * 3.78,
    left: defaultPadding.left * 3.78,
    right: defaultPadding.right * 3.78,
  };

  // Helper to render rich text HTML safely
  const renderHTML = (html: string) => {
    return { __html: html };
  };

  // Get sections from resume content - handle both old and new data structures
  const getSectionContent = (type: string) => {
    // New structure: sections array
    if (content.sections && Array.isArray(content.sections)) {
      return content.sections.find((s: any) => s.type === type);
    }
    // Old structure: direct properties
    return null;
  };

  // Get data from old structure (top-level properties)
  const getOldStructureData = (key: string) => {
    return content[key];
  };

  // Get all available sections from content
  const getSectionsToRender = () => {
    const sections: string[] = [];

    // Check for profile summary
    const profileSection = getSectionContent("profileSummary");
    const oldProfileSummary = getOldStructureData("profileSummary");
    if (profileSection?.content || oldProfileSummary) {
      sections.push("profileSummary");
    }

    // Check for work experience
    const expSection = getSectionContent("workExperience");
    const oldExperience = getOldStructureData("experience");
    if (
      (expSection?.items && expSection.items.length > 0) ||
      (oldExperience && oldExperience.length > 0)
    ) {
      sections.push("workExperience");
    }

    // Check for education
    const eduSection = getSectionContent("education");
    const oldEducation = getOldStructureData("education");
    if (
      (eduSection?.items && eduSection.items.length > 0) ||
      (oldEducation && oldEducation.length > 0)
    ) {
      sections.push("education");
    }

    // Check for skills
    const skillsSection = getSectionContent("skills");
    const oldSkills = getOldStructureData("skills");
    if (
      (skillsSection?.items && skillsSection.items.length > 0) ||
      oldSkills?.technical
    ) {
      sections.push("skills");
    }

    // Check for languages
    const langSection = getSectionContent("languages");
    if (
      (langSection?.items && langSection.items.length > 0) ||
      (oldSkills?.languages && oldSkills.languages.length > 0)
    ) {
      sections.push("languages");
    }

    // Check for certifications
    const certSection = getSectionContent("certifications");
    const oldCertificates = getOldStructureData("certificates");
    if (
      (certSection?.items && certSection.items.length > 0) ||
      (oldCertificates && oldCertificates.length > 0)
    ) {
      sections.push("certifications");
    }

    // Check for awards
    const awardsSection = getSectionContent("awards");
    const oldAwards = getOldStructureData("awards");
    if (
      (awardsSection?.items && awardsSection.items.length > 0) ||
      (oldAwards && oldAwards.length > 0)
    ) {
      sections.push("awards");
    }

    // Check for quote
    const quoteSection = content.sections?.find(
      (s: any) =>
        s.type === "quote" || s.title?.toLowerCase().includes("quote"),
    );
    const oldQuote = getOldStructureData("quote");
    if ((quoteSection?.items && quoteSection.items.length > 0) || oldQuote) {
      sections.push("quote");
    }

    return sections;
  };

  const allSections = getSectionsToRender();

  // Calculate page breaks based on content height
  useEffect(() => {
    const calculatePages = () => {
      // Use visible container first for accurate measurements, fallback to hidden
      const container = visibleContainerRef.current || measureRef.current;
      if (!container) {
        console.log("⚠️ Container not found");
        return;
      }

      const sectionElements = container.querySelectorAll("[data-section]");
      if (sectionElements.length === 0) {
        console.log("⚠️ No sections found, will retry");
        return;
      }

      // A4 page height in pixels (297mm at 96dpi)
      const PAGE_HEIGHT_MM = 297;
      const MM_TO_PX = 3.7795275591;
      const PAGE_HEIGHT_PX = PAGE_HEIGHT_MM * MM_TO_PX;

      const availableHeight = PAGE_HEIGHT_PX - paddingPx.top - paddingPx.bottom;

      const headerElement = container.querySelector("[data-section='header']");
      const headerHeight = headerElement?.getBoundingClientRect().height || 0;

      console.log("📐 Calculating pages:", {
        totalSections: sectionElements.length - 1,
        headerHeight: Math.round(headerHeight),
        availableHeight: Math.round(availableHeight),
        pageHeightPx: Math.round(PAGE_HEIGHT_PX),
        paddingTop: paddingPx.top,
        paddingBottom: paddingPx.bottom,
        allSections,
      });

      let currentHeight = headerHeight + 12; // Header + margin
      let currentPage: string[] = [];
      const calculatedPages: PageBreak[] = [];

      sectionElements.forEach((element) => {
        const sectionId = element.getAttribute("data-section");
        if (!sectionId || sectionId === "header") return;

        const sectionHeight = element.getBoundingClientRect().height;
        console.log(
          `  📄 Section "${sectionId}": ${Math.round(
            sectionHeight,
          )}px, current: ${Math.round(currentHeight)}px`,
        );

        // Check if section fits on current page (with buffer for safety)
        const buffer = 5;
        if (
          currentHeight + sectionHeight + buffer > availableHeight &&
          currentPage.length > 0
        ) {
          // Save current page and start new one
          calculatedPages.push({ sections: [...currentPage] });
          console.log(
            `  ✅ Page ${calculatedPages.length} completed with sections:`,
            currentPage,
          );

          currentPage = [sectionId];
          currentHeight = sectionHeight + 12; // Reset height with new section
        } else {
          currentPage.push(sectionId);
          currentHeight += sectionHeight + 12; // Add section + gap
        }
      });

      // Add last page
      if (currentPage.length > 0) {
        calculatedPages.push({ sections: [...currentPage] });
        console.log(
          `  ✅ Final page ${calculatedPages.length} with sections:`,
          currentPage,
        );
      }

      // If no pages calculated, show all sections on one page
      const finalPages =
        calculatedPages.length > 0
          ? calculatedPages
          : [{ sections: allSections }];
      setPages(finalPages);
      console.log(
        `✨ Executive template: ${finalPages.length} page(s) calculated`,
      );
    };

    // Multiple calculation attempts to catch proper layout
    const timeout1 = setTimeout(calculatePages, 200);
    const timeout2 = setTimeout(calculatePages, 600);
    const timeout3 = setTimeout(calculatePages, 1200);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [resume, padding, paddingPx, allSections]);

  // Render a single section by type
  const renderSection = (sectionType: string) => {
    switch (sectionType) {
      case "profileSummary":
        return renderProfileSection();
      case "workExperience":
        return renderExperienceSection();
      case "education":
        return renderEducationSection();
      case "skills":
        return renderSkillsSection();
      case "languages":
        return renderLanguagesSection();
      case "certifications":
        return renderCertificationsSection();
      case "awards":
        return renderAwardsSection();
      case "quote":
        return renderQuoteSection();
      default:
        return null;
    }
  };

  return (
    <>
      {/* Hidden measurement container - must match exact styling of visible pages */}
      <div
        ref={measureRef}
        style={{
          position: "fixed",
          top: "-10000px",
          left: "-10000px",
          width: "210mm",
          minHeight: "297mm",
          visibility: "hidden",
          pointerEvents: "none",
          background: "#ffffff",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "10pt",
          lineHeight: "1.4",
          color: "#000000",
          padding: `${paddingPx.top}px ${paddingPx.right}px ${paddingPx.bottom}px ${paddingPx.left}px`,
          boxSizing: "border-box",
          zIndex: -9999,
        }}
      >
        <div data-section="header">{renderHeaderSection()}</div>
        {allSections.map((sectionType, idx) => (
          <div key={`measure-${sectionType}-${idx}`} data-section={sectionType}>
            {renderSection(sectionType)}
          </div>
        ))}
      </div>

      {/* Actual rendered pages */}
      {pages.map((page, pageIndex) => (
        <div
          key={pageIndex}
          ref={pageIndex === 0 ? visibleContainerRef : undefined}
          id={
            pageIndex === 0
              ? "resume-preview-container"
              : `resume-preview-page-${pageIndex + 1}`
          }
          className="shadow-2xl"
          style={{
            width: "210mm",
            minHeight: "297mm",
            maxHeight: "297mm",
            background: "#ffffff",
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: "10pt",
            lineHeight: "1.4",
            color: "#000000",
            padding: `${paddingPx.top}px ${paddingPx.right}px ${paddingPx.bottom}px ${paddingPx.left}px`,
            marginBottom: pageIndex < pages.length - 1 ? "20px" : "0",
            boxSizing: "border-box",
          }}
        >
          {/* Header only on first page */}
          {pageIndex === 0 && (
            <div data-section="header">{renderHeaderSection()}</div>
          )}

          {/* Sections for this page */}
          {page.sections.map((sectionType, idx) => (
            <div key={`${sectionType}-${idx}`} data-section={sectionType}>
              {renderSection(sectionType)}
            </div>
          ))}
        </div>
      ))}
    </>
  );

  // --- Section Renderers ---

  function renderHeaderSection() {
    return (
      <div style={{ marginBottom: "12px" }} data-section="header">
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          {personalInfo.fullName && (
            <h1
              style={{
                fontSize: "28pt",
                fontWeight: "bold",
                color: "#000000",
                margin: 0,
              }}
            >
              {personalInfo.fullName}
            </h1>
          )}
          {personalInfo.portfolio && (
            <div
              style={{
                fontSize: "20pt",
                fontStyle: "italic",
                color: "#000000",
              }}
            >
              {personalInfo.portfolio}
            </div>
          )}
        </div>

        {/* Contact Info - 2 columns, simple icons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px 20px",
            fontSize: "10pt",
          }}
        >
          {personalInfo.location && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "10pt" }}>📍</span>
              <span>{personalInfo.location}</span>
            </div>
          )}
          {personalInfo.email && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "10pt" }}>✉️</span>
              <span>{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "10pt" }}>📞</span>
              <span>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.linkedin && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "10pt" }}>🔗</span>
              <span>
                {personalInfo.linkedin.replace(
                  /^https?:\/\/(www\.)?linkedin\.com\/in\//,
                  "",
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderProfileSection() {
    const profileSection = getSectionContent("profileSummary");
    const oldProfileSummary = getOldStructureData("profileSummary");

    const profileContent = profileSection?.content || oldProfileSummary;
    if (!profileContent) return null;

    return (
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "12pt",
            fontWeight: "bold",
            marginBottom: "6px",
            paddingBottom: "2px",
            borderBottom: "3px solid #000000",
          }}
        >
          {profileSection?.title || "Profile"}
        </div>
        <div
          style={{ textAlign: "justify", lineHeight: "1.4" }}
          dangerouslySetInnerHTML={renderHTML(profileContent)}
        />
      </div>
    );
  }

  function renderExperienceSection() {
    const expSection = getSectionContent("workExperience");
    const oldExperience = getOldStructureData("experience");

    const expItems = expSection?.items || oldExperience;
    if (!expItems || expItems.length === 0) return null;

    return (
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "12pt",
            fontWeight: "bold",
            marginBottom: "6px",
            paddingBottom: "2px",
            borderBottom: "3px solid #000000",
          }}
        >
          {expSection?.title || "Professional Experience"}
        </div>
        {expItems.map((item: any, index: number) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: "15px",
              marginBottom: "6px",
            }}
          >
            <div style={{ fontSize: "10pt" }}>
              <div style={{ fontWeight: "normal", marginBottom: "2px" }}>
                {item.startDate && (
                  <>
                    {new Date(item.startDate).toLocaleDateString("en-US", {
                      month: "2-digit",
                      year: "numeric",
                    })}{" "}
                    –{" "}
                    {item.endDate
                      ? new Date(item.endDate).toLocaleDateString("en-US", {
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "Present"}
                  </>
                )}
              </div>
              {item.location && (
                <div style={{ color: "#333333", fontSize: "9pt" }}>
                  {item.location}
                </div>
              )}
            </div>
            <div style={{ fontSize: "10pt" }}>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "11pt",
                  marginBottom: "2px",
                }}
              >
                {item.title || item.position}
              </div>
              {(item.organization || item.company) && (
                <div
                  style={{
                    fontStyle: "italic",
                    color: "#333333",
                    marginBottom: "4px",
                  }}
                >
                  {item.organization || item.company}
                </div>
              )}
              {item.description && (
                <div dangerouslySetInnerHTML={renderHTML(item.description)} />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderEducationSection() {
    const eduSection = getSectionContent("education");
    const oldEducation = getOldStructureData("education");

    const eduItems = eduSection?.items || oldEducation;
    if (!eduItems || eduItems.length === 0) return null;

    return (
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "12pt",
            fontWeight: "bold",
            marginBottom: "6px",
            paddingBottom: "2px",
            borderBottom: "3px solid #000000",
          }}
        >
          {eduSection?.title || "Education"}
        </div>
        {eduItems.map((item: any, index: number) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: "15px",
              marginBottom: "6px",
            }}
          >
            <div style={{ fontSize: "10pt" }}>
              <div style={{ fontWeight: "normal", marginBottom: "2px" }}>
                {item.startDate && (
                  <>
                    {new Date(item.startDate).toLocaleDateString("en-US", {
                      month: "2-digit",
                      year: "numeric",
                    })}{" "}
                    –{" "}
                    {item.endDate
                      ? new Date(item.endDate).toLocaleDateString("en-US", {
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "Present"}
                  </>
                )}
              </div>
              {item.location && (
                <div style={{ color: "#333333", fontSize: "9pt" }}>
                  {item.location}
                </div>
              )}
            </div>
            <div style={{ fontSize: "10pt" }}>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "11pt",
                  marginBottom: "2px",
                }}
              >
                {item.degree || item.title}
                {item.gpa && (
                  <span style={{ fontWeight: "normal" }}>
                    {" "}
                    (CGPA: {item.gpa})
                  </span>
                )}
                {item.percentage && (
                  <span style={{ fontWeight: "normal" }}>
                    {" "}
                    (Percentage: {item.percentage})
                  </span>
                )}
              </div>
              {(item.institution || item.organization) && (
                <div
                  style={{
                    fontStyle: "italic",
                    color: "#333333",
                  }}
                >
                  {item.institution || item.organization}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderSkillsSection() {
    const skillsSection = getSectionContent("skills");
    const oldSkills = getOldStructureData("skills");

    let skillItems: any[] = [];

    // New structure
    if (skillsSection?.items && skillsSection.items.length > 0) {
      skillItems = skillsSection.items;
    }
    // Old structure - parse from HTML string
    else if (oldSkills?.technical) {
      const skillsText =
        typeof oldSkills.technical === "string"
          ? oldSkills.technical.replace(/<[^>]*>/g, "") // Strip HTML
          : "";

      // Split by newlines and create items
      const skills = skillsText.split("\n").filter((s: string) => s.trim());
      skillItems = skills.map((skill: string) => ({
        name: skill.trim(),
        level: 4, // Default level
      }));
    }

    if (!skillItems || skillItems.length === 0) return null;

    return (
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "12pt",
            fontWeight: "bold",
            marginBottom: "6px",
            paddingBottom: "2px",
            borderBottom: "3px solid #000000",
          }}
        >
          {skillsSection?.title || "Skills"}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px 20px",
          }}
        >
          {skillItems.map((item: any, index: number) => {
            const level = item.level || 3;
            const maxDots = 5;
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1, fontSize: "10pt" }}>
                  {item.name || item.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "3px",
                    marginLeft: "10px",
                  }}
                >
                  {Array.from({ length: maxDots }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: i < level ? "#000000" : "#666666",
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderLanguagesSection() {
    const langSection = getSectionContent("languages");
    const oldSkills = getOldStructureData("skills");

    let langItems: any[] = [];

    // New structure
    if (langSection?.items && langSection.items.length > 0) {
      langItems = langSection.items;
    }
    // Old structure
    else if (oldSkills?.languages && Array.isArray(oldSkills.languages)) {
      langItems = oldSkills.languages.map((lang: string) => ({
        name: lang,
      }));
    }

    if (!langItems || langItems.length === 0) return null;

    return (
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "12pt",
            fontWeight: "bold",
            marginBottom: "6px",
            paddingBottom: "2px",
            borderBottom: "3px solid #000000",
          }}
        >
          {langSection?.title || "Languages"}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "6px",
          }}
        >
          {langItems.map((item: any, index: number) => (
            <div key={index} style={{ fontSize: "10pt" }}>
              • {item.name || item.title || item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderCertificationsSection() {
    const certSection = getSectionContent("certifications");
    const oldCertificates = getOldStructureData("certificates");

    const certItems = certSection?.items || oldCertificates;
    if (!certItems || certItems.length === 0) return null;

    return (
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "12pt",
            fontWeight: "bold",
            marginBottom: "6px",
            paddingBottom: "2px",
            borderBottom: "3px solid #000000",
          }}
        >
          {certSection?.title || "Certifications"}
        </div>
        {certItems.map((item: any, index: number) => (
          <div key={index} style={{ marginBottom: "6px" }}>
            <div style={{ fontWeight: "bold", fontSize: "10pt" }}>
              {item.title || item.name}
            </div>
            {(item.issuer || item.organization) && (
              <div
                style={{
                  fontStyle: "italic",
                  color: "#333333",
                  fontSize: "9pt",
                }}
              >
                {item.issuer || item.organization}
              </div>
            )}
            {(item.date || item.issueDate) && (
              <div
                style={{
                  color: "#666666",
                  fontSize: "9pt",
                }}
              >
                {new Date(item.date || item.issueDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "2-digit",
                    year: "numeric",
                  },
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderAwardsSection() {
    const awardsSection = getSectionContent("awards");
    const oldAwards = getOldStructureData("awards");

    const awardItems = awardsSection?.items || oldAwards;
    if (!awardItems || awardItems.length === 0) return null;

    return (
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "12pt",
            fontWeight: "bold",
            marginBottom: "6px",
            paddingBottom: "2px",
            borderBottom: "3px solid #000000",
          }}
        >
          {awardsSection?.title || "Awards"}
        </div>
        {awardItems.map((item: any, index: number) => (
          <div key={index} style={{ marginBottom: "6px" }}>
            <div style={{ fontWeight: "bold", fontSize: "10pt" }}>
              {item.title || item.name}
            </div>
            {(item.issuer || item.organization) && (
              <div
                style={{
                  fontStyle: "italic",
                  color: "#333333",
                  fontSize: "9pt",
                }}
              >
                {item.issuer || item.organization}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderQuoteSection() {
    const quoteSection = content.sections?.find(
      (s: any) =>
        s.type === "quote" || s.title?.toLowerCase().includes("quote"),
    );
    const oldQuote = getOldStructureData("quote");

    let quote = null;
    if (quoteSection && quoteSection.items && quoteSection.items.length > 0) {
      quote = quoteSection.items[0];
    } else if (oldQuote) {
      quote = oldQuote;
    }

    if (!quote) return null;

    return (
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "12pt",
            fontWeight: "bold",
            marginBottom: "6px",
            paddingBottom: "2px",
            borderBottom: "3px solid #000000",
          }}
        >
          {quoteSection?.title || "Favorite Quote"}
        </div>
        {(quote.author || quote.name) && (
          <div
            style={{
              fontWeight: "bold",
              fontSize: "10pt",
              marginBottom: "3px",
            }}
          >
            {quote.author || quote.name}
          </div>
        )}
        {(quote.text || quote.description) && (
          <div
            style={{
              fontStyle: "italic",
              color: "#333333",
              lineHeight: "1.4",
            }}
          >
            {quote.text || quote.description}
          </div>
        )}
      </div>
    );
  }
}
