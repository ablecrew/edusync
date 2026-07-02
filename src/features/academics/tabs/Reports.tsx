import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Printer, Play, Users, CheckCircle2, XCircle, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useAcademicsStore } from '../store';
import * as api from '../api';
import { CBC_LEVEL_COLORS } from '../constants';
import type { ReportLine } from '../types';

export const Reports: React.FC<{ store: ReturnType<typeof useAcademicsStore> }> = ({ store }) => {
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selReport, setSelReport] = useState<string | null>(null);
  const [lines, setLines] = useState<ReportLine[]>([]);
  const [bulkClass, setBulkClass] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!selReport) { setLines([]); return; }
    api.fetchReportLines(selReport).then(setLines).catch(() => setLines([]));
  }, [selReport]);

  const filtered = useMemo(() => store.reports.filter(r => {
    const s = store.studentById(r.student_id);
    if (classFilter !== 'ALL' && s?.class_name !== classFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    return true;
  }), [store.reports, classFilter, statusFilter, store]);

  const currentReport = store.reports.find(r => r.id === selReport);
  const currentStudent = currentReport ? store.studentById(currentReport.student_id) : null;
  const uniqueClasses = Array.from(new Set(store.students.map((s: any) => s.class_name).filter(Boolean)));

  const buildForClass = async () => {
    if (!bulkClass) return;
    setBusy(true);
    const learners = store.students.filter((s: any) => s.class_name === bulkClass);
    for (const s of learners) {
      await store.buildReport.mutateAsync({
        studentId: s.id,
        yearId: store.currentYear?.id ?? null,
        termId: store.currentTerm?.id ?? null,
        actor: 'Admin',
      });
    }
    await store.rankClass.mutateAsync({ className: bulkClass, yearId: store.currentYear?.id ?? null, termId: store.currentTerm?.id ?? null });
    setBusy(false); setBulkClass('');
    alert(`Built ${learners.length} report card(s) for ${bulkClass}.`);
  };

  const publish = async () => {
    if (!selReport) return;
    await store.updateReport.mutateAsync({ id: selReport, patch: { status: 'Published', published_at: new Date().toISOString() } });
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 flex flex-wrap items-center gap-2">
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All classes</option>
          {uniqueClasses.map(c => <option key={c as string}>{c as string}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All statuses</option>
          {['Draft','Ready-for-Review','Approved','Published','Archived'].map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <select value={bulkClass} onChange={e => setBulkClass(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <option value="">Select class to build…</option>
            {uniqueClasses.map(c => <option key={c as string}>{c as string}</option>)}
          </select>
          <Button size="sm" variant="primary" onClick={buildForClass} isLoading={busy} disabled={!bulkClass}>
            <Play className="w-3.5 h-3.5" /> Build reports for class
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4" /> Reports ({filtered.length})</h4>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={FileText} title="No reports yet" description="Build report cards for a whole class using the button above." />
          ) : (
            <ul className="space-y-1 max-h-[70vh] overflow-y-auto">
              {filtered.map(r => {
                const s = store.studentById(r.student_id);
                return (
                  <li key={r.id}>
                    <button onClick={() => setSelReport(r.id)}
                      className={`w-full text-left p-3 rounded-xl ${selReport === r.id ? 'bg-[#08428C] text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{s?.first_name} {s?.last_name}</p>
                        {r.position_class && <span className={`text-[11px] font-mono ${selReport === r.id ? 'text-blue-100' : 'text-slate-500'}`}>#{r.position_class}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-[11px] ${selReport === r.id ? 'text-blue-100' : 'text-slate-500'}`}>{s?.class_name ?? '—'}</span>
                        <Badge variant={r.status === 'Published' ? 'success' : r.status === 'Approved' ? 'primary' : 'muted'}>{r.status}</Badge>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-6 lg:col-span-2">
          {!currentReport || !currentStudent ? (
            <EmptyState icon={FileText} title="Select a report" description="Choose a report card from the left to preview and publish." />
          ) : (
            <>
              {/* Header */}
              <div className="border-b-2 border-slate-900 dark:border-white pb-4 mb-4 flex items-center justify-between">
                <div>
                  <p className="font-black text-lg uppercase">EduSync Academy — CBC Report Card</p>
                  <p className="text-xs text-slate-500">{store.currentYear?.name ?? '—'} · {store.currentTerm?.name ?? '—'}</p>
                </div>
                <div className="flex gap-2 print:hidden">
                  {currentReport.status !== 'Published' && (
                    <Button size="sm" variant="success" onClick={publish}><Send className="w-3.5 h-3.5" /> Publish</Button>
                  )}
                  <Button size="sm" variant="primary" onClick={() => window.print()}><Printer className="w-3.5 h-3.5" /> Print</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                <div><p className="text-slate-400 font-bold uppercase text-[10px]">Student</p><p className="font-semibold mt-0.5">{currentStudent.first_name} {currentStudent.last_name}</p></div>
                <div><p className="text-slate-400 font-bold uppercase text-[10px]">Adm no.</p><p className="font-mono font-semibold mt-0.5">{currentStudent.admission_number}</p></div>
                <div><p className="text-slate-400 font-bold uppercase text-[10px]">Class</p><p className="font-semibold mt-0.5">{currentStudent.class_name}</p></div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Overall</p>
                  <p className="font-black mt-0.5" style={{ color: CBC_LEVEL_COLORS[currentReport.overall_cbc_level ?? ''] ?? '#08428C' }}>
                    {currentReport.overall_score ?? '—'}% · {currentReport.overall_cbc_level ?? '—'}
                  </p>
                </div>
              </div>

              <table className="w-full text-sm mt-4">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs uppercase font-bold">
                    <th className="py-2 px-3 text-left">Subject</th>
                    <th className="py-2 px-3 text-right">Score</th>
                    <th className="py-2 px-3">Grade</th>
                    <th className="py-2 px-3">CBC Level</th>
                    <th className="py-2 px-3 text-left">Teacher remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {lines.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-400 text-xs">No subject lines yet.</td></tr>
                  ) : lines.map(l => (
                    <tr key={l.id}>
                      <td className="py-2 px-3 font-bold">{l.subject_name}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{l.moderated_score ?? l.raw_score ?? '—'}</td>
                      <td className="py-2 px-3 text-center">{l.grade ?? '—'}</td>
                      <td className="py-2 px-3 text-center">
                        {l.cbc_level && <Badge variant="success">{l.cbc_level}</Badge>}
                      </td>
                      <td className="py-2 px-3 text-xs italic text-slate-600 dark:text-slate-300">{l.teacher_remark ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
                <RemarkBox
                  label="Class teacher remarks"
                  value={currentReport.class_teacher_remark ?? ''}
                  onSave={v => store.updateReport.mutate({ id: currentReport.id, patch: { class_teacher_remark: v } })}
                />
                <RemarkBox
                  label="Principal remarks"
                  value={currentReport.principal_remark ?? ''}
                  onSave={v => store.updateReport.mutate({ id: currentReport.id, patch: { principal_remark: v } })}
                />
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

const RemarkBox: React.FC<{ label: string; value: string; onSave: (v: string) => void }> = ({ label, value, onSave }) => {
  const [v, setV] = useState(value);
  return (
    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-2">
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <Textarea value={v} onChange={e => setV(e.target.value)} />
      <Button size="sm" variant="primary" onClick={() => onSave(v)}>Save remark</Button>
    </div>
  );
};