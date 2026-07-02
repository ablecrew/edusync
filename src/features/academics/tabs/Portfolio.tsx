import React, { useMemo, useState } from 'react';
import { FolderKanban, Plus, Trash2, Eye, EyeOff, FileText, ImageIcon, Video, LinkIcon, PenLine, Music } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useAcademicsStore } from '../store';
import { EVIDENCE_KINDS } from '../constants';

const KIND_ICON: Record<string, any> = { Document: FileText, Image: ImageIcon, Video, Audio: Music, Link: LinkIcon, Reflection: PenLine };

export const Portfolio: React.FC<{ store: ReturnType<typeof useAcademicsStore> }> = ({ store }) => {
  const [studentId, setStudentId] = useState<string>('');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<any>({ kind: 'Document', visible_to_parent: true });

  const items = useMemo(() => store.portfolio.filter(i => !studentId || i.student_id === studentId), [store.portfolio, studentId]);

  const submit = async () => {
    if (!studentId || !form.title) return;
    await store.addPortfolio.mutateAsync({
      student_id: studentId, subject_id: form.subject_id, competency_id: form.competency_id,
      title: form.title, reflection: form.reflection, kind: form.kind,
      file_url: form.file_url, visible_to_parent: !!form.visible_to_parent,
    });
    setAddOpen(false); setForm({ kind: 'Document', visible_to_parent: true });
  };

  return (
    <div className="space-y-6">
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <Select label="Learner" options={[{ value: '', label: 'All learners' }, ...store.students.map((s: any) => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))]}
          value={studentId} onChange={e => setStudentId(e.target.value)} />
        <div className="ml-auto pt-4">
          <Button size="sm" variant="primary" onClick={() => setAddOpen(true)} disabled={!studentId}>
            <Plus className="w-3.5 h-3.5" /> Add evidence
          </Button>
        </div>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={studentId ? 'No portfolio evidence yet' : 'Choose a learner'}
          description="Upload documents, images, videos, reflections, or project links tied to competencies."
          actionLabel={studentId ? 'Add first item' : undefined}
          onAction={studentId ? () => setAddOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(i => {
            const Icon = KIND_ICON[i.kind] ?? FileText;
            const learner = store.studentById(i.student_id);
            const subject = i.subject_id ? store.subjectById(i.subject_id) : null;
            return (
              <Card key={i.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-[#e8f1fc] text-[#08428C] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm line-clamp-1">{i.title}</p>
                      <p className="text-[11px] text-slate-500">{learner?.first_name} {learner?.last_name}{subject && ` · ${subject.name}`}</p>
                    </div>
                  </div>
                  <Badge variant={i.visible_to_parent ? 'success' : 'muted'} title={i.visible_to_parent ? 'Visible on parent portal' : 'Hidden from parents'}>
                    {i.visible_to_parent ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Badge>
                </div>
                {i.reflection && <p className="text-xs text-slate-500 line-clamp-3">{i.reflection}</p>}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400">{i.captured_on}</span>
                  <div className="flex items-center gap-1">
                    {i.file_url && (
                      <a href={i.file_url} target="_blank" rel="noreferrer" className="p-1 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc]" title="Open">
                        <LinkIcon className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={() => { if (confirm('Delete evidence?')) store.removePortfolio.mutate(i.id); }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add portfolio evidence" maxWidth="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Kind" options={EVIDENCE_KINDS.map(k => ({ value: k, label: k }))} value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })} />
            <Select label="Subject (optional)" options={[{ value: '', label: '—' }, ...store.subjects.map(s => ({ value: s.id, label: s.name }))]}
              value={form.subject_id ?? ''} onChange={e => setForm({ ...form, subject_id: e.target.value })} />
          </div>
          <Input label="Title" value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input label="File URL" value={form.file_url ?? ''} onChange={e => setForm({ ...form, file_url: e.target.value })} placeholder="https://…" />
          <Textarea label="Reflection / description" value={form.reflection ?? ''} onChange={e => setForm({ ...form, reflection: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.visible_to_parent} onChange={e => setForm({ ...form, visible_to_parent: e.target.checked })} /> Visible on parent portal
          </label>
          <Button variant="primary" className="w-full" onClick={submit}>Save evidence</Button>
        </div>
      </Dialog>
    </div>
  );
};