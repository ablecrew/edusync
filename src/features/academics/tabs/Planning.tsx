import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Plus, Trash2, CheckCircle2, PlayCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useAcademicsStore } from '../store';
import * as api from '../api';
import type { SchemeTopic } from '../types';

export const Planning: React.FC<{ store: ReturnType<typeof useAcademicsStore> }> = ({ store }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [sowForm, setSowForm] = useState<any>({});
  const [selectedSow, setSelectedSow] = useState<string | null>(null);
  const [topics, setTopics] = useState<SchemeTopic[]>([]);
  const [topicForm, setTopicForm] = useState<any>({ lessons_planned: 1, status: 'Pending' });
  const [topicOpen, setTopicOpen] = useState(false);

  useEffect(() => {
    if (!selectedSow) { setTopics([]); return; }
    api.fetchSchemeTopics(selectedSow).then(setTopics).catch(() => setTopics([]));
  }, [selectedSow]);

  const currentSow = store.sow.find(s => s.id === selectedSow);

  const submitSow = async () => {
    if (!sowForm.title || !sowForm.staff_id) return;
    const rec = await store.createSoW.mutateAsync({
      staff_id: sowForm.staff_id, subject_id: sowForm.subject_id, class_id: sowForm.class_id,
      academic_year_id: store.currentYear?.id, term_id: store.currentTerm?.id,
      title: sowForm.title, file_url: sowForm.file_url,
    } as any);
    setSelectedSow((rec as any).id);
    setAddOpen(false); setSowForm({});
  };

  const submitTopic = async () => {
    if (!selectedSow || !topicForm.topic) return;
    await store.addSowTopic.mutateAsync({
      scheme_id: selectedSow, week_no: Number(topicForm.week_no) || 1,
      topic: topicForm.topic, learning_outcome: topicForm.learning_outcome,
      resources: topicForm.resources, lessons_planned: Number(topicForm.lessons_planned) || 1,
      lessons_taught: 0, target_date: topicForm.target_date, status: topicForm.status,
    } as any);
    const refreshed = await api.fetchSchemeTopics(selectedSow);
    setTopics(refreshed);
    setTopicOpen(false); setTopicForm({ lessons_planned: 1, status: 'Pending' });
  };

  const coverage = useMemo(() => {
    if (topics.length === 0) return 0;
    const planned = topics.reduce((a, t) => a + t.lessons_planned, 0);
    const taught = topics.reduce((a, t) => a + t.lessons_taught, 0);
    return Math.round((taught / (planned || 1)) * 100);
  }, [topics]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Schemes of Work</h4>
            <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}><Plus className="w-3.5 h-3.5" /></Button>
          </div>
          {store.sow.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No schemes yet" description="Create per-teacher schemes of work with weekly topics." />
          ) : (
            <ul className="space-y-1">
              {store.sow.map(s => {
                const teacher = store.teacherById(s.staff_id);
                const subject = s.subject_id ? store.subjectById(s.subject_id) : null;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => setSelectedSow(s.id)}
                      className={`w-full text-left p-3 rounded-xl transition-colors ${
                        selectedSow === s.id ? 'bg-[#08428C] text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}>
                      <p className="font-semibold text-sm">{s.title}</p>
                      <p className={`text-[11px] ${selectedSow === s.id ? 'text-blue-100' : 'text-slate-500'}`}>
                        {teacher ? `${teacher.first_name} ${teacher.last_name}` : '—'}{subject && ` · ${subject.name}`}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2 p-5">
          {!currentSow ? (
            <EmptyState icon={ClipboardList} title="Select a scheme" description="Choose a scheme of work on the left to view / edit its weekly topics." />
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold">{currentSow.title}</h4>
                  <p className="text-[11px] text-slate-500">
                    {topics.length} topic{topics.length === 1 ? '' : 's'} · {coverage}% coverage
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-40 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${coverage}%` }} />
                  </div>
                  <Button size="sm" variant="primary" onClick={() => setTopicOpen(true)}><Plus className="w-3.5 h-3.5" /> Topic</Button>
                </div>
              </div>

              {topics.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No topics yet" description="Add weekly topics with learning outcomes and lesson counts." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase text-slate-400">
                      <th className="py-2 px-3 text-left">Wk</th>
                      <th className="py-2 px-3 text-left">Topic / outcome</th>
                      <th className="py-2 px-3 text-right">Lessons</th>
                      <th className="py-2 px-3 text-left">Status</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {topics.map(t => (
                      <tr key={t.id}>
                        <td className="py-2 px-3 font-bold">{t.week_no}</td>
                        <td className="py-2 px-3">
                          <p className="font-semibold text-sm">{t.topic}</p>
                          {t.learning_outcome && <p className="text-[11px] text-slate-500">{t.learning_outcome}</p>}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-xs">
                          {t.lessons_taught}/{t.lessons_planned}
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant={t.status === 'Covered' ? 'success' : t.status === 'In Progress' ? 'warning' : 'muted'}>{t.status}</Badge>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {t.status !== 'Covered' && (
                              <button
                                onClick={async () => {
                                  await api.updateSchemeTopic(t.id, {
                                    lessons_taught: Math.min(t.lessons_planned, t.lessons_taught + 1),
                                    status: t.lessons_taught + 1 >= t.lessons_planned ? 'Covered' : 'In Progress',
                                    actual_date: new Date().toISOString().slice(0, 10),
                                  });
                                  const refreshed = await api.fetchSchemeTopics(selectedSow!);
                                  setTopics(refreshed);
                                }}
                                className="p-1 text-[#08428C] hover:bg-[#e8f1fc] rounded" title="Mark +1 lesson taught">
                                <PlayCircle className="w-4 h-4" />
                              </button>
                            )}
                            {t.status === 'Covered' && (
                              <span title="Covered"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Create SoW */}
      <Dialog isOpen={addOpen} onClose={() => setAddOpen(false)} title="New scheme of work" maxWidth="lg">
        <div className="space-y-3">
          <Input label="Title" value={sowForm.title ?? ''} onChange={e => setSowForm({ ...sowForm, title: e.target.value })} placeholder="Grade 10 Mathematics — Term 1" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Teacher" options={[{ value: '', label: '—' }, ...store.teachers.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))]}
              value={sowForm.staff_id ?? ''} onChange={e => setSowForm({ ...sowForm, staff_id: e.target.value })} />
            <Select label="Subject" options={[{ value: '', label: '—' }, ...store.subjects.map(s => ({ value: s.id, label: s.name }))]}
              value={sowForm.subject_id ?? ''} onChange={e => setSowForm({ ...sowForm, subject_id: e.target.value })} />
            <Select label="Class" options={[{ value: '', label: '—' }, ...store.classes.map((c: any) => ({ value: c.id, label: c.name }))]}
              value={sowForm.class_id ?? ''} onChange={e => setSowForm({ ...sowForm, class_id: e.target.value })} />
          </div>
          <Input label="File URL (optional)" value={sowForm.file_url ?? ''} onChange={e => setSowForm({ ...sowForm, file_url: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={submitSow}>Create scheme</Button>
        </div>
      </Dialog>

      {/* Add topic */}
      <Dialog isOpen={topicOpen} onClose={() => setTopicOpen(false)} title="Add topic" maxWidth="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Week #" type="number" value={topicForm.week_no ?? ''} onChange={e => setTopicForm({ ...topicForm, week_no: e.target.value })} />
            <Input label="Lessons planned" type="number" value={topicForm.lessons_planned ?? 1} onChange={e => setTopicForm({ ...topicForm, lessons_planned: e.target.value })} />
            <Input label="Target date" type="date" value={topicForm.target_date ?? ''} onChange={e => setTopicForm({ ...topicForm, target_date: e.target.value })} />
          </div>
          <Input label="Topic" value={topicForm.topic ?? ''} onChange={e => setTopicForm({ ...topicForm, topic: e.target.value })} />
          <Textarea label="Learning outcome" value={topicForm.learning_outcome ?? ''} onChange={e => setTopicForm({ ...topicForm, learning_outcome: e.target.value })} />
          <Input label="Resources" value={topicForm.resources ?? ''} onChange={e => setTopicForm({ ...topicForm, resources: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={submitTopic}>Save topic</Button>
        </div>
      </Dialog>
    </div>
  );
};