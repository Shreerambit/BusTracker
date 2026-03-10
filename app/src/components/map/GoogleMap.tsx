import { useEffect, useRef, useState } from 'react';
import type { GeoLocation } from '@/types';

interface GoogleMapProps {
  center?: GeoLocation;
  zoom?: number;
  markers?: MapMarker[];
  routePath?: GeoLocation[];
  onMapClick?: (location: GeoLocation) => void;
  onMarkerClick?: (markerId: string) => void;
  className?: string;
}

export interface MapMarker {
  id: string;
  position: GeoLocation;
  type: 'bus' | 'stop' | 'destination' | 'student';
  title: string;
  description?: string;
  icon?: string;
}

// Load Google Maps script
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

export function GoogleMap({
  center = { lat: 40.7128, lng: -74.0060 },
  zoom = 14,
  markers = [],
  routePath = [],
  onMapClick,
  onMarkerClick,
  className = ''
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (mapRef.current && !mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          });

          if (onMapClick) {
            mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
              onMapClick({
                lat: e.latLng!.lat(),
                lng: e.latLng!.lng()
              });
            });
          }
        }
        setIsLoaded(true);
      })
      .catch((err) => {
        setLoadError(err.message);
      });

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (routeLineRef.current) {
        routeLineRef.current.setMap(null);
      }
    };
  }, []);

  // Update center
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      mapInstanceRef.current.setCenter(center);
    }
  }, [center, isLoaded]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const icon = getMarkerIcon(markerData.type);
      
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: mapInstanceRef.current,
        title: markerData.title,
        icon: {
          url: icon,
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 40)
        },
        animation: markerData.type === 'bus' ? google.maps.Animation.BOUNCE : undefined
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${markerData.title}</h3>
            ${markerData.description ? `<p style="margin: 0; font-size: 12px; color: #666;">${markerData.description}</p>` : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        onMarkerClick?.(markerData.id);
      });

      markersRef.current.push(marker);
    });
  }, [markers, isLoaded, onMarkerClick]);

  // Update route line
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    if (routeLineRef.current) {
      routeLineRef.current.setMap(null);
    }

    if (routePath.length > 1) {
      routeLineRef.current = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 1.0,
        strokeWeight: 4,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeWeight: 0
          },
          offset: '50%',
          repeat: '100px'
        }]
      });

      routeLineRef.current.setMap(mapInstanceRef.current);

      // Fit bounds to show entire route
      const bounds = new google.maps.LatLngBounds();
      routePath.forEach(point => bounds.extend(point));
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [routePath, isLoaded]);

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ minHeight: '300px' }}>
        <div className="text-center p-4">
          <p className="text-red-500 font-medium">Failed to load map</p>
          <p className="text-gray-500 text-sm mt-1">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ minHeight: '300px' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ width: '100%', height: '100%', minHeight: '300px' }}
    />
  );
}

function getMarkerIcon(type: MapMarker['type']): string {
  switch (type) {
    case 'bus':
      return 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="white" stroke-width="2"/>
          <text x="20" y="25" text-anchor="middle" fill="white" font-size="16">🚌</text>
        </svg>
      `);
    case 'stop':
      return 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="#EF4444" stroke="white" stroke-width="2"/>
          <text x="20" y="25" text-anchor="middle" fill="white" font-size="16">🚏</text>
        </svg>
      `);
    case 'destination':
      return 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="#10B981" stroke="white" stroke-width="2"/>
          <text x="20" y="25" text-anchor="middle" fill="white" font-size="16">🏫</text>
        </svg>
      `);
    case 'student':
      return 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="#F59E0B" stroke="white" stroke-width="2"/>
          <text x="20" y="25" text-anchor="middle" fill="white" font-size="16">👤</text>
        </svg>
      `);
    default:
      return '';
  }
}

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}
