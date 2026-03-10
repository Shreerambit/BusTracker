import { useMemo } from 'react';
import { GoogleMap, type MapMarker } from './GoogleMap';
import type { GeoLocation, Bus, Stop, Route } from '@/types';

interface MapViewProps {
  buses?: Bus[];
  stops?: Stop[];
  route?: Route | null;
  selectedBusId?: string;
  studentStopId?: string;
  showRoute?: boolean;
  center?: GeoLocation;
  onMarkerClick?: (markerId: string) => void;
  className?: string;
}

export function MapView({
  buses = [],
  stops = [],
  route,
  selectedBusId,
  studentStopId,
  showRoute = true,
  center,
  onMarkerClick,
  className = ''
}: MapViewProps) {
  // Build markers array
  const markers = useMemo((): MapMarker[] => {
    const result: MapMarker[] = [];

    // Add bus markers
    buses.forEach(bus => {
      if (bus.currentLocation) {
        result.push({
          id: bus.id,
          position: bus.currentLocation,
          type: 'bus',
          title: `Bus ${bus.number}`,
          description: bus.status === 'active' ? 'Active' : 'Inactive'
        });
      }
    });

    // Add stop markers
    stops.forEach(stop => {
      const isStudentStop = stop.id === studentStopId;
      result.push({
        id: stop.id,
        position: stop.location,
        type: isStudentStop ? 'student' : 'stop',
        title: stop.name,
        description: stop.address
      });
    });

    // Add destination marker (school) - last stop
    if (stops.length > 0) {
      const lastStop = stops[stops.length - 1];
      if (lastStop.name.toLowerCase().includes('school')) {
        // Update the last stop to be destination type
        const lastMarker = result.find(m => m.id === lastStop.id);
        if (lastMarker) {
          lastMarker.type = 'destination';
        }
      }
    }

    return result;
  }, [buses, stops, studentStopId]);

  // Build route path
  const routePath = useMemo((): GeoLocation[] => {
    if (!showRoute || !route) return [];
    
    // Get stops in order
    const orderedStops = route.stops
      .sort((a, b) => a.order - b.order)
      .map(rs => stops.find(s => s.id === rs.stopId))
      .filter((s): s is Stop => s !== undefined)
      .map(s => s.location);

    return orderedStops;
  }, [route, stops, showRoute]);

  // Calculate map center
  const mapCenter = useMemo((): GeoLocation => {
    if (center) return center;
    
    // If there's a selected bus, center on it
    const selectedBus = buses.find(b => b.id === selectedBusId);
    if (selectedBus?.currentLocation) {
      return selectedBus.currentLocation;
    }

    // If there's a student stop, center on it
    const studentStop = stops.find(s => s.id === studentStopId);
    if (studentStop) {
      return studentStop.location;
    }

    // Default center - average of all markers
    if (markers.length > 0) {
      const avgLat = markers.reduce((sum, m) => sum + m.position.lat, 0) / markers.length;
      const avgLng = markers.reduce((sum, m) => sum + m.position.lng, 0) / markers.length;
      return { lat: avgLat, lng: avgLng };
    }

    return { lat: 40.7128, lng: -74.0060 };
  }, [center, buses, stops, selectedBusId, studentStopId, markers]);

  return (
    <GoogleMap
      center={mapCenter}
      markers={markers}
      routePath={routePath}
      onMarkerClick={onMarkerClick}
      className={className}
    />
  );
}
