'use server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-role';
import { revalidatePath } from 'next/cache';
import { BookingStatus, NotificationType, Role } from '@prisma/client';

export type NotificationCategory = 'booking' | 'payment' | 'review' | 'alert';

export interface FormattedNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: NotificationCategory;
  rawType: string;
  link: string | null;
  createdAt: string;
}

/**
 * Checks and generates reminder notifications for upcoming confirmed bookings within 24 hours.
 */
async function checkUpcomingBookingsForStudent(userId: string) {
  try {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingBookings = await db.booking.findMany({
      where: {
        studentId: userId,
        status: BookingStatus.CONFIRMED,
        scheduledAt: {
          gte: new Date(now.getTime() - 60 * 60 * 1000), // from 1 hour ago
          lte: next24h,
        },
      },
      include: {
        service: {
          select: { name: true },
        },
      },
      take: 5,
    });

    if (upcomingBookings.length === 0) return;

    const links = upcomingBookings.map((b) => `/student/bookings/${b.id}`);
    const existingReminders = await db.notification.findMany({
      where: {
        userId,
        link: { in: links },
        title: { contains: 'Upcoming' },
      },
      select: { link: true },
    });

    const existingLinksSet = new Set(existingReminders.map((r) => r.link));
    const newNotifications = upcomingBookings
      .filter((b) => !existingLinksSet.has(`/student/bookings/${b.id}`))
      .map((b) => {
        const dateStr = b.scheduledAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        return {
          userId,
          type: NotificationType.BOOKING_CONFIRMED,
          title: 'Upcoming Booking Reminder',
          message: `Reminder: You have a confirmed reservation for "${b.service.name}" (${b.bookingCode}) on ${dateStr} at ${b.slotTime || 'Standard Slot'}.`,
          link: `/student/bookings/${b.id}`,
        };
      });

    if (newNotifications.length > 0) {
      await db.notification.createMany({ data: newNotifications });
    }
  } catch (err) {
    console.error('Failed to process upcoming booking reminders:', err);
  }
}

/**
 * Retrieves the latest in-app notifications for the currently authenticated user.
 */
export async function getUserNotificationsAction(): Promise<FormattedNotification[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    // Trigger upcoming booking check for active students
    if (user.role === Role.STUDENT) {
      await checkUpcomingBookingsForStudent(user.id);
    }

    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const now = new Date();

    return notifications.map((n) => {
      // Relative time formatting
      const diffMs = now.getTime() - n.createdAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let time = 'Just now';
      if (diffMins > 0 && diffMins < 60) {
        time = `${diffMins}m ago`;
      } else if (diffHours >= 1 && diffHours < 24) {
        time = `${diffHours}h ago`;
      } else if (diffDays >= 1 && diffDays < 7) {
        time = `${diffDays}d ago`;
      } else if (diffDays >= 7) {
        time = n.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      let category: NotificationCategory = 'alert';
      const typeStr = String(n.type);
      if (typeStr.startsWith('BOOKING')) {
        category = 'booking';
      } else if (typeStr.startsWith('PAYMENT')) {
        category = 'payment';
      } else if (typeStr.startsWith('REVIEW')) {
        category = 'review';
      }

      return {
        id: n.id,
        title: n.title,
        description: n.message,
        time,
        unread: !n.isRead,
        type: category,
        rawType: typeStr,
        link: n.link || null,
        createdAt: n.createdAt.toISOString(),
      };
    });
  } catch (err) {
    console.warn('[getUserNotificationsAction] Error fetching notifications:', err);
    return [];
  }
}

/**
 * Retrieves count of unread notifications for fast header badge sync.
 */
export async function getUnreadNotificationCountAction(): Promise<number> {
  try {
    const user = await getCurrentUser();
    if (!user) return 0;

    return await db.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });
  } catch (err) {
    console.warn('[getUnreadNotificationCountAction] Error:', err);
    return 0;
  }
}

/**
 * Marks a specific notification as read.
 */
export async function markNotificationAsReadAction(notificationId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    await db.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.id, // Strictly scoped to authenticated user
      },
      data: { isRead: true },
    });

    return true;
  } catch (err) {
    console.warn('[markNotificationAsReadAction] Error:', err);
    return false;
  }
}

/**
 * Marks all notifications for the current user as read.
 */
export async function markAllNotificationsAsReadAction(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    await db.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    revalidatePath('/student/dashboard');
    revalidatePath('/provider/dashboard');
    revalidatePath('/admin/dashboard');
    return true;
  } catch (err) {
    console.warn('[markAllNotificationsAsReadAction] Error:', err);
    return false;
  }
}

/**
 * Deletes / dismisses a single notification.
 */
export async function deleteNotificationAction(notificationId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    await db.notification.deleteMany({
      where: {
        id: notificationId,
        userId: user.id,
      },
    });

    return true;
  } catch (err) {
    console.warn('[deleteNotificationAction] Error:', err);
    return false;
  }
}
