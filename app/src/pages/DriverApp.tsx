import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dataStore } from '@/lib/dataStore';
import { useBus, useStopsByRoute, useActiveTrip } from '@/hooks/useRealtime';
import { useGeolocation } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapView } from '@/components/map/MapView';
import { Bus, MapPin, Users, Navigation, Play, Square, Clock, ChevronRight, LogOut, Phone } from 'lucide-react';
import type { GeoLocation } from '@/types';

export function DriverApp() {
  const { logout, user } = useAuth();
  const driver = user as { id: string; busId?: string; name: string };
  const bus = useBus(driver.busId || '');
  const route = bus?.routeId ? dataStore.getRoute(bus.routeId) : null;
  const stops = useStopsByRoute(route?.id || '');
  const activeTrip = useActiveTrip(bus?.id || '');
  
  const { location, startWatching, stopWatching, isWatching } = useGeolocation();
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update bus location when GPS updates
  useEffect(() => {
    if (location && bus?.id && activeTrip) {
      dataStore.updateBusLocation(bus.id, {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined
      });
    }
  }, [location, bus?.id, activeTrip]);

  // Timer for trip duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTrip) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [activeTrip]);

  const startTrip = () => {
    if (!bus || !route) return;
    
    // Start GPS tracking
    startWatching();
    
    // Create trip
    dataStore.createTrip({
      routeId: route.id,
      busId: bus.id,
      driverId: driver.id,
      status: 'in_progress',
      startTime: new Date().toISOString(),
      nextStopId: stops[0]?.id,
      nextStopETA: stops[0]?.estimatedArrival
    });

    setCurrentStopIndex(0);
  };

  const endTrip = () => {
    if (activeTrip) {
      dataStore.updateTrip(activeTrip.id, {
        status: 'completed',
        endTime: new Date().toISOString()
      });
    }
    stopWatching();
  };

  const markStopComplete = () => {
    if (currentStopIndex < stops.length - 1) {
      const nextIndex = currentStopIndex + 1;
      setCurrentStopIndex(nextIndex);
      
      if (activeTrip) {
        dataStore.updateTrip(activeTrip.id, {
          nextStopId: stops[nextIndex]?.id,
          nextStopETA: stops[nextIndex]?.estimatedArrival
        });
      }
    } else {
      // All stops completed
      endTrip();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const busMarkers = bus ? [bus] : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold">Driver App</h1>
                <p className="text-sm text-blue-100">{driver.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTrip && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{formatTime(elapsedTime)}</span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={logout} className="text-white hover:bg-white/20">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Map */}
        <div className="flex-1 min-h-[300px]">
          <MapView
            buses={busMarkers}
            stops={stops}
            route={route}
            showRoute={true}
            className="h-full"
          />
        </div>

        {/* Trip Controls */}
        <div className="bg-white border-t p-4">
          {!activeTrip ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Current Assignment</p>
                  <p className="font-semibold">{bus?.number} - {route?.name}</p>
                </div>
                <Badge variant="outline">{stops.length} stops</Badge>
              </div>
              <Button onClick={startTrip} className="w-full bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Start Trip
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Stop */}
              {stops[currentStopIndex] && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {currentStopIndex + 1}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Current Stop</p>
                        <p className="font-semibold">{stops[currentStopIndex].name}</p>
                        <p className="text-xs text-gray-500">{stops[currentStopIndex].address}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">ETA</p>
                      <p className="font-mono">{stops[currentStopIndex].estimatedArrival || '--:--'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Stop Preview */}
              {stops[currentStopIndex + 1] && (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <ChevronRight className="w-4 h-4" />
                  <span>Next: {stops[currentStopIndex + 1].name}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={markStopComplete} className="flex-1">
                  <MapPin className="w-4 h-4 mr-2" />
                  {currentStopIndex < stops.length - 1 ? 'Complete Stop' : 'Finish Trip'}
                </Button>
                <Button variant="destructive" onClick={endTrip}>
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stop List */}
        <Card className="m-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Route Stops ({stops.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stops.map((stop, index) => (
                <div
                  key={stop.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    index === currentStopIndex && activeTrip
                      ? 'bg-blue-50 border border-blue-200'
                      : index < currentStopIndex && activeTrip
                      ? 'bg-green-50 opacity-60'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    index === currentStopIndex && activeTrip
                      ? 'bg-blue-600 text-white'
                      : index < currentStopIndex && activeTrip
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{stop.name}</p>
                    <p className="text-xs text-gray-500 truncate">{stop.address}</p>
                  </div>
                  {stop.estimatedArrival && (
                    <span className="text-xs text-gray-500">{stop.estimatedArrival}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Student Count */}
        <Card className="mx-4 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Students on Route</p>
                  <p className="text-xl font-bold">
                    {stops.reduce((acc, stop) => acc + (stop.studentIds?.length || 0), 0)}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
