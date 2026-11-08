'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  X,
  Compass,
  ArrowUpDown,
  Tag,
  DollarSign,
  RotateCcw,
  Layers,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryIcon } from '@/components/categories/category-filter';
import { StudentServiceCard } from './student-service-card';
import { StudentServiceEmpty } from './student-service-empty';
import { StudentServicePagination } from './student-service-pagination';
import type { StudentServicesResult } from '@/app/actions/student-service-actions';

interface StudentServiceDiscoveryViewProps {
  initialData: StudentServicesResult;
  searchQuery?: string;
  selectedCategory?: string;
  selectedPrice?: string;
  selectedSort?: string;
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured & Recommended' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest Additions' },
];

const PRICE_TIERS = [
  { value: 'all', label: 'All Prices' },
  { value: 'free', label: 'Free (₹0)' },
  { value: 'under-100', label: 'Under ₹100' },
  { value: '100-500', label: '₹100 to ₹500' },
  { value: 'above-500', label: 'Above ₹500' },
];

export function StudentServiceDiscoveryView({
  initialData,
  searchQuery = '',
  selectedCategory = 'all',
  selectedPrice = 'all',
  selectedSort = 'featured',
}: StudentServiceDiscoveryViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  // Search input local state
  const [searchInput, setSearchInput] = React.useState(searchQuery);
  const [prevSearchQuery, setPrevSearchQuery] = React.useState(searchQuery);

  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setSearchInput(searchQuery);
  }

  // Helper to update URL search parameters and trigger server-side query with transition
  const updateQueryParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams ? searchParams.toString() : '');

      for (const [key, value] of Object.entries(updates)) {
        if (
          value === null ||
          value === '' ||
          value === 'all' ||
          (key === 'sort' && value === 'featured') ||
          (key === 'page' && value === '1')
        ) {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      }

      const queryString = current.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      startTransition(() => {
        router.push(targetUrl);
      });
    },
    [router, pathname, searchParams]
  );

  // Debounced auto-search for responsive, live typing experience
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== searchQuery) {
        updateQueryParams({
          q: searchInput.trim() || null,
          page: '1',
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, updateQueryParams]);

  // Search submit handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams({
      q: searchInput.trim() || null,
      page: '1', // Reset to page 1 on new search
    });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateQueryParams({
      q: null,
      page: '1',
    });
  };

  const handleCategorySelect = (categorySlug: string) => {
    updateQueryParams({
      category: categorySlug === 'all' ? null : categorySlug,
      page: '1',
    });
  };

  const handlePriceSelect = (priceValue: string) => {
    updateQueryParams({
      price: priceValue === 'all' ? null : priceValue,
      page: '1',
    });
  };

  const handleSortSelect = (sortValue: string) => {
    updateQueryParams({
      sort: sortValue === 'featured' ? null : sortValue,
      page: '1',
    });
  };

  const handlePageChange = (newPage: number) => {
    updateQueryParams({
      page: String(newPage),
    });
    // Smooth scroll back to top of marketplace grid
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleResetAllFilters = () => {
    setSearchInput('');
    updateQueryParams({
      q: null,
      category: null,
      price: null,
      sort: null,
      page: null,
    });
  };

  const activeCategoryObj = initialData.categories.find(
    (c) => c.slug === selectedCategory || c.id === selectedCategory
  );

  const activeCategoryName = activeCategoryObj?.name;
  const hasActiveFilters = Boolean(
    searchQuery || (selectedCategory && selectedCategory !== 'all') || (selectedPrice && selectedPrice !== 'all')
  );

  return (
    <div className="space-y-8">
      {/* 1. Hero Marketplace Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-card p-6 sm:p-8 backdrop-blur-xl shadow-lg shadow-blue-500/5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="glow" className="gap-1 px-2.5 py-0.5 text-[11px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                <Compass className="h-3.5 w-3.5 text-blue-400" />
                <span>Verified Campus Marketplace</span>
              </Badge>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-mono">
                {initialData.priceCounts.all} active university amenities
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Discover Campus Services
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Explore and reserve certified academic facilities, sports arenas, laundry hubs,
              specialized equipment, and transportation slots across campus with guaranteed student pricing.
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card/70 p-3.5 backdrop-blur-sm sm:min-w-[280px]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-foreground">
                {initialData.priceCounts.free} Free Facilities Available
              </span>
              <span className="text-[11px] text-muted-foreground">
                Auditoriums, open stages, and IT desks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Horizontal Category Filter Scroller */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-blue-500" />
            Categories
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            {initialData.categories.length} campus departments
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {/* All Categories Pill */}
          <button
            type="button"
            onClick={() => handleCategorySelect('all')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-500/30'
                : 'border border-border/70 bg-card/80 text-foreground hover:bg-muted/50'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>All Services</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {initialData.priceCounts.all}
            </span>
          </button>

          {/* Each Category Pill */}
          {initialData.categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.slug)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-500/30'
                    : 'border border-border/70 bg-card/80 text-foreground hover:bg-muted/50'
                }`}
              >
                <CategoryIcon name={cat.icon} className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>{cat.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search, Price Filter, and Sorting Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between rounded-2xl border border-border/70 bg-card/60 p-3.5 backdrop-blur-sm">
        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          {isPending ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          )}
          <Input
            type="text"
            placeholder="Search campus amenities, labs, equipment, locations..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 pr-16 text-xs bg-background/50 h-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              title="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
          >
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Price Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:inline" />
            <Select value={selectedPrice} onValueChange={handlePriceSelect}>
              <SelectTrigger className="w-[150px] text-xs h-9 bg-background/50">
                <SelectValue placeholder="Price Tier" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_TIERS.map((tier) => (
                  <SelectItem key={tier.value} value={tier.value} className="text-xs">
                    {tier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:inline" />
            <Select value={selectedSort} onValueChange={handleSortSelect}>
              <SelectTrigger className="w-[175px] text-xs h-9 bg-background/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 4. Active Filter Tags / Chips Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
            <Tag className="h-3 w-3" />
            Active Filters:
          </span>

          {searchQuery && (
            <Badge
              variant="outline"
              className="gap-1.5 rounded-lg border-blue-500/40 bg-blue-500/10 text-[11px] text-blue-600 dark:text-blue-400 pl-2 pr-1 py-0.5"
            >
              <span>Search: &ldquo;{searchQuery}&rdquo;</span>
              <button
                type="button"
                onClick={handleClearSearch}
                className="hover:bg-blue-500/20 rounded-full p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}

          {activeCategoryName && selectedCategory !== 'all' && (
            <Badge
              variant="outline"
              className="gap-1.5 rounded-lg border-indigo-500/40 bg-indigo-500/10 text-[11px] text-indigo-600 dark:text-indigo-400 pl-2 pr-1 py-0.5"
            >
              <span>Category: {activeCategoryName}</span>
              <button
                type="button"
                onClick={() => handleCategorySelect('all')}
                className="hover:bg-indigo-500/20 rounded-full p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}

          {selectedPrice && selectedPrice !== 'all' && (
            <Badge
              variant="outline"
              className="gap-1.5 rounded-lg border-emerald-500/40 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400 pl-2 pr-1 py-0.5"
            >
              <span>
                Price: {PRICE_TIERS.find((t) => t.value === selectedPrice)?.label || selectedPrice}
              </span>
              <button
                type="button"
                onClick={() => handlePriceSelect('all')}
                className="hover:bg-emerald-500/20 rounded-full p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetAllFilters}
            className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2 gap-1"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            <span>Reset All</span>
          </Button>
        </div>
      )}

      {/* 5. Results Count & Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <p className="text-xs text-muted-foreground font-mono">
          Showing <strong className="text-foreground">{initialData.services.length}</strong> of{' '}
          <strong className="text-foreground">{initialData.total}</strong> services available
        </p>
      </div>

      {/* 6. Marketplace Grid or Empty State */}
      {initialData.services.length === 0 ? (
        <StudentServiceEmpty
          type={initialData.priceCounts.all === 0 ? 'no-services' : 'no-results'}
          searchQuery={searchQuery}
          onResetFilters={handleResetAllFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialData.services.map((service) => (
            <StudentServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      {/* 7. Pagination Bar */}
      <StudentServicePagination
        page={initialData.page}
        totalPages={initialData.totalPages}
        totalItems={initialData.total}
        pageSize={initialData.pageSize}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
