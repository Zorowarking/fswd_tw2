import type { Metadata } from 'next';
import { requireStudent } from '@/lib/auth-role';
import { getStudentBookingsAction } from '@/app/actions/booking-actions';
import { BookingListView } from '@/components/student/bookings/booking-list-view';

export const metadata: Metadata = {
  title: 'My Bookings | CampusServe Student Portal',
  description:
    'Manage, view digital tokens, verify payment status, and track upcoming and past campus service reservations.',
};

/**
 * Server page component for /student/bookings
 *
 * STRICT SECURITY INVARIANT:
 * - Route guarded by requireStudent()
 * - Queries are strictly scoped to where studentId === authenticated student's ID
 * - Students can never view or access any other user's booking data
 */
export default async function StudentBookingsPage() {
  await requireStudent();
  const bookingsData = await getStudentBookingsAction();

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <BookingListView initialData={bookingsData} />
    </div>
  );
}

