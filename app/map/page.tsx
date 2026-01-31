'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { MapComponent } from '@/components/map-component';
import { StationDetailsPopup } from '@/components/station-details-popup';
import { RerouteSuggestion } from '@/components/reroute-suggestion';
import { MapHeader } from '@/components/map-header';
import { LoadingOverlay } from '@/components/loading-overlay';
import type { Station, RerouteSuggestion as RerouteSuggestionType } from '@/lib/types';
import { getAllStations } from '@/lib/dummy-data';

export default function MapPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reroute, setReroute] = useState<RerouteSuggestionType | null>(null);
  const [targetStation, setTargetStation] = useState<Station | null>(null);

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('[v0] Geolocation error:', error);
          // Default to NYC if geolocation fails
          setUserLocation({ lat: 40.7306, lng: -73.9352 });
        }
      );
    }
  }, []);

  // Load dummy stations
  useEffect(() => {
    if (!userLocation) return;

    try {
      setLoading(true);
      // Load dummy stations
      const allStations = getAllStations();
      setStations(allStations);
      setError('');
      
      // Simulate real-time updates with dummy data
      const updateInterval = setInterval(() => {
        setStations((prevStations) =>
          prevStations.map((station) => ({
            ...station,
            timestamp: new Date().toISOString(),
            inventory: {
              ...station.inventory,
              charged: Math.max(0, Math.min(station.inventory.total_slots, 
                station.inventory.charged + (Math.random() > 0.6 ? 1 : Math.random() > 0.6 ? -1 : 0)
              )),
            },
            queue: {
              ...station.queue,
              length: Math.max(0, station.queue.length + (Math.random() > 0.6 ? 1 : Math.random() > 0.6 ? -1 : 0)),
            },
          }))
        );
      }, 5000);

      return () => clearInterval(updateInterval);
    } catch (err) {
      console.error('[v0] Fetch stations error:', err);
      setError('Failed to load stations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  // Mock reroute suggestion when station is selected
  useEffect(() => {
    if (!selectedStation || !userLocation || !stations.length) return;

    // Generate a mock reroute suggestion with 30% chance
    if (Math.random() > 0.7) {
      const otherStations = stations.filter((s) => s.station_id !== selectedStation.station_id);
      if (otherStations.length > 0) {
        const suggestedStation = otherStations[Math.floor(Math.random() * otherStations.length)];
        
        // Only suggest if the suggested station has better availability
        if (suggestedStation.queue.length < selectedStation.queue.length) {
          const suggestion: RerouteSuggestionType = {
            suggested_station_id: suggestedStation.station_id,
            reason: `${suggestedStation.name} has a shorter queue and better availability`,
            confidence: 0.75,
            estimated_time_minutes: Math.floor(Math.random() * 8) + 5,
            wait_time_minutes: suggestedStation.queue.avg_wait_time_min,
            total_time_minutes: (Math.floor(Math.random() * 8) + 5) + suggestedStation.queue.avg_wait_time_min,
          };
          setReroute(suggestion);
          setTargetStation(suggestedStation);
        }
      }
    }
  }, [selectedStation, userLocation, stations]);

  const handleAcceptReroute = () => {
    if (targetStation) {
      setSelectedStation(targetStation);
      setReroute(null);
    }
  };

  const handleDismissReroute = () => {
    setReroute(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!userLocation || loading) {
    return <LoadingOverlay />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <MapHeader user={user} onLogout={handleLogout} />

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        {error && (
          <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-30 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            {error}
          </div>
        )}

        <MapComponent
          stations={stations}
          onStationClick={setSelectedStation}
          userLocation={userLocation}
        />

        {/* Station Details Popup */}
        {selectedStation && (
          <StationDetailsPopup station={selectedStation} onClose={() => setSelectedStation(null)} />
        )}

        {/* Reroute Suggestion */}
        {reroute && targetStation && selectedStation && (
          <RerouteSuggestion
            suggestion={reroute}
            currentStation={selectedStation}
            suggestedStation={targetStation}
            onAccept={handleAcceptReroute}
            onDismiss={handleDismissReroute}
          />
        )}
      </div>
    </div>
  );
}
