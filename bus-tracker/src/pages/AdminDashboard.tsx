import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dataStore } from '@/lib/dataStore';
import { useBuses, useRoutes, useStops, useStudents, useDrivers } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bus, MapPin, Users, UserCircle, Route, Plus, LogOut, Edit, Trash2 } from 'lucide-react';
import type { Route as RouteType, Stop, Bus as BusType, Student, Driver } from '@/types';

export function AdminDashboard() {
  const { logout, user } = useAuth();
  const buses = useBuses();
  const routes = useRoutes();
  const stops = useStops();
  const students = useStudents();
  const drivers = useDrivers();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <Bus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">{user?.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Bus className="w-5 h-5" />} label="Buses" value={buses.length} color="bg-blue-500" />
          <StatCard icon={<Route className="w-5 h-5" />} label="Routes" value={routes.length} color="bg-green-500" />
          <StatCard icon={<MapPin className="w-5 h-5" />} label="Stops" value={stops.length} color="bg-orange-500" />
          <StatCard icon={<Users className="w-5 h-5" />} label="Students" value={students.length} color="bg-purple-500" />
        </div>

        <Tabs defaultValue="routes">
          <TabsList className="mb-6">
            <TabsTrigger value="routes">
              <Route className="w-4 h-4 mr-2" />
              Routes
            </TabsTrigger>
            <TabsTrigger value="stops">
              <MapPin className="w-4 h-4 mr-2" />
              Stops
            </TabsTrigger>
            <TabsTrigger value="buses">
              <Bus className="w-4 h-4 mr-2" />
              Buses
            </TabsTrigger>
            <TabsTrigger value="drivers">
              <UserCircle className="w-4 h-4 mr-2" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="w-4 h-4 mr-2" />
              Students
            </TabsTrigger>
          </TabsList>

          <TabsContent value="routes">
            <RoutesTab routes={routes} />
          </TabsContent>

          <TabsContent value="stops">
            <StopsTab stops={stops} routes={routes} />
          </TabsContent>

          <TabsContent value="buses">
            <BusesTab buses={buses} drivers={drivers} routes={routes} />
          </TabsContent>

          <TabsContent value="drivers">
            <DriversTab drivers={drivers} buses={buses} />
          </TabsContent>

          <TabsContent value="students">
            <StudentsTab students={students} stops={stops} routes={routes} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white`}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoutesTab({ routes }: { routes: RouteType[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRoute, setNewRoute] = useState({ name: '', description: '', color: '#3B82F6' });

  const handleCreate = () => {
    dataStore.createRoute({
      name: newRoute.name,
      description: newRoute.description,
      stops: [],
      status: 'active',
      color: newRoute.color
    });
    setIsDialogOpen(false);
    setNewRoute({ name: '', description: '', color: '#3B82F6' });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Routes</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Route
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Route</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Route Name</Label>
                <Input
                  value={newRoute.name}
                  onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                  placeholder="e.g., North Route"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={newRoute.description}
                  onChange={(e) => setNewRoute({ ...newRoute, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={newRoute.color}
                  onChange={(e) => setNewRoute({ ...newRoute, color: e.target.value })}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Create Route</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Stops</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route) => (
              <TableRow key={route.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: route.color }} />
                    {route.name}
                  </div>
                </TableCell>
                <TableCell>{route.description}</TableCell>
                <TableCell>{route.stops.length} stops</TableCell>
                <TableCell>
                  <Badge variant={route.status === 'active' ? 'default' : 'secondary'}>
                    {route.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => dataStore.deleteRoute(route.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StopsTab({ stops, routes }: { stops: Stop[]; routes: RouteType[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStop, setNewStop] = useState({ name: '', address: '', routeId: '' });

  const handleCreate = () => {
    dataStore.createStop({
      name: newStop.name,
      address: newStop.address,
      location: { lat: 40.7128, lng: -74.0060 }, // Default location
      routeId: newStop.routeId
    });
    setIsDialogOpen(false);
    setNewStop({ name: '', address: '', routeId: '' });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bus Stops</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Stop
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Stop</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Stop Name</Label>
                <Input
                  value={newStop.name}
                  onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                  placeholder="e.g., Maple Street"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={newStop.address}
                  onChange={(e) => setNewStop({ ...newStop, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              <div>
                <Label>Route</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={newStop.routeId}
                  onChange={(e) => setNewStop({ ...newStop, routeId: e.target.value })}
                >
                  <option value="">Select Route</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Stop</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stops.map((stop) => (
              <TableRow key={stop.id}>
                <TableCell className="font-medium">{stop.name}</TableCell>
                <TableCell>{stop.address}</TableCell>
                <TableCell>{routes.find(r => r.id === stop.routeId)?.name || '-'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => dataStore.deleteStop(stop.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function BusesTab({ buses, drivers, routes }: { buses: BusType[]; drivers: Driver[]; routes: RouteType[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBus, setNewBus] = useState({ number: '', model: '', capacity: 48 });

  const handleCreate = () => {
    dataStore.createBus?.({
      number: newBus.number,
      model: newBus.model,
      capacity: newBus.capacity,
      status: 'active'
    });
    setIsDialogOpen(false);
    setNewBus({ number: '', model: '', capacity: 48 });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Buses</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Bus
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Bus</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Bus Number</Label>
                <Input
                  value={newBus.number}
                  onChange={(e) => setNewBus({ ...newBus, number: e.target.value })}
                  placeholder="e.g., BUS-101"
                />
              </div>
              <div>
                <Label>Model</Label>
                <Input
                  value={newBus.model}
                  onChange={(e) => setNewBus({ ...newBus, model: e.target.value })}
                  placeholder="e.g., Blue Bird Vision"
                />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={newBus.capacity}
                  onChange={(e) => setNewBus({ ...newBus, capacity: parseInt(e.target.value) })}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Add Bus</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buses.map((bus) => (
              <TableRow key={bus.id}>
                <TableCell className="font-medium">{bus.number}</TableCell>
                <TableCell>{bus.model}</TableCell>
                <TableCell>{drivers.find(d => d.id === bus.driverId)?.name || 'Unassigned'}</TableCell>
                <TableCell>{routes.find(r => r.id === bus.routeId)?.name || 'Unassigned'}</TableCell>
                <TableCell>
                  <Badge variant={bus.status === 'active' ? 'default' : 'secondary'}>
                    {bus.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DriversTab({ drivers, buses }: { drivers: Driver[]; buses: BusType[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Drivers</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Assigned Bus</TableHead>
              <TableHead>License</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">{driver.name}</TableCell>
                <TableCell>{driver.email}</TableCell>
                <TableCell>{buses.find(b => b.id === driver.busId)?.number || 'Unassigned'}</TableCell>
                <TableCell>{driver.licenseNumber || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StudentsTab({ students, stops, routes }: { students: Student[]; stops: Stop[]; routes: RouteType[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', stopId: '', routeId: '' });

  const handleCreate = () => {
    dataStore.createStudent?.({
      name: newStudent.name,
      email: newStudent.email,
      stopId: newStudent.stopId,
      routeId: newStudent.routeId,
      role: 'student',
      createdAt: new Date().toISOString()
    });
    setIsDialogOpen(false);
    setNewStudent({ name: '', email: '', stopId: '', routeId: '' });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Students</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="Student name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="student@school.com"
                />
              </div>
              <div>
                <Label>Route</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={newStudent.routeId}
                  onChange={(e) => setNewStudent({ ...newStudent, routeId: e.target.value })}
                >
                  <option value="">Select Route</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Stop</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={newStudent.stopId}
                  onChange={(e) => setNewStudent({ ...newStudent, stopId: e.target.value })}
                >
                  <option value="">Select Stop</option>
                  {stops.filter(s => !newStudent.routeId || s.routeId === newStudent.routeId).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleCreate} className="w-full">Add Student</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Stop</TableHead>
              <TableHead>Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{routes.find(r => r.id === student.routeId)?.name || '-'}</TableCell>
                <TableCell>{stops.find(s => s.id === student.stopId)?.name || '-'}</TableCell>
                <TableCell>{student.grade || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
