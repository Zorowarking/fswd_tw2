'use client';

import * as React from 'react';
import {
  Layers,
  Building2,
  Trophy,
  FlaskConical,
  Wrench,
  Bus,
  Printer,
  Calendar,
  Hammer,
  HelpCircle,
  Cpu,
  Shirt,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Trophy,
  FlaskConical,
  Wrench,
  Bus,
  Printer,
  Calendar,
  Hammer,
  HelpCircle,
  Cpu,
  Shirt,
  UtensilsCrossed,
};

export function getCategoryIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Layers;
  return ICON_MAP[iconName] || Layers;
}

export function CategoryIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = getCategoryIcon(name);
  return React.createElement(Icon, { className });
}

export interface CategoryFilterItem {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  serviceCount?: number;
}

interface CategoryFilterProps {
  categories: CategoryFilterItem[];
  selectedSlug: string | null;
  onSelectCategory: (slug: string | null) => void;
  showAllOption?: boolean;
  showCounts?: boolean;
  className?: string;
}

export function CategoryFilter({
  categories,
  selectedSlug,
  onSelectCategory,
  showAllOption = true,
  showCounts = true,
  className,
}: CategoryFilterProps) {
  const totalCount = React.useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.serviceCount || 0), 0);
  }, [categories]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Category Pills Slider / Wrap */}
      <div className="flex flex-wrap items-center gap-2">
        {showAllOption && (
          <Button
            variant={selectedSlug === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectCategory(null)}
            className={cn(
              'rounded-xl text-xs font-medium h-9 gap-2 transition-all',
              selectedSlug === null
                ? 'shadow-sm shadow-primary/25'
                : 'bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Categories</span>
            {showCounts && (
              <Badge
                variant={selectedSlug === null ? 'secondary' : 'outline'}
                className="ml-1 text-[10px] px-1.5 py-0 h-4 rounded-full font-mono"
              >
                {totalCount}
              </Badge>
            )}
          </Button>
        )}

        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.icon);
          const isSelected = selectedSlug === cat.slug;

          return (
            <Button
              key={cat.id}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectCategory(isSelected ? null : cat.slug)}
              className={cn(
                'rounded-xl text-xs font-medium h-9 gap-2 transition-all',
                isSelected
                  ? 'shadow-sm shadow-primary/25'
                  : 'bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.name}</span>
              {showCounts && typeof cat.serviceCount === 'number' && (
                <Badge
                  variant={isSelected ? 'secondary' : 'outline'}
                  className="ml-1 text-[10px] px-1.5 py-0 h-4 rounded-full font-mono"
                >
                  {cat.serviceCount}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
