/**
 * Full-bleed shell for the resume editor — cancels dashboard content padding and
 * locks height so ATS / edit panels scroll internally (no document white gap).
 */
export default function ResumeEditLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative -mx-4 -mt-4 flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden sm:-mx-5 sm:-mt-5 sm:h-[calc(100dvh-4.5rem)] lg:-mx-6 lg:-mb-8 lg:-mt-5 lg:h-[calc(100dvh-5.75rem)]">
      {children}
    </div>
  );
}
