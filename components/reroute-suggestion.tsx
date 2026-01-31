'use client';

import type { RerouteSuggestion as Suggestion, Station } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, MapPin, ChevronRight } from 'lucide-react';

interface RerouteSuggestionProps {
  suggestion: Suggestion;
  currentStation: Station;
  suggestedStation: Station;
  onAccept: () => void;
  onDismiss: () => void;
}

export function RerouteSuggestion({
  suggestion,
  currentStation,
  suggestedStation,
  onAccept,
  onDismiss,
}: RerouteSuggestionProps) {
  const timeSaved = currentStation.wait_time_minutes - suggestion.wait_time_minutes;

  return (
    <Card className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 border-0 shadow-lg overflow-hidden z-40">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm">Better Route Available</h3>
          <p className="text-blue-100 text-xs mt-0.5">
            Save {timeSaved} minutes by switching stations
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current vs Suggested */}
        <div className="space-y-3">
          {/* Current Station */}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">Current</p>
            <p className="text-sm font-semibold text-foreground mb-2">{currentStation.name}</p>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span>{currentStation.wait_time_minutes} min wait</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-flex w-2 h-2 rounded-full bg-destructive" />
                <span>High demand</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="bg-accent text-white rounded-full p-2">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Suggested Station */}
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <p className="text-xs text-emerald-700 font-medium mb-1">Recommended</p>
            <p className="text-sm font-semibold text-foreground mb-2">{suggestedStation.name}</p>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span>{suggestion.wait_time_minutes} min wait</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-flex w-2 h-2 rounded-full bg-success" />
                <span>Low demand</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1">Why?</p>
          <p className="text-sm text-foreground">{suggestion.reason}</p>
        </div>

        {/* Time Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Travel Time</p>
            <p className="text-lg font-bold text-foreground">{suggestion.estimated_time_minutes} min</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-200">
            <p className="text-xs text-muted-foreground mb-1">Total Time</p>
            <p className="text-lg font-bold text-success">{suggestion.total_time_minutes} min</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDismiss}
            className="flex-1 bg-transparent"
          >
            Keep Route
          </Button>
          <Button
            size="sm"
            onClick={onAccept}
            className="flex-1 bg-accent hover:bg-orange-600 text-white"
          >
            Switch Station
          </Button>
        </div>
      </div>
    </Card>
  );
}
