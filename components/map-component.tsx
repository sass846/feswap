'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Station } from '@/lib/types';
import { getStationStatus } from '@/lib/types';

interface MapComponentProps {
  stations: Station[];
  onStationClick: (station: Station) => void;
  userLocation?: { lat: number; lng: number };
}

export function MapComponent({ stations, onStationClick, userLocation }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if Mapbox token is available
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error('[v0] Mapbox token not found');
      setLoading(false);
      return;
    }

    mapboxgl.accessToken = token;

    const defaultCenter: [number, number] = [userLocation?.lng ?? -73.9352, userLocation?.lat ?? 40.7306];
    const defaultZoom = 13;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: defaultCenter,
      zoom: defaultZoom,
      pitch: 0,
      bearing: 0,
    });

    map.current.on('load', () => {
      setLoading(false);
    });

    // Add user location marker if available
    if (userLocation) {
      new mapboxgl.Marker({ color: '#0f172a' })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h3>Your Location</h3>'))
        .addTo(map.current);
    }

    return () => {
      map.current?.remove();
    };
  }, [userLocation]);

  // Add/update station markers
  useEffect(() => {
    if (!map.current || !stations.length) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    stations.forEach((station) => {
      const status = getStationStatus(station);

      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.backgroundColor = status.color;
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.cursor = 'pointer';
      el.style.fontSize = '20px';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([station.location.lng, station.location.lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onStationClick(station);
      });

      markersRef.current.push(marker);
    });
  }, [stations, onStationClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
          <div className="bg-white px-4 py-2 rounded-lg text-sm font-medium text-foreground">
            Loading map...
          </div>
        </div>
      )}
    </div>
  );
}
