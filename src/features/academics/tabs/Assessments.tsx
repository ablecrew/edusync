import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Plus, Save, Lock, Trash2, ClipboardCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useAcademicsStore } from '../store';
import * as api from '../api';
import { ASSESSMENT_TYPES } from '../constants';

export const Assessments: React.FC<{ store: ReturnType<typeof useAcademicsStore> }> = ({ store }) => {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [paperOpen, setPaperOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState<any>(null);
  const [scheduleForm, setScheduleForm] = useState<any>({ assessment_type: 'End-of-Term' });
  const [paperForm, setPaperForm] = useState<any>({ max_score: 100 });
  const [selSchedule, setSelSchedule] = useState<string | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [existing, setExisting] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, { raw: string; moderated: string; remarks: string }>>({});

  useEffect(() => {
    if (!scoreOpen) return;
    (async () => {
      const cls = scoreOpen.class_name;
      const { supabase } = await import('@/lib/supabase/client');
      const { data } = await supabase.from('students').select('*').eq('class_name', cls).eq('status', 'Active').order('first_name');
      setRoster(data ?? []);
      const existingRows = await api.fetchResultsForPaper(scoreOpen.id);
      setExisting(existingRows);
      const map: any = {};
      (data ?? []).forEach((s: any) => {
        const r = existingRows.find(x => x.student_id === s.id);
        map[s.id] = {
          raw: r?.raw_score?.toString() ?? '',
          moderated: r?.moderated_score?.toString() ?? '',
          remarks: r?.remarks ?? '',
        };
      });
      setScores(map);
    })();
  }, [scoreOpen]);

  const submitSchedule = async () => {
    if (!scheduleForm.name || !scheduleForm.starts_on || !scheduleForm.ends_on) return;
    const rec = await store.createSchedule.mutateAsync({
      ...scheduleForm,
      academic_year_id: store.currentYear?.id,
      term_id: store.currentTerm?.id,
    });
    setSelSchedule((rec as any).id);
    setScheduleOpen(false); setScheduleForm({ assessment_type: 'End-of-Term' });
  };

  const submitPaper = async () => {
    if (!selSchedule || !paperForm.subject_name || !paperForm.class_name || !paperForm.paper_date) return;
    await store.addPaper.mutateAsync({ ...paperForm, schedule_id: selSchedule, max_score: Number(paperForm.max_score) || 100 } as any);
    setPaperOpen(false); setPaperForm({ max_score: 100 });
  };

  const saveScores = async () => {
    const rows = roster.map(s => {
      const g = scores[s.id];
      const existingRow = existing.find(x => x.student_id === s.id);
      return {
        ...(existingRow ? { id: existingRow.id } : {}),
        exam_paper_id: scoreOpen.id,
        student_id: s.id,
        raw_score: g?.raw ? Number(g.raw) : null,
        moderated_score: g?.moderated ? Number(g.moderated) : null,
        remarks: g?.remarks ?? null,
        entered_at: new Date().toISOString(),
      };
    });
    await store.upsertResults.mutateAsync(rows as any);
    alert('Scores saved.');
    const refreshed = await api.fetchResultsForPaper(scoreOpen.id);
    setExisting(refreshed);
  };

  const finalize = async () => {
    if (!scoreOpen) return;
    if (!confirm('Finalize this paper? Scores become read-only for teachers.')) return;
    await store.finalizeResults.mutateAsync(scoreOpen.id);
    alert('Paper finalized.');
  };

  const filteredPapers = useMemo(() => selSchedule ? store.examPapers.filter(p => p.schedule_id === selSchedule) : [], [selSchedule, store.examPapers]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><Calculator className="w-4 h-4" /> Exam Schedules</h4>
            <Button size="sm" variant="primary" onClick={() => setScheduleOpen(true)}><Plus className="w-3.5 h-3.5" /></Button>
          </div>
          {store.examSchedules.length === 0 ? (
            <EmptyState icon={Calculator} title="No exam windows" description="Create a schedule (e.g. Term 1 End-of-Term) to organize papers." />
          ) : (
            <ul className="space-y-1">
              {store.examSchedules.map(s => (
                <li key={s.id}>
                  <button onClick={() => setSelSchedule(s.id)}
                    className={`w-full text-left p-3 rounded-xl ${selSchedule === s.id ? 'bg-[#08428C] text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className={`text-[11px] ${selSchedule === s.id ? 'text-blue-100' : 'text-slate-500'}`}>{s.assessment_type} · {s.starts_on} → {s.ends_on}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold">Papers</h4>
            <Button size="sm" variant="primary" onClick={() => setPaperOpen(true)} disabled={!selSchedule}><Plus className="w-3.5 h-3.5" /> Add paper</Button>
          </div>
          {!selSchedule ? (
            <EmptyState icon={ClipboardCheck} title="Pick a schedule" description="Select a schedule on the left to add papers and enter scores." />
          ) : filteredPapers.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No papers yet" description="Add a paper for each subject / class combination." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-4 text-left">Subject</th>
                  <th className="py-3 px-4 text-left">Class</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-right">Max</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPapers.map(p => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-semibold">{p.subject_name}</td>
                    <td className="py-3 px-4">{p.class_name}</td>
                    <td className="py-3 px-4 text-xs">{p.paper_date} {p.start_time && `· ${p.start_time.slice(0, 5)}`}</td>
                    <td className="py-3 px-4 text-right font-mono">{p.max_score}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="primary" onClick={() => setScoreOpen(p)}>Enter scores</Button>
                        <button onClick={() => { if (confirm('Delete paper?')) store.removePaper.mutate(p.id); }} className="p-1 rounded-lg text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* New schedule */}
      <Dialog isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} title="New exam schedule" maxWidth="lg">
        <div className="space-y-3">
          <Input label="Name" value={scheduleForm.name ?? ''} onChange={e => setScheduleForm({ ...scheduleForm, name: e.target.value })} placeholder="Term 1 End-of-Term Exams" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Type" options={ASSESSMENT_TYPES.map(t => ({ value: t, label: t }))} value={scheduleForm.assessment_type} onChange={e => setScheduleForm({ ...scheduleForm, assessment_type: e.target.value })} />
            <Input label="Starts" type="date" value={scheduleForm.starts_on ?? ''} onChange={e => setScheduleForm({ ...scheduleForm, starts_on: e.target.value })} />
            <Input label="Ends" type="date" value={scheduleForm.ends_on ?? ''} onChange={e => setScheduleForm({ ...scheduleForm, ends_on: e.target.value })} />
          </div>
          <Input label="Publish target" type="date" value={scheduleForm.publish_target ?? ''} onChange={e => setScheduleForm({ ...scheduleForm, publish_target: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={submitSchedule}>Create</Button>
        </div>
      </Dialog>

      {/* New paper */}
      <Dialog isOpen={paperOpen} onClose={() => setPaperOpen(false)} title="New paper" maxWidth="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Subject"
              options={[{ value: '', label: '—' }, ...store.subjects.map(s => ({ value: s.id, label: s.name }))]}
              onChange={e => {
                const s = store.subjectById(e.target.value);
                setPaperForm({ ...paperForm, subject_id: e.target.value, subject_name: s?.name ?? '' });
              }} />
            <Select label="Class"
              options={[{ value: '', label: '—' }, ...store.classes.map((c: any) => ({ value: c.id, label: c.name }))]}
              onChange={e => {
                const c: any = store.classById(e.target.value);
                setPaperForm({ ...paperForm, class_id: e.target.value, class_name: c?.name ?? '' });
              }} />
            <Input label="Date" type="date" value={paperForm.paper_date ?? ''} onChange={e => setPaperForm({ ...paperForm, paper_date: e.target.value })} />
            <Input label="Start time" type="time" value={paperForm.start_time ?? ''} onChange={e => setPaperForm({ ...paperForm, start_time: e.target.value })} />
            <Input label="Duration (mins)" type="number" value={paperForm.duration_mins ?? ''} onChange={e => setPaperForm({ ...paperForm, duration_mins: Number(e.target.value) })} />
            <Input label="Max score" type="number" value={paperForm.max_score} onChange={e => setPaperForm({ ...paperForm, max_score: e.target.value })} />
            <Input label="Room" value={paperForm.room ?? ''} onChange={e => setPaperForm({ ...paperForm, room: e.target.value })} />
            <Input label="Invigilator" value={paperForm.invigilator ?? ''} onChange={e => setPaperForm({ ...paperForm, invigilator: e.target.value })} />
          </div>
          <Button variant="primary" className="w-full" onClick={submitPaper}>Add paper</Button>
        </div>
      </Dialog>

      {/* Score entry */}
      {scoreOpen && (
        <Dialog isOpen onClose={() => setScoreOpen(null)} title={`Scores — ${scoreOpen.subject_name} · ${scoreOpen.class_name}`} maxWidth="3xl">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">Max score: <b>{scoreOpen.max_score}</b> · {roster.length} learners</p>
              <div className="flex gap-2">
                <Button size="sm" variant="danger" onClick={finalize}><Lock className="w-3.5 h-3.5" /> Finalize</Button>
                <Button size="sm" variant="primary" onClick={saveScores}><Save className="w-3.5 h-3.5" /> Save all</Button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-900">
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase text-slate-400">
                    <th className="py-2 px-3 text-left">Learner</th>
                    <th className="py-2 px-3 text-right">Raw score</th>
                    <th className="py-2 px-3 text-right">Moderated</th>
                    <th className="py-2 px-3 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {roster.map((s: any) => (
                    <tr key={s.id}>
                      <td className="py-2 px-3">
                        <p className="font-semibold text-sm">{s.first_name} {s.last_name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{s.admission_number}</p>
                      </td>
                      <td className="py-2 px-3">
                        <input type="number" max={scoreOpen.max_score}
                          value={scores[s.id]?.raw ?? ''}
                          onChange={e => setScores(p => ({ ...p, [s.id]: { ...(p[s.id] ?? {}), raw: e.target.value, moderated: p[s.id]?.moderated ?? '', remarks: p[s.id]?.remarks ?? '' } }))}
                          className="w-20 px-2 py-1 text-right font-mono text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                      </td>
                      <td className="py-2 px-3">
                        <input type="number" max={scoreOpen.max_score}
                          value={scores[s.id]?.moderated ?? ''}
                          onChange={e => setScores(p => ({ ...p, [s.id]: { ...(p[s.id] ?? {}), moderated: e.target.value, raw: p[s.id]?.raw ?? '', remarks: p[s.id]?.remarks ?? '' } }))}
                          className="w-20 px-2 py-1 text-right font-mono text-sm rounded-lg bg-amber-50 border border-amber-200" />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          value={scores[s.id]?.remarks ?? ''}
                          onChange={e => setScores(p => ({ ...p, [s.id]: { ...(p[s.id] ?? {}), remarks: e.target.value, raw: p[s.id]?.raw ?? '', moderated: p[s.id]?.moderated ?? '' } }))}
                          className="w-full px-2 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          placeholder="Optional teacher remark…" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};