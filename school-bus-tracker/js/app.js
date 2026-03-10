// School Bus Tracker - Main Application

// ==================== DATA STORE ====================
class DataStore {
  constructor() {
    this.buses = new Map();
    this.routes = new Map();
    this.stops = new Map();
    this.students = new Map();
    this.drivers = new Map();
    this.trips = new Map();
    this.notifications = new Map();
    this.listeners = new Map();
    this.currentUser = null;
    
    this.initDemoData();
  }

  initDemoData() {
    // Demo Stops
    const stops = [
      { id: 'stop-1', name: 'Maple Street', address: '123 Maple St', location: { lat: 40.7128, lng: -74.0060 }, routeId: 'route-1', studentIds: ['student-1'], estimatedArrival: '07:30' },
      { id: 'stop-2', name: 'Oak Avenue', address: '456 Oak Ave', location: { lat: 40.7150, lng: -74.0080 }, routeId: 'route-1', estimatedArrival: '07:35' },
      { id: 'stop-3', name: 'Pine Road', address: '789 Pine Rd', location: { lat: 40.7180, lng: -74.0100 }, routeId: 'route-1', estimatedArrival: '07:40' },
      { id: 'stop-4', name: 'Cedar Lane', address: '321 Cedar Ln', location: { lat: 40.7200, lng: -74.0120 }, routeId: 'route-1', estimatedArrival: '07:45' },
      { id: 'stop-school', name: 'Lincoln High School', address: '100 School Dr', location: { lat: 40.7300, lng: -74.0200 }, routeId: 'route-1', estimatedArrival: '08:00' }
    ];
    stops.forEach(s => this.stops.set(s.id, s));

    // Demo Route
    this.routes.set('route-1', {
      id: 'route-1',
      name: 'North Route',
      description: 'Covers north side of town',
      stops: stops.map((s, i) => ({ stopId: s.id, order: i + 1, estimatedArrival: s.estimatedArrival })),
      status: 'active',
      startTime: '07:30',
      endTime: '08:00',
      color: '#3B82F6'
    });

    // Demo Bus
    this.buses.set('bus-1', {
      id: 'bus-1',
      number: 'BUS-101',
      model: 'Blue Bird Vision',
      capacity: 48,
      driverId: 'driver-1',
      routeId: 'route-1',
      status: 'active',
      currentLocation: { lat: 40.7128, lng: -74.0060, heading: 45, speed: 0 }
    });

    // Demo Driver
    this.drivers.set('driver-1', {
      id: 'driver-1',
      email: 'driver@school.com',
      name: 'John Driver',
      role: 'driver',
      busId: 'bus-1',
      createdAt: new Date().toISOString()
    });

    // Demo Student
    this.students.set('student-1', {
      id: 'student-1',
      email: 'student@school.com',
      name: 'Alice Student',
      role: 'student',
      parentId: 'parent-1',
      stopId: 'stop-1',
      routeId: 'route-1',
      grade: '10th',
      createdAt: new Date().toISOString()
    });

    // Demo Admin
    this.drivers.set('admin-1', {
      id: 'admin-1',
      email: 'admin@school.com',
      name: 'Administrator',
      role: 'admin',
      createdAt: new Date().toISOString()
    });
  }

  // Auth
  login(email, password, role) {
    const demoUsers = {
      'admin@school.com': { id: 'admin-1', email: 'admin@school.com', name: 'Administrator', role: 'admin' },
      'driver@school.com': { id: 'driver-1', email: 'driver@school.com', name: 'John Driver', role: 'driver', busId: 'bus-1' },
      'student@school.com': { id: 'student-1', email: 'student@school.com', name: 'Alice Student', role: 'student', stopId: 'stop-1', routeId: 'route-1' },
      'parent@school.com': { id: 'parent-1', email: 'parent@school.com', name: 'Bob Parent', role: 'parent', studentIds: ['student-1'] }
    };

    const user = demoUsers[email];
    if (user && user.role === role) {
      this.currentUser = user;
      localStorage.setItem('busTrackerUser', JSON.stringify(user));
      return user;
    }
    
    // Auto-create for demo
    const newUser = { id: `${role}-${Date.now()}`, email, name: email.split('@')[0], role, createdAt: new Date().toISOString() };
    this.currentUser = newUser;
    localStorage.setItem('busTrackerUser', JSON.stringify(newUser));
    return newUser;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('busTrackerUser');
  }

