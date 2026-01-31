'use client';

import { useState } from 'react';
import type { Station } from '@/lib/types';
import { getStationStatus } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Clock, Battery, TrendingUp, MessageCircle } from 'lucide-react';
import { StationChatbot } from '@/components/station-chatbot';

interface StationDetailsPopupProps {
  station: Station;
  onClose: () => void;
}

export function StationDetailsPopup({ station, onClose }: StationDetailsPopupProps) {
  const status = getStationStatus(station);
  const [activeTab, setActiveTab] = useState('info');
  const utilizationPercent = Math.round((station.available_batteries / station.total_capacity) * 100);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4 md:p-0">
      <Card className="w-full max-w-md max-h-[80vh] md:max-h-96 overflow-hidden flex flex-col shadow-2xl border-0 rounded-t-2xl md:rounded-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <h2 className="text-xl font-bold text-white">{station.name}</h2>
            </div>
            {station.address && (
              <p className="text-sm text-slate-300">{station.address}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-slate-300 transition p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-slate-50">
            <TabsTrigger value="info" className="rounded-none text-sm">
              <Battery className="w-4 h-4 mr-2" />
              Info
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-none text-sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="overflow-y-auto flex-1 p-6 space-y-6">
            {/* Station Status Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Availability */}
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">AVAILABILITY</p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-2xl font-bold text-foreground">
                    {station.available_batteries}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">
                    / {station.total_capacity}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-success transition-all"
                    style={{ width: `${utilizationPercent}%` }}
                  />
                </div>
              </div>

              {/* Wait Time */}
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  WAIT TIME
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {station.wait_time_minutes}
                </p>
                <p className="text-xs text-muted-foreground mt-1">minutes</p>
              </div>

              {/* Demand Level */}
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  DEMAND
                </p>
                <p className="text-lg font-bold text-foreground capitalize">
                  {station.demand}
                </p>
                <p className="text-xs text-muted-foreground mt-1">current level</p>
              </div>

              {/* Rating */}
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">RATING</p>
                <p className="text-2xl font-bold text-foreground">
                  {station.rating ? station.rating.toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {station.rating ? '⭐' : 'Not yet rated'}
                </p>
              </div>
            </div>

            {/* Service Time Estimate */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-foreground mb-2">Estimated Service Time</p>
              <p className="text-2xl font-bold text-blue-600">
                {station.wait_time_minutes + 10} minutes
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Includes 10 min swap time
              </p>
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="overflow-hidden flex-1 flex flex-col p-0">
            <StationChatbot stationId={station.id} stationName={station.name} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="border-t bg-slate-50 px-6 py-4 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-transparent"
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-accent hover:bg-orange-600 text-white"
          >
            Navigate
          </Button>
        </div>
      </Card>
    </div>
  );
}
