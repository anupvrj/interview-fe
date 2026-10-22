/**
 * Full-screen shell for the resume editor. The dashboard renders this route without
 * its sidebar and top bar (see DashboardLayout `isImmersiveToolPath`), so the editor
 * owns the whole viewport and its panels scroll internally.
 */
export default function ResumeEditLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden">{children}</div>;
}
