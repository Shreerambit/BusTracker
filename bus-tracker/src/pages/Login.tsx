import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bus, Shield, User, Users } from 'lucide-react';
import type { UserRole } from '@/types';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password, selectedRole);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfig: Record<UserRole, { icon: React.ReactNode; label: string; color: string; demoEmail: string }> = {
    admin: { icon: <Shield className="w-5 h-5" />, label: 'Administrator', color: 'bg-purple-500', demoEmail: 'admin@school.com' },
    driver: { icon: <Bus className="w-5 h-5" />, label: 'Bus Driver', color: 'bg-blue-500', demoEmail: 'driver@school.com' },
    student: { icon: <User className="w-5 h-5" />, label: 'Student', color: 'bg-green-500', demoEmail: 'student@school.com' },
    parent: { icon: <Users className="w-5 h-5" />, label: 'Parent', color: 'bg-orange-500', demoEmail: 'parent@school.com' }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">School Bus Tracker</h1>
          <p className="text-gray-600 mt-2">Real-time bus tracking for safer journeys</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Select your role and enter your credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedRole} onValueChange={(v) => {
              setSelectedRole(v as UserRole);
              setEmail(roleConfig[v as UserRole].demoEmail);
            }}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="admin" className="flex flex-col items-center gap-1 py-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Admin</span>
                </TabsTrigger>
                <TabsTrigger value="driver" className="flex flex-col items-center gap-1 py-2">
                  <Bus className="w-4 h-4" />
                  <span className="text-xs">Driver</span>
                </TabsTrigger>
                <TabsTrigger value="student" className="flex flex-col items-center gap-1 py-2">
                  <User className="w-4 h-4" />
                  <span className="text-xs">Student</span>
                </TabsTrigger>
                <TabsTrigger value="parent" className="flex flex-col items-center gap-1 py-2">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Parent</span>
                </TabsTrigger>
              </TabsList>

              {(['admin', 'driver', 'student', 'parent'] as UserRole[]).map((role) => (
                <TabsContent key={role} value={role}>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 ${roleConfig[role].color} rounded-lg flex items-center justify-center`}>
                        {roleConfig[role].icon}
                      </div>
                      <div>
                        <p className="font-medium">{roleConfig[role].label}</p>
                        <p className="text-sm text-gray-500">Demo: {roleConfig[role].demoEmail}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                      Any password works for demo mode
                    </p>
                  </form>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Install this app for the best experience</p>
          <p className="mt-1">Works offline as a PWA</p>
        </div>
      </div>
    </div>
  );
}
