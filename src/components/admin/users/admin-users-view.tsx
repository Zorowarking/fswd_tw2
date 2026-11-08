'use client';

import * as React from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  GraduationCap,
  Building2,
  Shield,
  HelpCircle,
  Eye,
  Edit,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { EmptyState, TableEmptyState } from '@/components/ui/empty-state';
import {
  getAdminUsersData,
  adminUpdateUserAction,
  getAdminUserDetails,
  type AdminUsersData,
  type AdminUserListItem,
  type AdminUserDetailActivity,
  type AdminUsersFilterParams,
} from '@/app/actions/admin-users-actions';
import { Role } from '@prisma/client';

interface AdminUsersViewProps {
  initialData: AdminUsersData;
}

export function AdminUsersView({ initialData }: AdminUsersViewProps) {
  const [users, setUsers] = React.useState<AdminUserListItem[]>(initialData.users);
  const [metrics, setMetrics] = React.useState(initialData.metrics);
  const currentAdminId = initialData.currentAdminId;

  // Pagination & Server Filter states
  const [totalCount, setTotalCount] = React.useState(initialData.totalCount ?? initialData.users.length);
  const [totalPages, setTotalPages] = React.useState(initialData.totalPages ?? 1);
  const [currentPage, setCurrentPage] = React.useState(initialData.currentPage ?? 1);
  const [pageSize, setPageSize] = React.useState(initialData.pageSize ?? 10);
  const [isPending, startTransition] = React.useTransition();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<'ALL' | Role | 'UNASSIGNED'>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'ONBOARDING_PENDING'>('ALL');
  const [dateFilter, setDateFilter] = React.useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'>('ALL');

  // Inspection Modal state
  const [selectedUserForDetails, setSelectedUserForDetails] = React.useState<AdminUserListItem | null>(null);
  const [detailedActivity, setDetailedActivity] = React.useState<AdminUserDetailActivity | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);

  // Edit User Modal state
  const [editingUser, setEditingUser] = React.useState<AdminUserListItem | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editRole, setEditRole] = React.useState<Role | 'UNASSIGNED'>('UNASSIGNED');
  const [isSubmittingEdit, setIsSubmittingEdit] = React.useState(false);

  // Server-side data fetcher with optimistic responsiveness
  const loadData = React.useCallback(
    (overrides?: Partial<AdminUsersFilterParams>) => {
      startTransition(async () => {
        try {
          const res = await getAdminUsersData({
            searchQuery: overrides?.searchQuery !== undefined ? overrides.searchQuery : searchQuery,
            roleFilter: overrides?.roleFilter !== undefined ? overrides.roleFilter : roleFilter,
            statusFilter: overrides?.statusFilter !== undefined ? overrides.statusFilter : statusFilter,
            dateFilter: overrides?.dateFilter !== undefined ? overrides.dateFilter : dateFilter,
            page: overrides?.page !== undefined ? overrides.page : currentPage,
            pageSize: overrides?.pageSize !== undefined ? overrides.pageSize : pageSize,
          });
          setUsers(res.users);
          setTotalCount(res.totalCount);
          setTotalPages(res.totalPages);
          setCurrentPage(res.currentPage);
          setMetrics(res.metrics);
        } catch (err) {
          console.error('Failed to load users:', err);
          toast.error('Failed to refresh users from database.');
        }
      });
    },
    [searchQuery, roleFilter, statusFilter, dateFilter, currentPage, pageSize]
  );

  const loadDataRef = React.useRef(loadData);
  React.useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  // Debounced search query
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      loadDataRef.current({ searchQuery, page: 1 });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRoleChange = (newRole: 'ALL' | Role | 'UNASSIGNED') => {
    setRoleFilter(newRole);
    loadData({ roleFilter: newRole, page: 1 });
  };

  const handleStatusChange = (newStatus: 'ALL' | 'ACTIVE' | 'ONBOARDING_PENDING') => {
    setStatusFilter(newStatus);
    loadData({ statusFilter: newStatus, page: 1 });
  };

  const handleDateChange = (newDate: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR') => {
    setDateFilter(newDate);
    loadData({ dateFilter: newDate, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadData({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    loadData({ pageSize: newSize, page: 1 });
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() || roleFilter !== 'ALL' || statusFilter !== 'ALL' || dateFilter !== 'ALL'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setDateFilter('ALL');
    setCurrentPage(1);
    loadData({
      searchQuery: '',
      roleFilter: 'ALL',
      statusFilter: 'ALL',
      dateFilter: 'ALL',
      page: 1,
    });
  };

  // Load user detailed activity when detail modal opens
  const handleOpenDetails = async (user: AdminUserListItem) => {
    setSelectedUserForDetails(user);
    setIsLoadingDetails(true);
    setDetailedActivity(null);

    try {
      const details = await getAdminUserDetails(user.id);
      setDetailedActivity(details);
    } catch (err) {
      console.error('[handleOpenDetails error]:', err);
      toast.error('Failed to load user activity details.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Open Edit User modal
  const handleOpenEdit = (user: AdminUserListItem) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditPhone(user.phone || '');
    setEditRole(user.role || 'UNASSIGNED');
  };

  // Submit Admin Edit User Action
  const handleSaveUserChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmittingEdit(true);

    try {
      const targetRole: Role | null = editRole === 'UNASSIGNED' ? null : editRole;

      const result = await adminUpdateUserAction({
        userId: editingUser.id,
        name: editName,
        phone: editPhone || null,
        role: targetRole,
      });

      if (!result.success || !result.user) {
        toast.error(result.error || 'Failed to update user.');
        setIsSubmittingEdit(false);
        return;
      }

      // Update local state smoothly
      const updatedUserList = users.map((u) => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            name: result.user!.name,
            phone: result.user!.phone,
            role: result.user!.role,
            accountStatus: (result.user!.role ? 'ACTIVE' : 'ONBOARDING_PENDING') as 'ACTIVE' | 'ONBOARDING_PENDING',
          };
        }
        return u;
      });

      setUsers(updatedUserList);

      // Recalculate metrics
      const newStudents = updatedUserList.filter((u) => u.role === Role.STUDENT).length;
      const newProviders = updatedUserList.filter((u) => u.role === Role.SERVICE_PROVIDER).length;
      const newAdmins = updatedUserList.filter((u) => u.role === Role.ADMIN).length;
      const newUnassigned = updatedUserList.filter((u) => u.role === null).length;

      setMetrics({
        ...metrics,
        studentsCount: newStudents,
        providersCount: newProviders,
        adminsCount: newAdmins,
        unassignedCount: newUnassigned,
      });

      toast.success('User updated successfully!', {
        description: `Updated role and contact coordinates for ${result.user.name || editingUser.email}.`,
      });

      setEditingUser(null);
    } catch (err: unknown) {
      console.error('[handleSaveUserChanges error]:', err);
      toast.error('An unexpected error occurred while saving user changes.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const getRoleBadge = (role: Role | null) => {
    switch (role) {
      case Role.STUDENT:
        return (
          <Badge variant="glow" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30 gap-1">
            <GraduationCap className="h-3 w-3" />
            <span>Student</span>
          </Badge>
        );
      case Role.SERVICE_PROVIDER:
        return (
          <Badge variant="glow" className="text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/30 gap-1">
            <Building2 className="h-3 w-3" />
            <span>Service Provider</span>
          </Badge>
        );
      case Role.ADMIN:
        return (
          <Badge variant="destructive" className="text-[10px] gap-1 shadow-sm">
            <Shield className="h-3 w-3" />
            <span>Administrator</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px] text-amber-500 bg-amber-500/10 border-amber-500/30 gap-1">
            <HelpCircle className="h-3 w-3" />
            <span>Unassigned (Onboarding)</span>
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Campus User Directory
            </h1>
            <Badge variant="glow" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Admin Portal
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage authenticated campus accounts, verify role assignments, inspect booking volume, and execute administrative actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-3 py-1 font-mono">
            {users.length} Total Users
          </Badge>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-4 space-y-1.5 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Accounts</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-extrabold text-foreground">{metrics.totalUsers}</p>
          <span className="text-[10px] text-muted-foreground">Registered in Neon DB</span>
        </Card>

        <Card className="p-4 space-y-1.5 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Students</span>
            <GraduationCap className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-blue-400">{metrics.studentsCount}</p>
          <span className="text-[10px] text-muted-foreground">Campus booking clients</span>
        </Card>

        <Card className="p-4 space-y-1.5 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Providers</span>
            <Building2 className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-400">{metrics.providersCount}</p>
          <span className="text-[10px] text-muted-foreground">Campus facility desks</span>
        </Card>

        <Card className="p-4 space-y-1.5 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Admins</span>
            <Shield className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-rose-400">{metrics.adminsCount}</p>
          <span className="text-[10px] text-muted-foreground">System administrators</span>
        </Card>

        <Card className="p-4 space-y-1.5 bg-card/60 border-border/60 backdrop-blur-xl col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>In Onboarding</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400">{metrics.unassignedCount}</p>
          <span className="text-[10px] text-muted-foreground">Pending role selection</span>
        </Card>
      </div>

      {/* Search, Filter Tabs & Controls */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              {isPending ? (
                <Loader2 className="absolute left-3 top-2.5 h-4 w-4 text-primary animate-spin" />
              ) : (
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, or ID..."
                className="w-full rounded-xl border border-border/80 bg-background/80 pl-9 pr-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Registration Date Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined:
                </span>
                <select
                  value={dateFilter}
                  onChange={(e) => handleDateChange(e.target.value as typeof dateFilter)}
                  className="rounded-xl border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="WEEK">Past 7 Days</option>
                  <option value="MONTH">Past 30 Days</option>
                  <option value="YEAR">Past Year</option>
                </select>
              </div>

              {/* Account Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value as typeof statusFilter)}
                  className="rounded-xl border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active (Role Set)</option>
                  <option value="ONBOARDING_PENDING">Onboarding</option>
                </select>
              </div>
            </div>
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-border/40 pt-3">
            <span className="text-xs font-semibold text-muted-foreground mr-1 whitespace-nowrap">
              Role:
            </span>
            <Button
              variant={roleFilter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleChange('ALL')}
              className="h-7 text-xs px-2.5 font-medium rounded-lg"
            >
              All ({metrics.totalUsers})
            </Button>
            <Button
              variant={roleFilter === Role.STUDENT ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleChange(Role.STUDENT)}
              className="h-7 text-xs px-2.5 font-medium rounded-lg"
            >
              Students ({metrics.studentsCount})
            </Button>
            <Button
              variant={roleFilter === Role.SERVICE_PROVIDER ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleChange(Role.SERVICE_PROVIDER)}
              className="h-7 text-xs px-2.5 font-medium rounded-lg"
            >
              Providers ({metrics.providersCount})
            </Button>
            <Button
              variant={roleFilter === Role.ADMIN ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleChange(Role.ADMIN)}
              className="h-7 text-xs px-2.5 font-medium rounded-lg"
            >
              Admins ({metrics.adminsCount})
            </Button>
            <Button
              variant={roleFilter === 'UNASSIGNED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleChange('UNASSIGNED')}
              className="h-7 text-xs px-2.5 font-medium rounded-lg"
            >
              Unassigned ({metrics.unassignedCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Data Table */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden shadow-xl">
        <CardHeader className="py-4 px-6 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Registered Accounts</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Showing {users.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount} accounts matching filters.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            <span>Zero Sensitive Auth Data Exposed</span>
          </Badge>
        </CardHeader>

        {/* MOBILE CARD VIEW (Block on mobile, hidden on md+) */}
        <div className="block md:hidden">
          {users.length === 0 ? (
            <div className="p-6">
              <EmptyState
                compact
                icon={Users}
                title="No campus users found"
                description={
                  hasActiveFilters
                    ? 'No user records match your active search or filter criteria. Try resetting filters.'
                    : 'No users registered in this university directory.'
                }
                actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
                onAction={hasActiveFilters ? handleResetFilters : undefined}
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {users.map((u) => {
                const isCurrentAdmin = u.id === currentAdminId;
                const isInternalName = !u.name || u.name.startsWith('user_');
                const displayName: string = isInternalName
                  ? u.role === 'ADMIN'
                    ? 'Campus Administrator'
                    : u.role === 'SERVICE_PROVIDER'
                    ? 'Campus Provider'
                    : 'Campus Student'
                  : (u.name ?? 'Campus Member');
                const isInternalEmail =
                  u.email.startsWith('user_') && u.email.endsWith('@campusserve.edu');
                const displayEmail: string = isInternalEmail
                  ? u.role === 'ADMIN'
                    ? 'admin@campusserve.edu'
                    : u.role === 'SERVICE_PROVIDER'
                    ? 'provider@campus.edu'
                    : 'student@campus.edu'
                  : u.email;

                return (
                  <div key={u.id} className="p-4 space-y-3 bg-card/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.avatarUrl}
                            alt={displayName}
                            className="h-10 w-10 rounded-xl object-cover ring-1 ring-border/60 shrink-0"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold text-foreground truncate">{displayName}</span>
                            {isCurrentAdmin && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-rose-500/40 text-rose-400">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{displayEmail}</p>
                        </div>
                      </div>
                      <div className="shrink-0">{getRoleBadge(u.role)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/30">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Phone</span>
                        <span className="font-mono text-foreground/90">{u.phone || 'Not set'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Status</span>
                        {u.accountStatus === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold text-[11px]">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-500 font-semibold text-[11px]">
                            <Clock className="h-3 w-3" /> Onboarding
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Bookings</span>
                        <span className="font-semibold text-foreground">{u.totalBookingsCount} Total</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Joined</span>
                        <span>{u.formattedJoinedDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetails(u)}
                        className="flex-1 text-xs h-8 gap-1 rounded-xl"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(u)}
                        className="flex-1 text-xs h-8 gap-1 rounded-xl text-primary border-primary/30"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Manage</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DESKTOP TABLE VIEW (Hidden on mobile, block on md+) */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold text-foreground">User Identity</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Role</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Contact Phone</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Booking Volume</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Account Status</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Registered</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableEmptyState
                  colSpan={7}
                  title="No campus users found"
                  description={
                    hasActiveFilters
                      ? 'No user records match your active search or filter criteria. Try resetting filters.'
                      : 'No users registered in this university directory.'
                  }
                  actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
                  onAction={hasActiveFilters ? handleResetFilters : undefined}
                />
              ) : (
                users.map((u) => {
                  const isCurrentAdmin = u.id === currentAdminId;
                  const isInternalName = !u.name || u.name.startsWith('user_');
                  const displayName: string = isInternalName
                    ? u.role === 'ADMIN'
                      ? 'Campus Administrator'
                      : u.role === 'SERVICE_PROVIDER'
                      ? 'Campus Provider'
                      : 'Campus Student'
                    : (u.name ?? 'Campus Member');
                  const isInternalEmail =
                    u.email.startsWith('user_') && u.email.endsWith('@campusserve.edu');
                  const displayEmail: string = isInternalEmail
                    ? u.role === 'ADMIN'
                      ? 'admin@campusserve.edu'
                      : u.role === 'SERVICE_PROVIDER'
                      ? 'provider@campus.edu'
                      : 'student@campus.edu'
                    : u.email;

                  return (
                    <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                      {/* Identity */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u.avatarUrl}
                              alt={displayName}
                              className="h-8 w-8 rounded-xl object-cover ring-1 ring-border/60"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <span>{displayName}</span>
                              {isCurrentAdmin && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-rose-500/40 text-rose-400">
                                  You
                                </Badge>
                              )}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                              {displayEmail}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        {getRoleBadge(u.role)}
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="text-xs text-muted-foreground">
                        {u.phone ? (
                          <span className="font-mono text-foreground/90">{u.phone}</span>
                        ) : (
                          <span className="italic text-muted-foreground/60">Not set</span>
                        )}
                      </TableCell>

                      {/* Booking Count */}
                      <TableCell>
                        <div className="flex flex-col space-y-0.5">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1">
                            <Inbox className="h-3 w-3 text-blue-500" />
                            <span>{u.totalBookingsCount} Total Bookings</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {u.role === Role.SERVICE_PROVIDER
                              ? `${u.providerBookingsCount} handled as vendor (${u.servicesCount} services)`
                              : `${u.studentBookingsCount} student orders`}
                          </span>
                        </div>
                      </TableCell>

                      {/* Account Status */}
                      <TableCell>
                        {u.accountStatus === 'ACTIVE' ? (
                          <Badge variant="glow" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>Active</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] text-amber-500 bg-amber-500/10 border-amber-500/30 gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            <span>Onboarding Pending</span>
                          </Badge>
                        )}
                      </TableCell>

                      {/* Joined Date */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {u.formattedJoinedDate}
                      </TableCell>

                      {/* Administrative Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetails(u)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            title="View User Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(u)}
                            className="h-8 px-2.5 text-xs font-medium gap-1"
                            title="Edit Role / User Details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Manage</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-border/70 bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>
              Page {currentPage} of {totalPages} ({totalCount} total accounts)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() => handlePageChange(currentPage - 1)}
              className="h-8 px-2.5 text-xs rounded-lg"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = Math.min(currentPage - 2 + i, totalPages - 4 + i);
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    disabled={isPending}
                    onClick={() => handlePageChange(pageNum)}
                    className="h-8 w-8 p-0 text-xs rounded-lg"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isPending}
              onClick={() => handlePageChange(currentPage + 1)}
              className="h-8 px-2.5 text-xs rounded-lg"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* User Details Inspection Dialog */}
      <Dialog open={selectedUserForDetails !== null} onOpenChange={(open) => !open && setSelectedUserForDetails(null)}>
        <DialogContent className="max-w-2xl rounded-2xl border-border bg-card p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-2 border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <DialogTitle className="text-lg font-bold">
                  User Account Inspection
                </DialogTitle>
              </div>
              {selectedUserForDetails && getRoleBadge(selectedUserForDetails.role)}
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Administrative profile audit. Sensitive credentials, password hashes, and session secrets are cryptographically shielded.
            </DialogDescription>
          </DialogHeader>

          {selectedUserForDetails && (() => {
            const isInternalModalName =
              !selectedUserForDetails.name || selectedUserForDetails.name.startsWith('user_');
            const modalDisplayName: string = isInternalModalName
              ? selectedUserForDetails.role === 'ADMIN'
                ? 'Campus Administrator'
                : selectedUserForDetails.role === 'SERVICE_PROVIDER'
                ? 'Campus Provider'
                : 'Campus Student'
              : (selectedUserForDetails.name ?? 'Campus Member');
            const isInternalModalEmail =
              selectedUserForDetails.email.startsWith('user_') &&
              selectedUserForDetails.email.endsWith('@campusserve.edu');
            const modalDisplayEmail: string = isInternalModalEmail
              ? selectedUserForDetails.role === 'ADMIN'
                ? 'admin@campusserve.edu'
                : selectedUserForDetails.role === 'SERVICE_PROVIDER'
                ? 'provider@campus.edu'
                : 'student@campus.edu'
              : selectedUserForDetails.email;

            return (
              <div className="space-y-6 pt-3 text-xs">
                {/* Identity Overview */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-muted/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-md">
                    {modalDisplayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">
                      {modalDisplayName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-primary" />
                        <span>{modalDisplayEmail}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-primary" />
                        <span>{selectedUserForDetails.phone || 'No phone set'}</span>
                      </span>
                    </div>
                  </div>
                </div>

              {/* Technical Account Coordinates */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-border/50 bg-background/50">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Database Record ID</span>
                  <span className="font-mono text-xs font-semibold text-foreground select-all">{selectedUserForDetails.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Clerk Identity UID</span>
                  <span className="font-mono text-xs font-semibold text-foreground select-all">{selectedUserForDetails.clerkUserId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Registration Date</span>
                  <span className="text-xs text-foreground">{selectedUserForDetails.formattedJoinedDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Account Status</span>
                  <span className="text-xs font-bold text-emerald-400">{selectedUserForDetails.accountStatus}</span>
                </div>
              </div>

              {/* Activity History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Inbox className="h-3.5 w-3.5 text-primary" />
                  <span>Activity & Relations</span>
                </h4>

                {isLoadingDetails ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Loading user activity records...</span>
                  </div>
                ) : detailedActivity ? (
                  <div className="space-y-4">
                    {/* Student Bookings */}
                    {detailedActivity.studentBookings.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-muted-foreground">
                          Recent Bookings Made ({detailedActivity.studentBookings.length}):
                        </span>
                        <div className="space-y-1.5">
                          {detailedActivity.studentBookings.map((b) => (
                            <div key={b.id} className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-background/40">
                              <div>
                                <span className="font-bold text-foreground text-xs">{b.serviceName}</span>
                                <span className="text-[10px] text-muted-foreground block font-mono">Ref: {b.bookingCode} • {b.scheduledAt}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-xs text-foreground block">₹{b.amount}</span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0">{b.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Provider Services */}
                    {detailedActivity.providerServices.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-muted-foreground">
                          Owned Services ({detailedActivity.providerServices.length}):
                        </span>
                        <div className="space-y-1.5">
                          {detailedActivity.providerServices.map((s) => (
                            <div key={s.id} className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-background/40">
                              <div>
                                <span className="font-bold text-foreground text-xs">{s.name}</span>
                                <span className="text-[10px] text-muted-foreground block">{s.category} • ₹{s.price}</span>
                              </div>
                              <div className="text-right">
                                <Badge variant={s.isActive ? 'success' : 'secondary'} className="text-[9px] px-1 py-0">
                                  {s.isActive ? 'Active' : 'Paused'}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground block">{s.bookingsCount} orders</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reviews */}
                    {detailedActivity.reviews.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-muted-foreground">
                          Reviews Shared ({detailedActivity.reviews.length}):
                        </span>
                        <div className="space-y-1.5">
                          {detailedActivity.reviews.map((r) => (
                            <div key={r.id} className="p-2 rounded-lg border border-border/40 bg-background/40 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-foreground">{r.serviceName}</span>
                                <span className="text-amber-400 font-bold text-xs">{r.rating} ★</span>
                              </div>
                              {r.comment && (
                                <p className="text-[11px] text-muted-foreground italic">&ldquo;{r.comment}&rdquo;</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {detailedActivity.studentBookings.length === 0 &&
                      detailedActivity.providerServices.length === 0 &&
                      detailedActivity.reviews.length === 0 && (
                        <p className="text-muted-foreground text-xs italic py-2">
                          No booking, service listing, or review records created yet by this user.
                        </p>
                      )}
                  </div>
                ) : null}
                </div>
              </div>
            );
          })()}

          <DialogFooter className="pt-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUserForDetails(null)}
              className="text-xs"
            >
              Close
            </Button>
            {selectedUserForDetails && (
              <Button
                variant="gradient"
                size="sm"
                onClick={() => {
                  const target = selectedUserForDetails;
                  setSelectedUserForDetails(null);
                  handleOpenEdit(target);
                }}
                className="text-xs gap-1.5 font-semibold"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit User Role & Contact</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Administrative Edit User Modal */}
      <Dialog open={editingUser !== null} onOpenChange={(open) => !open && !isSubmittingEdit && setEditingUser(null)}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Edit className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">
                Administrative User Management
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify account role, campus display name, or emergency contact phone number.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleSaveUserChanges} className="space-y-4 pt-2">
              {editingUser.id === currentAdminId && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400">
                  <span className="font-bold">Active Account Notice: </span>
                  You are viewing your own administrator account. Admin role demotion is disabled for security.
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  User Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Sunil Kumar"
                  className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Assigned Campus Role
                </label>
                <select
                  value={editRole}
                  disabled={editingUser.id === currentAdminId}
                  onChange={(e) => setEditRole(e.target.value as typeof editRole)}
                  className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value={Role.STUDENT}>STUDENT (Campus Student Portal)</option>
                  <option value={Role.SERVICE_PROVIDER}>SERVICE_PROVIDER (Service Desk & Operations)</option>
                  <option value={Role.ADMIN}>ADMIN (Campus Central Administration)</option>
                  <option value="UNASSIGNED">UNASSIGNED (Reset to Onboarding / Select Role)</option>
                </select>
                <span className="text-[10px] text-muted-foreground block">
                  Selecting UNASSIGNED resets the user&apos;s role back to initial onboarding.
                </span>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmittingEdit}
                  onClick={() => setEditingUser(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  size="sm"
                  disabled={isSubmittingEdit}
                  className="gap-1.5 text-xs font-semibold shadow-md shadow-primary/20"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Save Account Changes</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
