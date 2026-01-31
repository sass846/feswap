'use client'

import { Zap, MapPin, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onRefresh?: () => void
}

export function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
      <div className="space-y-6 max-w-sm">
        <div className="flex justify-center">
          <div className="p-4 bg-accent/10 rounded-2xl">
            <MapPin className="w-12 h-12 text-accent" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">No Stations Nearby</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Move to an area with battery swap stations or check back later for updates.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-card rounded-lg">
            <Zap className="w-5 h-5 text-warning flex-shrink-0" />
            <p className="text-sm text-foreground text-left">
              Enable location services for the best experience
            </p>
          </div>
        </div>

        {onRefresh && (
          <Button
            onClick={onRefresh}
            variant="outline"
            className="w-full gap-2 bg-transparent"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}
