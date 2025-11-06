'use client';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900">
      {/* Clean layout without sidebar */}
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  );
}