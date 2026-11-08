import * as React from 'react';
import { Loader2 } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <span className="text-xs font-medium text-muted-foreground animate-pulse">
          Loading CampusServe...
        </span>
      </div>
    </div>
  );
}
