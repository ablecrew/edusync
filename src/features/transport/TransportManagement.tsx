import React, { useState } from 'react';
import { Plus, Navigation, MapPin } from 'lucide-react';
import { useRoutes, useCreateRoute } from '../../hooks/useQueries';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Dialog } from '../../components/ui/dialog';
import { Spinner } from '../../components/ui/spinner';

export const TransportManagement: React.FC = () => {
  const { data: routes = [], isLoading } = useRoutes();
  const createRouteMutation = useCreateRoute();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');
  const [phone, setPhone] = useState('');

  const [activeTracking, setActiveTracking] = useState('North Hills Express');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !vehicle) return;
    await createRouteMutation.mutateAsync({
      route_name: name,
      vehicle_number: vehicle,
      driver_name: driver || 'Staff Driver',
      driver_phone: phone || '+1 (555) 000-0000',
      capacity: 50,
      enrolled_students: 0,
      monthly_fee: 180,
      status: 'Active',
    });
    setIsAddOpen(false);
  };

  if (isLoading) return <Spinner size="lg" text="Loading GPS Transport Fleet..." />;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Transport Fleet & Live Tracking</span>
            <Badge variant="primary">{routes.length} Active Routes</Badge>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage student bus routes, vehicle fleets, driver assignments, live GPS tracker simulation, and maintenance fuel logs.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Transport Route</span>
        </Button>
      </div>

      {/* Live GPS Map Simulation */}
      <Card variant="default" className="p-6 space-y-4 bg-slate-900 text-white relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base text-sky-400">
            <Navigation className="w-5 h-5 animate-pulse" />
            <span>Live GPS Bus Fleet Tracker Simulation</span>
          </div>
          <Badge variant="success">Synchronized</Badge>
        </div>

        <div className="aspect-video w-full rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden group">
          <img
            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&auto=format&fit=crop&q=80"
            alt="Map Preview"
            className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-[#08428C]/20 pointer-events-none" />

          {/* Simulated Animated Bus Marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#08428C] text-white px-4 py-2 rounded-2xl shadow-2xl border border-white/30 animate-bounce">
            <MapPin className="w-5 h-5 text-amber-300" />
            <div className="text-left font-sans">
              <p className="text-xs font-black">{activeTracking}</p>
              <p className="text-[10px] text-blue-100">Speed: 42 mph • Next Stop: Maple Dr</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {routes.map((rt) => (
          <Card key={rt.id} variant="default" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={rt.status === 'Active' ? 'success' : 'warning'}>{rt.status}</Badge>
              <span className="text-xs font-mono font-bold text-[#08428C]">${rt.monthly_fee} / mo</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{rt.route_name}</h3>
              <p className="text-xs font-mono text-slate-500 mt-0.5">{rt.vehicle_number}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <p><span className="text-slate-400">Driver:</span> <span className="font-bold text-slate-900 dark:text-white">{rt.driver_name}</span></p>
              <p><span className="text-slate-400">Phone:</span> <span className="font-mono">{rt.driver_phone}</span></p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">{rt.enrolled_students} / {rt.capacity} Students</span>
              <Button size="sm" variant={activeTracking === rt.route_name ? 'primary' : 'outline'} onClick={() => setActiveTracking(rt.route_name)}>
                Track
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Bus Route">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Route Name" placeholder="e.g. Westside Shuttle" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Vehicle Number / Model" placeholder="e.g. BUS-401 (Volvo Sprinter)" required value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
          <Input label="Driver Name" placeholder="e.g. Arthur Pendelton" value={driver} onChange={(e) => setDriver(e.target.value)} />
          <Input label="Driver Phone" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button type="submit" variant="primary" className="w-full" isLoading={createRouteMutation.isPending}>Save Route</Button>
        </form>
      </Dialog>
    </div>
  );
};
