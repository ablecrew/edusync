import React, { useMemo, useState } from 'react';
import { CalendarCheck, HeartPulse, Shield, GraduationCap, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import type { useStudentsStore } from '../store';

type Kind = 'attendance' | 'health' | 'discipline' | 'academic';
const TABS: { id: Kind; label: string; icon: any }[] = [
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'health',     label: 'Health',     icon: HeartPulse },
  { id: 'discipline', label: 'Discipline', icon: Shield },
  { id: 'academic',   label: 'Academic',   icon: GraduationCap },
];

export const Records: React.FC<{ store: ReturnType<typeof useStudentsStore> }> = ({ store }) => {
  const s = store as any;
  const [kind, setKind] = useState<Kind>('attendance');
  const [studentId, setStudentId] = useState('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const rows = useMemo(() => {
    const src = kind === 'attendance' ? s.attendance
              : kind === 'health' ? s.health
              : kind === 'discipline' ? s.discipline
              : s.academic;
    return studentId === 'ALL' ? src : src.filter((r: any) => r.student_id === studentId);
  }, [kind, studentId, s.attendance, s.health, s.discipline, s.academic]);

  const submit = async () => {
    if (!form.student_id) return;
    if (kind === 'attendance') await s.addAttendance.mutateAsync({ ...form, date: form.date || new Date().toISOString().slice(0, 10) });
    if (kind === 'health')     await s.addHealth.mutateAsync(form);
    if (kind === 'discipline') await s.addDiscipline.mutateAsync(form);
    if (kind === 'academic')   await s.addAcademic.mutateAsync(form);
    setAddOpen(false); setForm({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setKind(t.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                  kind === t.id ? 'bg-white dark:bg-slate-900 text-[#08428C] shadow-sm' : 'text-slate-600'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <select value={studentId} onChange={e => setStudentId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <option value="ALL">All students</option>
            {store.students.map(st => <option key={st.id} value={st.id}>{st.first_name} {st.last_name}</option>)}
          </select>
          <Button variant="primary" size="sm" onClick={() => { setForm({}); setAddOpen(true); }}>
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={TABS.find(t => t.id === kind)!.icon}
          title={`No ${kind} records yet`}
          description={`Records added here appear in the student's profile and on their guardian portal.`}
          actionLabel="Add first record" onAction={() => setAddOpen(true)} />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 px-5 text-left">Student</th>
                <th className="py-3 px-5 text-left">Date</th>
                <th className="py-3 px-5 text-left">Details</th>
                {kind !== 'attendance' && <th className="py-3 px-5 text-left">Status / Score</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r: any) => {
                const st = store.students.find(x => x.id === r.student_id);
                return (
                  <tr key={r.id}>
                    <td className="py-3 px-5 font-semibold">{st ? `${st.first_name} ${st.last_name}` : '—'}</td>
                    <td className="py-3 px-5 text-xs">{r.date ?? r.visit_date ?? r.incident_date ?? `${r.term} ${r.academic_year}`}</td>
                    <td className="py-3 px-5 text-xs">
                      {kind === 'attendance' && (r.notes || '—')}
                      {kind === 'health'     && `${r.reason ?? ''}${r.diagnosis ? ' · ' + r.diagnosis : ''}`}
                      {kind === 'discipline' && `${r.incident_type ?? ''} — ${r.description ?? ''}`}
                      {kind === 'academic'   && `${r.subject} · ${r.teacher_name ?? ''}`}
                    </td>
                    {kind !== 'attendance' && (
                      <td className="py-3 px-5">
                        {kind === 'academic'
                          ? <span className="font-mono font-bold">{r.score ?? '—'} {r.grade && `(${r.grade})`}</span>
                          : <Badge variant="muted">{r.status ?? '—'}</Badge>}
                      </td>
                    )}
                    {kind === 'attendance' && (
                      <td className="py-3 px-5"><Badge variant={r.status === 'Present' ? 'success' : r.status === 'Absent' ? 'danger' : 'warning'}>{r.status}</Badge></td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog isOpen={addOpen} onClose={() => setAddOpen(false)} title={`Add ${kind} record`} maxWidth="lg">
        <div className="space-y-3">
          <Select label="Student" options={[{ value: '', label: '—' }, ...store.students.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))]}
            value={form.student_id ?? ''} onChange={e => setForm({ ...form, student_id: e.target.value })} />

          {kind === 'attendance' && (<>
            <Input label="Date" type="date" value={form.date ?? ''} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Select label="Status" options={['Present', 'Absent', 'Late', 'Excused'].map(v => ({ value: v, label: v }))} value={form.status ?? 'Present'} onChange={e => setForm({ ...form, status: e.target.value })} />
            <Input label="Notes" value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </>)}
          {kind === 'health' && (<>
            <Input label="Visit date" type="date" value={form.visit_date ?? ''} onChange={e => setForm({ ...form, visit_date: e.target.value })} />
            <Input label="Reason" value={form.reason ?? ''} onChange={e => setForm({ ...form, reason: e.target.value })} />
            <Input label="Diagnosis" value={form.diagnosis ?? ''} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
            <Textarea label="Treatment / Notes" value={form.treatment ?? ''} onChange={e => setForm({ ...form, treatment: e.target.value })} />
          </>)}
          {kind === 'discipline' && (<>
            <Input label="Incident date" type="date" value={form.incident_date ?? ''} onChange={e => setForm({ ...form, incident_date: e.target.value })} />
            <Input label="Incident type" value={form.incident_type ?? ''} onChange={e => setForm({ ...form, incident_type: e.target.value })} />
            <Textarea label="Description" value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input label="Action taken" value={form.action_taken ?? ''} onChange={e => setForm({ ...form, action_taken: e.target.value })} />
            <Select label="Status" options={['Open', 'Resolved', 'Escalated', 'Dismissed'].map(v => ({ value: v, label: v }))} value={form.status ?? 'Open'} onChange={e => setForm({ ...form, status: e.target.value })} />
          </>)}
          {kind === 'academic' && (<>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Term" value={form.term ?? ''} onChange={e => setForm({ ...form, term: e.target.value })} />
              <Input label="Academic year" value={form.academic_year ?? ''} onChange={e => setForm({ ...form, academic_year: e.target.value })} />
            </div>
            <Input label="Subject" value={form.subject ?? ''} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Score" type="number" value={form.score ?? ''} onChange={e => setForm({ ...form, score: Number(e.target.value) })} />
              <Input label="Grade" value={form.grade ?? ''} onChange={e => setForm({ ...form, grade: e.target.value })} />
            </div>
            <Input label="Teacher" value={form.teacher_name ?? ''} onChange={e => setForm({ ...form, teacher_name: e.target.value })} />
            <Textarea label="Remarks" value={form.remarks ?? ''} onChange={e => setForm({ ...form, remarks: e.target.value })} />
          </>)}

          <Button variant="primary" className="w-full" onClick={submit}>Save</Button>
        </div>
      </Dialog>
    </div>
  );
};