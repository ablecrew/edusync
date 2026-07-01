import React, { useMemo, useState } from 'react';
import { FolderOpen, Upload, Trash2, Search, Download, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useStudentsStore, downloadCSV } from '../store';
import { DOC_TYPES } from '../constants';

export const Documents: React.FC<{ store: ReturnType<typeof useStudentsStore> }> = ({ store }) => {
  const [q, setQ] = useState('');
  const [studentFilter, setStudentFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [docType, setDocType] = useState<string>(DOC_TYPES[0]);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    return store.documents.filter(d => {
      const student = store.studentById(d.student_id);
      const term = q.toLowerCase();
      if (studentFilter !== 'ALL' && d.student_id !== studentFilter) return false;
      if (typeFilter !== 'ALL' && d.doc_type !== typeFilter) return false;
      if (term && !`${d.file_name} ${student?.first_name} ${student?.last_name}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [store.documents, store, q, studentFilter, typeFilter]);

  const missingCritical = useMemo(() => {
    return store.students.map(s => {
      const docs = store.docsForStudent(s.id);
      const missing = ['Birth Certificate', 'Photo'].filter(t => !docs.some(d => d.doc_type === t));
      return { student: s, missing };
    }).filter(x => x.missing.length > 0);
  }, [store.students, store.documents, store]);

  const upload = async () => {
    if (!selectedStudentId || !fileName) return;
    await store.addDocument.mutateAsync({
      student_id: selectedStudentId,
      doc_type: docType,
      file_name: fileName,
      file_url: fileUrl || undefined,
      size_kb: Math.floor(100 + Math.random() * 500),
      uploaded_by: 'You',
      notes: notes || undefined,
    });
    setUploadOpen(false);
    setFileName(''); setFileUrl(''); setNotes('');
  };

  const exportCSV = () => downloadCSV('student-documents.csv', filtered.map(d => {
    const s = store.studentById(d.student_id);
    return {
      admission: s?.admission_number,
      student: `${s?.first_name} ${s?.last_name}`,
      doc_type: d.doc_type,
      file_name: d.file_name,
      uploaded_by: d.uploaded_by,
      uploaded_at: d.uploaded_at,
      size_kb: d.size_kb,
    };
  }));

  return (
    <div className="space-y-6">
      {/* Missing critical documents alert */}
      {missingCritical.length > 0 && (
        <Card className="p-4 border-amber-300 bg-amber-50 dark:bg-amber-900/10">
          <p className="text-xs font-bold text-amber-800 uppercase mb-2">
            {missingCritical.length} learner(s) missing critical documents
          </p>
          <ul className="text-xs space-y-1">
            {missingCritical.slice(0, 5).map(x => (
              <li key={x.student.id} className="flex items-center justify-between">
                <span><b>{x.student.first_name} {x.student.last_name}</b> — missing: {x.missing.join(', ')}</span>
                <Button size="sm" variant="outline" onClick={() => { setSelectedStudentId(x.student.id); setUploadOpen(true); }}>
                  <Upload className="w-3.5 h-3.5" /> Upload
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search file name or student…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#08428C]/30"
          />
        </div>
        <select value={studentFilter} onChange={e => setStudentFilter(e.target.value)} className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All students</option>
          {store.students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All doc types</option>
          {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-3.5 h-3.5" /> Export</Button>
        <Button variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="w-3.5 h-3.5" /> Upload
        </Button>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={store.documents.length === 0 ? 'No documents uploaded' : 'No documents match your filters'}
          description="Birth certificates, previous report cards, IDs, photos, and medical records will appear here."
          actionLabel={store.documents.length === 0 ? 'Upload First Document' : undefined}
          onAction={store.documents.length === 0 ? () => setUploadOpen(true) : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 px-5 text-left">Student</th>
                <th className="py-3 px-5 text-left">Type</th>
                <th className="py-3 px-5 text-left">File</th>
                <th className="py-3 px-5 text-left">Uploaded</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(d => {
                const s = store.studentById(d.student_id);
                return (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-5">
                      <p className="font-semibold">{s ? `${s.first_name} ${s.last_name}` : 'Unknown'}</p>
                      <p className="text-[11px] font-mono text-slate-500">{s?.admission_number}</p>
                    </td>
                    <td className="py-3 px-5"><Badge variant="info">{d.doc_type}</Badge></td>
                    <td className="py-3 px-5">
                      <p className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" /> {d.file_name}</p>
                      {d.size_kb && <p className="text-[11px] text-slate-400">{d.size_kb} KB</p>}
                    </td>
                    <td className="py-3 px-5 text-xs">
                      <p>{d.uploaded_at?.slice(0, 10)}</p>
                      {d.uploaded_by && <p className="text-slate-400">by {d.uploaded_by}</p>}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {d.file_url && (
                          <a href={d.file_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc]" title="Open">
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => { if (confirm('Delete document?')) store.removeDocument.mutate(d.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog isOpen={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Document" maxWidth="lg">
        <div className="space-y-3">
          <Select label="Student" options={[{ value: '', label: '—' }, ...store.students.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name} (${s.admission_number})` }))]} value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} />
          <Select label="Document Type" options={DOC_TYPES.map(t => ({ value: t, label: t }))} value={docType} onChange={e => setDocType(e.target.value)} />
          <Input label="File Name" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="birth-cert.pdf" />
          <Input label="File URL (optional)" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://storage.supabase.co/…" hint="If your app uses Supabase Storage, paste the public URL here." />
          <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
          <Button variant="primary" className="w-full" onClick={upload} isLoading={store.addDocument.isPending} disabled={!selectedStudentId || !fileName}>
            Save Document
          </Button>
        </div>
      </Dialog>
    </div>
  );
};