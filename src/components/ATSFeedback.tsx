"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Target,
} from "lucide-react";

// Global style to remove all list markers
const listStyleReset = {
  listStyle: "none",
  listStyleType: "none",
  paddingLeft: 0,
  marginLeft: 0,
} as React.CSSProperties;

interface ATSFeedback {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  details?: {
    formatting?: { score: number; issues: string[]; improvements: string[] };
    content?: { score: number; issues: string[]; improvements: string[] };
    keywords?: { score: number; issues: string[]; improvements: string[] };
    structure?: { score: number; issues: string[]; improvements: string[] };
  };
}

interface ATSFeedbackProps {
  feedback: ATSFeedback;
}

export function ATSFeedback({ feedback }: ATSFeedbackProps) {
  // Additional CSS to ensure no bullet points appear and icons/content stay on same line
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      /* Protect main container padding */
      .ats-feedback-list {
        padding-left: 2rem !important;
        padding-right: 2rem !important;
      }
      /* Only reset padding on list elements, not the container */
      .ats-feedback-list ul,
      .ats-feedback-list li {
        list-style: none !important;
        list-style-type: none !important;
        padding-left: 0 !important;
        margin-left: 0 !important;
      }
      .ats-feedback-list li::before,
      .ats-feedback-list li::after {
        content: none !important;
        display: none !important;
      }
      .ats-feedback-list li {
        display: flex !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
      }
      .ats-feedback-list li > div:first-child {
        flex-shrink: 0 !important;
        min-width: 20px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .ats-feedback-list li > div:first-child svg {
        display: block !important;
        margin: 0 auto !important;
      }
      .ats-feedback-list li > span {
        flex: 1 1 auto !important;
        min-width: 0 !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 dark:text-[#fd7070] bg-red-50 dark:bg-red-950/25 border-red-200 dark:border-red-900/40";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Get color for category scores based on percentage
  const getCategoryScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) {
      return {
        badge: "bg-green-500 text-white",
        progress: "bg-green-500",
        text: "text-green-700",
        bg: "bg-green-50",
        border: "border-green-200",
      };
    } else if (percentage >= 60) {
      return {
        badge: "bg-yellow-500 text-white",
        progress: "bg-yellow-500",
        text: "text-yellow-700",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
      };
    } else {
      return {
        badge: "bg-red-500 text-white",
        progress: "bg-red-500",
        text: "text-red-700 dark:text-[#fd7070]",
        bg: "bg-red-50 dark:bg-red-950/25",
        border: "border-red-200 dark:border-red-900/40",
      };
    }
  };

  return (
    <div 
      className="space-y-6 py-6 ats-feedback-list"
      style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
    >
      {/* Score Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ATS Score</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Applicant Tracking System Compatibility
          </p>
        </div>
        <div
          className={`px-6 py-4 rounded-xl border-2 ${getScoreColor(
            feedback.score
          )}`}
        >
          <div className="flex items-center gap-3">
            <div className="text-5xl font-bold">{feedback.score}</div>
            <div className="text-sm font-medium">/ 100</div>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      {feedback.details && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {feedback.details.formatting && (() => {
            const max = 25;
            const score = feedback.details.formatting.score;
            const colors = getCategoryScoreColor(score, max);
            const percentage = (score / max) * 100;
            const isComplete = score === max;
            
            return (
              <Card className={`border-2 ${colors.border} ${colors.bg}`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm font-semibold ${colors.text}`}>
                        Formatting
                      </span>
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className={`${colors.badge} border-0 font-bold text-xs`}
                      >
                        {score} / {max}
                        {isComplete && " ✓"}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${colors.progress} transition-all duration-300`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {percentage.toFixed(0)}% complete
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          {feedback.details.content && (() => {
            const max = 30;
            const score = feedback.details.content.score;
            const colors = getCategoryScoreColor(score, max);
            const percentage = (score / max) * 100;
            const isComplete = score === max;
            
            return (
              <Card className={`border-2 ${colors.border} ${colors.bg}`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm font-semibold ${colors.text}`}>
                        Content
                      </span>
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className={`${colors.badge} border-0 font-bold text-xs`}
                      >
                        {score} / {max}
                        {isComplete && " ✓"}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${colors.progress} transition-all duration-300`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {percentage.toFixed(0)}% complete
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          {feedback.details.keywords && (() => {
            const max = 25;
            const score = feedback.details.keywords.score;
            const colors = getCategoryScoreColor(score, max);
            const percentage = (score / max) * 100;
            const isComplete = score === max;
            
            return (
              <Card className={`border-2 ${colors.border} ${colors.bg}`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm font-semibold ${colors.text}`}>
                        Keywords
                      </span>
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className={`${colors.badge} border-0 font-bold text-xs`}
                      >
                        {score} / {max}
                        {isComplete && " ✓"}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${colors.progress} transition-all duration-300`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {percentage.toFixed(0)}% complete
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          {feedback.details.structure && (() => {
            const max = 20;
            const score = feedback.details.structure.score;
            const colors = getCategoryScoreColor(score, max);
            const percentage = (score / max) * 100;
            const isComplete = score === max;
            
            return (
              <Card className={`border-2 ${colors.border} ${colors.bg}`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm font-semibold ${colors.text}`}>
                        Structure
                      </span>
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className={`${colors.badge} border-0 font-bold text-xs`}
                      >
                        {score} / {max}
                        {isComplete && " ✓"}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${colors.progress} transition-all duration-300`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {percentage.toFixed(0)}% complete
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {/* Category-wise Improvements */}
      {feedback.details && (
        <div className="space-y-4">
          {/* Formatting Improvements */}
          {feedback.details.formatting?.improvements && 
           feedback.details.formatting.improvements.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Formatting - Areas for Improvement
                  </h3>
                </div>
                <ul className="space-y-3" style={listStyleReset}>
                  {feedback.details.formatting.improvements.map((improvement, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 text-muted-foreground"
                      style={{ 
                        ...listStyleReset, 
                        display: "flex", 
                        alignItems: "center",
                        flexWrap: "nowrap",
                        width: "100%"
                      }}
                    >
                      <div 
                        className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0" 
                        style={{ 
                          flexShrink: 0, 
                          minWidth: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-white" style={{ display: "block" }} />
                      </div>
                      <span 
                        className="leading-relaxed" 
                        style={{ flex: "1 1 auto", minWidth: 0, wordBreak: "break-word" }}
                      >
                        {improvement}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Content Improvements */}
          {feedback.details.content?.improvements && 
           feedback.details.content.improvements.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Content - Areas for Improvement
                  </h3>
                </div>
                <ul className="space-y-3" style={listStyleReset}>
                  {feedback.details.content.improvements.map((improvement, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 text-muted-foreground"
                      style={{ 
                        ...listStyleReset, 
                        display: "flex", 
                        alignItems: "center",
                        flexWrap: "nowrap",
                        width: "100%"
                      }}
                    >
                      <div 
                        className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0" 
                        style={{ 
                          flexShrink: 0, 
                          minWidth: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-white" style={{ display: "block" }} />
                      </div>
                      <span 
                        className="leading-relaxed" 
                        style={{ flex: "1 1 auto", minWidth: 0, wordBreak: "break-word" }}
                      >
                        {improvement}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Keywords Improvements */}
          {feedback.details.keywords?.improvements && 
           feedback.details.keywords.improvements.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Keywords - Areas for Improvement
                  </h3>
                </div>
                <ul className="space-y-3" style={listStyleReset}>
                  {feedback.details.keywords.improvements.map((improvement, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 text-muted-foreground"
                      style={{ 
                        ...listStyleReset, 
                        display: "flex", 
                        alignItems: "center",
                        flexWrap: "nowrap",
                        width: "100%"
                      }}
                    >
                      <div 
                        className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0" 
                        style={{ 
                          flexShrink: 0, 
                          minWidth: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-white" style={{ display: "block" }} />
                      </div>
                      <span 
                        className="leading-relaxed" 
                        style={{ flex: "1 1 auto", minWidth: 0, wordBreak: "break-word" }}
                      >
                        {improvement}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Structure Improvements */}
          {feedback.details.structure?.improvements && 
           feedback.details.structure.improvements.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Structure - Areas for Improvement
                  </h3>
                </div>
                <ul className="space-y-3" style={listStyleReset}>
                  {feedback.details.structure.improvements.map((improvement, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 text-muted-foreground"
                      style={{ 
                        ...listStyleReset, 
                        display: "flex", 
                        alignItems: "center",
                        flexWrap: "nowrap",
                        width: "100%"
                      }}
                    >
                      <div 
                        className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0" 
                        style={{ 
                          flexShrink: 0, 
                          minWidth: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-white" style={{ display: "block" }} />
                      </div>
                      <span 
                        className="leading-relaxed" 
                        style={{ flex: "1 1 auto", minWidth: 0, wordBreak: "break-word" }}
                      >
                        {improvement}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Strengths */}
      {feedback.strengths && feedback.strengths.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-foreground">Strengths</h3>
            </div>
            <ul className="space-y-3" style={listStyleReset}>
              {feedback.strengths.map((strength, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-muted-foreground"
                  style={{ 
                    ...listStyleReset, 
                    display: "flex", 
                    alignItems: "center",
                    flexWrap: "nowrap",
                    width: "100%"
                  }}
                >
                  <div 
                    className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0" 
                    style={{ 
                      flexShrink: 0, 
                      minWidth: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" style={{ display: "block" }} />
                  </div>
                  <span 
                    className="leading-relaxed" 
                    style={{ flex: "1 1 auto", minWidth: 0, wordBreak: "break-word" }}
                  >
                    {strength}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Weaknesses */}
      {feedback.weaknesses && feedback.weaknesses.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-[#fd7070]" />
              <h3 className="text-lg font-semibold text-foreground">
                Areas for Improvement
              </h3>
            </div>
            <ul className="space-y-3" style={listStyleReset}>
              {feedback.weaknesses.map((weakness, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-muted-foreground"
                  style={{ 
                    ...listStyleReset, 
                    display: "flex", 
                    alignItems: "center",
                    flexWrap: "nowrap",
                    width: "100%"
                  }}
                >
                  <div 
                    className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0" 
                    style={{ 
                      flexShrink: 0, 
                      minWidth: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-white" style={{ display: "block" }} />
                  </div>
                  <span 
                    className="leading-relaxed" 
                    style={{ flex: "1 1 auto", minWidth: 0, wordBreak: "break-word" }}
                  >
                    {weakness}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {feedback.suggestions && feedback.suggestions.length > 0 && (
        <Card className="border-border bg-muted/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Recommendations
              </h3>
            </div>
            <ul className="space-y-3" style={listStyleReset}>
              {feedback.suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-muted-foreground"
                  style={{ 
                    ...listStyleReset, 
                    display: "flex", 
                    alignItems: "center",
                    flexWrap: "nowrap",
                    width: "100%"
                  }}
                >
                  <div 
                    className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0" 
                    style={{ 
                      flexShrink: 0, 
                      minWidth: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-white" style={{ display: "block" }} />
                  </div>
                  <span 
                    className="leading-relaxed" 
                    style={{ flex: "1 1 auto", minWidth: 0, wordBreak: "break-word" }}
                  >
                    {suggestion}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

