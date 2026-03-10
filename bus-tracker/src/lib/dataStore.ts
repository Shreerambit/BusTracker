import type { Bus, Route, Stop, Student, Driver, Trip, Notification } from '@/types';

// In-memory data store for demo purposes
// In production, this would be Firebase or a backend API

class DataStore {
  private buses: Map<string, Bus> = new Map();
  private routes: Map<string, Route> = new Map();
  private stops: Map<string, Stop> = new Map();
  private students: Map<string, Student> = new Map();
  private drivers: Map<string, Driver> = new Map();
  private trips: Map<string, Trip> = new Map();
  private notifications: Map<string, Notification[]> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Demo Stops
    const stops: Stop[] = [
      {
        id: 'stop-1',
        name: 'Maple Street',
        address: '123 Maple St',
        location: { lat: 40.7128, lng: -74.0060 },
        routeId: 'route-1',
        studentIds: ['student-1']
      },
      {
        id: 'stop-2',
        name: 'Oak Avenue',
        address: '456 Oak Ave',
        location: { lat: 40.7150, lng: -74.0080 },
        routeId: 'route-1'
      },
      {
        id: 'stop-3',
        name: 'Pine Road',
        address: '789 Pine Rd',
        location: { lat: 40.7180, lng: -74.0100 },
        routeId: 'route-1'
      },
      {
        id: 'stop-4',
        name: 'Cedar Lane',
        address: '321 Cedar Ln',
        location: { lat: 40.7200, lng: -74.0120 },
        routeId: 'route-1'
      },
      {
        id: 'stop-school',
        name: 'Lincoln High School',
        address: '100 School Dr',
        location: { lat: 40.7300, lng: -74.0200 },
        routeId: 'route-1'
      }
    ];

    stops.forEach(stop => this.stops.set(stop.id, stop));

    // Demo Route
    const route: Route = {
      id: 'route-1',
      name: 'North Route',
      description: 'Covers north side of town',
      stops: [
        { stopId: 'stop-1', order: 1, estimatedArrival: '07:30' },
        { stopId: 'stop-2', order: 2, estimatedArrival: '07:35' },
        { stopId: 'stop-3', order: 3, estimatedArrival: '07:40' },
        { stopId: 'stop-4', order: 4, estimatedArrival: '07:45' },
        { stopId: 'stop-school', order: 5, estimatedArrival: '08:00' }
      ],
      status: 'active',
      startTime: '07:30',
      endTime: '08:00',
      color: '#3B82F6'
    };
    this.routes.set(route.id, route);

    // Demo Bus
    const bus: Bus = {
      id: 'bus-1',
      number: 'BUS-101',
      model: 'Blue Bird Vision',
      capacity: 48,
      driverId: 'driver-1',
      routeId: 'route-1',
      status: 'active',
      currentLocation: { lat: 40.7128, lng: -74.0060 }
    };
    this.buses.set(bus.id, bus);

    // Demo Driver
    const driver: Driver = {
      id: 'driver-1',
      email: 'driver@school.com',
      name: 'John Driver',
      role: 'driver',
      busId: 'bus-1',
      createdAt: new Date().toISOString()
    };
    this.drivers.set(driver.id, driver);

