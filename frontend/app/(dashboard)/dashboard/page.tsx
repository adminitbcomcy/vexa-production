import { redirect } from 'next/navigation';

// Redirect /dashboard to /meetings
export default function DashboardPage() {
  redirect('/meetings');
}
