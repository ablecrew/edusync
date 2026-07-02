import React, { useMemo } from 'react';
import {
  ClipboardList, LogIn, LogOut, MessageSquare, Plane, Bell, Clock, Wrench, Heart, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useStaffPortalStore } from '../store';
import { SHIFT_COLORS } from '../constants';

export const Dashboard: React.FC<{ store: ReturnType<typeof useStaffPortalStore>; onNavigate: (t: string) => void }> = ({ store, onNavigate }) => {
  const me = store.me!;
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const kpis = [
    { label: 'Open tasks',        value: store.openTasks.length,        icon: ClipboardList,  color: 'text-[#08428C]', onClick: () => onNavigate('duties') },
    { label: 'Overdue',           value: store.overdueTasks.length,     icon: AlertTriangle,  color: 'text-rose-600',  onClick: () => onNavigate('duties') },
    { label: 'Work orders',       value: store.openWorkOrders.length,   icon: Wrench,         color: 'text-amber-600', onClick: () => onNavigate('duties') },
    { label: 'Pending leaves',    value: store.pendingLeaves,           icon: Plane,          color: 'text-sky-600',   onClick: () => onNavigate('leave') },
    { label: 'Unread messages',   value: store.unreadMessages,          icon: MessageSquare,  color: 'text-violet-600', onClick: () => onNavigate('messages') },
    ...(store.isClinical ? [{ label: 'Clinic visits today', value: store.clinicVisits.filter(v => v.visit_date.slice(0, 10) === now.toISOString().slice(0, 10)).length, icon: Heart, color: 'text-rose-600', onClick: () => onNavigate('clinic') }] : []),
  ];

  const nextPayslip = store.payslips[0];

  const upcomingShifts = useMemo(() => {
    const todayISO = now.toISOString().slice(0, 10);
    return store.shifts.filter(s => s.shift_date >= todayISO).slice(0, 3);
  }, [store.shifts, now]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting header */}
      <Card className="p-5 bg-gradient-to-r from-[#08428C] to-[#0a4fa8] text-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase text-blue-200 font-bold tracking-wider">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <h2 className="text-2xl font-black mt-1">{greeting}, {me.full_name.split(' ')[0]}</h2>
            <p className="text-sm text-blue-100 mt-1">
              {store.todayShift
                ? `You're on ${store.todayShift.kind} shift · ${store.todayShift.starts_at.slice(0,5)} → ${store.todayShift.ends_at.slice(0,5)}${store.todayShift.location ? ` · ${store.todayShift.location}` : ''}`
                : 'No shift scheduled today.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!store.todayAttendance?.check_in ? (
              <Button variant="outline" onClick={() => store.checkIn.mutate()} isLoading={store.checkIn.isPending}
                className="bg-white text-[#08428C] hover:bg-blue-50 border-white">
                <LogIn className="w-4 h-4" /> Check in
              </Button>
            ) : !store.todayAttendance?.check_out ? (
              <Button variant="outline" onClick={() => store.checkOut.mutate()} isLoading={store.checkOut.isPending}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <LogOut className="w-4 h-4" /> Check out
              </Button>
            ) : (
              <Badge variant="success" className="text-sm px-3 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Checked in {new Date(store.todayAttendance.check_in!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · out {new Date(store.todayAttendance.check_out!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label} onClick={k.onClick} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
                {k.label}<Icon className={`w-3.5 h-3.5 ${k.color}`} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{k.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming shifts */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><Clock className="w-4 h-4" /> Upcoming Shifts</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('duties')}>All duties</Button>
          </div>
          {upcomingShifts.length === 0 ? (
            <EmptyState icon={Clock} title="No shifts scheduled" description="Your shift roster will appear here once HR publishes it." />
          ) : (
            <ul className="space-y-2">
              {upcomingShifts.map(s => (
                <li key={s.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full" style={{ backgroundColor: SHIFT_COLORS[s.kind] ?? '#08428C' }} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{s.shift_date === now.toISOString().slice(0, 10) ? 'Today' : new Date(s.shift_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <p className="text-[11px] text-slate-500">
                      {s.kind} · {s.starts_at.slice(0,5)} → {s.ends_at.slice(0,5)}{s.location && ` · ${s.location}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Notices */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><Bell className="w-4 h-4" /> Notices</h4>
          </div>
          {store.notices.length === 0 ? (
            <EmptyState icon={Bell} title="No notices" description="Announcements from the administration will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {store.notices.slice(0, 4).map(n => (
                <li key={n.id} className="py-2">
                  <div className="flex items-start gap-2">
                    {n.pinned && <span className="text-amber-500 text-xs">📌</span>}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{n.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(n.published_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Payslip */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold">Latest Payslip</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('payslips')}>All</Button>
          </div>
          {!nextPayslip ? (
            <EmptyState icon={Bell} title="No payslip yet" description="Your monthly payslip will appear here after HR processes payroll." />
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <p className="text-[10px] uppercase text-slate-400 font-bold">Net pay</p>
              <p className="text-3xl font-black text-emerald-600">KES {Number(nextPayslip.net_pay).toLocaleString()}</p>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Gross: <b className="text-slate-800 dark:text-slate-200 font-mono">{Number(nextPayslip.gross_pay).toLocaleString()}</b></span>
                <span>Deductions: <b className="text-rose-600 font-mono">-{Number(nextPayslip.total_deductions).toLocaleString()}</b></span>
              </div>
              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                {nextPayslip.days_present}/{nextPayslip.working_days} days present
                {nextPayslip.overtime_mins > 0 && ` · +${nextPayslip.overtime_mins}m OT`}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Assigned work orders */}
      {store.openWorkOrders.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-600" /> Work orders assigned to you</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('duties')}>Open</Button>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {store.openWorkOrders.slice(0, 5).map(w => (
              <li key={w.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{w.title}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{w.ticket_no} · {w.kind}{w.location && ` · ${w.location}`}</p>
                </div>
                <Badge variant={w.priority === 'Urgent' ? 'danger' : w.priority === 'High' ? 'warning' : 'muted'}>{w.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Task warning */}
      {store.overdueTasks.length > 0 && (
        <Card className="p-4 border-rose-300 bg-rose-50">
          <p className="text-sm font-bold text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {store.overdueTasks.length} task{store.overdueTasks.length === 1 ? '' : 's'} past due
          </p>
          <p className="text-xs text-rose-700 mt-1">Check the Duties tab to update or complete them.</p>
        </Card>
      )}
    </div>
  );
};