  getCurrentUser() {
    if (!this.currentUser) {
      const saved = localStorage.getItem('busTrackerUser');
      if (saved) this.currentUser = JSON.parse(saved);
    }
    return this.currentUser;
  }

  // CRUD Operations
  getAll(collection) {
    const map = this[collection];
    return map ? Array.from(map.values()) : [];
  }

  getById(collection, id) {
    return this[collection]?.get(id);
  }

  create(collection, data) {
    const id = `${collection.slice(0, -1)}-${Date.now()}`;
    const newItem = { ...data, id };
    this[collection].set(id, newItem);
    this.notify(collection);
    return newItem;
  }

  update(collection, id, updates) {
    const item = this[collection]?.get(id);
    if (item) {
      const updated = { ...item, ...updates };
      this[collection].set(id, updated);
      this.notify(collection);
      return updated;
    }
    return null;
  }

  delete(collection, id) {
    const deleted = this[collection]?.delete(id);
    if (deleted) this.notify(collection);
    return deleted;
  }

  // Bus location
  updateBusLocation(busId, location) {
    const bus = this.buses.get(busId);
    if (bus) {
      bus.currentLocation = { ...location, timestamp: Date.now() };
      bus.lastUpdated = new Date().toISOString();
      this.notify('buses');
    }
  }

  // Stops by route
  getStopsByRoute(routeId) {
    const route = this.routes.get(routeId);
    if (!route) return [];
    return route.stops
      .sort((a, b) => a.order - b.order)
      .map(rs => this.stops.get(rs.stopId))
      .filter(Boolean);
  }

  // Active trip
  getActiveTrip(busId) {
    return this.getAll('trips').find(t => t.busId === busId && t.status === 'in_progress');
  }

  // Notifications
  getNotifications(userId) {
    return this.notifications.get(userId) || [];
  }

  addNotification(userId, notification) {
    const notifs = this.notifications.get(userId) || [];
    const newNotif = { ...notification, id: `notif-${Date.now()}`, createdAt: new Date().toISOString(), read: false };
    notifs.push(newNotif);
    this.notifications.set(userId, notifs);
    this.notify(`notifications-${userId}`);
    return newNotif;
  }

  markNotificationRead(userId, notifId) {
    const notifs = this.notifications.get(userId) || [];
    const notif = notifs.find(n => n.id === notifId);
    if (notif) {
      notif.read = true;
      this.notify(`notifications-${userId}`);
      return true;
    }
    return false;
  }

  // Subscribe to changes
  subscribe(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    callback(this.getAll(event));
    return () => this.listeners.get(event)?.delete(callback);
  }

  notify(event) {
    const listeners = this.listeners.get(event);
    if (listeners) listeners.forEach(cb => cb(this.getAll(event)));
  }
}

const store = new DataStore();

