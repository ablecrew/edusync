import React, { useMemo, useState } from 'react';
import { CalendarCheck, LogIn, LogOut, Download, Percent, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useStaffPortalStore, downloadCSV } from '../store';

export const Attendance: React.FC<{ store: ReturnType<typeof useStaffPortalStore> }> = ({ store }) => {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const monthly = useMemo(() => store.attendance.filter(a => a.date.startsWith(month)), [store.attendance, month]);
  const stats = useMemo(() => ({
    present: monthly.filter(a => a.status === 'Present').length,
    late:    monthly.filter(a => a.status === 'Late').length,
    absent:  monthly.filter(a => a.status === 'Absent').length,
    excused: monthly.filter(a => a.status === 'Excused' || a.status === 'Half-day').length,
    overtime: monthly.reduce((a, x) => a + (x.overtime_mins ?? 0), 0),
  }), [monthly]);
  const total = monthly.length || 1;
  const onTime = Math.round(((stats.present) / total) * 100);

  const days = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const dim = new Date(y, m, 0).getDate();
    const cells: { day: number; date: string; row?: any }[] = [];
    for (let d = 1; d <= dim; d++) {
      const iso = `${month}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, date: iso, row: monthly.find(a => a.date === iso) });
    }
    return cells;
  }, [month, monthly]);

  const exportCSV = () => downloadCSV(`attendance-${month}.csv`, monthly.map(a => ({
    date: a.date, status: a.status, check_in: a.check_in ?? '', check_out: a.check_out ?? '',
    overtime_mins: a.overtime_mins, method: a.method ?? '',
  })));

  const bg = (s?: string) => {
    if (!s) return 'bg-slate-100 dark:bg-slate-800';
    if (s === 'Present') return 'bg-emerald-500 text-white';
    if (s === 'Late')    return 'bg-amber-500 text-white';
    if (s === 'Absent')  return 'bg-rose-500 text-white';
    if (s === 'Excused' || s === 'Half-day') return 'bg-sky-500 text-white';
    return 'bg-slate-200 dark:bg-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Quick check-in card */}
      <Card className="p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h4 className="font-bold text-sm">Today — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
          {store.todayAttendance?.check_in ? (
            <p className="text-xs text-slate-500 mt-1">
              Checked in at <b>{new Date(store.todayAttendance.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>
              {store.todayAttendance.check_out && <> · out at <b>{new Date(store.todayAttendance.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b></>}
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">You haven't checked in yet.</p>
          )}
        </div>
        <div className="flex gap-2">
          {!store.todayAttendance?.check_in && (
            <Button variant="primary" onClick={() => store.checkIn.mutate()} isLoading={store.checkIn.isPending}>
              <LogIn className="w-4 h-4" /> Check in
            </Button>
          )}
          {store.todayAttendance?.check_in && !store.todayAttendance?.check_out && (
            <Button variant="secondary" onClick={() => store.checkOut.mutate()} isLoading={store.checkOut.isPending}>
              <LogOut className="w-4 h-4" /> Check out
            </Button>
          )}
        </div>
      </Card>

      {/* Month selector + stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 col-span-2 md:col-span-1">
          <p className="text-[11px] uppercase text-slate-400 font-bold">Viewing</p>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase text-slate-400 font-bold flex items-center gap-1"><Percent className="w-3 h-3" /> On-time</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{onTime}%</p>
        </Card>
        <Card className="p-4"><p className="text-[11px] uppercase text-slate-400 font-bold">Present</p><p className="text-2xl font-black text-emerald-600 mt-1">{stats.present}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase text-slate-400 font-bold">Absent</p><p className="text-2xl font-black text-rose-600 mt-1">{stats.absent}</p></Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase text-slate-400 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Overtime</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.overtime}m</p>
        </Card>
      </div>

      {/* Calendar grid */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold flex items-center gap-2"><CalendarCheck className="w-4 h-4" /> Monthly grid</h4>
          <Button size="sm" variant="outline" onClick={exportCSV}><Download className="w-3.5 h-3.5" /> Export CSV</Button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map(d => (
            <div key={d.date} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold ${bg(d.row?.status)}`}>
              <span className="text-[10px] opacity-80">{d.day}</span>
              {d.row?.status && <span className="text-[8px] uppercase mt-0.5">{d.row.status[0]}</span>}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-4 text-[11px]">
          {['Present','Late','Absent','Excused','Half-day'].map(s => (
            <span key={s} className="flex items-center gap-1"><span className={`w-3 h-3 rounded ${bg(s).split(' ')[0]}`} /> {s}</span>
          ))}
        </div>
      </Card>

      {/* History table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h4 className="font-bold">Recent history</h4>
        </div>
        {store.attendance.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No attendance records yet" description="Once you check in, your history will appear here." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 px-5 text-left">Date</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-left">Check-in</th>
                <th className="py-3 px-5 text-left">Check-out</th>
                <th className="py-3 px-5 text-right">Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {store.attendance.slice(0, 30).map(a => (
                <tr key={a.id}>
                  <td className="py-3 px-5 font-semibold">{a.date}</td>
                  <td className="py-3 px-5 text-center">
                    <Badge variant={a.status === 'Present' ? 'success' : a.status === 'Absent' ? 'danger' : 'warning'}>{a.status}</Badge>
                  </td>
                  <td className="py-3 px-5 text-xs font-mono">{a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="py-3 px-5 text-xs font-mono">{a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="py-3 px-5 text-right font-mono">{a.overtime_mins ? `+${a.overtime_mins}m` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};