import {
  Award,
  Brain,
  Code,
  FileText,
  MessageSquare,
  Mic,
  Search,
  Sparkles,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FloatingIcon = {
  id: string;
  Icon: LucideIcon;
  left: string;
  top: string;
  sizeClass: string;
  opacity: number;
  animation: string;
  delay: string;
};

const FLOATING_ICONS: FloatingIcon[] = [
  {
    id: "file",
    Icon: FileText,
    left: "8%",
    top: "18%",
    sizeClass: "h-10 w-10 sm:h-12 sm:w-12",
    opacity: 0.12,
    animation: "float-0 7s ease-in-out infinite",
    delay: "0s",
  },
  {
    id: "mic",
    Icon: Mic,
    left: "82%",
    top: "14%",
    sizeClass: "h-9 w-9 sm:h-11 sm:w-11",
    opacity: 0.11,
    animation: "float-1 8s ease-in-out infinite",
    delay: "0.4s",
  },
  {
    id: "code",
    Icon: Code,
    left: "72%",
    top: "68%",
    sizeClass: "h-10 w-10 sm:h-12 sm:w-12",
    opacity: 0.12,
    animation: "float-2 9s ease-in-out infinite",
    delay: "0.8s",
  },
  {
    id: "video",
    Icon: Video,
    left: "12%",
    top: "72%",
    sizeClass: "h-9 w-9 sm:h-11 sm:w-11",
    opacity: 0.1,
    animation: "float-0 8s ease-in-out infinite",
    delay: "1.2s",
  },
  {
    id: "search",
    Icon: Search,
    left: "48%",
    top: "8%",
    sizeClass: "h-7 w-7 sm:h-9 sm:w-9",
    opacity: 0.09,
    animation: "float-1 7s ease-in-out infinite",
    delay: "0.6s",
  },
  {
    id: "award",
    Icon: Award,
    left: "90%",
    top: "46%",
    sizeClass: "h-7 w-7 sm:h-9 sm:w-9",
    opacity: 0.09,
    animation: "float-2 8s ease-in-out infinite",
    delay: "1s",
  },
  {
    id: "message",
    Icon: MessageSquare,
    left: "4%",
    top: "44%",
    sizeClass: "h-7 w-7 sm:h-9 sm:w-9",
    opacity: 0.09,
    animation: "float-0 9s ease-in-out infinite",
    delay: "1.4s",
  },
  {
    id: "sparkles",
    Icon: Sparkles,
    left: "58%",
    top: "78%",
    sizeClass: "h-6 w-6 sm:h-8 sm:w-8",
    opacity: 0.08,
    animation: "float-1 10s ease-in-out infinite",
    delay: "0.2s",
  },
  {
    id: "brain",
    Icon: Brain,
    left: "36%",
    top: "58%",
    sizeClass: "h-6 w-6 sm:h-8 sm:w-8",
    opacity: 0.08,
    animation: "float-2 10s ease-in-out infinite",
    delay: "1.6s",
  },
];

export function MarketingSectionFloatingIcons() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {FLOATING_ICONS.map(({ id, Icon, left, top, sizeClass, opacity, animation, delay }) => (
        <div
          key={id}
          className="absolute"
          style={{
            left,
            top,
            opacity,
            animation,
            animationDelay: delay,
          }}
        >
          <Icon className={`${sizeClass} text-primary`} />
        </div>
      ))}
    </div>
  );
}
