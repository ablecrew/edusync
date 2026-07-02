import React, { useMemo, useState } from 'react';
import {
  BookOpen, Plus, Trash2, ChevronDown, ChevronRight, Calendar, Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useAcademicsStore } from '../store';
import { CURRICULA, SUBJECT_KINDS } from '../constants';
import type { CurriculumSubject } from '../types';

type SubTab = 'years' | 'subjects' | 'mapping';

export const Curriculum: React.FC<{ store: ReturnType<typeof useAcademicsStore> }> = ({ store }) => {
  const [sub, setSub] = useState<SubTab>('subjects');
  const [yearOpen, setYearOpen] = useState(false);
  const [termOpen, setTermOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [editing, setEditing] = useState<CurriculumSubject | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [yForm, setYForm] = useState<any>({});
  const [tForm, setTForm] = useState<any>({});
  const [sForm, setSForm] = useState<any>({ curriculum: 'CBC', kind: 'Core', is_active: true });

  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [mandatory, setMandatory] = useState(true);

  const submitYear = async () => {
    if (!yForm.name || !yForm.starts_on || !yForm.ends_on) return;
    await store.upsertYear.mutateAsync(yForm);
    setYearOpen(false); setYForm({});
  };
  const submitTerm = async () => {
    if (!tForm.name) return;
    await store.upsertTerm.mutateAsync(tForm);
    setTermOpen(false); setTForm({});
  };
  const submitSubject = async () => {
    if (!sForm.code || !sForm.name) return;
    if (editing) {
      await store.updateSubject.mutateAsync({ id: editing.id, patch: sForm });
      setEditing(null);
    } else {
      await store.createSubject.mutateAsync(sForm);
    }
    setSubjectOpen(false); setSForm({ curriculum: 'CBC', kind: 'Core', is_active: true });
  };

  const submitClassSubject = async () => {
    if (!classId || !subjectId) return;
    await store.assignClassSubject.mutateAsync({
      class_id: classId, subject_id: subjectId, is_mandatory: mandatory,
      academic_year_id: store.currentYear?.id,
    });
    setClassId(''); setSubjectId('');
  };

  const groupedByClass = useMemo(() => {
    const map: Record<string, any[]> = {};
    store.classSubjects.forEach(cs => {
      map[cs.class_id] = map[cs.class_id] ?? [];
      map[cs.class_id].push(cs);
    });
    return map;
  }, [store.classSubjects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {[
          { id: 'years',    label: 'Years & Terms',  count: store.years.length },
          { id: 'subjects', label: 'Subjects & CBC', count: store.subjects.length },
          { id: 'mapping',  label: 'Class Mapping',  count: store.classSubjects.length },
        ].map(t => (
          <button key={t.id} onClick={() => setSub(t.id as SubTab)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${
              sub === t.id ? 'bg-white dark:bg-slate-900 text-[#08428C] shadow-sm' : 'text-slate-600'
            }`}>
            {t.label}<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">{t.count}</span>
          </button>
        ))}
      </div>

      {/* YEARS & TERMS */}
      {sub === 'years' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold flex items-center gap-2"><Calendar className="w-4 h-4" /> Academic Years</h4>
              <Button size="sm" variant="primary" onClick={() => setYearOpen(true)}><Plus className="w-3.5 h-3.5" /> New year</Button>
            </div>
            {store.years.length === 0 ? (
              <EmptyState icon={Calendar} title="No academic years yet" description="Create your first academic year (e.g. 2025/2026)." />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {store.years.map(y => (
                  <li key={y.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{y.name}</p>
                      <p className="text-[11px] text-slate-500">{y.starts_on} → {y.ends_on}</p>
                    </div>
                    {y.is_current && <Badge variant="success">Current</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold flex items-center gap-2"><Layers className="w-4 h-4" /> Terms</h4>
              <Button size="sm" variant="primary" onClick={() => setTermOpen(true)}><Plus className="w-3.5 h-3.5" /> New term</Button>
            </div>
            {store.terms.length === 0 ? (
              <EmptyState icon={Layers} title="No terms" description="Add school terms tied to an academic year." />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {store.terms.map(t => (
                  <li key={t.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{t.name}</p>
                      <p className="text-[11px] text-slate-500">{t.starts_on ?? '—'} → {t.ends_on ?? '—'}</p>
                    </div>
                    {t.is_current && <Badge variant="success">Current</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* SUBJECTS */}
      {sub === 'subjects' && (
        <>
          <div className="flex items-center justify-end">
            <Button size="sm" variant="primary" onClick={() => { setEditing(null); setSForm({ curriculum: 'CBC', kind: 'Core', is_active: true }); setSubjectOpen(true); }}>
              <Plus className="w-3.5 h-3.5" /> New subject
            </Button>
          </div>
          {store.subjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No subjects yet"
              description="Add your first curriculum subject. You can then define learning areas, strands, sub-strands and competencies."
              actionLabel="Add first subject"
              onAction={() => { setEditing(null); setSubjectOpen(true); }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {store.subjects.map(s => (
                <Card key={s.id} className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant={s.kind === 'Core' ? 'primary' : s.kind === 'Optional' ? 'info' : 'muted'}>{s.kind}</Badge>
                      <p className="font-black text-lg mt-2">{s.name}</p>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{s.code}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">{s.curriculum}</span>
                  </div>
                  {s.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{s.description}</p>}

                  {/* Expand hierarchy */}
                  <button
                    onClick={() => setExpanded(p => ({ ...p, [s.id]: !p[s.id] }))}
                    className="mt-3 flex items-center gap-1 text-xs font-bold text-[#08428C]"
                  >
                    {expanded[s.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    Learning areas / strands
                  </button>
                  {expanded[s.id] && <HierarchyEditor store={store} subject={s} />}

                  <div className="flex justify-end gap-1 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setSForm(s); setSubjectOpen(true); }}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${s.name}? This removes all its learning areas.`)) store.deleteSubject.mutate(s.id); }}>
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* MAPPING */}
      {sub === 'mapping' && (
        <>
          <Card className="p-4">
            <h4 className="font-bold text-sm mb-3">Assign subjects to classes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
              <Select label="Class" options={[{ value: '', label: '—' }, ...store.classes.map((c: any) => ({ value: c.id, label: c.name }))]}
                value={classId} onChange={e => setClassId(e.target.value)} />
              <Select label="Subject" options={[{ value: '', label: '—' }, ...store.subjects.map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))]}
                value={subjectId} onChange={e => setSubjectId(e.target.value)} />
              <label className="flex items-center gap-1.5 text-xs font-semibold pt-4">
                <input type="checkbox" checked={mandatory} onChange={e => setMandatory(e.target.checked)} /> Mandatory
              </label>
              <Button variant="primary" onClick={submitClassSubject} disabled={!classId || !subjectId}><Plus className="w-3.5 h-3.5" /> Assign</Button>
            </div>
          </Card>

          {store.classes.length === 0 ? (
            <EmptyState icon={BookOpen} title="No classes to map yet" description="Add classes in the Students / Academic Classes module first." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {store.classes.map((c: any) => {
                const list = groupedByClass[c.id] ?? [];
                return (
                  <Card key={c.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold">{c.name}</p>
                      <Badge variant="muted">{list.length} subject{list.length === 1 ? '' : 's'}</Badge>
                    </div>
                    {list.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3">No subjects assigned yet.</p>
                    ) : (
                      <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {list.map(cs => {
                          const subject = store.subjectById(cs.subject_id);
                          return (
                            <li key={cs.id} className="py-1.5 flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{subject?.name ?? '—'}</p>
                                <p className="text-[11px] text-slate-500">{subject?.code} · {cs.is_mandatory ? 'Mandatory' : 'Optional'}</p>
                              </div>
                              <button onClick={() => store.unassignClassSubject.mutate(cs.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Year dialog */}
      <Dialog isOpen={yearOpen} onClose={() => setYearOpen(false)} title="Academic year" maxWidth="md">
        <div className="space-y-3">
          <Input label="Name" value={yForm.name ?? ''} onChange={e => setYForm({ ...yForm, name: e.target.value })} placeholder="2025/2026" />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Starts" type="date" value={yForm.starts_on ?? ''} onChange={e => setYForm({ ...yForm, starts_on: e.target.value })} />
            <Input label="Ends" type="date" value={yForm.ends_on ?? ''} onChange={e => setYForm({ ...yForm, ends_on: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!yForm.is_current} onChange={e => setYForm({ ...yForm, is_current: e.target.checked })} /> Mark as current
          </label>
          <Button variant="primary" className="w-full" onClick={submitYear}>Save</Button>
        </div>
      </Dialog>

      {/* Term dialog */}
      <Dialog isOpen={termOpen} onClose={() => setTermOpen(false)} title="Term" maxWidth="md">
        <div className="space-y-3">
          <Input label="Name" value={tForm.name ?? ''} onChange={e => setTForm({ ...tForm, name: e.target.value })} placeholder="Term 1" />
          <Select label="Academic year" options={[{ value: '', label: '—' }, ...store.years.map(y => ({ value: y.id, label: y.name }))]}
            value={tForm.academic_year_id ?? ''} onChange={e => setTForm({ ...tForm, academic_year_id: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Starts" type="date" value={tForm.starts_on ?? ''} onChange={e => setTForm({ ...tForm, starts_on: e.target.value })} />
            <Input label="Ends" type="date" value={tForm.ends_on ?? ''} onChange={e => setTForm({ ...tForm, ends_on: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!tForm.is_current} onChange={e => setTForm({ ...tForm, is_current: e.target.checked })} /> Mark as current
          </label>
          <Button variant="primary" className="w-full" onClick={submitTerm}>Save</Button>
        </div>
      </Dialog>

      {/* Subject dialog */}
      <Dialog isOpen={subjectOpen} onClose={() => { setSubjectOpen(false); setEditing(null); }} title={editing ? 'Edit subject' : 'New subject'} maxWidth="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Code" value={sForm.code ?? ''} onChange={e => setSForm({ ...sForm, code: e.target.value })} placeholder="MATH-101" />
            <Select label="Curriculum" options={CURRICULA.map(c => ({ value: c, label: c }))} value={sForm.curriculum} onChange={e => setSForm({ ...sForm, curriculum: e.target.value })} />
            <Select label="Kind" options={SUBJECT_KINDS.map(k => ({ value: k, label: k }))} value={sForm.kind} onChange={e => setSForm({ ...sForm, kind: e.target.value })} />
          </div>
          <Input label="Name" value={sForm.name ?? ''} onChange={e => setSForm({ ...sForm, name: e.target.value })} />
          <Input label="Department" value={sForm.department ?? ''} onChange={e => setSForm({ ...sForm, department: e.target.value })} />
          <Textarea label="Description" value={sForm.description ?? ''} onChange={e => setSForm({ ...sForm, description: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={submitSubject}>{editing ? 'Save changes' : 'Add subject'}</Button>
        </div>
      </Dialog>
    </div>
  );
};

/* ---- Inline hierarchy editor per subject ---- */
const HierarchyEditor: React.FC<{ store: ReturnType<typeof useAcademicsStore>; subject: CurriculumSubject }> = ({ store, subject }) => {
  const areas = store.areas.filter(a => a.subject_id === subject.id);
  const [newArea, setNewArea] = useState('');

  return (
    <div className="mt-3 space-y-2 text-xs">
      <div className="flex gap-2">
        <input value={newArea} onChange={e => setNewArea(e.target.value)} placeholder="New learning area…"
          className="flex-1 px-2 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        <button
          onClick={async () => {
            if (!newArea) return;
            await store.addArea.mutateAsync({ subject_id: subject.id, name: newArea, order_no: areas.length } as any);
            setNewArea('');
          }}
          className="px-2 rounded-lg bg-[#08428C] text-white text-xs font-bold">+</button>
      </div>
      <ul className="pl-2 border-l-2 border-slate-100 dark:border-slate-800 space-y-1">
        {areas.map(a => {
          const strands = store.strands.filter(s => s.learning_area_id === a.id);
          return (
            <li key={a.id}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">📖 {a.name}</span>
                <button onClick={() => store.removeHier.mutate({ table: 'learning_areas', id: a.id })} className="text-rose-500 hover:underline text-[10px]">×</button>
              </div>
              <ul className="pl-4 border-l border-slate-100 dark:border-slate-800 mt-1 space-y-0.5">
                {strands.map(st => {
                  const subs = store.subStrands.filter(x => x.strand_id === st.id);
                  return (
                    <li key={st.id}>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>▸ {st.name}</span>
                        <button onClick={() => store.removeHier.mutate({ table: 'strands', id: st.id })} className="text-rose-500 hover:underline">×</button>
                      </div>
                      <ul className="pl-4 mt-0.5 space-y-0.5">
                        {subs.map(ss => (
                          <li key={ss.id} className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>· {ss.name}{ss.competency && ` — ${ss.competency}`}</span>
                            <button onClick={() => store.removeHier.mutate({ table: 'sub_strands', id: ss.id })} className="text-rose-500">×</button>
                          </li>
                        ))}
                        <QuickAdd
                          placeholder="+ sub-strand"
                          onSubmit={(v) => store.addSubStrand.mutate({ strand_id: st.id, name: v, order_no: subs.length } as any)}
                        />
                      </ul>
                    </li>
                  );
                })}
                <QuickAdd
                  placeholder="+ strand"
                  onSubmit={(v) => store.addStrand.mutate({ learning_area_id: a.id, name: v, order_no: strands.length } as any)}
                />
              </ul>
            </li>
          );
        })}
        {areas.length === 0 && <li className="text-slate-400 italic">No learning areas yet</li>}
      </ul>
    </div>
  );
};

const QuickAdd: React.FC<{ placeholder: string; onSubmit: (v: string) => void }> = ({ placeholder, onSubmit }) => {
  const [v, setV] = useState('');
  return (
    <li className="flex items-center gap-1">
      <input value={v} onChange={e => setV(e.target.value)} placeholder={placeholder}
        className="flex-1 px-1.5 py-0.5 text-[10px] rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
      <button onClick={() => { if (v) { onSubmit(v); setV(''); } }} className="text-[10px] text-[#08428C] font-bold">+</button>
    </li>
  );
};