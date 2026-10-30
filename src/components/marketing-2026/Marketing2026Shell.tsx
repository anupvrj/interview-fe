import { cn } from "@/lib/utils";
import { geist, geistMono, hand } from "./fonts";

export function Marketing2026Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mk26 min-h-screen bg-background antialiased",
        geist.variable,
        geistMono.variable,
        hand.variable,
      )}
    >
      {children}
    </div>
  );
}