    // Demo Student
    const student: Student = {
      id: 'student-1',
      email: 'student@school.com',
      name: 'Alice Student',
      role: 'student',
      parentId: 'parent-1',
      stopId: 'stop-1',
      routeId: 'route-1',
      grade: '10th',
      createdAt: new Date().toISOString()
    };
    this.students.set(student.id, student);
  }

  // Generic methods
  private notifyListeners(collection: string, data: any) {
    const listeners = this.listeners.get(collection);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  subscribe(collection: string, callback: (data: any) => void) {
    if (!this.listeners.has(collection)) {
      this.listeners.set(collection, new Set());
    }
    this.listeners.get(collection)!.add(callback);
    
    // Return current data immediately
    const data = this.getCollectionData(collection);
    callback(data);

    return () => {
      this.listeners.get(collection)?.delete(callback);
    };
  }

  private getCollectionData(collection: string): any {
    switch (collection) {
      case 'buses': return Array.from(this.buses.values());
      case 'routes': return Array.from(this.routes.values());
      case 'stops': return Array.from(this.stops.values());
      case 'students': return Array.from(this.students.values());
      case 'drivers': return Array.from(this.drivers.values());
      case 'trips': return Array.from(this.trips.values());
      default: return [];
    }
  }

  // Bus methods
  getBuses(): Bus[] {
    return Array.from(this.buses.values());
  }

  getBus(id: string): Bus | undefined {
    return this.buses.get(id);
  }

  createBus(bus: Omit<Bus, 'id'>): Bus {
    const newBus = { ...bus, id: `bus-${Date.now()}` };
    this.buses.set(newBus.id, newBus as Bus);
    this.notifyListeners('buses', this.getBuses());
    return newBus as Bus;
  }

  updateBus(id: string, updates: Partial<Bus>): Bus | undefined {
    const bus = this.buses.get(id);
    if (bus) {
      const updated = { ...bus, ...updates };
      this.buses.set(id, updated);
      this.notifyListeners('buses', this.getBuses());
      return updated;
    }
    return undefined;
  }

  deleteBus(id: string): boolean {
    const deleted = this.buses.delete(id);
    if (deleted) {
      this.notifyListeners('buses', this.getBuses());
    }
    return deleted;
  }

  updateBusLocation(id: string, location: { lat: number; lng: number; heading?: number; speed?: number }) {
    const bus = this.buses.get(id);
    if (bus) {
      bus.currentLocation = location;
      bus.lastUpdated = new Date().toISOString();
      this.buses.set(id, bus);
      this.notifyListeners('buses', this.getBuses());
    }
  }

  // Route methods
  getRoutes(): Route[] {
    return Array.from(this.routes.values());
  }

  getRoute(id: string): Route | undefined {
    return this.routes.get(id);
  }

  createRoute(route: Omit<Route, 'id'>): Route {
    const newRoute = { ...route, id: `route-${Date.now()}` };
    this.routes.set(newRoute.id, newRoute as Route);
    this.notifyListeners('routes', this.getRoutes());
    return newRoute as Route;
  }

  updateRoute(id: string, updates: Partial<Route>): Route | undefined {
    const route = this.routes.get(id);
    if (route) {
      const updated = { ...route, ...updates };
      this.routes.set(id, updated);
      this.notifyListeners('routes', this.getRoutes());
      return updated;
    }
    return undefined;
  }

  deleteRoute(id: string): boolean {
    const deleted = this.routes.delete(id);
    if (deleted) {
      this.notifyListeners('routes', this.getRoutes());
    }
    return deleted;
  }

  // Stop methods
  getStops(): Stop[] {
    return Array.from(this.stops.values());
  }

  getStop(id: string): Stop | undefined {
    return this.stops.get(id);
  }

  getStopsByRoute(routeId: string): Stop[] {
    return this.getStops()
      .filter(s => s.routeId === routeId)
      .sort((a, b) => {
        const route = this.routes.get(routeId);
        if (!route) return 0;
        const orderA = route.stops.find(s => s.stopId === a.id)?.order || 0;
        const orderB = route.stops.find(s => s.stopId === b.id)?.order || 0;
        return orderA - orderB;
      });
  }

  createStop(stop: Omit<Stop, 'id'>): Stop {
    const newStop = { ...stop, id: `stop-${Date.now()}` };
    this.stops.set(newStop.id, newStop as Stop);
    this.notifyListeners('stops', this.getStops());
    return newStop as Stop;
  }

  updateStop(id: string, updates: Partial<Stop>): Stop | undefined {
    const stop = this.stops.get(id);
    if (stop) {
      const updated = { ...stop, ...updates };
      this.stops.set(id, updated);
      this.notifyListeners('stops', this.getStops());
      return updated;
    }
    return undefined;
  }

  deleteStop(id: string): boolean {
    const deleted = this.stops.delete(id);
    if (deleted) {
      this.notifyListeners('stops', this.getStops());
    }
    return deleted;
  }

  // Student methods
  getStudents(): Student[] {
    return Array.from(this.students.values());
  }

  getStudent(id: string): Student | undefined {
    return this.students.get(id);
  }

  createStudent(student: Omit<Student, 'id'>): Student {
    const newStudent = { ...student, id: `student-${Date.now()}` };
    this.students.set(newStudent.id, newStudent as Student);
    this.notifyListeners('students', this.getStudents());
    return newStudent as Student;
  }

  updateStudent(id: string, updates: Partial<Student>): Student | undefined {
    const student = this.students.get(id);
    if (student) {
      const updated = { ...student, ...updates };
      this.students.set(id, updated);
      this.notifyListeners('students', this.getStudents());
      return updated;
    }
    return undefined;
  }

  deleteStudent(id: string): boolean {
    const deleted = this.students.delete(id);
    if (deleted) {
      this.notifyListeners('students', this.getStudents());
    }
    return deleted;
  }

  // Driver methods
  getDrivers(): Driver[] {
    return Array.from(this.drivers.values());
  }

  getDriver(id: string): Driver | undefined {
    return this.drivers.get(id);
  }

  createDriver(driver: Omit<Driver, 'id'>): Driver {
    const newDriver = { ...driver, id: `driver-${Date.now()}` };
    this.drivers.set(newDriver.id, newDriver as Driver);
    this.notifyListeners('drivers', this.getDrivers());
    return newDriver as Driver;
  }

  updateDriver(id: string, updates: Partial<Driver>): Driver | undefined {
    const driver = this.drivers.get(id);
    if (driver) {
      const updated = { ...driver, ...updates };
      this.drivers.set(id, updated);
      this.notifyListeners('drivers', this.getDrivers());
      return updated;
    }
    return undefined;
  }

  deleteDriver(id: string): boolean {
    const deleted = this.drivers.delete(id);
    if (deleted) {
      this.notifyListeners('drivers', this.getDrivers());
    }
    return deleted;
  }

  // Trip methods
  getTrips(): Trip[] {
    return Array.from(this.trips.values());
  }

  getTrip(id: string): Trip | undefined {
    return this.trips.get(id);
  }

  getActiveTripForBus(busId: string): Trip | undefined {
    return this.getTrips().find(t => t.busId === busId && t.status === 'in_progress');
  }

  createTrip(trip: Omit<Trip, 'id'>): Trip {
    const newTrip = { ...trip, id: `trip-${Date.now()}` };
    this.trips.set(newTrip.id, newTrip as Trip);
    this.notifyListeners('trips', this.getTrips());
    return newTrip as Trip;
  }

  updateTrip(id: string, updates: Partial<Trip>): Trip | undefined {
    const trip = this.trips.get(id);
    if (trip) {
      const updated = { ...trip, ...updates };
      this.trips.set(id, updated);
      this.notifyListeners('trips', this.getTrips());
      return updated;
    }
    return undefined;
  }

  // Notification methods
  getNotifications(userId: string): Notification[] {
    return this.notifications.get(userId) || [];
  }

  addNotification(userId: string, notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const userNotifications = this.notifications.get(userId) || [];
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    userNotifications.push(newNotification);
    this.notifications.set(userId, userNotifications);
    this.notifyListeners(`notifications-${userId}`, userNotifications);
    return newNotification;
  }

  markNotificationAsRead(userId: string, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifications.set(userId, userNotifications);
      this.notifyListeners(`notifications-${userId}`, userNotifications);
      return true;
    }
    return false;
  }
}

export const dataStore = new DataStore();
