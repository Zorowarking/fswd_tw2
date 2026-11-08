'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  CheckCheck,
  Star,
  ShieldAlert,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/sonner';
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  type FormattedNotification,
} from '@/app/actions/notification-actions';

export function NotificationMenu() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<FormattedNotification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

  const fetchNotifications = React.useCallback(async () => {
    try {
      const list = await getUserNotificationsAction();
      setNotifications(list);
    } catch (err) {
      console.warn('[NotificationMenu] Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and periodic polling
  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (isMounted) {
        await fetchNotifications();
      }
    };

    load();

    // Poll every 20 seconds for updates
    const interval = setInterval(load, 20000);

    // Refresh when user returns to tab
    const handleFocus = () => load();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unreadCount === 0) return;

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    toast.success('All notifications marked as read');

    try {
      await markAllNotificationsAsReadAction();
    } catch {
      toast.error('Failed to sync read status');
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (item: FormattedNotification) => {
    // Optimistic read status update
    if (item.unread) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
      );
      markNotificationAsReadAction(item.id).catch(() => {});
    }

    if (item.link) {
      setIsOpen(false);
      router.push(item.link);
    }
  };

  const handleDeleteNotification = async (
    e: React.MouseEvent,
    notificationId: string
  ) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    try {
      await deleteNotificationAction(notificationId);
      toast.success('Notification dismissed');
    } catch {
      toast.error('Failed to dismiss notification');
      fetchNotifications();
    }
  };

  const displayedNotifications = notifications.filter((n) =>
    filter === 'unread' ? n.unread : true
  );

  const getNotificationIcon = (type: FormattedNotification['type'], rawType: string) => {
    if (rawType.includes('CANCELLED') || rawType.includes('REJECTED')) {
      return <AlertTriangle className="h-4 w-4 text-rose-500" />;
    }
    if (type === 'booking') {
      return <CalendarCheck className="h-4 w-4 text-blue-500" />;
    }
    if (type === 'payment') {
      return <CreditCard className="h-4 w-4 text-emerald-500" />;
    }
    if (type === 'review') {
      return <Star className="h-4 w-4 text-amber-500 fill-amber-500" />;
    }
    return <ShieldAlert className="h-4 w-4 text-indigo-500" />;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-xl border-border/80 bg-background/60 shadow-sm hover:bg-muted focus-visible:ring-1 focus-visible:ring-primary"
          aria-label={`Open notifications (${unreadCount} unread)`}
        >
          <Bell className="h-4 w-4 text-foreground/80" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-sm ring-2 ring-background animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 rounded-2xl border-border bg-popover/95 p-0 shadow-2xl backdrop-blur-xl z-50 overflow-hidden"
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b border-border/60 p-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">Notifications</span>
            {unreadCount > 0 ? (
              <Badge variant="glow" className="text-[10px] px-1.5 py-0 font-bold">
                {unreadCount} Unread
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                All Read
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>

        {/* Quick Filter Bar */}
        <div className="flex items-center border-b border-border/40 px-3 py-1.5 bg-background/50 gap-1 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              filter === 'unread'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notification Items List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/30 p-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Checking notifications...</span>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <h4 className="text-xs font-bold text-foreground">You&apos;re All Caught Up</h4>
              <p className="text-[11px] text-muted-foreground max-w-[220px] leading-relaxed">
                {filter === 'unread'
                  ? 'No unread notifications right now.'
                  : 'You will receive updates here for reservations, token releases, and payments.'}
              </p>
            </div>
          ) : (
            displayedNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group flex items-start gap-3 rounded-xl p-3 text-xs transition-colors hover:bg-muted/60 cursor-pointer ${
                  item.unread ? 'bg-primary/5' : ''
                }`}
              >
                {/* Type Icon */}
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/50 ${
                    item.unread ? 'bg-background shadow-xs' : 'bg-muted/40'
                  }`}
                >
                  {getNotificationIcon(item.type, item.rawType)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={`text-xs truncate ${
                        item.unread
                          ? 'font-bold text-foreground'
                          : 'font-medium text-foreground/85'
                      }`}
                    >
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.unread && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotification(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-all"
                        title="Dismiss notification"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground/75 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> {item.time}
                    </span>
                    {item.link && (
                      <span className="inline-flex items-center gap-0.5 text-primary text-[10px] font-medium group-hover:underline">
                        View details <ExternalLink className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 bg-muted/10 p-2 text-center">
          <span className="text-[10px] text-muted-foreground">
            CampusServe Smart Notification Engine
          </span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
