import { getStudentDashboardData } from '@/lib/student-dashboard-data';
import { StudentDashboardView } from '@/components/student/student-dashboard-view';
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Student Services Dashboard | CampusServe',
  description:
    'Real-time student dashboard for scheduling campus laundry, meal tokens, IT devices, and facility rooms.',
};

/**
 * Server page component for /student/dashboard
 * Protected by /student/layout.tsx (only Role.STUDENT permitted).
 * Retrieves real user and database state, and renders dynamic dashboard.
 */
export default async function StudentDashboardPage() {
  const data = await getStudentDashboardData();

  return <StudentDashboardView initialData={data} />;
}
