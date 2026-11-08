'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StatusDistributionItem } from '@/app/actions/admin-analytics-actions';
import type { LucideIcon } from 'lucide-react';

interface DistributionDonutChartProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badgeLabel?: string;
  data: StatusDistributionItem[];
  centerLabel?: string;
  isCurrency?: boolean;
}

export function DistributionDonutChart({
  title,
  description,
  icon: Icon,
  badgeLabel,
  data,
  centerLabel = 'Total Records',
  isCurrency = false,
}: DistributionDonutChartProps) {
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  const totalCount = useMemo(() => {
    return data.reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  const totalAmount = useMemo(() => {
    return data.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [data]);

  // Donut geometry (Viewbox: 200 x 200, radius = 70, strokeWidth = 24)
  const size = 200;
  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Compute SVG segments with dash offsets
  const segments = useMemo(() => {
    if (totalCount === 0) return [];

    let currentOffset = 0;
    return data.map((item) => {
      const sliceFraction = item.count / totalCount;
      const strokeLength = sliceFraction * circumference;
      const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
      const strokeDashoffset = -currentOffset;
      currentOffset += strokeLength;

      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [data, totalCount, circumference]);

  const activeItem = hoveredStatus
    ? data.find((d) => d.status === hoveredStatus)
    : null;

  return (
    <Card className="bg-card/85 backdrop-blur-md border-border/80 shadow-sm flex flex-col justify-between">
      <CardHeader className="p-4 sm:p-6 pb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {description}
            </CardDescription>
          </div>
          {badgeLabel && (
            <Badge variant="glow" className="text-[11px] font-semibold">
              {badgeLabel}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-4 space-y-6">
        {/* Donut Graphic & Center Callout */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="relative w-44 h-44 select-none shrink-0">
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox={`0 0 ${size} ${size}`}
            >
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeWidth={strokeWidth}
              />

              {/* Data segments */}
              {segments.map((seg) => {
                const isHovered = hoveredStatus === seg.status;
                return (
                  <circle
                    key={seg.status}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="butt"
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredStatus(seg.status)}
                    onMouseLeave={() => setHoveredStatus(null)}
                  />
                );
              })}
            </svg>

            {/* Central Badge / Metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                {activeItem ? activeItem.label : centerLabel}
              </span>
              <span className="text-xl font-black text-foreground">
                {activeItem
                  ? activeItem.count
                  : isCurrency
                  ? `₹${totalAmount >= 1000 ? `${(totalAmount / 1000).toFixed(1)}k` : totalAmount}`
                  : totalCount}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {activeItem ? `${activeItem.percentage}%` : `${totalCount} records`}
              </span>
            </div>
          </div>

          {/* Quick percentage legend */}
          <div className="flex-1 w-full space-y-2">
            {data.map((item) => {
              const isHovered = hoveredStatus === item.status;
              return (
                <div
                  key={item.status}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                    isHovered
                      ? 'border-primary/50 bg-primary/10 shadow-sm'
                      : 'border-border/40 bg-muted/20 hover:bg-muted/40'
                  }`}
                  onMouseEnter={() => setHoveredStatus(item.status)}
                  onMouseLeave={() => setHoveredStatus(null)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-foreground truncate max-w-[120px]">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    {item.amount !== undefined && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="font-bold text-foreground">{item.count}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress ratio multi-bar */}
        <div className="space-y-1.5 pt-2 border-t border-border/40">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
            {data.map((item) => (
              <div
                key={item.status}
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
                className="transition-all duration-300"
                title={`${item.label}: ${item.count} (${item.percentage}%)`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Aggregated Status Split</span>
            <span>100% Total Distribution</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

