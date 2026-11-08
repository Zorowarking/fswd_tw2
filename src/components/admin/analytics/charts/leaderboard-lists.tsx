'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Grid, Users, Star, IndianRupee, Trophy } from 'lucide-react';
import type {
  PopularServiceAnalytics,
  ActiveProviderAnalytics,
} from '@/app/actions/admin-analytics-actions';

interface LeaderboardListsProps {
  services: PopularServiceAnalytics[];
  providers: ActiveProviderAnalytics[];
}

export function LeaderboardLists({
  services,
  providers,
}: LeaderboardListsProps) {
  const [activeTab, setActiveTab] = useState<'services' | 'providers'>('services');

  const maxServiceBookings = Math.max(...services.map((s) => s.totalBookings), 1);
  const maxProviderBookings = Math.max(...providers.map((p) => p.totalBookings), 1);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 font-black text-xs border border-amber-500/40">
            1
          </span>
        );
      case 2:
        return (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300/20 text-slate-300 font-black text-xs border border-slate-300/40">
            2
          </span>
        );
      case 3:
        return (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700/20 text-amber-600 font-black text-xs border border-amber-700/40">
            3
          </span>
        );
      default:
        return (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-xs">
            {rank}
          </span>
        );
    }
  };

  return (
    <Card className="bg-card/85 backdrop-blur-md border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="p-4 sm:p-6 pb-2 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>Campus Operations Leaderboards</span>
              </CardTitle>
              <Badge variant="outline" className="text-[11px] font-medium border-border/60">
                Ranked By Volume
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Highest-demand student services and top-performing institutional operators
            </CardDescription>
          </div>

          {/* Switcher Tab */}
          <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/60 self-start sm:self-auto">
            <Button
              type="button"
              variant={activeTab === 'services' ? 'default' : 'ghost'}
              size="sm"
              className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'services'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('services')}
            >
              <Grid className="h-3.5 w-3.5 mr-1.5" />
              Popular Services ({services.length})
            </Button>
            <Button
              type="button"
              variant={activeTab === 'providers' ? 'default' : 'ghost'}
              size="sm"
              className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'providers'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('providers')}
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Active Providers ({providers.length})
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-4">
        {activeTab === 'services' ? (
          <div className="space-y-3">
            {services.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No services with booking activity found for this timeframe.
              </div>
            ) : (
              services.map((svc, idx) => {
                const rank = idx + 1;
                const ratio = Math.max(
                  10,
                  Math.round((svc.totalBookings / maxServiceBookings) * 100)
                );

                return (
                  <div
                    key={svc.id}
                    className="p-3.5 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-all space-y-2 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {getRankBadge(rank)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                              {svc.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] py-0 px-2 font-medium"
                            >
                              {svc.category}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground block">
                            Provider: {svc.providerName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto text-xs">
                        {/* Rating */}
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-500" />
                          <span>{svc.averageRating > 0 ? svc.averageRating : '—'}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({svc.reviewCount})
                          </span>
                        </div>

                        {/* Revenue */}
                        <div className="flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          <IndianRupee className="h-3.5 w-3.5" />
                          <span>{svc.totalRevenue.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Bookings Count */}
                        <Badge variant="glow" className="text-xs font-bold font-mono">
                          {svc.totalBookings} orders
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Fill Bar */}
                    <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        style={{ width: `${ratio}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {providers.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No active service providers recorded in the database.
              </div>
            ) : (
              providers.map((p, idx) => {
                const rank = idx + 1;
                const ratio = Math.max(
                  10,
                  Math.round((p.totalBookings / maxProviderBookings) * 100)
                );

                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-all space-y-2 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {getRankBadge(rank)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                              {p.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-2 font-medium border-border/60"
                            >
                              {p.servicesCount} services
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground block font-mono">
                            {p.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto text-xs">
                        {/* Rating */}
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-500" />
                          <span>{p.averageRating > 0 ? p.averageRating : '—'}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({p.reviewCount})
                          </span>
                        </div>

                        {/* Fulfillment rate */}
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground block">
                            Fulfillment
                          </span>
                          <span className="font-bold text-foreground">
                            {p.fulfillmentRate}%
                          </span>
                        </div>

                        {/* Turnover */}
                        <div className="text-right font-mono">
                          <span className="text-[10px] text-muted-foreground block">
                            Turnover
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{p.totalRevenue.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Total Volume */}
                        <Badge variant="glow" className="text-xs font-bold font-mono">
                          {p.totalBookings} fulfilled
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Fill Bar */}
                    <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        style={{ width: `${ratio}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
