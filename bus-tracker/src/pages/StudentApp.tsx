import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dataStore } from '@/lib/dataStore';
import { useBus, useRoute, useStopsByRoute, useNotifications } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapView } from '@/components/map/MapView';
import { Bus, MapPin, Clock, Bell, Navigation, LogOut, ChevronRight, AlertCircle, Check } from 'lucide-react';
import type { Student, GeoLocation } from '@/types';

export function StudentApp() {
  const { logout, user } = useAuth();
  const student = user as Student;
  
  const route = useRoute(student.routeId || '');
  const bus = useBus(route ? dataStore.getBuses().find(b => b.routeId === route.id)?.id || '' : '');
  const stops = useStopsByRoute(route?.id || '');
  const studentStop = stops.find(s => s.id === student.stopId);
  const { notifications, unreadCount } = useNotifications(student.id);

  const [eta, setEta] = useState<string>('Calculating...');
  const [distance, setDistance] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Calculate ETA and distance
  useEffect(() => {
    if (bus?.currentLocation && studentStop) {
      const dist = calculateDistance(bus.currentLocation, studentStop.location);
      setDistance(dist);
      
      // Estimate: assume 30 km/h average speed in city
      const timeMinutes = Math.ceil((dist / 1000) / 30 * 60);
      setEta(`${timeMinutes} min`);

      // Send notification if bus is nearby (within 500m)
      if (dist < 500 && !notifications.some(n => n.type === 'bus_nearby' && !n.read)) {
        dataStore.addNotification(student.id, {
          userId: student.id,
          title: 'Bus is Nearby!',
          message: `Bus ${bus.number} is ${Math.round(dist)}m away from your stop`,
          type: 'bus_nearby',
          data: { busId: bus.id, distance: dist }
        });
      }
    }
  }, [bus?.currentLocation, studentStop, notifications]);

  const calculateDistance = (loc1: GeoLocation, loc2: GeoLocation): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = loc1.lat * Math.PI / 180;
    const φ2 = loc2.lat * Math.PI / 180;
    const Δφ = (loc2.lat - loc1.lat) * Math.PI / 180;
    const Δλ = (loc2.lng - loc1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const markNotificationRead = (notifId: string) => {
    dataStore.markNotificationAsRead(student.id, notifId);
  };

  const busMarkers = bus ? [bus] : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-green-600 text-white sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold">Bus Tracker</h1>
                <p className="text-sm text-green-100">{student.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-white hover:bg-white/20 relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={logout} className="text-white hover:bg-white/20">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="bg-white border-b shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Notifications</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)}>
                Close
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No notifications</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg ${notif.read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{notif.title}</p>
                        <p className="text-sm text-gray-600">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {!notif.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markNotificationRead(notif.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Map */}
        <div className="flex-1 min-h-[300px]">
          <MapView
            buses={busMarkers}
            stops={stops}
            route={route}
            selectedBusId={bus?.id}
            studentStopId={student.stopId}
            showRoute={true}
            className="h-full"
          />
        </div>

        {/* Bus Status Card */}
        <Card className="m-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  bus?.currentLocation ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Bus className={`w-6 h-6 ${bus?.currentLocation ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Your Bus</p>
                  <p className="text-xl font-bold">{bus?.number || 'Not Assigned'}</p>
                  {bus?.currentLocation ? (
                    <Badge variant="default" className="bg-green-500">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Not Running</Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">ETA to Your Stop</p>
                <p className="text-2xl font-bold text-green-600">{bus?.currentLocation ? eta : '--'}</p>
                {distance !== null && (
                  <p className="text-xs text-gray-500">{Math.round(distance)}m away</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Stop Card */}
        {studentStop && (
          <Card className="mx-4 mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Your Stop
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{studentStop.name}</p>
                  <p className="text-sm text-gray-500">{studentStop.address}</p>
                </div>
                {studentStop.estimatedArrival && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Scheduled</p>
                    <p className="font-mono">{studentStop.estimatedArrival}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Route Stops */}
        <Card className="mx-4 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Route Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stops.map((stop, index) => {
                const isMyStop = stop.id === student.stopId;
                const isPast = bus?.currentLocation && 
                  stops.findIndex(s => s.id === student.stopId) > index;
                
                return (
                  <div
                    key={stop.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      isMyStop ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isMyStop ? 'bg-green-600 text-white' : isPast ? 'bg-gray-300' : 'bg-gray-200'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMyStop ? 'text-green-700' : ''}`}>
                        {stop.name}
                        {isMyStop && <span className="ml-2 text-xs">(Your Stop)</span>}
                      </p>
                    </div>
                    {stop.estimatedArrival && (
                      <span className="text-xs text-gray-500">{stop.estimatedArrival}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Safety Alert */}
        <div className="mx-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Safety Reminder</p>
              <p className="text-sm text-amber-700">
                Please arrive at your stop 5 minutes before the scheduled time. 
                Stay in a safe location while waiting.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
