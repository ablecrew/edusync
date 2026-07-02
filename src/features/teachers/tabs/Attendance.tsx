import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Save, MessageSquarePlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useTeachersStore } from '../store';
import * as api from '../api';
import { ATTENDANCE_STATES, BEHAVIOR_KINDS, BEHAVIOR_CATEGORIES } from '../constants';

export const Attendance: React.FC<{ store: ReturnType<typeof useTeachersStore> }> = ({ store }) => {
  const [className, setClassName] = useState(store.myClassNames[0] ?? '');
  const [subject, setSubject] = useState(store.mySubjects[0] ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, { status: string; notes: string }>>({});
  const [behaviorFor, setBehaviorFor] = useState<any>(null);
  const [bForm, setBForm] = useState<any>({ kind: 'Concern', category: 'Conduct', note: '' });

  useEffect(() => {
    if (!className) return;
    api.fetchStudentsForClass(className).then(setRoster).catch(() => setRoster([]));
  }, [className]);

  useEffect(() => {
    // Prefill marks from existing DB rows for this date+subject
    const existing = new Map(store.attendance.filter(a => a.date === date && a.subject === subject).map(a => [a.student_id, a]));
    const m: any = {};
    roster.forEach(s => {
      const e = existing.get(s.id);
      m[s.id] = { status: e?.status ?? 'Present', notes: e?.notes ?? '' };
    });
    setMarks(m);
  }, [roster, store.attendance, date, subject]);

  const setMark = (id: string, patch: any) => setMarks(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const markAll = (status: string) => {
    const next: any = {};
    Object.keys(marks).forEach(id => { next[id] = { ...marks[id], status }; });
    setMarks(next);
  };

  const save = async () => {
    if (!className || !subject) return;
    const rows = Object.entries(marks).map(([student_id, m]) => ({
      staff_id: store.activeTeacherId, student_id, class_name: className, subject, date,
      status: m.status, notes: m.notes || null,
    }));
    await store.upsertAttendance.mutateAsync(rows as any);
    alert('Attendance saved.');
  };

  const submitBehavior = async () => {
    if (!behaviorFor || !bForm.note) return;
    await store.addBehavior.mutateAsync({
      staff_id: store.activeTeacherId, student_id: behaviorFor.id,
      date, kind: bForm.kind, category: bForm.category, note: bForm.note,
      action_taken: bForm.action_taken, follow_up: bForm.follow_up,
    } as any);
    setBehaviorFor(null); setBForm({ kind: 'Concern', category: 'Conduct', note: '' });
  };

  const summary = useMemo(() => {
    const values = Object.values(marks);
    return {
      present: values.filter(v => v.status === 'Present').length,
      absent:  values.filter(v => v.status === 'Absent').length,
      late:    values.filter(v => v.status === 'Late').length,
    };
  }, [marks]);

  return (
    <div className="space-y-6">
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <Select label="Class" options={store.myClassNames.map(c => ({ value: c, label: c }))} value={className} onChange={e => setClassName(e.target.value)} />
        <Select label="Subject" options={store.mySubjects.map(s => ({ value: s, label: s }))} value={subject} onChange={e => setSubject(e.target.value)} />
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <div className="ml-auto flex items-center gap-2 pt-4">
          <Button size="sm" variant="ghost" onClick={() => markAll('Present')}>Mark all present</Button>
          <Button size="sm" variant="primary" onClick={save} isLoading={store.upsertAttendance.isPending}>
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4"><p className="text-[11px] uppercase text-slate-400 font-bold">Present</p><p className="text-2xl font-black text-emerald-600 mt-1">{summary.present}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase text-slate-400 font-bold">Absent</p><p className="text-2xl font-black text-rose-600 mt-1">{summary.absent}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase text-slate-400 font-bold">Late</p><p className="text-2xl font-black text-amber-600 mt-1">{summary.late}</p></Card>
      </div>

      {!className || !subject ? (
        <EmptyState icon={ClipboardCheck} title="Pick a class and subject" description="Choose from your assigned classes and subjects above." />
      ) : roster.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No learners in this class" description="Confirm that student records use the same class_name spelling." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 px-5 text-left">Learner</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-left">Notes</th>
                <th className="py-3 px-5 text-right">Behavior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {roster.map(s => {
                const m = marks[s.id] ?? { status: 'Present', notes: '' };
                return (
                  <tr key={s.id}>
                    <td className="py-3 px-5">
                      <p className="font-semibold">{s.first_name} {s.last_name}</p>
                      <p className="text-[11px] font-mono text-slate-500">{s.admission_number}</p>
                    </td>
                    <td className="py-3 px-5">
                      <select value={m.status} onChange={e => setMark(s.id, { status: e.target.value })}
                        className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {ATTENDANCE_STATES.map(x => <option key={x}>{x}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-5">
                      <input value={m.notes} onChange={e => setMark(s.id, { notes: e.target.value })}
                        placeholder="Optional notes…"
                        className="w-full px-2 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setBehaviorFor(s)}>
                        <MessageSquarePlus className="w-3.5 h-3.5" /> Note
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Behavior note dialog */}
      {behaviorFor && (
        <Dialog isOpen onClose={() => setBehaviorFor(null)} title={`Behavior note — ${behaviorFor.first_name} ${behaviorFor.last_name}`} maxWidth="lg">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Kind" options={BEHAVIOR_KINDS.map(k => ({ value: k, label: k }))} value={bForm.kind} onChange={e => setBForm({ ...bForm, kind: e.target.value })} />
              <Select label="Category" options={BEHAVIOR_CATEGORIES.map(c => ({ value: c, label: c }))} value={bForm.category} onChange={e => setBForm({ ...bForm, category: e.target.value })} />
            </div>
            <Textarea label="Note" value={bForm.note} onChange={e => setBForm({ ...bForm, note: e.target.value })} />
            <Input label="Action taken" value={bForm.action_taken ?? ''} onChange={e => setBForm({ ...bForm, action_taken: e.target.value })} />
            <Input label="Follow-up" value={bForm.follow_up ?? ''} onChange={e => setBForm({ ...bForm, follow_up: e.target.value })} />
            <Button variant="primary" className="w-full" onClick={submitBehavior}>Save note</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};