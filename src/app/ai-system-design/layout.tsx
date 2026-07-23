import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI System Design Interview Practice — Live Whiteboard Mock",
  description:
    "Practice system design interviews with an Excalidraw whiteboard, AI Live interviewer, and rubric-based scoring. Choose from 10 curated prompts, submit diagram snapshots for spoken feedback, and get a detailed architecture report.",
  keywords:
    "system design interview practice, AI system design mock interview, system design whiteboard, architecture interview prep, Excalidraw system design, AI Live interviewer, distributed systems interview, scaling and trade-offs interview, URL shortener system design, senior engineer interview prep",
  alternates: {
    canonical: "https://interviewtrix.com/ai-system-design",
  },
  openGraph: {
    title:
      "AI System Design Interview Practice — Live Whiteboard Mock | Interview Trix",
    description:
      "Whiteboard architecture on Excalidraw, defend trade-offs in a live AI voice session, and get scored on scope, components, scaling, and communication.",
    type: "website",
    url: "https://interviewtrix.com/ai-system-design",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "AI System Design Interview Practice — Live Whiteboard Mock | Interview Trix",
    description:
      "Whiteboard architecture on Excalidraw, defend trade-offs in a live AI voice session, and get scored on scope, components, scaling, and communication.",
  },
};

export default function AiSystemDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