// ==================== MAP COMPONENT ====================
class MapComponent {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.map = null;
    this.markers = [];
    this.routeLine = null;
    this.options = options;
    this.init();
  }

  init() {
    if (!this.container) {
      console.log('Map container not found');
      return;
    }
    
    // Check if Google Maps is available
    if (!window.google || !window.google.maps) {
      console.log('Google Maps not loaded, showing fallback');
      this.showFallback();
      return;
    }
    
    try {
      this.map = new google.maps.Map(this.container, {
        center: this.options.center || { lat: 40.7128, lng: -74.0060 },
        zoom: this.options.zoom || 14,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      if (this.options.onClick) {
        this.map.addListener('click', (e) => {
          this.options.onClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
      }
    } catch (e) {
      console.error('Error initializing map:', e);
      this.showFallback();
    }
  }
  
  showFallback() {
    if (this.container) {
      this.container.innerHTML = `
        <div class="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
          <div class="text-center p-4">
            <div class="text-4xl mb-2">🗺️</div>
            <p class="text-gray-600 text-sm">Map unavailable</p>
            <p class="text-gray-400 text-xs mt-1">Add Google Maps API key to enable</p>
          </div>
        </div>
      `;
    }
  }

  clearMarkers() {
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];
  }

  addMarker(position, options = {}) {
    if (!this.map || !window.google) return;
    
    const icons = {
      bus: { url: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="white" stroke-width="2"/><text x="20" y="25" text-anchor="middle" font-size="16">🚌</text></svg>'), scaledSize: new google.maps.Size(40, 40) },
      stop: { url: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#EF4444" stroke="white" stroke-width="2"/><text x="20" y="25" text-anchor="middle" font-size="16">🚏</text></svg>'), scaledSize: new google.maps.Size(35, 35) },
      destination: { url: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#10B981" stroke="white" stroke-width="2"/><text x="20" y="25" text-anchor="middle" font-size="16">🏫</text></svg>'), scaledSize: new google.maps.Size(40, 40) },
      student: { url: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#F59E0B" stroke="white" stroke-width="2"/><text x="20" y="25" text-anchor="middle" font-size="16">👤</text></svg>'), scaledSize: new google.maps.Size(35, 35) }
    };

    const marker = new google.maps.Marker({
      position,
      map: this.map,
      title: options.title || '',
      icon: icons[options.type] || icons.stop,
      animation: options.type === 'bus' ? google.maps.Animation.BOUNCE : undefined
    });

    if (options.info) {
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px;"><strong>${options.title}</strong><br/>${options.info}</div>`
      });
      marker.addListener('click', () => infoWindow.open(this.map, marker));
    }

    this.markers.push(marker);
    return marker;
  }

  drawRoute(path) {
    if (this.routeLine) this.routeLine.setMap(null);
    if (path.length < 2 || !this.map || !window.google) return;

    this.routeLine = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#3B82F6',
      strokeOpacity: 1,
      strokeWeight: 4,
      icons: [{ icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: '#3B82F6', fillOpacity: 1, strokeWeight: 0 }, offset: '50%', repeat: '100px' }]
    });

    this.routeLine.setMap(this.map);
    
    const bounds = new google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    this.map.fitBounds(bounds);
  }

  setCenter(position) {
    if (this.map) this.map.setCenter(position);
  }
}

// ==================== UI COMPONENTS ====================
const UI = {
  app: document.getElementById('app'),

  renderLogin() {
    this.app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <span class="text-3xl">🚌</span>
            </div>
            <h1 class="text-3xl font-bold text-gray-900">School Bus Tracker</h1>
            <p class="text-gray-600 mt-2">Real-time bus tracking for safer journeys</p>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-lg font-semibold mb-4">Sign In</h2>
            <p class="text-sm text-gray-500 mb-4">Select your role and enter credentials</p>
            
            <div class="grid grid-cols-4 gap-2 mb-6">
              ${['admin', 'driver', 'student', 'parent'].map(role => `
                <button onclick="app.selectRole('${role}')" id="role-${role}" 
                  class="role-btn flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all">
                  <span class="text-xl">${role === 'admin' ? '🛡️' : role === 'driver' ? '🚌' : role === 'student' ? '👤' : '👥'}</span>
                  <span class="text-xs capitalize">${role}</span>
                </button>
              `).join('')}
            </div>
            
            <div id="login-form" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" id="email" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter your email" value="student@school.com">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" id="password" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Any password works">
              </div>
              <button onclick="app.login()" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Sign In
              </button>
              <p class="text-xs text-center text-gray-500">Demo: Use emails like admin@school.com, driver@school.com, etc.</p>
            </div>
          </div>
          
          <div class="mt-6 text-center text-sm text-gray-500">
            <p>Install this app for the best experience</p>
            <p class="mt-1">Works offline as a PWA</p>
          </div>
        </div>
      </div>
    `;
    
    // Select student by default
    this.selectRole('student');
  },

  selectRole(role) {
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.classList.remove('border-blue-500', 'bg-blue-50');
      btn.classList.add('border-gray-200');
    });
    const selected = document.getElementById(`role-${role}`);
    if (selected) {
      selected.classList.remove('border-gray-200');
      selected.classList.add('border-blue-500', 'bg-blue-50');
    }
    
    const emails = { admin: 'admin@school.com', driver: 'driver@school.com', student: 'student@school.com', parent: 'parent@school.com' };
    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.value = emails[role];
    if (window.app) window.app.selectedRole = role;
  },

  renderAdminDashboard() {
    const buses = store.getAll('buses');
    const routes = store.getAll('routes');
    const stops = store.getAll('stops');
    const students = store.getAll('students');
    
    this.app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        <header class="bg-white border-b sticky top-0 z-10">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white text-xl">🚌</div>
                <div>
                  <h1 class="text-xl font-bold">Admin Dashboard</h1>
                  <p class="text-sm text-gray-500">${store.getCurrentUser()?.name}</p>
                </div>
              </div>
              <button onclick="app.logout()" class="px-4 py-2 border rounded-lg hover:bg-gray-50">Logout</button>
            </div>
          </div>
        </header>
        
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            ${this.statCard('🚌', 'Buses', buses.length, 'bg-blue-500')}
            ${this.statCard('🛣️', 'Routes', routes.length, 'bg-green-500')}
            ${this.statCard('🚏', 'Stops', stops.length, 'bg-orange-500')}
            ${this.statCard('👤', 'Students', students.length, 'bg-purple-500')}
          </div>
          
          <div class="bg-white rounded-xl shadow">
            <div class="border-b">
              <div class="flex gap-2 p-2 overflow-x-auto">
                ${['routes', 'stops', 'buses', 'drivers', 'students'].map(tab => `
                  <button onclick="app.switchAdminTab('${tab}')" id="admin-tab-${tab}" 
                    class="admin-tab px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap ${tab === 'routes' ? 'bg-gray-100' : 'hover:bg-gray-50'}">
                    ${tab}
                  </button>
                `).join('')}
              </div>
            </div>
            <div id="admin-content" class="p-6">
              ${this.renderRoutesTab()}
            </div>
          </div>
        </main>
      </div>
    `;
  },

  statCard(icon, label, value, color) {
    return `
      <div class="bg-white rounded-xl p-6 shadow">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white text-xl">${icon}</div>
          <div>
            <p class="text-2xl font-bold">${value}</p>
            <p class="text-sm text-gray-500">${label}</p>
          </div>
        </div>
      </div>
    `;
  },

  renderRoutesTab() {
    const routes = store.getAll('routes');
    return `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Routes</h3>
        <button onclick="app.showAddRoute()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Route</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr><th class="px-4 py-2 text-left">Name</th><th class="px-4 py-2 text-left">Description</th><th class="px-4 py-2 text-left">Stops</th><th class="px-4 py-2 text-left">Status</th></tr>
          </thead>
          <tbody>
            ${routes.map(r => `
              <tr class="border-b">
                <td class="px-4 py-3 font-medium"><span class="inline-block w-3 h-3 rounded-full mr-2" style="background:${r.color}"></span>${r.name}</td>
                <td class="px-4 py-3">${r.description || '-'}</td>
                <td class="px-4 py-3">${r.stops.length} stops</td>
                <td class="px-4 py-3"><span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">${r.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderStopsTab() {
    const stops = store.getAll('stops');
    const routes = store.getAll('routes');
    return `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Bus Stops</h3>
        <button onclick="app.showAddStop()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Stop</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr><th class="px-4 py-2 text-left">Name</th><th class="px-4 py-2 text-left">Address</th><th class="px-4 py-2 text-left">Route</th></tr>
          </thead>
          <tbody>
            ${stops.map(s => `
              <tr class="border-b">
                <td class="px-4 py-3 font-medium">${s.name}</td>
                <td class="px-4 py-3">${s.address}</td>
                <td class="px-4 py-3">${routes.find(r => r.id === s.routeId)?.name || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderBusesTab() {
    const buses = store.getAll('buses');
    const drivers = store.getAll('drivers');
    const routes = store.getAll('routes');
    return `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Buses</h3>
        <button onclick="app.showAddBus()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Bus</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr><th class="px-4 py-2 text-left">Number</th><th class="px-4 py-2 text-left">Model</th><th class="px-4 py-2 text-left">Driver</th><th class="px-4 py-2 text-left">Route</th><th class="px-4 py-2 text-left">Status</th></tr>
          </thead>
          <tbody>
            ${buses.map(b => `
              <tr class="border-b">
                <td class="px-4 py-3 font-medium">${b.number}</td>
                <td class="px-4 py-3">${b.model}</td>
                <td class="px-4 py-3">${drivers.find(d => d.id === b.driverId)?.name || 'Unassigned'}</td>
                <td class="px-4 py-3">${routes.find(r => r.id === b.routeId)?.name || 'Unassigned'}</td>
                <td class="px-4 py-3"><span class="px-2 py-1 ${b.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} rounded text-xs">${b.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderDriversTab() {
    const drivers = store.getAll('drivers');
    const buses = store.getAll('buses');
    return `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Drivers</h3>
        <button onclick="app.showAddDriver()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Driver</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr><th class="px-4 py-2 text-left">Name</th><th class="px-4 py-2 text-left">Email</th><th class="px-4 py-2 text-left">Assigned Bus</th></tr>
          </thead>
          <tbody>
            ${drivers.map(d => `
              <tr class="border-b">
                <td class="px-4 py-3 font-medium">${d.name}</td>
                <td class="px-4 py-3">${d.email}</td>
                <td class="px-4 py-3">${buses.find(b => b.id === d.busId)?.number || 'Unassigned'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderStudentsTab() {
    const students = store.getAll('students');
    const stops = store.getAll('stops');
    const routes = store.getAll('routes');
    return `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Students</h3>
        <button onclick="app.showAddStudent()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Student</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr><th class="px-4 py-2 text-left">Name</th><th class="px-4 py-2 text-left">Email</th><th class="px-4 py-2 text-left">Route</th><th class="px-4 py-2 text-left">Stop</th></tr>
          </thead>
          <tbody>
            ${students.map(s => `
              <tr class="border-b">
                <td class="px-4 py-3 font-medium">${s.name}</td>
                <td class="px-4 py-3">${s.email}</td>
                <td class="px-4 py-3">${routes.find(r => r.id === s.routeId)?.name || '-'}</td>
                <td class="px-4 py-3">${stops.find(st => st.id === s.stopId)?.name || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderDriverApp() {
    const user = store.getCurrentUser();
    const bus = store.getById('buses', user.busId);
    const route = bus?.routeId ? store.getById('routes', bus.routeId) : null;
    const stops = route ? store.getStopsByRoute(route.id) : [];
    const activeTrip = store.getActiveTrip(bus?.id);
    
    this.app.innerHTML = `
      <div class="min-h-screen bg-gray-50 flex flex-col">
        <header class="bg-blue-600 text-white sticky top-0 z-10">
          <div class="px-4 py-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🚌</div>
                <div>
                  <h1 class="font-bold">Driver App</h1>
                  <p class="text-sm text-blue-100">${user.name}</p>
                </div>
              </div>
              <button onclick="app.logout()" class="p-2 hover:bg-white/20 rounded-lg">Logout</button>
            </div>
          </div>
        </header>
        
        <main class="flex-1 flex flex-col">
          <div id="driver-map" class="flex-1 min-h-[250px]"></div>
          
          <div class="bg-white border-t p-4">
            ${!activeTrip ? `
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Current Assignment</p>
                    <p class="font-semibold">${bus?.number || 'No Bus'} - ${route?.name || 'No Route'}</p>
                  </div>
                  <span class="px-2 py-1 bg-gray-100 rounded text-sm">${stops.length} stops</span>
                </div>
                <button onclick="app.startTrip()" class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium">
                  ▶ Start Trip
                </button>
              </div>
            ` : `
              <div class="space-y-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">${window.app?.currentStopIndex + 1 || 1}</div>
                      <div>
                        <p class="text-sm text-gray-500">Current Stop</p>
                        <p class="font-semibold">${stops[window.app?.currentStopIndex || 0]?.name || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button onclick="app.completeStop()" class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium">
                    ✓ Complete Stop
                  </button>
                  <button onclick="app.endTrip()" class="px-4 bg-red-500 text-white rounded-lg hover:bg-red-600">
                    ⏹
                  </button>
                </div>
              </div>
            `}
          </div>
          
          <div class="bg-white m-4 rounded-xl shadow p-4">
            <h3 class="text-sm font-medium mb-3">Route Stops (${stops.length})</h3>
            <div class="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
              ${stops.map((stop, i) => `
                <div class="flex items-center gap-3 p-2 rounded-lg ${i === (window.app?.currentStopIndex || 0) ? 'bg-blue-50 border border-blue-200' : i < (window.app?.currentStopIndex || 0) ? 'bg-green-50 opacity-60' : 'bg-gray-50'}">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${i === (window.app?.currentStopIndex || 0) ? 'bg-blue-600 text-white' : i < (window.app?.currentStopIndex || 0) ? 'bg-green-500 text-white' : 'bg-gray-200'}">${i + 1}</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">${stop.name}</p>
                  </div>
                  <span class="text-xs text-gray-500">${stop.estimatedArrival || '--:--'}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </main>
      </div>
    `;
    
    // Initialize map
    setTimeout(() => {
      if (window.app) {
        window.app.driverMap = new MapComponent('driver-map', { center: bus?.currentLocation });
        if (bus && window.app.driverMap.map) {
          window.app.driverMap.addMarker(bus.currentLocation, { type: 'bus', title: bus.number });
          stops.forEach((stop, i) => {
            window.app.driverMap.addMarker(stop.location, { 
              type: i === stops.length - 1 ? 'destination' : 'stop', 
              title: stop.name,
              info: stop.address 
            });
          });
          if (stops.length > 1) {
            window.app.driverMap.drawRoute(stops.map(s => s.location));
          }
        }
      }
    }, 100);
  },

  renderStudentApp() {
    const user = store.getCurrentUser();
    const student = user.role === 'parent' ? store.getById('students', user.studentIds?.[0]) : user;
    const route = student?.routeId ? store.getById('routes', student.routeId) : null;
    const bus = route ? store.getAll('buses').find(b => b.routeId === route.id) : null;
    const stops = route ? store.getStopsByRoute(route.id) : [];
    const studentStop = stops.find(s => s.id === student?.stopId);
    const notifications = store.getNotifications(student?.id);
    const unreadCount = notifications.filter(n => !n.read).length;
    const showNotifPanel = window.app?.showNotifPanel || false;
    
    // Calculate ETA
    let eta = '--';
    let distance = null;
    if (bus?.currentLocation && studentStop) {
      const dist = this.calculateDistance(bus.currentLocation, studentStop.location);
      distance = Math.round(dist);
      const timeMinutes = Math.ceil((dist / 1000) / 30 * 60);
      eta = `${timeMinutes} min`;
    }
    
    this.app.innerHTML = `
      <div class="min-h-screen bg-gray-50 flex flex-col">
        <header class="bg-green-600 text-white sticky top-0 z-10">
          <div class="px-4 py-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🚌</div>
                <div>
                  <h1 class="font-bold">Bus Tracker</h1>
                  <p class="text-sm text-green-100">${user.name}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="app.toggleNotifications()" class="p-2 hover:bg-white/20 rounded-lg relative">
                  🔔
                  ${unreadCount > 0 ? `<span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">${unreadCount}</span>` : ''}
                </button>
                <button onclick="app.logout()" class="p-2 hover:bg-white/20 rounded-lg">Logout</button>
              </div>
            </div>
          </div>
        </header>
        
        ${showNotifPanel ? `
          <div class="bg-white border-b shadow-lg p-4">
            <div class="flex justify-between items-center mb-3">
              <h3 class="font-semibold">Notifications</h3>
              <button onclick="app.toggleNotifications()" class="text-sm text-gray-500">Close</button>
            </div>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              ${notifications.length === 0 ? '<p class="text-gray-500 text-center py-4">No notifications</p>' : 
                notifications.map(n => `
                  <div class="p-3 rounded-lg ${n.read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'}">
                    <p class="font-medium text-sm">${n.title}</p>
                    <p class="text-sm text-gray-600">${n.message}</p>
                    ${!n.read ? `<button onclick="app.markRead('${n.id}')" class="text-xs text-blue-600 mt-1">Mark read</button>` : ''}
                  </div>
                `).join('')}
            </div>
          </div>
        ` : ''}
        
        <main class="flex-1 flex flex-col">
          <div id="student-map" class="flex-1 min-h-[250px]"></div>
          
          <div class="bg-white m-4 rounded-xl shadow p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 ${bus?.currentLocation ? 'bg-green-100' : 'bg-gray-100'} rounded-xl flex items-center justify-center text-2xl">🚌</div>
                <div>
                  <p class="text-sm text-gray-500">Your Bus</p>
                  <p class="text-xl font-bold">${bus?.number || 'Not Assigned'}</p>
                  ${bus?.currentLocation ? '<span class="px-2 py-0.5 bg-green-500 text-white rounded text-xs">Active</span>' : '<span class="px-2 py-0.5 bg-gray-200 rounded text-xs">Not Running</span>'}
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500">ETA to Your Stop</p>
                <p class="text-2xl font-bold text-green-600">${bus?.currentLocation ? eta : '--'}</p>
                ${distance !== null ? `<p class="text-xs text-gray-500">${distance}m away</p>` : ''}
              </div>
            </div>
          </div>
          
          ${studentStop ? `
            <div class="bg-white mx-4 mb-4 rounded-xl shadow p-4">
              <h3 class="text-sm font-medium mb-2">🚏 Your Stop</h3>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">📍</div>
                <div class="flex-1">
                  <p class="font-semibold">${studentStop.name}</p>
                  <p class="text-sm text-gray-500">${studentStop.address}</p>
                </div>
                <span class="font-mono text-sm">${studentStop.estimatedArrival || '--:--'}</span>
              </div>
            </div>
          ` : ''}
          
          <div class="bg-white mx-4 mb-4 rounded-xl shadow p-4">
            <h3 class="text-sm font-medium mb-2">🕐 Route Schedule</h3>
            <div class="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
              ${stops.map((stop, i) => {
                const isMyStop = stop.id === student?.stopId;
                return `
                  <div class="flex items-center gap-3 p-2 rounded-lg ${isMyStop ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isMyStop ? 'bg-green-600 text-white' : 'bg-gray-200'}">${i + 1}</div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate ${isMyStop ? 'text-green-700' : ''}">${stop.name} ${isMyStop ? '(Your Stop)' : ''}</p>
                    </div>
                    <span class="text-xs text-gray-500">${stop.estimatedArrival || '--:--'}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          
          <div class="mx-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div class="flex items-start gap-3">
              <span class="text-xl">⚠️</span>
              <div>
                <p class="font-medium text-amber-800">Safety Reminder</p>
                <p class="text-sm text-amber-700">Arrive at your stop 5 minutes early. Stay in a safe location while waiting.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
    
    // Initialize map
    setTimeout(() => {
      if (window.app) {
        window.app.studentMap = new MapComponent('student-map', { center: studentStop?.location });
        if (window.app.studentMap.map) {
          if (bus?.currentLocation) {
            window.app.studentMap.addMarker(bus.currentLocation, { type: 'bus', title: bus.number });
          }
          stops.forEach((stop, i) => {
            window.app.studentMap.addMarker(stop.location, { 
              type: stop.id === student?.stopId ? 'student' : i === stops.length - 1 ? 'destination' : 'stop', 
              title: stop.name 
            });
          });
          if (stops.length > 1) {
            window.app.studentMap.drawRoute(stops.map(s => s.location));
          }
        }
      }
    }, 100);
  },

  calculateDistance(loc1, loc2) {
    const R = 6371e3;
    const φ1 = loc1.lat * Math.PI / 180;
    const φ2 = loc2.lat * Math.PI / 180;
    const Δφ = (loc2.lat - loc1.lat) * Math.PI / 180;
    const Δλ = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
};

// ==================== APP CONTROLLER ====================
class App {
  constructor() {
    this.selectedRole = 'student';
    this.currentTab = 'routes';
    this.driverMap = null;
    this.studentMap = null;
    this.watchId = null;
    this.currentStopIndex = 0;
    this.showNotifPanel = false;
    
    // Check for existing session
    const user = store.getCurrentUser();
    if (user) {
      this.renderDashboard(user.role);
    } else {
      UI.renderLogin();
    }
  }

  selectRole(role) {
    UI.selectRole(role);
  }

  login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email) {
      alert('Please enter your email');
      return;
    }
    
    const user = store.login(email, password, this.selectedRole);
    if (user) {
      this.renderDashboard(user.role);
    }
  }

  logout() {
    store.logout();
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.currentStopIndex = 0;
    UI.renderLogin();
  }

  renderDashboard(role) {
    switch(role) {
      case 'admin':
        UI.renderAdminDashboard();
        break;
      case 'driver':
        UI.renderDriverApp();
        break;
      case 'student':
      case 'parent':
        UI.renderStudentApp();
        break;
      default:
        UI.renderLogin();
    }
  }

  switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(btn => {
      btn.classList.remove('bg-gray-100');
      btn.classList.add('hover:bg-gray-50');
    });
    const tabBtn = document.getElementById(`admin-tab-${tab}`);
    if (tabBtn) tabBtn.classList.add('bg-gray-100');
    
    const content = document.getElementById('admin-content');
    if (!content) return;
    
    switch(tab) {
      case 'routes': content.innerHTML = UI.renderRoutesTab(); break;
      case 'stops': content.innerHTML = UI.renderStopsTab(); break;
      case 'buses': content.innerHTML = UI.renderBusesTab(); break;
      case 'drivers': content.innerHTML = UI.renderDriversTab(); break;
      case 'students': content.innerHTML = UI.renderStudentsTab(); break;
    }
  }

  startTrip() {
    const user = store.getCurrentUser();
    const bus = store.getById('buses', user.busId);
    if (!bus) {
      alert('No bus assigned');
      return;
    }

    // Start GPS tracking
    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          store.updateBusLocation(bus.id, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading,
            speed: pos.coords.speed
          });
          // Update map
          if (this.driverMap && this.driverMap.map) {
            this.driverMap.clearMarkers();
            const updatedBus = store.getById('buses', bus.id);
            this.driverMap.addMarker(updatedBus.currentLocation, { type: 'bus', title: bus.number });
            const stops = store.getStopsByRoute(bus.routeId);
            stops.forEach((stop, i) => {
              this.driverMap.addMarker(stop.location, { 
                type: i === stops.length - 1 ? 'destination' : 'stop', 
                title: stop.name 
              });
            });
          }
        },
        (err) => console.error('GPS error:', err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    // Create trip
    store.create('trips', {
      routeId: bus.routeId,
      busId: bus.id,
      driverId: user.id,
      status: 'in_progress',
      startTime: new Date().toISOString()
    });

    this.currentStopIndex = 0;
    UI.renderDriverApp();
  }

  endTrip() {
    const user = store.getCurrentUser();
    const bus = store.getById('buses', user.busId);
    const activeTrip = store.getActiveTrip(bus?.id);
    
    if (activeTrip) {
      store.update('trips', activeTrip.id, { status: 'completed', endTime: new Date().toISOString() });
    }
    
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    this.currentStopIndex = 0;
    UI.renderDriverApp();
  }

  completeStop() {
    const user = store.getCurrentUser();
    const bus = store.getById('buses', user.busId);
    const stops = store.getStopsByRoute(bus?.routeId);
    
    if (this.currentStopIndex < stops.length - 1) {
      this.currentStopIndex++;
      UI.renderDriverApp();
    } else {
      this.endTrip();
    }
  }

  toggleNotifications() {
    this.showNotifPanel = !this.showNotifPanel;
    UI.renderStudentApp();
  }

  markRead(notifId) {
    const user = store.getCurrentUser();
    const student = user.role === 'parent' ? store.getById('students', user.studentIds?.[0]) : user;
    store.markNotificationRead(student?.id, notifId);
    UI.renderStudentApp();
  }

  // Modal handlers
  showAddRoute() {
    const name = prompt('Route name:');
    if (name) {
      store.create('routes', { name, description: '', stops: [], status: 'active', color: '#3B82F6' });
      UI.renderAdminDashboard();
    }
  }

  showAddStop() {
    const name = prompt('Stop name:');
    const address = prompt('Address:');
    if (name && address) {
      store.create('stops', { name, address, location: { lat: 40.7128, lng: -74.006 }, routeId: 'route-1' });
      UI.renderAdminDashboard();
    }
  }

  showAddBus() {
    const number = prompt('Bus number:');
    if (number) {
      store.create('buses', { number, model: 'Standard', capacity: 48, status: 'active' });
      UI.renderAdminDashboard();
    }
  }

  showAddDriver() {
    const name = prompt('Driver name:');
    const email = prompt('Email:');
    if (name && email) {
      store.create('drivers', { name, email, role: 'driver', createdAt: new Date().toISOString() });
      UI.renderAdminDashboard();
    }
  }

  showAddStudent() {
    const name = prompt('Student name:');
    const email = prompt('Email:');
    if (name && email) {
      store.create('students', { name, email, role: 'student', routeId: 'route-1', stopId: 'stop-1', createdAt: new Date().toISOString() });
      UI.renderAdminDashboard();
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

// Also try immediate initialization
try {
  window.app = new App();
} catch (e) {
  console.log('Waiting for DOM...');
}
