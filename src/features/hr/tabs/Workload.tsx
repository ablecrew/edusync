import React, { useMemo, useState } from 'react';
import { BookOpen, Plus, Trash2, Users, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useHrStore } from '../store';

export const Workload: React.FC<{ store: ReturnType<typeof useHrStore> }> = ({ store }) => {
  const [addOpen, setAddOpen] = useState<{ staffId: string } | null>(null);
  const [form, setForm] = useState<any>({ subject: '', weekly_hours: 0, is_class_teacher: false });

  const teaching = useMemo(() => store.staff.filter(s => s.staff_type === 'Teaching' && s.status === 'Active'), [store.staff]);

  const summary = useMemo(() => teaching.map(s => {
    const my = store.workloadForStaff(s.id);
    const hours = my.reduce((a, w) => a + Number(w.weekly_hours), 0);
    const subjectCount = new Set(my.map(w => w.subject)).size;
    const classes = new Set(my.map(w => w.class_name).filter(Boolean)).size;
    const classTeacherOf = my.filter(w => w.is_class_teacher).map(w => w.class_name).filter(Boolean).join(', ');
    return { staff: s, hours, subjectCount, classes, classTeacherOf, items: my };
  }), [teaching, store.workload, store]);

  const submit = async () => {
    if (!addOpen || !form.subject) return;
    await store.addWorkload.mutateAsync({
      staff_id: addOpen.staffId,
      subject: form.subject,
      class_name: form.class_name,
      weekly_hours: Number(form.weekly_hours) || 0,
      is_class_teacher: !!form.is_class_teacher,
      is_supervisor: !!form.is_supervisor,
      academic_year: form.academic_year,
      term: form.term,
      notes: form.notes,
    } as any);
    setAddOpen(null); setForm({ subject: '', weekly_hours: 0 });
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 text-xs text-slate-500 flex items-start gap-2">
        <BookOpen className="w-4 h-4 mt-0.5 text-[#08428C]" />
        <div>
          <b className="text-slate-700 dark:text-slate-200">Teaching workload</b> — assign subjects, hours per week, class-teacher and supervisor duties.
          Track syllabus coverage lesson-by-lesson to see who is on schedule.
        </div>
      </Card>

      {teaching.length === 0 ? (
        <EmptyState icon={Users} title="No teaching staff yet" description="Add staff with type = Teaching in the Directory tab." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {summary.map(({ staff: s, hours, subjectCount, classes, classTeacherOf, items }) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-sm">{s.first_name} {s.last_name}</p>
                  <p className="text-[11px] font-mono text-slate-500">{s.staff_code}</p>
                  {classTeacherOf && (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                      <Award className="w-3 h-3" /> Class teacher of <b>{classTeacherOf}</b>
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="primary">{hours} h/wk</Badge>
                  <span className="text-[11px] text-slate-500">{subjectCount} subject{subjectCount === 1 ? '' : 's'} · {classes} class{classes === 1 ? '' : 'es'}</span>
                </div>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No assignments yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {items.map(w => (
                    <li key={w.id} className="py-1.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{w.subject} <span className="text-slate-400 font-normal">· {w.class_name ?? '—'}</span></p>
                        {(w.is_class_teacher || w.is_supervisor) && (
                          <div className="flex gap-1 mt-0.5">
                            {w.is_class_teacher && <Badge variant="success">Class Teacher</Badge>}
                            {w.is_supervisor && <Badge variant="warning">Supervisor</Badge>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{w.weekly_hours}h</span>
                        <button onClick={() => store.deleteWorkload.mutate(w.id)} className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => setAddOpen({ staffId: s.id })}>
                <Plus className="w-3.5 h-3.5" /> Add assignment
              </Button>
            </Card>
          ))}
        </div>
      )}

      {addOpen && (
        <Dialog isOpen onClose={() => setAddOpen(null)} title="Add workload assignment" maxWidth="lg">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Subject" value={form.subject ?? ''} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" />
              <Input label="Class name" value={form.class_name ?? ''} onChange={e => setForm({ ...form, class_name: e.target.value })} placeholder="e.g. Grade 10 North" />
              <Input label="Weekly hours" type="number" step="0.5" value={form.weekly_hours ?? ''} onChange={e => setForm({ ...form, weekly_hours: e.target.value })} />
              <Input label="Term" value={form.term ?? ''} onChange={e => setForm({ ...form, term: e.target.value })} placeholder="e.g. Term 1" />
              <Input label="Academic year" value={form.academic_year ?? ''} onChange={e => setForm({ ...form, academic_year: e.target.value })} placeholder="e.g. 2026" />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={!!form.is_class_teacher} onChange={e => setForm({ ...form, is_class_teacher: e.target.checked })} />
                Class Teacher
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={!!form.is_supervisor} onChange={e => setForm({ ...form, is_supervisor: e.target.checked })} />
                Supervisor / co-curricular
              </label>
            </div>
            <Button variant="primary" className="w-full" onClick={submit} isLoading={store.addWorkload.isPending}>Save</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};