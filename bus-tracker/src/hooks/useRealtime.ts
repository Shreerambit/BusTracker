import { useState, useEffect, useCallback } from 'react';
import { dataStore } from '@/lib/dataStore';
import type { Bus, Route, Stop, Student, Driver, Trip, Notification } from '@/types';

export function useBuses() {
  const [buses, setBuses] = useState<Bus[]>([]);

  useEffect(() => {
    return dataStore.subscribe('buses', setBuses);
  }, []);

  return buses;
}

export function useBus(busId: string) {
  const [bus, setBus] = useState<Bus | null>(null);

  useEffect(() => {
    return dataStore.subscribe('buses', (buses: Bus[]) => {
      const found = buses.find(b => b.id === busId);
      if (found) setBus(found);
    });
  }, [busId]);

  return bus;
}

export function useRoutes() {
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    return dataStore.subscribe('routes', setRoutes);
  }, []);

  return routes;
}

export function useRoute(routeId: string) {
  const [route, setRoute] = useState<Route | null>(null);

  useEffect(() => {
    return dataStore.subscribe('routes', (routes: Route[]) => {
      const found = routes.find(r => r.id === routeId);
      if (found) setRoute(found);
    });
  }, [routeId]);

  return route;
}

export function useStops() {
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    return dataStore.subscribe('stops', setStops);
  }, []);

  return stops;
}

export function useStopsByRoute(routeId: string) {
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    const updateStops = () => {
      setStops(dataStore.getStopsByRoute(routeId));
    };
    updateStops();
    return dataStore.subscribe('stops', updateStops);
  }, [routeId]);

  return stops;
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    return dataStore.subscribe('students', setStudents);
  }, []);

  return students;
}

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    return dataStore.subscribe('drivers', setDrivers);
  }, []);

  return drivers;
}

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    return dataStore.subscribe('trips', setTrips);
  }, []);

  return trips;
}

export function useActiveTrip(busId: string) {
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    return dataStore.subscribe('trips', (trips: Trip[]) => {
      const active = trips.find(t => t.busId === busId && t.status === 'in_progress');
      setTrip(active || null);
    });
  }, [busId]);

  return trip;
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    return dataStore.subscribe(`notifications-${userId}`, (notifs: Notification[]) => {
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
  }, [userId]);

  return { notifications, unreadCount };
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return null;
    }

    setIsWatching(true);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(position);
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsWatching(false);
    };
  }, []);

  const stopWatching = useCallback(() => {
    setIsWatching(false);
  }, []);

  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          resolve(position);
        },
        (err) => reject(err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    });
  }, []);

  return { location, error, isWatching, startWatching, stopWatching, getCurrentPosition };
}
