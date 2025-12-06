/**
 * Template Preview Component
 * Renders unique resume design for each template
 */

import { ResumeTemplate } from "@/lib/api";
import { CheckCircle } from "lucide-react";

interface TemplatePreviewProps {
  template: ResumeTemplate;
  isSelected: boolean;
}

export function TemplatePreview({ template, isSelected }: TemplatePreviewProps) {
  return (
    <div
      className="h-64 lg:h-72 bg-white rounded-t-lg relative overflow-hidden border-b-2"
      style={{ borderColor: template.colors.primary }}
    >
      {/* Executive - Centered, Classic */}
      {template.id === "executive" && (
        <div className="absolute inset-0 p-3 text-xs" style={{ fontFamily: template.layout.fontFamily }}>
          <div className="text-center mb-2 pb-2 border-b-2" style={{ borderColor: template.colors.primary }}>
            <h3 className="font-bold text-[11px] mb-0.5" style={{ color: template.colors.primary }}>JOHN DOE</h3>
            <p className="text-[8px]" style={{ color: template.colors.secondary }}>Software Engineer</p>
            <p className="text-[7px] mt-0.5" style={{ color: template.colors.text }}>john@email.com • +1 (555) 123-4567</p>
          </div>
          <div className="mb-2"><h4 className="font-bold text-[9px] mb-1 text-center" style={{ color: template.colors.primary }}>PROFILE</h4><p className="text-[7px] leading-tight" style={{ color: template.colors.text }}>Innovative professional with 5+ years of experience...</p></div>
          <div className="mb-2"><h4 className="font-bold text-[9px] mb-1 text-center" style={{ color: template.colors.primary }}>EXPERIENCE</h4><div className="text-[7px]"><p className="font-semibold">Senior Software Engineer</p><p style={{ color: template.colors.secondary }}>Tech Corp • 2021 - Present</p><p className="mt-0.5">• Led cloud-native development</p></div></div>
          <div><h4 className="font-bold text-[9px] mb-1 text-center" style={{ color: template.colors.primary }}>SKILLS</h4><p className="text-[7px]" style={{ color: template.colors.text }}>JavaScript • React • Node.js • AWS</p></div>
        </div>
      )}

      {/* Corporate - Two-Column, Professional */}
      {template.id === "corporate" && (
        <div className="absolute inset-0 flex" style={{ fontFamily: template.layout.fontFamily }}>
          <div className="w-2/3 p-3 text-xs">
            <div className="mb-2 pb-1 border-b" style={{ borderColor: template.colors.primary }}>
              <h3 className="font-bold text-[11px]" style={{ color: template.colors.primary }}>JOHN DOE</h3>
              <p className="text-[8px]" style={{ color: template.colors.secondary }}>Software Engineer</p>
            </div>
            <div className="mb-2"><h4 className="font-bold text-[8px] mb-1" style={{ color: template.colors.primary }}>EXPERIENCE</h4><div className="text-[7px]"><p className="font-semibold">Senior Software Engineer</p><p style={{ color: template.colors.secondary }}>Tech Corp • 2021 - Present</p><p className="mt-0.5">• Cloud-native applications</p><p>• System optimization</p></div></div>
            <div><h4 className="font-bold text-[8px] mb-1" style={{ color: template.colors.primary }}>EDUCATION</h4><p className="text-[7px]">B.S. Computer Science<br/><span style={{ color: template.colors.secondary }}>UC Berkeley • 2019</span></p></div>
          </div>
          <div className="w-1/3 p-2 text-xs" style={{ backgroundColor: `${template.colors.primary}10` }}>
            <div className="mb-2"><h4 className="font-bold text-[8px] mb-1" style={{ color: template.colors.primary }}>CONTACT</h4><p className="text-[6px] leading-relaxed" style={{ color: template.colors.text }}>john@email.com<br/>+1 (555) 123-4567<br/>San Francisco, CA</p></div>
            <div><h4 className="font-bold text-[8px] mb-1" style={{ color: template.colors.primary }}>SKILLS</h4><p className="text-[6px]" style={{ color: template.colors.text }}>JavaScript<br/>TypeScript<br/>React<br/>Node.js<br/>AWS</p></div>
          </div>
        </div>
      )}

      {/* Classic - Traditional, Underlined */}
      {template.id === "classic" && (
        <div className="absolute inset-0 p-3 text-xs" style={{ fontFamily: template.layout.fontFamily }}>
          <div className="text-center mb-2">
            <h3 className="font-bold text-[13px]" style={{ color: template.colors.primary }}>John Doe</h3>
            <div className="border-t-2 border-b-2 py-1 my-1" style={{ borderColor: template.colors.primary }}>
              <p className="text-[8px]" style={{ color: template.colors.text }}>john@email.com | +1 (555) 123-4567 | San Francisco, CA</p>
            </div>
          </div>
          <div className="mb-2"><h4 className="font-bold text-[9px] text-center mb-1" style={{ color: template.colors.text, textDecoration: "underline" }}>PROFESSIONAL SUMMARY</h4><p className="text-[7px] text-justify leading-tight" style={{ color: template.colors.text }}>Innovative professional with 5+ years of experience in software development and cloud architecture...</p></div>
          <div className="mb-2"><h4 className="font-bold text-[9px] text-center mb-1" style={{ color: template.colors.text, textDecoration: "underline" }}>WORK EXPERIENCE</h4><div className="text-[7px]"><p className="font-semibold">Senior Software Engineer, Tech Corp</p><p className="italic" style={{ color: template.colors.secondary }}>2021 - Present</p></div></div>
        </div>
      )}

      {/* Harvard - Academic, Elegant */}
      {template.id === "harvard" && (
        <div className="absolute inset-0 p-3 text-xs" style={{ fontFamily: template.layout.fontFamily }}>
          <div className="text-center mb-2 pb-2" style={{ borderBottom: `3px solid ${template.colors.primary}` }}>
            <h3 className="font-bold text-[12px] mb-0.5" style={{ color: template.colors.primary }}>JOHN DOE</h3>
            <p className="text-[7px]" style={{ color: template.colors.text }}>john@email.com • +1 (555) 123-4567 • San Francisco, CA</p>
          </div>
          <div className="mb-2"><h4 className="font-bold text-[9px] mb-1" style={{ color: template.colors.primary }}>EDUCATION</h4><div className="text-[7px]"><p className="font-semibold">University of California, Berkeley</p><p>Bachelor of Science in Computer Science</p><p className="italic" style={{ color: template.colors.secondary }}>GPA: 3.8/4.0 • Dean's List</p></div></div>
          <div className="mb-2"><h4 className="font-bold text-[9px] mb-1" style={{ color: template.colors.primary }}>EXPERIENCE</h4><div className="text-[7px]"><p className="font-semibold">Senior Software Engineer</p><p style={{ color: template.colors.secondary }}>Tech Corp, San Francisco • 2021-Present</p><p className="mt-0.5">• Led cloud development team</p></div></div>
        </div>
      )}

      {/* Atlantic Blue - Sidebar, Modern */}
      {template.id === "atlantic-blue" && (
        <div className="absolute inset-0 flex" style={{ fontFamily: template.layout.fontFamily }}>
          <div className="w-1/3 p-2 text-xs" style={{ backgroundColor: template.colors.primary, color: "white" }}>
            <h3 className="font-bold text-[10px] mb-2">JOHN DOE</h3>
            <div className="mb-2"><h4 className="font-bold text-[7px] mb-1" style={{ color: template.colors.accent }}>CONTACT</h4><p className="text-[6px] leading-relaxed">john@email.com<br/>+1 555 123 4567<br/>San Francisco</p></div>
            <div className="mb-2"><h4 className="font-bold text-[7px] mb-1" style={{ color: template.colors.accent }}>SKILLS</h4><p className="text-[6px]">JavaScript<br/>React<br/>Node.js<br/>AWS<br/>Docker</p></div>
            <div><h4 className="font-bold text-[7px] mb-1" style={{ color: template.colors.accent }}>LANGUAGES</h4><p className="text-[6px]">English<br/>Spanish</p></div>
          </div>
          <div className="w-2/3 p-3">
            <div className="mb-2"><h4 className="font-bold text-[9px] mb-1" style={{ color: template.colors.primary }}>SOFTWARE ENGINEER</h4><p className="text-[7px] leading-tight" style={{ color: template.colors.text }}>Innovative professional with expertise in full-stack development...</p></div>
            <div><h4 className="font-bold text-[9px] mb-1" style={{ color: template.colors.primary }}>EXPERIENCE</h4><div className="text-[7px]"><p className="font-semibold">Senior Software Engineer</p><p style={{ color: template.colors.secondary }}>Tech Corp • 2021-Present</p><p className="mt-0.5">• Led cloud development</p></div></div>
          </div>
        </div>
      )}

      {/* Mercury - Clean, Minimal */}
      {template.id === "mercury" && (
        <div className="absolute inset-0 p-3 text-xs" style={{ fontFamily: template.layout.fontFamily }}>
          <div className="mb-2 flex items-center justify-between pb-1" style={{ borderBottom: `2px solid ${template.colors.primary}` }}>
            <div><h3 className="font-bold text-[11px]" style={{ color: template.colors.primary }}>John Doe</h3><p className="text-[7px]" style={{ color: template.colors.secondary }}>Software Engineer</p></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-2">
              <div><h4 className="font-bold text-[8px] mb-1" style={{ color: template.colors.primary }}>ABOUT</h4><p className="text-[7px]" style={{ color: template.colors.text }}>5+ years of experience in software development...</p></div>
              <div><h4 className="font-bold text-[8px] mb-1" style={{ color: template.colors.primary }}>EXPERIENCE</h4><p className="text-[7px] font-semibold">Senior Engineer</p><p className="text-[6px]" style={{ color: template.colors.secondary }}>Tech Corp • 2021-Present</p></div>
            </div>
            <div className="space-y-2">
              <div><h4 className="font-bold text-[7px] mb-1" style={{ color: template.colors.primary }}>CONTACT</h4><p className="text-[6px]" style={{ color: template.colors.text }}>john@email.com<br/>+1 555 123 4567</p></div>
              <div><h4 className="font-bold text-[7px] mb-1" style={{ color: template.colors.primary }}>SKILLS</h4><p className="text-[6px]" style={{ color: template.colors.text }}>React<br/>Node.js<br/>AWS</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Hunter Green - Two-Column with Accent Sidebar */}
      {template.id === "hunter-green" && (
        <div className="absolute inset-0 flex" style={{ fontFamily: template.layout.fontFamily }}>
          <div className="w-7/12 p-3">
            <div className="mb-2"><h3 className="font-bold text-[11px] mb-0.5" style={{ color: template.colors.primary }}>JOHN DOE</h3><p className="text-[7px]" style={{ color: template.colors.text }}>john@email.com • +1 (555) 123-4567</p></div>
            <div className="mb-2"><h4 className="font-bold text-[8px] mb-1 pb-0.5" style={{ color: template.colors.primary, borderBottom: `2px solid ${template.colors.accent}` }}>EXPERIENCE</h4><div className="text-[7px]"><p className="font-semibold">Senior Software Engineer</p><p style={{ color: template.colors.secondary }}>Tech Corp • 2021-Present</p><p>• Cloud architecture</p><p>• Team leadership</p></div></div>
          </div>
          <div className="w-5/12 p-2" style={{ backgroundColor: `${template.colors.primary}15` }}>
            <div className="mb-2"><h4 className="font-bold text-[8px] mb-1" style={{ color: template.colors.primary }}>SKILLS</h4><div className="text-[6px] space-y-0.5"><div style={{ backgroundColor: template.colors.accent, color: "white", padding: "1px 3px", display: "inline-block", borderRadius: "2px", marginRight: "2px" }}>JavaScript</div><div style={{ backgroundColor: template.colors.accent, color: "white", padding: "1px 3px", display: "inline-block", borderRadius: "2px", marginRight: "2px" }}>React</div><div style={{ backgroundColor: template.colors.accent, color: "white", padding: "1px 3px", display: "inline-block", borderRadius: "2px", marginRight: "2px" }}>Node.js</div></div></div>
            <div><h4 className="font-bold text-[8px] mb-1" style={{ color: template.colors.primary }}>EDUCATION</h4><p className="text-[6px]">B.S. Computer Sci.<br/><span style={{ color: template.colors.secondary }}>UC Berkeley</span></p></div>
          </div>
        </div>
      )}

      {/* Blue Steel - Header Bar, Grid */}
      {template.id === "blue-steel" && (
        <div className="absolute inset-0 p-3 text-xs" style={{ fontFamily: template.layout.fontFamily }}>
          <div className="mb-2" style={{ backgroundColor: template.colors.primary, color: "white", padding: "4px 6px", borderRadius: "4px" }}>
            <h3 className="font-bold text-[11px]">JOHN DOE</h3>
            <p className="text-[7px]">Software Engineer</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5"><div><h4 className="font-bold text-[8px] mb-1" style={{ color: template.colors.primary }}>PROFILE</h4><p className="text-[7px]" style={{ color: template.colors.text }}>5+ years experience in software development...</p></div><div><h4 className="font-bold text-[8px] mb-1" style={{ color: template.colors.primary }}>EXPERIENCE</h4><p className="text-[7px] font-semibold">Senior Engineer</p><p className="text-[6px]" style={{ color: template.colors.secondary }}>Tech Corp • 2021-Now</p></div></div>
            <div className="space-y-1.5"><div><h4 className="font-bold text-[8px] mb-1" style={{ color: template.colors.primary }}>SKILLS</h4><p className="text-[6px]" style={{ color: template.colors.text }}>JavaScript • React<br/>Node.js • AWS</p></div><div><h4 className="font-bold text-[8px] mb-1" style={{ color: template.colors.primary }}>CONTACT</h4><p className="text-[6px]">john@email.com<br/>+1 555 123 4567</p></div></div>
          </div>
        </div>
      )}

      {/* Powder Blush - Creative Header Banner */}
      {template.id === "powder-blush" && (
        <div className="absolute inset-0" style={{ fontFamily: template.layout.fontFamily }}>
          <div className="h-1/4 p-2 flex items-center justify-center" style={{ backgroundColor: template.colors.primary, color: "white" }}>
            <div className="text-center"><h3 className="font-bold text-[11px]">JOHN DOE</h3><p className="text-[7px]">Software Engineer</p></div>
          </div>
          <div className="p-3 text-xs space-y-1.5">
            <div><h4 className="font-bold text-[8px] mb-0.5" style={{ color: template.colors.primary, borderLeft: `3px solid ${template.colors.primary}`, paddingLeft: "4px" }}>PROFILE</h4><p className="text-[7px]" style={{ color: template.colors.text }}>Creative professional with passion for design...</p></div>
            <div><h4 className="font-bold text-[8px] mb-0.5" style={{ color: template.colors.primary, borderLeft: `3px solid ${template.colors.primary}`, paddingLeft: "4px" }}>EXPERIENCE</h4><p className="text-[7px] font-semibold">Designer</p><p className="text-[6px]" style={{ color: template.colors.secondary }}>Creative Studio • 2021-Present</p></div>
            <div><h4 className="font-bold text-[8px] mb-0.5" style={{ color: template.colors.primary, borderLeft: `3px solid ${template.colors.primary}`, paddingLeft: "4px" }}>SKILLS</h4><p className="text-[6px]">Figma • Photoshop • Illustrator</p></div>
          </div>
        </div>
      )}

      {/* Emerald Mist - Colored Accent Panel */}
      {template.id === "emerald-mist" && (
        <div className="absolute inset-0 flex" style={{ fontFamily: template.layout.fontFamily }}>
          <div className="w-3/5 p-3 text-xs">
            <h3 className="font-bold text-[12px] mb-1" style={{ color: template.colors.primary }}>John Doe</h3>
            <p className="text-[7px] mb-2" style={{ color: template.colors.secondary }}>Software Engineer | john@email.com</p>
            <div className="mb-2"><h4 className="font-bold text-[8px] mb-1 pb-0.5" style={{ color: template.colors.primary, borderBottom: `1px solid ${template.colors.accent}` }}>Summary</h4><p className="text-[7px]" style={{ color: template.colors.text }}>Innovative professional...</p></div>
            <div><h4 className="font-bold text-[8px] mb-1 pb-0.5" style={{ color: template.colors.primary, borderBottom: `1px solid ${template.colors.accent}` }}>Experience</h4><p className="text-[7px] font-semibold">Senior Engineer</p><p className="text-[6px]" style={{ color: template.colors.secondary }}>Tech Corp • 2021-Now</p></div>
          </div>
          <div className="w-2/5 p-2" style={{ backgroundColor: template.colors.accent, color: "white" }}>
            <div className="mb-2"><h4 className="font-bold text-[8px] mb-1">SKILLS</h4><div className="space-y-0.5 text-[6px]"><div style={{ backgroundColor: "white", color: template.colors.primary, padding: "2px 4px", borderRadius: "2px" }}>JavaScript</div><div style={{ backgroundColor: "white", color: template.colors.primary, padding: "2px 4px", borderRadius: "2px" }}>React</div><div style={{ backgroundColor: "white", color: template.colors.primary, padding: "2px 4px", borderRadius: "2px" }}>AWS</div></div></div>
            <div><h4 className="font-bold text-[8px] mb-1">CONTACT</h4><p className="text-[6px]">San Francisco, CA<br/>linkedin.com/in/johndoe</p></div>
          </div>
        </div>
      )}

      {/* Selection Badge */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* ATS Badge */}
      {template.atsOptimized && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-1 text-[10px] font-semibold bg-green-500 text-white rounded-full shadow">
            ATS Ready
          </span>
        </div>
      )}
    </div>
  );
}

