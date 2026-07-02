import React, { useMemo, useState } from 'react';
import { BookOpen, Plus, Upload, FileText, Trash2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useTeachersStore } from '../store';
import { MATERIAL_KINDS } from '../constants';

type SubTab = 'plans' | 'materials';

export const Lessons: React.FC<{ store: ReturnType<typeof useTeachersStore> }> = ({ store }) => {
  const [sub, setSub] = useState<SubTab>('plans');
  const [lessonOpen, setLessonOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState<any>({ status: 'Planned' });
  const [materialForm, setMaterialForm] = useState<any>({ kind: 'Notes', shared_with_students: true });
  const [q, setQ] = useState('');

  const submitLesson = async () => {
    if (!lessonForm.class_name || !lessonForm.subject || !lessonForm.topic) return;
    await store.createLesson.mutateAsync({
      staff_id: store.activeTeacherId,
      class_name: lessonForm.class_name,
      subject: lessonForm.subject,
      topic: lessonForm.topic,
      objectives: lessonForm.objectives,
      activities: lessonForm.activities,
      homework: lessonForm.homework,
      resources_used: lessonForm.resources_used,
      reflection: lessonForm.reflection,
      date: lessonForm.date ?? new Date().toISOString().slice(0, 10),
      status: lessonForm.status,
    });
    setLessonOpen(false);
    setLessonForm({ status: 'Planned' });
  };

  const submitMaterial = async () => {
    if (!materialForm.title || !materialForm.subject) return;
    await store.addMaterial.mutateAsync({
      staff_id: store.activeTeacherId,
      subject: materialForm.subject,
      class_name: materialForm.class_name,
      title: materialForm.title,
      kind: materialForm.kind,
      file_name: materialForm.file_name,
      file_url: materialForm.file_url,
      description: materialForm.description,
      shared_with_students: !!materialForm.shared_with_students,
      shared_with_staff: !!materialForm.shared_with_staff,
    });
    setMaterialOpen(false);
    setMaterialForm({ kind: 'Notes', shared_with_students: true });
  };

  const filteredLessons = store.myLessons.filter(l =>
    !q || `${l.topic} ${l.class_name} ${l.subject}`.toLowerCase().includes(q.toLowerCase())
  );
  const filteredMaterials = store.myMaterials.filter(m =>
    !q || `${m.title} ${m.subject} ${m.description ?? ''}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'plans', label: 'Lesson Plans', count: store.myLessons.length },
            { id: 'materials', label: 'Study Materials', count: store.myMaterials.length },
          ].map(t => (
            <button key={t.id} onClick={() => setSub(t.id as SubTab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                sub === t.id ? 'bg-white dark:bg-slate-900 text-[#08428C] shadow-sm' : 'text-slate-600'
              }`}>
              {t.label}<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">{t.count}</span>
            </button>
          ))}
        </div>
        {sub === 'plans' && <Button variant="primary" size="sm" onClick={() => setLessonOpen(true)}><Plus className="w-3.5 h-3.5" /> New lesson</Button>}
        {sub === 'materials' && <Button variant="primary" size="sm" onClick={() => setMaterialOpen(true)}><Upload className="w-3.5 h-3.5" /> Upload material</Button>}
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${sub}…`}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        </div>
      </Card>

      {sub === 'plans' && (
        filteredLessons.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={store.myLessons.length === 0 ? 'No lesson plans yet' : 'No plans match your search'}
            description="Post a lesson to keep a running record of what you've taught and what's next."
            actionLabel={store.myLessons.length === 0 ? 'Post first lesson' : undefined}
            onAction={store.myLessons.length === 0 ? () => setLessonOpen(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredLessons.map(l => (
              <Card key={l.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold">{l.topic}</p>
                    <p className="text-[11px] text-slate-500">{l.subject} · {l.class_name} · {l.date}</p>
                  </div>
                  <Badge variant={l.status === 'Delivered' ? 'success' : l.status === 'Skipped' ? 'danger' : 'muted'}>{l.status}</Badge>
                </div>
                {l.objectives && <p className="text-xs mt-2"><b className="text-slate-500">Objectives:</b> {l.objectives}</p>}
                {l.homework && <p className="text-xs mt-1"><b className="text-slate-500">Homework:</b> {l.homework}</p>}
                <div className="flex gap-1 mt-3">
                  {l.status !== 'Delivered' && (
                    <Button size="sm" variant="success" onClick={() => store.updateLesson.mutate({ id: l.id, patch: { status: 'Delivered' } })}>
                      Mark delivered
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {sub === 'materials' && (
        filteredMaterials.length === 0 ? (
          <EmptyState
            icon={Upload}
            title={store.myMaterials.length === 0 ? 'No materials uploaded' : 'No materials match your search'}
            description="Share notes, handouts, videos, and question papers with your students."
            actionLabel={store.myMaterials.length === 0 ? 'Upload first material' : undefined}
            onAction={store.myMaterials.length === 0 ? () => setMaterialOpen(true) : undefined}
          />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Title</th>
                  <th className="py-3 px-5 text-left">Type</th>
                  <th className="py-3 px-5 text-left">Subject / Class</th>
                  <th className="py-3 px-5">Shared with</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMaterials.map(m => (
                  <tr key={m.id}>
                    <td className="py-3 px-5">
                      <p className="font-semibold flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" /> {m.title}</p>
                      {m.file_name && <p className="text-[11px] font-mono text-slate-500">{m.file_name}</p>}
                    </td>
                    <td className="py-3 px-5"><Badge variant="info">{m.kind}</Badge></td>
                    <td className="py-3 px-5 text-xs">
                      <p className="font-semibold">{m.subject}</p>
                      <p className="text-slate-500">{m.class_name ?? '—'}</p>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex flex-wrap gap-1">
                        {m.shared_with_students && <Badge variant="success">Students</Badge>}
                        {m.shared_with_staff && <Badge variant="primary">Staff</Badge>}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex justify-end gap-1">
                        {m.file_url && (
                          <a href={m.file_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc]" title="Open">
                            <FileText className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => store.removeMaterial.mutate(m.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      )}

      {/* New lesson */}
      <Dialog isOpen={lessonOpen} onClose={() => setLessonOpen(false)} title="Post lesson" maxWidth="2xl">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Class" options={[{ value: '', label: '—' }, ...store.myClassNames.map(c => ({ value: c, label: c }))]}
              value={lessonForm.class_name ?? ''} onChange={e => setLessonForm({ ...lessonForm, class_name: e.target.value })} />
            <Select label="Subject" options={[{ value: '', label: '—' }, ...store.mySubjects.map(s => ({ value: s, label: s }))]}
              value={lessonForm.subject ?? ''} onChange={e => setLessonForm({ ...lessonForm, subject: e.target.value })} />
            <Input label="Date" type="date" value={lessonForm.date ?? new Date().toISOString().slice(0, 10)} onChange={e => setLessonForm({ ...lessonForm, date: e.target.value })} />
          </div>
          <Input label="Topic" value={lessonForm.topic ?? ''} onChange={e => setLessonForm({ ...lessonForm, topic: e.target.value })} />
          <Textarea label="Objectives" value={lessonForm.objectives ?? ''} onChange={e => setLessonForm({ ...lessonForm, objectives: e.target.value })} />
          <Textarea label="Activities" value={lessonForm.activities ?? ''} onChange={e => setLessonForm({ ...lessonForm, activities: e.target.value })} />
          <Input label="Homework" value={lessonForm.homework ?? ''} onChange={e => setLessonForm({ ...lessonForm, homework: e.target.value })} />
          <Textarea label="Reflection (post-lesson notes)" value={lessonForm.reflection ?? ''} onChange={e => setLessonForm({ ...lessonForm, reflection: e.target.value })} />
          <Select label="Status" options={['Planned', 'Delivered', 'Skipped'].map(s => ({ value: s, label: s }))}
            value={lessonForm.status} onChange={e => setLessonForm({ ...lessonForm, status: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={submitLesson} isLoading={store.createLesson.isPending}>Save lesson</Button>
        </div>
      </Dialog>

      {/* New material */}
      <Dialog isOpen={materialOpen} onClose={() => setMaterialOpen(false)} title="Upload study material" maxWidth="lg">
        <div className="space-y-3">
          <Input label="Title" value={materialForm.title ?? ''} onChange={e => setMaterialForm({ ...materialForm, title: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Kind" options={MATERIAL_KINDS.map(k => ({ value: k, label: k }))} value={materialForm.kind} onChange={e => setMaterialForm({ ...materialForm, kind: e.target.value })} />
            <Select label="Subject" options={[{ value: '', label: '—' }, ...store.mySubjects.map(s => ({ value: s, label: s }))]}
              value={materialForm.subject ?? ''} onChange={e => setMaterialForm({ ...materialForm, subject: e.target.value })} />
            <Select label="Class (optional)" options={[{ value: '', label: 'All classes' }, ...store.myClassNames.map(c => ({ value: c, label: c }))]}
              value={materialForm.class_name ?? ''} onChange={e => setMaterialForm({ ...materialForm, class_name: e.target.value })} />
          </div>
          <Input label="File name" value={materialForm.file_name ?? ''} onChange={e => setMaterialForm({ ...materialForm, file_name: e.target.value })} placeholder="notes.pdf" />
          <Input label="File URL" value={materialForm.file_url ?? ''} onChange={e => setMaterialForm({ ...materialForm, file_url: e.target.value })} placeholder="https://…" />
          <Textarea label="Description" value={materialForm.description ?? ''} onChange={e => setMaterialForm({ ...materialForm, description: e.target.value })} />
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={!!materialForm.shared_with_students} onChange={e => setMaterialForm({ ...materialForm, shared_with_students: e.target.checked })} />
              Share with students
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={!!materialForm.shared_with_staff} onChange={e => setMaterialForm({ ...materialForm, shared_with_staff: e.target.checked })} />
              Share with staff
            </label>
          </div>
          <Button variant="primary" className="w-full" onClick={submitMaterial}>Save material</Button>
        </div>
      </Dialog>
    </div>
  );
};