import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireStudent } from '@/lib/auth-role';
import { getStudentBookingTrackingDetails } from '@/app/actions/booking-actions';
import { BookingTrackingView } from '@/components/student/bookings/booking-tracking-view';

interface StudentBookingTrackingPageProps {
  params: Promise<{ bookingId: string }>;
}

export async function generateMetadata({
  params,
}: StudentBookingTrackingPageProps): Promise<Metadata> {
  const { bookingId } = await params;
  const booking = await getStudentBookingTrackingDetails(bookingId);

  if (!booking) {
    return {
      title: 'Booking Not Found | CampusServe',
    };
  }

  return {
    title: `Tracking Token ${booking.bookingCode} | ${booking.service.name}`,
    description: `Track real-time timeline, payment status, and verification pass for reservation ${booking.bookingCode}.`,
  };
}

/**
 * Route: /student/bookings/[bookingId]
 *
 * STRICT SECURITY INVARIANT:
 * - Scoped strictly to studentId === authenticatedStudent.id via requireStudent()
 * - Students can never view or access any other student's reservation
 */
export default async function StudentBookingTrackingPage({
  params,
}: StudentBookingTrackingPageProps) {
  await requireStudent();
  const { bookingId } = await params;
  const booking = await getStudentBookingTrackingDetails(bookingId);

  if (!booking) {
    notFound();
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <BookingTrackingView booking={booking} />
    </div>
  );
}

