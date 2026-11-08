'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, IndianRupee, TrendingUp, Sparkles } from 'lucide-react';
import type { TimelineDataPoint } from '@/app/actions/admin-analytics-actions';

interface TimelineAreaChartProps {
  data: TimelineDataPoint[];
  initialMetric?: 'bookings' | 'revenue';
}

export function TimelineAreaChart({
  data,
  initialMetric = 'bookings',
}: TimelineAreaChartProps) {
  const [metric, setMetric] = useState<'bookings' | 'revenue'>(initialMetric);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Compute values and bounds
  const chartMetrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        values: [],
        maxVal: 1,
        totalVal: 0,
        avgVal: 0,
        peakItem: null,
      };
    }

    const values = data.map((d) => (metric === 'bookings' ? d.bookings : d.revenue));
    const maxVal = Math.max(...values, metric === 'bookings' ? 5 : 500);
    const totalVal = values.reduce((sum, v) => sum + v, 0);
    const avgVal = values.length > 0 ? totalVal / values.length : 0;

    let peakIdx = 0;
    values.forEach((v, i) => {
      if (v > values[peakIdx]) peakIdx = i;
    });

    return {
      values,
      maxVal,
      totalVal,
      avgVal,
      peakItem: data[peakIdx] ? { ...data[peakIdx], val: values[peakIdx] } : null,
    };
  }, [data, metric]);

  const { values, maxVal, totalVal, avgVal, peakItem } = chartMetrics;

  // SVG coordinate calculations (ViewBox: 800 x 240, Padding: L:45, R:25, T:25, B:40)
  const svgWidth = 800;
  const svgHeight = 240;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 40;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const points = useMemo(() => {
    if (data.length <= 1) {
      return data.map((_, i) => ({
        x: padLeft + (i * plotWidth),
        y: padTop + plotHeight / 2,
      }));
    }

    return data.map((_, i) => {
      const x = padLeft + (i / (data.length - 1)) * plotWidth;
      const val = values[i] ?? 0;
      const y = padTop + plotHeight - (val / maxVal) * plotHeight;
      return { x, y };
    });
  }, [data, values, maxVal, padLeft, padTop, plotHeight, plotWidth]);

  // Construct smooth bezier curve path
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };
    if (points.length === 1) {
      const p = points[0];
      return {
        linePath: `M ${p.x} ${p.y}`,
        areaPath: `M ${p.x} ${padTop + plotHeight} L ${p.x} ${p.y} L ${p.x} ${padTop + plotHeight} Z`,
      };
    }

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

  // Y-axis grid levels (4 ticks)
  const yTicks = useMemo(() => {
    return [0, 0.33, 0.66, 1].map((pct) => {
      const val = Math.round(maxVal * pct);
      const y = padTop + plotHeight - pct * plotHeight;
      return { val, y };
    });
  }, [maxVal, padTop, plotHeight]);

  // X-axis label indices (5 evenly distributed labels)
  const xLabels = useMemo(() => {
    if (data.length <= 1) return data.map((d, i) => ({ text: d.label, x: points[i]?.x ?? 0 }));
    const count = Math.min(6, data.length);
    const step = (data.length - 1) / (count - 1);
    const indices: number[] = [];
    for (let i = 0; i < count; i++) {
      indices.push(Math.round(i * step));
    }
    const unique = Array.from(new Set(indices));
    return unique.map((idx) => ({
      text: data[idx]?.label ?? '',
      x: points[idx]?.x ?? 0,
    }));
  }, [data, points]);

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;
  const activeData = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null;

  return (
    <Card className="bg-card/85 backdrop-blur-md border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="p-4 sm:p-6 pb-2 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                {metric === 'bookings' ? (
                  <CalendarDays className="h-5 w-5 text-blue-500" />
                ) : (
                  <IndianRupee className="h-5 w-5 text-emerald-500" />
                )}
                <span>
                  {metric === 'bookings'
                    ? 'Bookings Over Time'
                    : 'Revenue Trajectory Over Time'}
                </span>
              </CardTitle>
              <Badge variant="outline" className="text-[11px] font-medium border-border/60">
                Prisma Database Aggregated
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              {metric === 'bookings'
                ? 'Chronological volume of campus appointments, work orders, and amenity slots'
                : 'Gross financial turnover received and settled through successful transactions'}
            </CardDescription>
          </div>

          {/* Metric Switcher & Peak Highlights */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/60">
              <Button
                type="button"
                variant={metric === 'bookings' ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all ${
                  metric === 'bookings'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setMetric('bookings')}
              >
                Bookings
              </Button>
              <Button
                type="button"
                variant={metric === 'revenue' ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all ${
                  metric === 'revenue'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setMetric('revenue')}
              >
                Revenue
              </Button>
            </div>
          </div>
        </div>

        {/* Quick KPI ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-4 text-xs">
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
            <span className="text-[11px] text-muted-foreground block font-medium">Total Volume</span>
            <span className="text-sm sm:text-base font-bold text-foreground">
              {metric === 'bookings' ? `${totalVal} bookings` : `₹${totalVal.toLocaleString('en-IN')}`}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
            <span className="text-[11px] text-muted-foreground block font-medium">Interval Average</span>
            <span className="text-sm sm:text-base font-bold text-foreground">
              {metric === 'bookings'
                ? `${avgVal.toFixed(1)} / day`
                : `₹${Math.round(avgVal).toLocaleString('en-IN')} / day`}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
            <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" /> Peak Interval
            </span>
            <span className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 truncate">
              {peakItem
                ? metric === 'bookings'
                  ? `${peakItem.val} (${peakItem.label})`
                  : `₹${peakItem.val.toLocaleString('en-IN')} (${peakItem.label})`
                : '—'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-4">
        {/* Interactive SVG Chart */}
        <div className="relative w-full aspect-[21/9] min-h-[220px] select-none">
          <svg
            className="w-full h-full overflow-visible"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              {/* Gradient for Bookings */}
              <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>

              {/* Gradient for Revenue */}
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#10b981" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              {/* Glow filter */}
              <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Horizontal Grid lines & Y-axis labels */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={tick.y}
                  x2={svgWidth - padRight}
                  y2={tick.y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={tick.y + 3.5}
                  textAnchor="end"
                  className="text-[10px] fill-muted-foreground font-mono"
                >
                  {metric === 'bookings'
                    ? tick.val
                    : `₹${tick.val >= 1000 ? `${(tick.val / 1000).toFixed(1)}k` : tick.val}`}
                </text>
              </g>
            ))}

            {/* X-axis base line */}
            <line
              x1={padLeft}
              y1={padTop + plotHeight}
              x2={svgWidth - padRight}
              y2={padTop + plotHeight}
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeWidth="1"
            />

            {/* X-axis date labels */}
            {xLabels.map((xl, i) => (
              <text
                key={i}
                x={xl.x}
                y={padTop + plotHeight + 20}
                textAnchor="middle"
                className="text-[11px] fill-muted-foreground font-medium"
              >
                {xl.text}
              </text>
            ))}

            {/* Render Area & Line Path */}
            {points.length > 0 && (
              <>
                <path
                  d={areaPath}
                  fill={`url(#${metric === 'bookings' ? 'bookingsGradient' : 'revenueGradient'})`}
                  className="transition-all duration-300"
                />
                <path
                  d={linePath}
                  fill="none"
                  stroke={metric === 'bookings' ? '#2563eb' : '#059669'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                  filter="url(#chartGlow)"
                />
              </>
            )}

            {/* Active Hover Guide and Marker */}
            {activePoint && (
              <g>
                <line
                  x1={activePoint.x}
                  y1={padTop}
                  x2={activePoint.x}
                  y2={padTop + plotHeight}
                  stroke={metric === 'bookings' ? '#3b82f6' : '#10b981'}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="opacity-70"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="6"
                  fill={metric === 'bookings' ? '#2563eb' : '#059669'}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="shadow-lg"
                />
              </g>
            )}

            {/* Invisible hover intercept rects for each data point */}
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

          {/* Floating Hover Tooltip Card */}
          {activeData && activePoint && (
            <div
              style={{
                left: `${(activePoint.x / svgWidth) * 100}%`,
                top: `${(activePoint.y / svgHeight) * 100}%`,
              }}
              className="absolute pointer-events-none z-20 -translate-x-1/2 -translate-y-full mb-3 min-w-[160px] rounded-xl border border-border/80 bg-popover/95 p-3 text-popover-foreground shadow-xl backdrop-blur-md transition-transform duration-100"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-1.5 mb-1.5 text-xs">
                <span className="font-bold">{activeData.label}</span>
                <span className="text-[10px] text-muted-foreground">{activeData.date}</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bookings:</span>
                  <span className="font-bold text-foreground">{activeData.bookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {activeData.completedBookings}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Revenue:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{activeData.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
                {activeData.cancelledBookings > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-red-500">
                    <span>Cancelled:</span>
                    <span>{activeData.cancelledBookings}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chart footer meta */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  metric === 'bookings' ? 'bg-blue-600' : 'bg-emerald-600'
                }`}
              />
              <span className="font-medium text-foreground">
                {metric === 'bookings' ? 'Booking Requests' : 'Settled Revenue'}
              </span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-emerald-500" /> Continuous Daily Tracking
            </span>
          </div>
          <span>Hover data points to inspect specific daily metrics</span>
        </div>
      </CardContent>
    </Card>
  );
}
