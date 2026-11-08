import type { Metadata } from 'next';
import { getStudentProfileData } from '@/app/actions/student-profile-actions';
import { StudentProfileView } from '@/components/student/profile/student-profile-view';

export const metadata: Metadata = {
  title: 'Student Profile & Settings | CampusServe',
  description:
    'Manage your campus student profile, contact coordinates, notification preferences, and account settings.',
};

/**
 * Dedicated Student Profile Page
 * Protected by /student/layout.tsx (enforces Role.STUDENT).
 * Displays Clerk profile image, name, email, phone, role, account creation date,
 * application-specific editable fields, account settings, and links to Clerk security.
 */
export default async function StudentProfilePage() {
  const data = await getStudentProfileData();

  return <StudentProfileView initialData={data} />;
}

