'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error caught by boundary:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
          </div>
          
          <p className="text-muted-foreground text-sm">
            We encountered an unexpected error. Please try again.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-muted p-3 rounded text-xs font-mono text-foreground/70 overflow-auto max-h-32">
              {error.message}
            </div>
          )}
          
          <Button 
            onClick={reset}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Try Again
          </Button>
        </div>
      </Card>
    </div>
  )
}
