'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, ShieldAlert, GraduationCap, Building2 } from 'lucide-react';
import type { UserGrowthAnalytics } from '@/app/actions/admin-analytics-actions';

interface UserGrowthCardProps {
  userGrowth: UserGrowthAnalytics;
}

export function UserGrowthCard({ userGrowth }: UserGrowthCardProps) {
  const { total, byRole, timeline } = userGrowth;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const studentCount = byRole.find((r) => r.role === 'STUDENT')?.count || 0;
  const providerCount = byRole.find((r) => r.role === 'SERVICE_PROVIDER')?.count || 0;
  const studentToProviderRatio =
    providerCount > 0 ? (studentCount / providerCount).toFixed(1) : studentCount;

  // SVG chart parameters (ViewBox: 600 x 140)
  const svgWidth = 600;
  const svgHeight = 140;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 25;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const maxVal = Math.max(...timeline.map((t) => t.cumulativeUsers), 5);

  const points = useMemo(() => {
    if (timeline.length <= 1) {
      return timeline.map((_, i) => ({
        x: padLeft + i * plotWidth,
        y: padTop + plotHeight / 2,
      }));
    }
    return timeline.map((t, i) => {
      const x = padLeft + (i / (timeline.length - 1)) * plotWidth;
      const y = padTop + plotHeight - (t.cumulativeUsers / maxVal) * plotHeight;
      return { x, y };
    });
  }, [timeline, maxVal, padLeft, plotWidth, padTop, plotHeight]);

  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };
    let dLine = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 2;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (next.x - curr.x) / 2;
      const cpY2 = next.y;
      dLine += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }

    const firstPt = points[0];
    const lastPt = points[points.length - 1];
    const baseY = padTop + plotHeight;
    const dArea = `${dLine} L ${lastPt.x} ${baseY} L ${firstPt.x} ${baseY} Z`;

    return { linePath: dLine, areaPath: dArea };
  }, [points, padTop, plotHeight]);

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;
  const activeData = hoverIndex !== null && timeline[hoverIndex] ? timeline[hoverIndex] : null;

  return (
    <Card className="bg-card/85 backdrop-blur-md border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="p-4 sm:p-6 pb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <span>User Growth & Role Demographics</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Cumulative university adoption, active accounts, and RBAC role distribution
            </CardDescription>
          </div>
          <Badge variant="glow" className="text-[11px] font-semibold">
            {total} Registered Users
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-4 space-y-6">
        {/* Role breakdown cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {byRole.map((roleItem) => {
            const Icon =
              roleItem.role === 'STUDENT'
                ? GraduationCap
                : roleItem.role === 'SERVICE_PROVIDER'
                ? Building2
                : ShieldAlert;

            return (
              <div
                key={roleItem.role}
                className="p-3.5 rounded-2xl border border-border/50 bg-muted/20 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${roleItem.color}15`,
                      color: roleItem.color,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {roleItem.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {roleItem.percentage}% of university
                    </span>
                  </div>
                </div>

                <span className="text-lg font-black font-mono text-foreground">
                  {roleItem.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* User Growth Timeline SVG */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">
              Cumulative User Registrations Over Time
            </span>
            <span className="text-[11px] text-muted-foreground">
              Student / Provider Ratio: <strong className="text-foreground">{studentToProviderRatio}:1</strong>
            </span>
          </div>

          <div className="relative w-full aspect-[21/6] min-h-[140px] select-none">
            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid line */}
              <line
                x1={padLeft}
                y1={padTop + plotHeight}
                x2={svgWidth - padRight}
                y2={padTop + plotHeight}
                stroke="currentColor"
                strokeOpacity="0.15"
                strokeWidth="1"
              />

              {/* Area & Line */}
              {points.length > 0 && (
                <>
                  <path d={areaPath} fill="url(#userGrowthGrad)" />
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Active Marker */}
              {activePoint && (
                <g>
                  <line
                    x1={activePoint.x}
                    y1={padTop}
                    x2={activePoint.x}
                    y2={padTop + plotHeight}
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-70"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="5"
                    fill="#8b5cf6"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Hover Rects */}
              {points.map((pt, i) => {
                const rectWidth = plotWidth / (points.length || 1);
                const rectX = pt.x - rectWidth / 2;
                return (
                  <rect
                    key={i}
                    x={rectX}
                    y={padTop}
                    width={rectWidth}
                    height={plotHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {activeData && activePoint && (
              <div
                style={{
                  left: `${(activePoint.x / svgWidth) * 100}%`,
                  top: `${(activePoint.y / svgHeight) * 100}%`,
                }}
                className="absolute pointer-events-none z-20 -translate-x-1/2 -translate-y-full mb-2 min-w-[140px] rounded-xl border border-border/80 bg-popover/95 p-2 text-popover-foreground shadow-xl backdrop-blur-md text-xs"
              >
                <div className="font-bold border-b border-border/50 pb-1 mb-1">
                  {activeData.label}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Users:</span>
                  <span className="font-bold text-foreground">
                    {activeData.cumulativeUsers}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">New Signups:</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    +{activeData.newUsers}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
