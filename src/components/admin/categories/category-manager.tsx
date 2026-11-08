'use client';

import * as React from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FolderTree,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CategoryItem,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  seedExampleCategoriesAction,
} from '@/app/actions/category-actions';
import { CATEGORY_ICON_OPTIONS, generateSlug } from '@/lib/validations/category';
import { getCategoryIcon } from '@/components/categories/category-filter';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CategoryManagerProps {
  initialCategories: CategoryItem[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = React.useState<CategoryItem[]>(initialCategories);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = React.useState<'name' | 'services' | 'newest'>('name');

  // Dialog states
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<CategoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Delete modal state
  const [categoryToDelete, setCategoryToDelete] = React.useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Seed state
  const [isSeeding, setIsSeeding] = React.useState(false);

  // Form Fields
  const [formData, setFormData] = React.useState({
    name: '',
    slug: '',
    description: '',
    icon: 'Building2',
    isActive: true,
  });
  const [formError, setFormError] = React.useState<string | null>(null);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: 'Building2',
      isActive: true,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (category: CategoryItem) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || 'HelpCircle',
      isActive: category.isActive,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Name change handler with auto-slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    if (!editingCategory) {
      setFormData((prev) => ({
        ...prev,
        name: newName,
        slug: generateSlug(newName),
      }));
    } else {
      setFormData((prev) => ({ ...prev, name: newName }));
    }
  };

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formData.name.trim().length < 2) {
      setFormError('Name must be at least 2 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const res = await updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          slug: formData.slug.trim() || generateSlug(formData.name),
          description: formData.description.trim() || undefined,
          icon: formData.icon,
          isActive: formData.isActive,
        });

        if (!res.success || !res.data) {
          setFormError(res.error || 'Failed to update category.');
          toast.error(res.error || 'Failed to update category.');
        } else {
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? res.data! : c))
          );
          toast.success(`Category "${res.data.name}" updated successfully.`);
          setIsFormOpen(false);
        }
      } else {
        const res = await createCategory({
          name: formData.name.trim(),
          slug: formData.slug.trim() || generateSlug(formData.name),
          description: formData.description.trim() || undefined,
          icon: formData.icon,
          isActive: formData.isActive,
        });

        if (!res.success || !res.data) {
          setFormError(res.error || 'Failed to create category.');
          toast.error(res.error || 'Failed to create category.');
        } else {
          setCategories((prev) => [res.data!, ...prev]);
          toast.success(`Category "${res.data.name}" created successfully.`);
          setIsFormOpen(false);
        }
      }
    } catch {
      setFormError('An unexpected server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Toggle Active Status
  const handleToggleStatus = async (cat: CategoryItem) => {
    try {
      const res = await toggleCategoryStatus(cat.id);
      if (res.success && res.data) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, isActive: res.data!.isActive } : c))
        );
        toast.success(
          `Category "${cat.name}" is now ${res.data.isActive ? 'Active' : 'Inactive'}.`
        );
      } else {
        toast.error(res.error || 'Failed to toggle status.');
      }
    } catch {
      toast.error('Network error updating category status.');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteCategory(categoryToDelete.id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
        toast.success(`Category "${categoryToDelete.name}" was deleted.`);
        setCategoryToDelete(null);
      } else {
        toast.error(res.error || 'Failed to delete category.');
      }
    } catch {
      toast.error('Network error deleting category.');
    } finally {
      setIsDeleting(false);
    }
  };

  // One-click Seed Example Categories
  const handleSeedExamples = async () => {
    setIsSeeding(true);
    try {
      const res = await seedExampleCategoriesAction();
      if (res.success) {
        toast.success(`Populated ${res.data?.count || 9} campus categories!`);
        // Refresh page to sync full count state
        window.location.reload();
      } else {
        toast.error(res.error || 'Could not seed categories.');
      }
    } catch {
      toast.error('Failed to seed categories.');
    } finally {
      setIsSeeding(false);
    }
  };

  // Filter & Sort Logic
  const filteredCategories = React.useMemo(() => {
    return categories
      .filter((cat) => {
        const matchesSearch =
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus =
          statusFilter === 'all'
            ? true
            : statusFilter === 'active'
            ? cat.isActive
            : !cat.isActive;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'services') return b.serviceCount - a.serviceCount;
        if (sortBy === 'newest')
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return a.name.localeCompare(b.name);
      });
  }, [categories, searchQuery, statusFilter, sortBy]);

  // Derived Stats
  const totalCategories = categories.length;
  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = totalCategories - activeCount;
  const totalServices = categories.reduce((sum, c) => sum + c.serviceCount, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Actions Bar */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-r from-blue-900/20 via-indigo-900/15 to-purple-900/20 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <FolderTree className="h-3.5 w-3.5" />
              <span>Campus Catalog Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Service Categories
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Organize campus offerings into clean functional categories with icon assignments,
              pricing scopes, and availability defaults.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedExamples}
              disabled={isSeeding}
              className="rounded-xl text-xs font-semibold gap-2 border-border/70 bg-card/60 hover:bg-muted"
            >
              <Sparkles className={cn('h-3.5 w-3.5 text-amber-500', isSeeding && 'animate-spin')} />
              <span>Seed Defaults</span>
            </Button>

            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="rounded-xl text-xs font-semibold gap-2 shadow-sm shadow-primary/25"
            >
              <Plus className="h-4 w-4" />
              <span>New Category</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/70 bg-card/60 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Categories
              </p>
              <p className="text-2xl font-black text-foreground">{totalCategories}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Layers className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-card/60 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Active Categories
              </p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-card/60 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Inactive
              </p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {inactiveCount}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-card/60 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Linked Services
              </p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {totalServices}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <FolderTree className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="rounded-2xl border-border/70 bg-card/60 backdrop-blur-sm p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category name, slug, description..."
              className="pl-9 h-10 rounded-xl bg-background/50 text-xs border-border/60"
            />
          </div>

          {/* Status Filter & Sort By */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Status:</span>
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val as 'all' | 'active' | 'inactive')}
              >
                <SelectTrigger className="h-9 w-32 rounded-xl text-xs bg-background/50 border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Sort By:</span>
              <Select
                value={sortBy}
                onValueChange={(val) => setSortBy(val as 'name' | 'services' | 'newest')}
              >
                <SelectTrigger className="h-9 w-36 rounded-xl text-xs bg-background/50 border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="services">Most Services</SelectItem>
                  <SelectItem value="newest">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-2 border-border/80 bg-card/40 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">No Categories Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No categories match your active search filters. Try adjusting your search query.'
              : 'There are no service categories configured yet. Click below to initialize standard campus categories.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {searchQuery ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="rounded-xl text-xs"
              >
                Clear Search
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSeedExamples}
                disabled={isSeeding}
                className="rounded-xl text-xs gap-2"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Initialize Example Categories</span>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);

            return (
              <Card
                key={cat.id}
                className={cn(
                  'rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between group hover:shadow-lg',
                  cat.isActive
                    ? 'border-border/70 bg-card/70 hover:border-border'
                    : 'border-border/40 bg-muted/20 opacity-80'
                )}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    {/* Category Icon Badge */}
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-transform group-hover:scale-105',
                        cat.isActive
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          : 'bg-muted text-muted-foreground border-border/50'
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    {/* Action Dropdown Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-44">
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(cat)}
                          className="text-xs cursor-pointer gap-2"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                          <span>Edit Details</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(cat)}
                          className="text-xs cursor-pointer gap-2"
                        >
                          {cat.isActive ? (
                            <>
                              <XCircle className="h-3.5 w-3.5 text-amber-500" />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Activate</span>
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => setCategoryToDelete(cat)}
                          className="text-xs text-destructive focus:text-destructive cursor-pointer gap-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Category</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Title & Slug */}
                  <div className="mt-4 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-foreground tracking-tight">
                        {cat.name}
                      </h3>
                      <Badge
                        variant={cat.isActive ? 'default' : 'secondary'}
                        className={cn(
                          'text-[10px] px-2 py-0 h-4 font-semibold',
                          cat.isActive
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {cat.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>

                    <p className="font-mono text-[11px] text-muted-foreground">/{cat.slug}</p>
                  </div>

                  {/* Description */}
                  {cat.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="p-5 pt-3 border-t border-border/50 bg-muted/20 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Catalog:</span>
                    <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 rounded-lg">
                      {cat.serviceCount} {cat.serviceCount === 1 ? 'service' : 'services'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(cat)}
                      className="h-8 px-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-3xl max-w-lg border-border/80 p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">
              {editingCategory ? 'Edit Service Category' : 'Create New Category'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure category branding, URL slug, and visibility for campus booking offerings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {formError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="category-name" className="text-xs font-bold">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g. Sports Facilities, Laboratories"
                className="h-10 rounded-xl text-xs bg-background/50 border-border/60"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="category-slug" className="text-xs font-bold">
                URL Slug <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="category-slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))
                  }
                  placeholder="e.g. sports-facilities"
                  className="h-10 rounded-xl text-xs font-mono bg-background/50 border-border/60"
                  required
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Lowercase letters, digits, and hyphens only.
              </p>
            </div>

            {/* Icon Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Category Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, icon: val }))}
              >
                <SelectTrigger className="h-10 rounded-xl text-xs bg-background/50 border-border/60">
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-56">
                  {CATEGORY_ICON_OPTIONS.map((opt) => {
                    const OptIcon = getCategoryIcon(opt.value);
                    return (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          <OptIcon className="h-4 w-4 text-primary" />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="category-desc" className="text-xs font-bold">
                Description
              </Label>
              <textarea
                id="category-desc"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief summary of services contained within this category..."
                rows={3}
                className="w-full rounded-xl border border-border/60 bg-background/50 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Active Status Checkbox */}
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="category-active" className="text-xs font-bold cursor-pointer">
                  Active Status
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Active categories appear on student search and service booking filters.
                </p>
              </div>

              <input
                type="checkbox"
                id="category-active"
                checked={formData.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </div>

            <DialogFooter className="mt-6 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="rounded-xl text-xs font-bold gap-2"
              >
                {isSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <DialogContent className="rounded-3xl max-w-md border-border/80 p-6 sm:p-8">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-black tracking-tight">
              Delete &quot;{categoryToDelete?.name}&quot;?
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this category?{' '}
              {categoryToDelete && categoryToDelete.serviceCount > 0 ? (
                <span className="text-destructive font-semibold">
                  This category currently contains {categoryToDelete.serviceCount} linked services.
                  Deleting it will unlink those services (their category will become unassigned).
                </span>
              ) : (
                'This action cannot be undone.'
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex gap-2 sm:justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCategoryToDelete(null)}
              disabled={isDeleting}
              className="rounded-xl text-xs flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="rounded-xl text-xs font-bold flex-1 gap-2"
            >
              {isDeleting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>Delete Category</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
