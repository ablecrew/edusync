import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Download, Users, CalendarCheck, DollarSign, Plane, History, ClipboardList } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useHrStore, downloadCSV } from '../store';

const COLORS = ['#08428C', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#22c55e', '#64748b'];

export const Reports: React.FC<{ store: ReturnType<typeof useHrStore> }> = ({ store }) => {
  const [kind, setKind] = useState<'staff' | 'attendance' | 'leave' | 'payroll' | 'qualifications' | 'audit'>('staff');

  const staffRows = useMemo(() => store.staff.map(s => ({
    staff_code: s.staff_code,
    first_name: s.first_name, last_name: s.last_name,
    email: s.email ?? '', phone: s.phone ?? '',
    staff_type: s.staff_type, work_category: s.work_category,
    department: store.deptById(s.department_id ?? '')?.name ?? '',
    designation: s.designation ?? '',
    status: s.status, hired: s.date_of_hire,
    basic_salary: s.basic_salary,
  })), [store.staff, store.departments]);

  const attendanceRows = useMemo(() => store.attendance.map(a => {
    const s = store.staffById(a.staff_id);
    return {
      date: a.date, staff: `${s?.first_name} ${s?.last_name}`, staff_code: s?.staff_code,
      status: a.status, check_in: a.check_in ?? '', check_out: a.check_out ?? '',
      overtime_mins: a.overtime_mins, method: a.method ?? '',
    };
  }), [store.attendance, store.staff]);

  const leaveRows = useMemo(() => store.leaveReqs.map(l => {
    const s = store.staffById(l.staff_id);
    return {
      staff: `${s?.first_name} ${s?.last_name}`, staff_code: s?.staff_code,
      type: l.leave_type, from: l.start_date, to: l.end_date, days: l.days,
      status: l.status, approved_by: l.approved_by ?? '', reason: l.reason ?? '',
    };
  }), [store.leaveReqs, store.staff]);

  const auditRows = useMemo(() => store.audit.map(a => ({
    date: new Date(a.date).toISOString().slice(0, 19).replace('T', ' '),
    actor: a.actor, action: a.action, entity: a.entity, entity_id: a.entity_id, details: a.details ?? '',
  })), [store.audit]);

  const qualRows = useMemo(() => {
    const rows: any[] = [];
    store.staff.forEach(s => {
      (s.qualifications ?? []).forEach(q => rows.push({
        staff_code: s.staff_code, name: `${s.first_name} ${s.last_name}`,
        qualification: q.qualification, institution: q.institution ?? '', year: q.year ?? '',
      }));
    });
    return rows;
  }, [store.staff]);

  const attStatusMix = useMemo(() => {
    const map: Record<string, number> = {};
    store.attendance.forEach(a => { map[a.status] = (map[a.status] ?? 0) + 1; });
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [store.attendance]);

  const byDept = useMemo(() => {
    const map: Record<string, number> = {};
    store.staff.forEach(s => {
      const d = store.deptById(s.department_id ?? '')?.name ?? 'Unassigned';
      map[d] = (map[d] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [store.staff, store.departments]);

  const exportCurrent = () => {
    if (kind === 'staff')          downloadCSV('staff-roster.csv', staffRows);
    if (kind === 'attendance')     downloadCSV('attendance.csv', attendanceRows);
    if (kind === 'leave')          downloadCSV('leave-log.csv', leaveRows);
    if (kind === 'qualifications') downloadCSV('qualifications.csv', qualRows);
    if (kind === 'audit')          downloadCSV('hr-audit.csv', auditRows);
    if (kind === 'payroll') {
      const rows = store.runs.map(r => ({
        period: `${r.period_year}-${String(r.period_month).padStart(2, '0')}`,
        status: r.status, run_by: r.run_by ?? '', paid_on: r.paid_on ?? '',
      }));
      downloadCSV('payroll-runs.csv', rows);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          {([
            { id: 'staff',          label: 'Staff Roster',    icon: Users },
            { id: 'attendance',     label: 'Attendance',      icon: CalendarCheck },
            { id: 'leave',          label: 'Leave Log',       icon: Plane },
            { id: 'payroll',        label: 'Payroll',         icon: DollarSign },
            { id: 'qualifications', label: 'Qualifications',  icon: ClipboardList },
            { id: 'audit',          label: 'Audit Trail',     icon: History },
          ] as const).map(k => {
            const Icon = k.icon;
            return (
              <button key={k.id} onClick={() => setKind(k.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer ${
                  kind === k.id ? 'bg-[#08428C] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {k.label}
              </button>
            );
          })}
        </div>
        <Button size="sm" variant="outline" onClick={exportCurrent}><Download className="w-3.5 h-3.5" /> Export CSV</Button>
      </div>

      {kind === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <h4 className="font-bold mb-3">Staff by Department</h4>
            {byDept.length === 0 ? <EmptyState icon={Users} title="No staff yet" />
              : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={byDept} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                      <XAxis type="number" allowDecimals={false} fontSize={10} />
                      <YAxis type="category" dataKey="name" fontSize={10} width={140} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#08428C" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
          </Card>
          <Card className="p-5">
            <h4 className="font-bold mb-3">Roster ({staffRows.length})</h4>
            <SimpleTable rows={staffRows.slice(0, 200)} columns={['staff_code','first_name','last_name','department','status']} compact />
          </Card>
        </div>
      )}

      {kind === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <h4 className="font-bold mb-3">Recent attendance ({attendanceRows.length})</h4>
            {attendanceRows.length === 0 ? <EmptyState icon={CalendarCheck} title="No attendance yet" />
              : <SimpleTable rows={attendanceRows.slice(0, 200)} columns={['date','staff','status','check_in','check_out','overtime_mins']} />}
          </Card>
          <Card className="p-5">
            <h4 className="font-bold mb-3">Status mix</h4>
            {attStatusMix.length === 0 ? <EmptyState icon={CalendarCheck} title="No data" />
              : (
                <div className="h-56">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={attStatusMix} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                        {attStatusMix.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
          </Card>
        </div>
      )}

      {kind === 'leave' && (
        leaveRows.length === 0
          ? <EmptyState icon={Plane} title="No leave requests" />
          : <SimpleTable rows={leaveRows} columns={['staff','type','from','to','days','status','approved_by','reason']} />
      )}

      {kind === 'payroll' && (
        store.runs.length === 0
          ? <EmptyState icon={DollarSign} title="No payroll runs yet" />
          : (
            <Card className="p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                    <th className="py-2 px-3 text-left">Period</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-left">Run by</th>
                    <th className="py-2 px-3 text-left">Paid on</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {store.runs.map(r => (
                    <tr key={r.id}>
                      <td className="py-2 px-3">{r.period_year}-{String(r.period_month).padStart(2, '0')}</td>
                      <td className="py-2 px-3"><Badge variant={r.status === 'Paid' ? 'success' : 'muted'}>{r.status}</Badge></td>
                      <td className="py-2 px-3 text-xs">{r.run_by ?? '—'}</td>
                      <td className="py-2 px-3 text-xs">{r.paid_on ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}

      {kind === 'qualifications' && (
        qualRows.length === 0
          ? <EmptyState icon={ClipboardList} title="No qualifications recorded" description="Add qualifications to each staff record on the Directory tab." />
          : <SimpleTable rows={qualRows} columns={['staff_code','name','qualification','institution','year']} />
      )}

      {kind === 'audit' && (
        auditRows.length === 0
          ? <EmptyState icon={History} title="No HR audit entries yet" description="Every staff status/salary/department change is logged automatically." />
          : <SimpleTable rows={auditRows.slice(0, 300)} columns={['date','actor','action','entity','entity_id','details']} />
      )}
    </div>
  );
};

const SimpleTable: React.FC<{ rows: any[]; columns: string[]; compact?: boolean }> = ({ rows, columns, compact }) => (
  <Card className="overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase text-slate-400">
            {columns.map(c => <th key={c} className={`text-left ${compact ? 'py-1 px-2' : 'py-2 px-3'}`}>{c.replace(/_/g, ' ')}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c} className={`whitespace-nowrap ${compact ? 'py-1 px-2' : 'py-2 px-3'}`}>
                  {typeof r[c] === 'number' ? <span className="font-mono">{r[c].toLocaleString?.() ?? r[c]}</span> : (r[c] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);