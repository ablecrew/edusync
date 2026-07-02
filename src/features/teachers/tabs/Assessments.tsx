import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, RefreshCw, Trash2, Award, Save } from 'lucide-react';
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
import { ASSESSMENT_KINDS } from '../constants';

export const Assessments: React.FC<{ store: ReturnType<typeof useTeachersStore> }> = ({ store }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<any>({ kind: 'Assignment', max_score: 100, weight: 1 });
  const [gradingFor, setGradingFor] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, { score: string; feedback: string }>>({});

  useEffect(() => {
    if (!gradingFor) { setSubs([]); return; }
    api.fetchSubmissionsForAssessment(gradingFor.id).then(list => {
      setSubs(list);
      const s: any = {};
      list.forEach((r: any) => { s[r.id] = { score: r.score ?? '', feedback: r.feedback ?? '' }; });
      setScores(s);
    });
  }, [gradingFor]);

  const submit = async () => {
    if (!form.class_name || !form.subject || !form.title || !form.due_date) return;
    await store.createAssessment.mutateAsync({
      staff_id: store.activeTeacherId,
      class_name: form.class_name, subject: form.subject, title: form.title,
      kind: form.kind, instructions: form.instructions,
      max_score: Number(form.max_score) || 100, weight: Number(form.weight) || 1,
      due_date: form.due_date, academic_year: String(new Date().getFullYear()),
      term: form.term, attachment_url: form.attachment_url,
    } as any);
    setAddOpen(false); setForm({ kind: 'Assignment', max_score: 100, weight: 1 });
  };

  const saveGrade = async (submissionId: string) => {
    const g = scores[submissionId];
    if (!g?.score) return;
    await store.gradeSubmission.mutateAsync({ id: submissionId, score: Number(g.score), feedback: g.feedback, graderId: store.activeTeacherId });
    // refresh
    const list = await api.fetchSubmissionsForAssessment(gradingFor.id);
    setSubs(list);
  };

  const summary = useMemo(() => {
    const rows = subs;
    return {
      total: rows.length,
      submitted: rows.filter((r: any) => r.status === 'Submitted' || r.status === 'Late').length,
      graded: rows.filter((r: any) => r.status === 'Graded').length,
      missing: rows.filter((r: any) => r.status === 'Missing').length,
    };
  }, [subs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h4 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4" /> Assessments</h4>
          <p className="text-xs text-slate-500 mt-0.5">Create, assign, and grade — submission stubs are auto-created for every enrolled learner.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => store.scanMissing.mutate()} isLoading={store.scanMissing.isPending}>
            <RefreshCw className="w-3.5 h-3.5" /> Mark missing (past due)
          </Button>
          <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}><Plus className="w-3.5 h-3.5" /> New assessment</Button>
        </div>
      </div>

      {store.myAssessments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assessments yet"
          description="Create assignments, homework, quizzes and exams for your classes."
          actionLabel="Create first assessment"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {store.myAssessments.map(a => {
            const mine = store.submissions.filter(s => s.assessment_id === a.id);
            const submitted = mine.filter(s => s.status === 'Submitted' || s.status === 'Late').length;
            const graded = mine.filter(s => s.status === 'Graded').length;
            const dueDays = Math.floor((new Date(a.due_date).getTime() - Date.now()) / 86400000);
            return (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold">{a.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{a.subject} · {a.class_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="info">{a.kind}</Badge>
                    <Badge variant={dueDays < 0 ? 'danger' : dueDays <= 3 ? 'warning' : 'muted'}>
                      {dueDays < 0 ? `${-dueDays}d overdue` : dueDays === 0 ? 'Due today' : `${dueDays}d left`}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                  <Badge variant="muted">Max: {a.max_score}</Badge>
                  <Badge variant="muted">Weight: {a.weight}</Badge>
                  <Badge variant="primary">{mine.length} assigned</Badge>
                  <Badge variant={submitted > 0 ? 'warning' : 'muted'}>{submitted} submitted</Badge>
                  <Badge variant={graded > 0 ? 'success' : 'muted'}>{graded} graded</Badge>
                </div>
                <div className="flex gap-1 mt-3">
                  <Button size="sm" variant="primary" onClick={() => setGradingFor(a)}>
                    <Award className="w-3.5 h-3.5" /> Grade
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${a.title} and all submissions?`)) store.deleteAssessment.mutate(a.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add assessment */}
      <Dialog isOpen={addOpen} onClose={() => setAddOpen(false)} title="Create assessment" maxWidth="2xl">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Kind" options={ASSESSMENT_KINDS.map(k => ({ value: k, label: k }))} value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })} />
            <Select label="Class" options={[{ value: '', label: '—' }, ...store.myClassNames.map(c => ({ value: c, label: c }))]}
              value={form.class_name ?? ''} onChange={e => setForm({ ...form, class_name: e.target.value })} />
            <Select label="Subject" options={[{ value: '', label: '—' }, ...store.mySubjects.map(s => ({ value: s, label: s }))]}
              value={form.subject ?? ''} onChange={e => setForm({ ...form, subject: e.target.value })} />
          </div>
          <Input label="Title" value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Instructions" value={form.instructions ?? ''} onChange={e => setForm({ ...form, instructions: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input label="Max score" type="number" value={form.max_score} onChange={e => setForm({ ...form, max_score: e.target.value })} />
            <Input label="Weight" type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
            <Input label="Due date" type="date" value={form.due_date ?? ''} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            <Input label="Term" value={form.term ?? ''} onChange={e => setForm({ ...form, term: e.target.value })} />
          </div>
          <Input label="Attachment URL" value={form.attachment_url ?? ''} onChange={e => setForm({ ...form, attachment_url: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={submit} isLoading={store.createAssessment.isPending}>Save & assign to class</Button>
        </div>
      </Dialog>

      {/* Grade dialog */}
      {gradingFor && (
        <Dialog isOpen onClose={() => setGradingFor(null)} title={`Grade — ${gradingFor.title}`} maxWidth="2xl">
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 text-center"><p className="text-slate-400 font-bold uppercase text-[10px]">Total</p><p className="text-lg font-black">{summary.total}</p></div>
              <div className="p-2 rounded-lg bg-amber-50 text-center"><p className="text-amber-500 font-bold uppercase text-[10px]">Submitted</p><p className="text-lg font-black text-amber-600">{summary.submitted}</p></div>
              <div className="p-2 rounded-lg bg-emerald-50 text-center"><p className="text-emerald-500 font-bold uppercase text-[10px]">Graded</p><p className="text-lg font-black text-emerald-600">{summary.graded}</p></div>
              <div className="p-2 rounded-lg bg-rose-50 text-center"><p className="text-rose-500 font-bold uppercase text-[10px]">Missing</p><p className="text-lg font-black text-rose-600">{summary.missing}</p></div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 font-bold">
                  <th className="py-2 text-left">Learner</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Score / {gradingFor.max_score}</th>
                  <th className="py-2 text-left">Feedback</th>
                  <th className="py-2 text-right">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subs.map(s => {
                  const stu = store.studentById(s.student_id);
                  const g = scores[s.id] ?? { score: '', feedback: '' };
                  return (
                    <tr key={s.id}>
                      <td className="py-2">
                        <p className="font-semibold">{stu?.first_name} {stu?.last_name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{stu?.admission_number}</p>
                      </td>
                      <td className="py-2 text-center">
                        <Badge variant={s.status === 'Graded' ? 'success' : s.status === 'Late' ? 'warning' : s.status === 'Missing' ? 'danger' : 'muted'}>{s.status}</Badge>
                      </td>
                      <td className="py-2">
                        <input type="number" max={gradingFor.max_score} value={g.score}
                          onChange={e => setScores(p => ({ ...p, [s.id]: { ...p[s.id], score: e.target.value } }))}
                          className="w-20 px-2 py-1 text-right font-mono text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                      </td>
                      <td className="py-2">
                        <input value={g.feedback} onChange={e => setScores(p => ({ ...p, [s.id]: { ...p[s.id], feedback: e.target.value } }))}
                          className="w-full px-2 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          placeholder="Optional feedback…" />
                      </td>
                      <td className="py-2 text-right">
                        <Button size="sm" variant="primary" onClick={() => saveGrade(s.id)}><Save className="w-3.5 h-3.5" /></Button>
                      </td>
                    </tr>
                  );
                })}
                {subs.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-400 text-xs">No submissions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Dialog>
      )}
    </div>
  );
};