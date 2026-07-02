import React, { useMemo, useState } from 'react';
import { CalendarCheck, LogIn, LogOut, Search, Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { useHrStore } from '../store';
import { ATTENDANCE_STATES } from '../constants';

export const Attendance: React.FC<{ store: ReturnType<typeof useHrStore> }> = ({ store }) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const forDay = useMemo(() => {
    const map = new Map(store.attendance.filter(a => a.date === date).map(a => [a.staff_id, a]));
    return store.staff
      .filter(s => s.status !== 'Resigned' && s.status !== 'Terminated' && s.status !== 'Retired')
      .map(s => ({ staff: s, att: map.get(s.id) }));
  }, [store.staff, store.attendance, date]);

  const filtered = forDay.filter(({ staff: s, att }) => {
    if (q && !`${s.first_name} ${s.last_name} ${s.staff_code}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (statusFilter !== 'ALL') {
      const st = att?.status ?? 'Absent';
      if (st !== statusFilter) return false;
    }
    return true;
  });

  const dayStats = useMemo(() => ({
    present: forDay.filter(x => x.att?.status === 'Present').length,
    late:    forDay.filter(x => x.att?.status === 'Late').length,
    absent:  forDay.filter(x => !x.att || x.att.status === 'Absent').length,
    excused: forDay.filter(x => x.att?.status === 'Excused' || x.att?.status === 'Half-day').length,
    overtime: forDay.reduce((a, x) => a + (x.att?.overtime_mins ?? 0), 0),
  }), [forDay]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Present', value: dayStats.present, color: 'text-emerald-600' },
          { label: 'Late',    value: dayStats.late,    color: 'text-amber-600' },
          { label: 'Absent',  value: dayStats.absent,  color: 'text-rose-600' },
          { label: 'Excused/Half', value: dayStats.excused, color: 'text-sky-600' },
          { label: 'Overtime mins', value: dayStats.overtime, color: 'text-[#08428C]' },
        ].map(k => (
          <Card key={k.label} className="p-4">
            <p className="text-[11px] font-bold uppercase text-slate-400">{k.label}</p>
            <p className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-3 flex flex-wrap items-center gap-2">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search staff…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All statuses</option>
          {ATTENDANCE_STATES.map(s => <option key={s}>{s}</option>)}
        </select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarCheck}
          title={store.staff.length === 0 ? 'No active staff' : 'No staff match your filters'}
          description="Add staff first to record attendance." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Staff</th>
                  <th className="py-3 px-5 text-left">Check-in</th>
                  <th className="py-3 px-5 text-left">Check-out</th>
                  <th className="py-3 px-5 text-right">Overtime</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Method</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(({ staff: s, att }) => {
                  const isToday = date === new Date().toISOString().slice(0, 10);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-5">
                        <p className="font-semibold">{s.first_name} {s.last_name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{s.staff_code}</p>
                      </td>
                      <td className="py-3 px-5 text-xs">{att?.check_in ? new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="py-3 px-5 text-xs">{att?.check_out ? new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="py-3 px-5 text-right font-mono">{att?.overtime_mins ? `+${att.overtime_mins} m` : '—'}</td>
                      <td className="py-3 px-5">
                        <select
                          value={att?.status ?? 'Absent'}
                          onChange={e => store.upsertAtt.mutate({ staff_id: s.id, date, status: e.target.value, method: 'Manual' })}
                          className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          {ATTENDANCE_STATES.map(x => <option key={x}>{x}</option>)}
                        </select>
                      </td>
                      <td className="py-3 px-5 text-[11px] text-slate-500">{att?.method ?? '—'}</td>
                      <td className="py-3 px-5 text-right">
                        {isToday && (
                          <div className="flex items-center justify-end gap-1">
                            {!att?.check_in && (
                              <Button size="sm" variant="secondary" onClick={() => store.checkIn.mutate({ staffId: s.id, method: 'Web' })}>
                                <LogIn className="w-3.5 h-3.5" /> In
                              </Button>
                            )}
                            {att?.check_in && !att?.check_out && (
                              <Button size="sm" variant="ghost" onClick={() => store.checkOut.mutate(s.id)}>
                                <LogOut className="w-3.5 h-3.5" /> Out
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="p-4 text-xs text-slate-500 flex items-start gap-2">
        <Clock className="w-4 h-4 mt-0.5 text-[#08428C] shrink-0" />
        <div>
          <b className="text-slate-700 dark:text-slate-200">Biometric / mobile ready.</b> Any device that can call the Supabase REST endpoint
          can post to <code className="font-mono">staff_attendance</code>. The DB trigger auto-classifies rows past 08:15 as
          <b> Late</b> and calculates <b>overtime</b> after 17:00 automatically.
        </div>
      </Card>
    </div>
  );
};