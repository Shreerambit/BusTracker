// User Types
export type UserRole = 'admin' | 'driver' | 'student' | 'parent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export interface Driver extends User {
  role: 'driver';
  busId?: string;
  licenseNumber?: string;
}

export interface Student extends User {
  role: 'student';
  parentId?: string;
  stopId?: string;
  routeId?: string;
  grade?: string;
}

export interface Parent extends User {
  role: 'parent';
  studentIds: string[];
}

// Bus Types
export interface Bus {
  id: string;
  number: string;
  model: string;
  capacity: number;
  driverId?: string;
  routeId?: string;
  status: 'active' | 'maintenance' | 'inactive';
  currentLocation?: GeoLocation;
  lastUpdated?: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

// Route Types
export interface Route {
  id: string;
  name: string;
  description?: string;
  stops: RouteStop[];
  status: 'active' | 'inactive';
  startTime?: string;
  endTime?: string;
  color: string;
}

export interface RouteStop {
  stopId: string;
  order: number;
  estimatedArrival?: string;
}

// Stop Types
export interface Stop {
  id: string;
  name: string;
  address: string;
  location: GeoLocation;
  routeId?: string;
  studentIds?: string[];
  estimatedArrival?: string;
}

// Trip Types
export interface Trip {
  id: string;
  routeId: string;
  busId: string;
  driverId: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  currentLocation?: GeoLocation;
  nextStopId?: string;
  nextStopETA?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'bus_nearby' | 'trip_started' | 'trip_ended' | 'delay' | 'emergency';
  read: boolean;
  createdAt: string;
  data?: {
    tripId?: string;
    stopId?: string;
    busId?: string;
    distance?: number;
  };
}

// Map Types
export interface MapMarker {
  id: string;
  position: GeoLocation;
  type: 'bus' | 'stop' | 'destination' | 'student';
  title: string;
  description?: string;
  icon?: string;
}

// Settings
export interface AppSettings {
  proximityThreshold: number; // in meters
  updateInterval: number; // in seconds
  notificationEnabled: boolean;
}
