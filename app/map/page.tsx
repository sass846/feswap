'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { MapComponent } from '@/components/map-component';
import { StationDetailsPopup } from '@/components/station-details-popup';
import { RerouteSuggestion } from '@/components/reroute-suggestion';
import { MapHeader } from '@/components/map-header';
import { LoadingOverlay } from '@/components/loading-overlay';
import type { Station, RerouteSuggestion as RerouteSuggestionType, StationState } from '@/lib/types';
import { apiCall, API_ENDPOINTS, WebSocketManager } from '@/lib/api';

const apiBaseUrl = API_ENDPOINTS.BASE_URL; // Declare apiBaseUrl here

export default function MapPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const wsManagerRef = useRef<WebSocketManager | null>(null);

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

  // Setup WebSocket connection and fetch initial stations
  useEffect(() => {
    if (!userLocation || !token) return;

    const fetchStations = async () => {
      try {
        setLoading(true);
        const data = await apiCall<Station[]>(
          `${API_ENDPOINTS.stations}?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius=15`,
          {},
          token
        );
        setStations(data);
        setError('');
      } catch (err) {
        console.error('[v0] Fetch stations error:', err);
        setError('Failed to load stations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Setup WebSocket for real-time updates
    const setupWebSocket = async () => {
      try {
        wsManagerRef.current = new WebSocketManager(token);
        await wsManagerRef.current.connect();
        
        // Listen for station state updates
        wsManagerRef.current.subscribe('station.state', (data: StationState) => {
          setStations((prevStations) => {
            const index = prevStations.findIndex((s) => s.station_id === data.station_id);
            if (index >= 0) {
              const updated = [...prevStations];
              updated[index] = { ...updated[index], ...data };
              return updated;
            }
            return prevStations;
          });

          // Update selected station if it changed
          if (selectedStation?.station_id === data.station_id) {
            setSelectedStation((prev) => (prev ? { ...prev, ...data } : prev));
          }
        });

        // Listen for AI actions (reroute suggestions)
        wsManagerRef.current.subscribe('langgraph.action', (action: any) => {
          if (action.type === 'reroute' && action.metadata) {
            const suggestion: RerouteSuggestionType = {
              suggested_station_id: action.metadata.target_station,
              reason: action.reasoning,
              confidence: action.confidence,
              estimated_time_minutes: action.metadata.estimated_time || 0,
              wait_time_minutes: action.metadata.wait_time || 0,
              total_time_minutes: (action.metadata.estimated_time || 0) + (action.metadata.wait_time || 0),
            };
            setReroute(suggestion);
            const suggested = stations.find((s) => s.station_id === action.metadata.target_station);
            if (suggested) {
              setTargetStation(suggested);
            }
          }
        });
      } catch (err) {
        console.error('[v0] WebSocket setup error:', err);
      }
    };

    fetchStations();
    setupWebSocket();

    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect();
      }
    };
  }, [userLocation, token, selectedStation, stations]);

  // Check for reroute suggestions when station is selected
  useEffect(() => {
    if (!selectedStation || !userLocation || !token) return;

    const checkReroute = async () => {
      try {
        const suggestion = await apiCall<RerouteSuggestionType>(
          API_ENDPOINTS.rerouteSuggestion(selectedStation.station_id),
          {
            method: 'POST',
            body: JSON.stringify({
              current_lat: userLocation.lat,
              current_lng: userLocation.lng,
            }),
          },
          token
        );
        
        // Only show reroute if confidence is high and it's actually better
        if (suggestion.confidence > 0.6 && suggestion.total_time_minutes < (selectedStation.queue.avg_wait_time_min || 15) + 15) {
          setReroute(suggestion);
          const suggested = stations.find((s) => s.station_id === suggestion.suggested_station_id);
          if (suggested) {
            setTargetStation(suggested);
          }
        }
      } catch (err) {
        console.error('[v0] Reroute check error:', err);
        // Silently fail - not critical
      }
    };

    checkReroute();
  }, [selectedStation, userLocation, token, stations]);

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
