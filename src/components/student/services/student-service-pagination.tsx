'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentServicePaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function StudentServicePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: StudentServicePaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page > 3) {
        pages.push('...');
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/60">
      <p className="text-xs text-muted-foreground order-2 sm:order-1 font-mono">
        Showing <strong className="text-foreground">{startItem}</strong> to{' '}
        <strong className="text-foreground">{endItem}</strong> of{' '}
        <strong className="text-foreground">{totalItems}</strong> services
      </p>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 px-2.5 text-xs gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        {getPageNumbers().map((p, index) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-xs text-muted-foreground">
                …
              </span>
            );
          }

          const pageNum = Number(p);
          const isActive = pageNum === page;

          return (
            <Button
              key={`page-${pageNum}`}
              type="button"
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className={`h-8 w-8 p-0 text-xs font-mono ${
                isActive
                  ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-500/20'
                  : 'hover:bg-muted'
              }`}
            >
              {pageNum}
            </Button>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 px-2.5 text-xs gap-1"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

