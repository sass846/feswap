import { Battery, Loader2 } from 'lucide-react';

export function LoadingOverlay() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center gap-4">
      <div className="p-4 bg-accent rounded-lg">
        <Battery className="w-8 h-8 text-white animate-pulse" />
      </div>
      <div className="text-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground mb-2">SwapHub</h2>
        <p className="text-sm text-muted-foreground">Loading your map and nearby stations...</p>
      </div>
    </div>
  );
}
