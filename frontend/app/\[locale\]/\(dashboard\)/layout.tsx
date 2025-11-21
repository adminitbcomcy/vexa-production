import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={`/${params.locale}/meetings`} className="text-2xl font-bold">
              Vexa.ai
            </Link>
            <nav className="flex gap-6">
              <Link
                href={`/${params.locale}/meetings`}
                className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400"
              >
                Meetings
              </Link>
              <Link
                href={`/${params.locale}/record`}
                className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400"
              >
                Record
              </Link>
              <Link
                href={`/${params.locale}/settings`}
                className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400"
              >
                Settings
              </Link>
            </nav>
          </div>

          <UserButton afterSignOutUrl={`/${params.locale}/sign-in`} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
