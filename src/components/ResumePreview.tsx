/**
 * Resume Preview Component
 * Renders a visual preview of the resume matching the template design
 */

import { useState } from "react";
import { Resume, ResumeTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface Section {
  id: string;
  type:
    | "personalInfo"
    | "profileSummary"
    | "experience"
    | "education"
    | "skills"
    | "projects"
    | "achievements"
    | "languages"
    | "certificates"
    | "interests"
    | "courses"
    | "awards"
    | "organisations"
    | "publications"
    | "references"
    | "declaration";
  title: string;
  visible: boolean;
  expanded?: boolean;
  column?: "left" | "right"; // For double column layout
}

interface ResumePreviewProps {
  resume: Resume;
  template?: ResumeTemplate;
  sections?: Section[];
  layout?: {
    type: "single" | "double";
    columnWidths?: {
      left: number;
      right: number;
    };
  };
}

export function ResumePreview({
  resume,
  template,
  sections,
  layout,
}: ResumePreviewProps) {
  const [zoomLevel, setZoomLevel] = useState(100);

  // Use provided template or show placeholder
  const resumeTemplate = template;

  if (!resumeTemplate) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50">
        <div className="text-center">
          <p className="text-sm">Loading template...</p>
        </div>
      </div>
    );
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 200)); // Max 200%
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50)); // Min 50%
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const colors = resumeTemplate.colors;
  const templateLayout = resumeTemplate.layout;
  const personalInfo = resume.content.personalInfo;

  // Default sections if not provided
  const defaultSections: Section[] = [
    {
      id: "personalInfo",
      type: "personalInfo",
      title: "Personal Information",
      visible: true,
    },
    {
      id: "profileSummary",
      type: "profileSummary",
      title: "Profile Summary",
      visible: true,
    },
    {
      id: "experience",
      type: "experience",
      title: "Experience",
      visible: true,
    },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "skills", type: "skills", title: "Skills", visible: true },
    { id: "projects", type: "projects", title: "Projects", visible: true },
    {
      id: "achievements",
      type: "achievements",
      title: "Achievements",
      visible: true,
    },
  ];

  const displaySections = sections || defaultSections;
  const resumeLayout = layout ||
    resume.layout || {
      type: "single",
      columnWidths: { left: 60, right: 40 },
      padding: { top: 10, bottom: 10, left: 10, right: 10 },
    };

  // Separate header (personalInfo) from other sections
  const getHeaderAndBodySections = () => {
    const visibleSections = displaySections.filter((s) => s.visible);
    const headerSection = visibleSections.find(
      (s) => s.type === "personalInfo"
    );
    // Profile Summary and all other sections go into body (columns)
    const bodySections = visibleSections.filter(
      (s) => s.type !== "personalInfo"
    );

    if (resumeLayout.type === "double") {
      const leftColumn: Section[] = [];
      const rightColumn: Section[] = [];

      // Use explicit column assignment if available, otherwise use smart defaults
      bodySections.forEach((section) => {
        if (section.column === "right") {
          rightColumn.push(section);
        } else if (section.column === "left") {
          leftColumn.push(section);
        } else if (
          section.type === "skills" ||
          section.type === "education" ||
          section.type === "achievements" ||
          section.type === "languages" ||
          section.type === "certificates" ||
          section.type === "interests" ||
          section.type === "awards" ||
          section.type === "references"
        ) {
          // Default: Smaller sections go right
          rightColumn.push(section);
        } else {
          // Default: Larger sections (experience, projects, profileSummary, courses, organisations, publications, declaration) go left
          leftColumn.push(section);
        }
      });

      return { headerSection, leftColumn, rightColumn };
    }

    return { headerSection, leftColumn: bodySections, rightColumn: [] };
  };

  // Helper function to render section content with custom title
  const renderSectionContent = (section: Section) => {
    const sectionTitle = section.title; // Use custom title from section
    switch (section.type) {
      case "personalInfo":
        return (
          <>
            {/* Header Section - Matching CV Style */}
            <div style={{ marginBottom: "8px" }}>
              {/* Name */}
              {personalInfo.fullName && (
                <h1
                  style={{
                    fontSize: "28px",
                    color: "#000000",
                    fontWeight: "700",
                    lineHeight: "1.1",
                    marginBottom: "4px",
                  }}
                >
                  {personalInfo.fullName}
                </h1>
              )}
              {/* Title */}
              {personalInfo.portfolio && (
                <p
                  style={{
                    fontSize: "16px",
                    color: "#000000",
                    fontWeight: "400",
                    marginBottom: "8px",
                  }}
                >
                  {personalInfo.portfolio}
                </p>
              )}
              {/* Contact Info - Table-based for better PDF rendering */}
              <div
                style={{
                  fontSize: "11px",
                  color: "#000000",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    margin: 0,
                    padding: 0,
                  }}
                >
                  <tbody>
                    <tr>
                      {personalInfo.email && (
                        <td
                          style={{
                            padding: "2px 12px 2px 0",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <svg
                            style={{
                              width: "14px",
                              height: "14px",
                              display: "inline-block",
                              verticalAlign: "text-bottom",
                              marginRight: "4px",
                            }}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <a
                            href={`mailto:${personalInfo.email}`}
                            style={{
                              color: "#000000",
                              textDecoration: "none",
                              display: "inline",
                            }}
                          >
                            {personalInfo.email}
                          </a>
                        </td>
                      )}
                      {personalInfo.phone && (
                        <td
                          style={{
                            padding: "2px 12px",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <svg
                            style={{
                              width: "14px",
                              height: "14px",
                              display: "inline-block",
                              verticalAlign: "text-bottom",
                              marginRight: "4px",
                            }}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          <a
                            href={`tel:${personalInfo.phone}`}
                            style={{
                              color: "#000000",
                              textDecoration: "none",
                              display: "inline",
                            }}
                          >
                            {personalInfo.phone}
                          </a>
                        </td>
                      )}
                      {personalInfo.location && (
                        <td
                          style={{
                            padding: "2px 12px",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <svg
                            style={{
                              width: "14px",
                              height: "14px",
                              display: "inline-block",
                              verticalAlign: "text-bottom",
                              marginRight: "4px",
                            }}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span
                            style={{
                              color: "#000000",
                              display: "inline",
                            }}
                          >
                            {personalInfo.location}
                          </span>
                        </td>
                      )}
                      {personalInfo.github && (
                        <td
                          style={{
                            padding: "2px 12px",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <svg
                            style={{
                              width: "14px",
                              height: "14px",
                              display: "inline-block",
                              verticalAlign: "text-bottom",
                              marginRight: "4px",
                            }}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                          <a
                            href={
                              personalInfo.github.startsWith("http")
                                ? personalInfo.github
                                : `https://github.com/${personalInfo.github}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#000000",
                              textDecoration: "none",
                              display: "inline",
                            }}
                          >
                            {personalInfo.github}
                          </a>
                        </td>
                      )}
                      {personalInfo.linkedin && (
                        <td
                          style={{
                            padding: "2px 12px",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <svg
                            style={{
                              width: "14px",
                              height: "14px",
                              display: "inline-block",
                              verticalAlign: "text-bottom",
                              marginRight: "4px",
                            }}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          <a
                            href={
                              personalInfo.linkedin.startsWith("http")
                                ? personalInfo.linkedin
                                : `https://linkedin.com/in/${personalInfo.linkedin}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#000000",
                              textDecoration: "none",
                              display: "inline",
                            }}
                          >
                            {personalInfo.linkedin}
                          </a>
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );

      case "profileSummary":
        return (
          <>
            {resume.content.profileSummary && (
              <div style={{ marginBottom: "8px" }}>
                <h2
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#000000",
                    textAlign: "center",
                    borderTop: "1px solid #000000",
                    borderBottom: "1px solid #000000",
                    margin: "0 0 6px 0",
                    lineHeight: "26px",
                    height: "26px",
                    display: "block",
                  }}
                >
                  {sectionTitle}
                </h2>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#000000",
                    lineHeight: "1.4",
                    textAlign: "justify",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: resume.content.profileSummary || "",
                  }}
                />
              </div>
            )}
          </>
        );

      case "experience":
        return (
          resume.content.experience.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <div className="space-y-4">
                {resume.content.experience.map((exp) => (
                  <div
                    key={exp.id || `exp-${exp.position}-${exp.company}`}
                    className="mb-4"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3
                          className="font-semibold"
                          style={{
                            fontSize: `${templateLayout.fontSize.body + 1}px`,
                            color: colors.text,
                          }}
                        >
                          {exp.position}
                          {exp.company && (
                            <span className="font-normal">
                              {" "}
                              at {exp.company}
                            </span>
                          )}
                        </h3>
                      </div>
                      <span
                        className="text-sm"
                        style={{
                          fontSize: `${templateLayout.fontSize.body - 1}px`,
                          color: colors.secondary,
                        }}
                      >
                        {exp.current
                          ? `${exp.startDate} - Present`
                          : `${exp.startDate}${
                              exp.endDate ? ` - ${exp.endDate}` : ""
                            }`}
                      </span>
                    </div>
                    {exp.description && (
                      <div
                        className="prose prose-sm max-w-none"
                        style={{
                          fontSize: `${templateLayout.fontSize.body}px`,
                          color: colors.text,
                          marginLeft: 0,
                          paddingLeft: 0,
                        }}
                        dangerouslySetInnerHTML={{
                          __html: Array.isArray(exp.description)
                            ? exp.description.map((d) => `<p>${d}</p>`).join("")
                            : exp.description || "",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        );

      case "education":
        return (
          resume.content.education.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <div className="space-y-3">
                {resume.content.education.map((edu, index) => (
                  <div key={edu.id || index}>
                    <h3
                      className="font-semibold"
                      style={{
                        fontSize: `${templateLayout.fontSize.body + 1}px`,
                        color: colors.text,
                      }}
                    >
                      {edu.degree}
                      {edu.field && (
                        <span className="font-normal"> - {edu.field}</span>
                      )}
                    </h3>
                    <p
                      className="text-sm"
                      style={{
                        fontSize: `${templateLayout.fontSize.body}px`,
                        color: colors.secondary,
                      }}
                    >
                      {edu.institution}
                      {edu.startDate && (
                        <span>
                          {" • "}
                          {edu.endDate
                            ? `${edu.startDate} - ${edu.endDate}`
                            : edu.startDate}
                        </span>
                      )}
                      {edu.gpa && <span> • GPA: {edu.gpa}</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        );

      case "skills": {
        const technicalSkills = resume.content.skills.technical;
        const hasSkills =
          typeof technicalSkills === "string"
            ? technicalSkills.trim().length > 0
            : technicalSkills.length > 0;

        return (
          hasSkills && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <div style={{ fontSize: "9px", lineHeight: "1.5" }}>
                <div
                  style={{ color: "#000000", paddingLeft: "0px" }}
                  dangerouslySetInnerHTML={{
                    __html:
                      typeof technicalSkills === "string"
                        ? technicalSkills
                        : `<ul style="margin: 0; padding-left: 16px; list-style: disc;">${technicalSkills
                            .map((skill) => `<li>${skill}</li>`)
                            .join("")}</ul>`,
                  }}
                />
                {resume.content.skills.languages &&
                  resume.content.skills.languages.length > 0 && (
                    <div>
                      <span
                        className="font-semibold"
                        style={{
                          fontSize: `${templateLayout.fontSize.body}px`,
                        }}
                      >
                        Languages:{" "}
                      </span>
                      <span
                        style={{
                          fontSize: `${templateLayout.fontSize.body}px`,
                        }}
                      >
                        {resume.content.skills.languages.join(", ")}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          )
        );
      }

      case "projects":
        return (
          resume.content.projects &&
          resume.content.projects.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <div className="space-y-4">
                {resume.content.projects.map((project, index) => (
                  <div key={project.id || index}>
                    <h3
                      className="font-semibold mb-1"
                      style={{
                        fontSize: `${templateLayout.fontSize.body + 1}px`,
                        color: colors.text,
                      }}
                    >
                      {project.name}
                    </h3>
                    <div
                      className="mb-1 prose prose-sm max-w-none"
                      style={{
                        fontSize: `${templateLayout.fontSize.body}px`,
                        color: colors.text,
                      }}
                      dangerouslySetInnerHTML={{
                        __html: project.description || "",
                      }}
                    />
                    {project.technologies.length > 0 && (
                      <p
                        className="text-sm"
                        style={{
                          fontSize: `${templateLayout.fontSize.body - 1}px`,
                          color: colors.secondary,
                        }}
                      >
                        Technologies: {project.technologies.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        );

      case "achievements":
        return (
          resume.content.achievements &&
          resume.content.achievements.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <div className="space-y-2">
                {resume.content.achievements.map((achievement, index) => (
                  <div key={achievement.id || index}>
                    <h3
                      className="font-semibold"
                      style={{
                        fontSize: `${templateLayout.fontSize.body}px`,
                        color: colors.text,
                      }}
                    >
                      • {achievement.title}
                    </h3>
                    {achievement.description && (
                      <p
                        className="ml-4 text-sm"
                        style={{
                          fontSize: `${templateLayout.fontSize.body - 1}px`,
                          color: colors.secondary,
                        }}
                      >
                        {achievement.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        );

      case "certificates":
        return (
          resume.content.certificates &&
          resume.content.certificates.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <div className="space-y-2">
                {resume.content.certificates.map((cert, index) => (
                  <div key={cert.id || index} style={{ marginBottom: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <h3
                        className="font-semibold"
                        style={{
                          fontSize: "10px",
                          color: colors.text,
                        }}
                      >
                        {cert.title}
                      </h3>
                      <span
                        style={{
                          fontSize: "9px",
                          color: colors.secondary,
                        }}
                      >
                        {cert.issueDate}
                        {cert.expiryDate && ` - ${cert.expiryDate}`}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "9px",
                        color: colors.secondary,
                      }}
                    >
                      {cert.issuer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        );

      case "awards":
        return (
          resume.content.awards &&
          resume.content.awards.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <div className="space-y-2">
                {resume.content.awards.map((award, index) => (
                  <div key={award.id || index} style={{ marginBottom: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <h3
                        className="font-semibold"
                        style={{
                          fontSize: "10px",
                          color: colors.text,
                        }}
                      >
                        {award.title}
                      </h3>
                      {award.date && (
                        <span
                          style={{
                            fontSize: "9px",
                            color: colors.secondary,
                          }}
                        >
                          {award.date}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "9px",
                        color: colors.secondary,
                      }}
                    >
                      {award.issuer}
                    </p>
                    {award.description && (
                      <p
                        style={{
                          fontSize: "9px",
                          color: colors.text,
                          marginTop: "2px",
                        }}
                      >
                        {award.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        );

      case "interests":
        return (
          resume.content.interests && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <div
                style={{
                  fontSize: "10px",
                  color: "#000000",
                  lineHeight: "1.4",
                }}
                dangerouslySetInnerHTML={{
                  __html: resume.content.interests || "",
                }}
              />
            </div>
          )
        );

      case "references":
        return (
          resume.content.references &&
          resume.content.references.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <div className="space-y-3">
                {resume.content.references.map((ref, index) => (
                  <div key={ref.id || index} style={{ marginBottom: "6px" }}>
                    <h3
                      className="font-semibold"
                      style={{
                        fontSize: "10px",
                        color: colors.text,
                      }}
                    >
                      {ref.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "9px",
                        color: colors.secondary,
                      }}
                    >
                      {ref.position} • {ref.company}
                    </p>
                    {(ref.email || ref.phone) && (
                      <p
                        style={{
                          fontSize: "9px",
                          color: colors.text,
                        }}
                      >
                        {ref.email && ref.email}
                        {ref.email && ref.phone && " • "}
                        {ref.phone && ref.phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        );

      case "publications":
        return (
          resume.content.publications &&
          resume.content.publications.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <div className="space-y-2">
                {resume.content.publications.map((pub, index) => (
                  <div key={pub.id || index} style={{ marginBottom: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <h3
                        className="font-semibold"
                        style={{
                          fontSize: "10px",
                          color: colors.text,
                        }}
                      >
                        {pub.title}
                      </h3>
                      {pub.date && (
                        <span
                          style={{
                            fontSize: "9px",
                            color: colors.secondary,
                          }}
                        >
                          {pub.date}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "9px",
                        color: colors.secondary,
                      }}
                    >
                      {pub.publisher}
                    </p>
                    {pub.link && (
                      <a
                        href={pub.link}
                        style={{
                          fontSize: "9px",
                          color: colors.primary,
                          textDecoration: "none",
                        }}
                      >
                        {pub.link}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        );

      case "courses":
        return (
          resume.content.courses &&
          resume.content.courses.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <div className="space-y-2">
                {resume.content.courses.map((course, index) => (
                  <div key={course.id || index} style={{ marginBottom: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <h3
                        className="font-semibold"
                        style={{
                          fontSize: "10px",
                          color: colors.text,
                        }}
                      >
                        {course.name}
                      </h3>
                      {course.date && (
                        <span
                          style={{
                            fontSize: "9px",
                            color: colors.secondary,
                          }}
                        >
                          {course.date}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "9px",
                        color: colors.secondary,
                      }}
                    >
                      {course.institution}
                    </p>
                    {course.description && (
                      <p
                        style={{
                          fontSize: "9px",
                          color: colors.text,
                          marginTop: "2px",
                        }}
                      >
                        {course.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        );

      case "organisations":
        return (
          resume.content.organisations &&
          resume.content.organisations.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <div className="space-y-2">
                {resume.content.organisations.map((org, index) => (
                  <div key={org.id || index} style={{ marginBottom: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <h3
                        className="font-semibold"
                        style={{
                          fontSize: "10px",
                          color: colors.text,
                        }}
                      >
                        {org.name}
                      </h3>
                      <span
                        style={{
                          fontSize: "9px",
                          color: colors.secondary,
                        }}
                      >
                        {org.startDate}
                        {org.endDate && ` - ${org.endDate}`}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "9px",
                        color: colors.secondary,
                      }}
                    >
                      {org.role}
                    </p>
                    {org.description && (
                      <p
                        style={{
                          fontSize: "9px",
                          color: colors.text,
                          marginTop: "2px",
                        }}
                      >
                        {org.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        );

      case "declaration":
        return (
          resume.content.declaration && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <p
                style={{
                  fontSize: "10px",
                  color: "#000000",
                  lineHeight: "1.4",
                  textAlign: "justify",
                }}
              >
                {resume.content.declaration}
              </p>
            </div>
          )
        );

      case "languages":
        return (
          resume.content.languages && (
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#000000",
                  textAlign: "center",
                  borderTop: "1px solid #000000",
                  borderBottom: "1px solid #000000",
                  margin: "0 0 6px 0",
                  lineHeight: "26px",
                  height: "26px",
                  display: "block",
                }}
              >
                {sectionTitle}
              </h2>
              <div
                style={{
                  fontSize: "10px",
                  color: "#000000",
                  lineHeight: "1.4",
                }}
                dangerouslySetInnerHTML={{
                  __html: resume.content.languages || "",
                }}
              />
            </div>
          )
        );

      // Default handler for any future section types
      default:
        return (
          <div style={{ marginBottom: "8px" }}>
            <h2
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#000000",
                textAlign: "center",
                borderTop: "1px solid #000000",
                borderBottom: "1px solid #000000",
                margin: "0 0 6px 0",
                lineHeight: "26px",
                height: "26px",
                display: "block",
              }}
            >
              {sectionTitle}
            </h2>
            <div style={{ fontSize: "9px", lineHeight: "1.5", color: "#666" }}>
              <p>Content for {sectionTitle.toLowerCase()} will appear here.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      {/* Zoom Controls */}
      <div className="sticky top-0 z-20 bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 50}
            className="h-8 w-8 p-0"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {zoomLevel}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 200}
            className="h-8 w-8 p-0"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
            className="h-8 px-3 ml-2"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Scrollable Preview Container */}
      <div
        className="flex-1 overflow-auto bg-gray-200 p-4"
        suppressHydrationWarning
      >
        <div
          id="resume-preview-container"
          className="mx-auto bg-white shadow-2xl transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            fontFamily: templateLayout.fontFamily,
            backgroundColor: colors.background,
            color: colors.text,
            width: "210mm",
            maxWidth: "210mm",
            minHeight: "297mm",
            padding: `${resumeLayout.padding?.top || 8}mm ${
              resumeLayout.padding?.right || 8
            }mm ${resumeLayout.padding?.bottom || 8}mm ${
              resumeLayout.padding?.left || 8
            }mm`,
            boxSizing: "border-box",
          }}
          suppressHydrationWarning
        >
          {/* Render header section (always full width at top) */}
          {(() => {
            const { headerSection, leftColumn, rightColumn } =
              getHeaderAndBodySections();

            return (
              <>
                {/* Header Section - Always Full Width (Only Personal Info) */}
                {headerSection && (
                  <div style={{ width: "100%", marginBottom: "10px" }}>
                    {renderSectionContent(headerSection)}
                  </div>
                )}

                {/* Body Sections - Single or Double Column (Profile Summary and all others) */}
                {resumeLayout.type === "double" ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `${
                        resumeLayout.columnWidths?.left || 60
                      }% ${resumeLayout.columnWidths?.right || 40}%`,
                      gap: "12px",
                      alignItems: "start",
                    }}
                  >
                    {/* Left Column */}
                    <div>
                      {leftColumn.map((section) => (
                        <div key={section.id} style={{ breakInside: "auto" }}>
                          {renderSectionContent(section)}
                        </div>
                      ))}
                    </div>
                    {/* Right Column */}
                    <div>
                      {rightColumn.map((section) => (
                        <div key={section.id} style={{ breakInside: "auto" }}>
                          {renderSectionContent(section)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Single Column Layout */
                  leftColumn.map((section) => (
                    <div key={section.id}>{renderSectionContent(section)}</div>
                  ))
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
