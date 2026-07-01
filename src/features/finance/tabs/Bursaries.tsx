import React, { useMemo, useState } from 'react';
import {
  Award,
  Plus,
  FileText,
  Upload,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import { useFinanceStore } from '../store';
import { money, shortDate } from '@/utils/cn';
import type { Bursary, BursaryStatus } from '../types';


const STATUS_ORDER: BursaryStatus[] = [
  'Applied',
  'Under Review',
  'Approved',
  'Disbursed',
  'Suspended',
  'Rejected',
  'Closed',
];

const statusBadge = (s: BursaryStatus) => {
  const map: Record<BursaryStatus, any> = {
    Applied: 'muted',
    'Under Review': 'info',
    Approved: 'primary',
    Disbursed: 'success',
    Suspended: 'warning',
    Rejected: 'danger',
    Closed: 'muted',
  };
  return map[s];
};

export const Bursaries: React.FC<{ store: ReturnType<typeof useFinanceStore> }> = ({ store }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | BursaryStatus>('all');
  const [selected, setSelected] = useState<Bursary | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState<{ b: Bursary; kind: 'Approved' | 'Rejected' } | null>(null);
  const [awardAmount, setAwardAmount] = useState('');
  const [noteText, setNoteText] = useState('');
  const [docName, setDocName] = useState('');

  const filtered = useMemo(() => {
    return store.bursaries.filter((b) => (statusFilter === 'all' ? true : b.status === statusFilter));
  }, [store.bursaries, statusFilter]);

  const funnel = useMemo(() => {
    const counts: Partial<Record<BursaryStatus, number>> = {};
    store.bursaries.forEach((b) => (counts[b.status] = (counts[b.status] || 0) + 1));
    return counts;
  }, [store.bursaries]);

  const totalAwarded = store.bursaries.reduce((a, b) => a + b.awarded_amount, 0);
  const totalDisbursed = store.bursaries
    .filter((b) => b.status === 'Disbursed')
    .reduce((a, b) => a + b.awarded_amount, 0);
  const atRisk = store.bursaries.filter((b) => b.progress_flag === 'At Risk').length;

  // form for new
  const [formStudent, setFormStudent] = useState(store.students[0]?.id || '');
  const [formProgram, setFormProgram] = useState('CDF Nairobi');
  const [formSponsor, setFormSponsor] = useState(store.sponsors[0]?.id || '');
  const [formRequested, setFormRequested] = useState('20000');
  const [formTerm, setFormTerm] = useState('Term 1');
  const [formNotes, setFormNotes] = useState('');

  const handleCreate = async () => {
    await store.createBursary({
      program: formProgram,
      sponsor_id: formSponsor || undefined,
      student_id: formStudent,
      requested_amount: Number(formRequested),
      eligibility_notes: formNotes,
      academic_year: '2025/2026',
      term: formTerm,
    });
    setNewOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase text-slate-400">Applications</p>
          <p className="text-xl font-black text-[#08428C] mt-1">{store.bursaries.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {funnel['Under Review'] || 0} under review · {funnel.Applied || 0} new
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase text-slate-400">Total Awarded</p>
          <p className="text-xl font-black text-[#08428C] mt-1">{money(totalAwarded)}</p>
        </Card>
        <Card className="p-4 border-emerald-500/30">
          <p className="text-[11px] font-bold uppercase text-slate-400">Disbursed</p>
          <p className="text-xl font-black text-emerald-600 mt-1">{money(totalDisbursed)}</p>
        </Card>
        <Card className="p-4 border-amber-500/30">
          <p className="text-[11px] font-bold uppercase text-slate-400">Learners At Risk</p>
          <p className="text-xl font-black text-amber-600 mt-1">{atRisk}</p>
          <p className="text-[11px] text-amber-600 mt-1">Flagged for review</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          {(['all', ...STATUS_ORDER] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-[#08428C] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => setNewOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> New Application
        </Button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((b) => {
          const st = store.studentById(b.student_id);
          return (
            <Card
              key={b.id}
              className="p-5 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelected(b)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#08428C]" />
                    <span className="font-mono text-xs font-bold text-[#08428C]">{b.reference}</span>
                    <Badge variant={statusBadge(b.status)}>{b.status}</Badge>
                    {b.progress_flag === 'At Risk' && (
                      <Badge variant="danger">
                        <AlertTriangle className="w-3 h-3" /> At Risk
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-bold mt-1">{b.program}</h4>
                  <p className="text-xs text-slate-500">
                    {st?.first_name} {st?.last_name} · {st?.class_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Awarded</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">
                    {money(b.awarded_amount)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    of {money(b.requested_amount)} requested
                  </p>
                </div>
              </div>
              {b.claim_schedule && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Remittance schedule</div>
                  <div className="flex flex-wrap gap-1.5">
                    {b.claim_schedule.installments.map((inst, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-md font-mono ${
                          inst.remitted
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {shortDate(inst.due)} · {money(inst.amount)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="lg:col-span-2">
            <Card className="p-6">
              <EmptyState icon={<Award className="w-6 h-6" />} title="No bursaries in this bucket" />
            </Card>
          </div>
        )}
      </div>

      {/* Detail panel */}
      <Dialog
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.reference} — ${selected.program}` : ''}
        maxWidth="2xl"
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase">Learner</p>
                <p className="font-semibold mt-0.5">
                  {store.studentById(selected.student_id)?.first_name}{' '}
                  {store.studentById(selected.student_id)?.last_name}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Sponsor</p>
                <p className="font-semibold mt-0.5">
                  {store.sponsors.find((s) => s.id === selected.sponsor_id)?.name || '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Awarded</p>
                <p className="font-mono font-bold text-[#08428C] mt-0.5">
                  {money(selected.awarded_amount)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Status</p>
                <div className="mt-0.5">
                  <Badge variant={statusBadge(selected.status)}>{selected.status}</Badge>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
              <p className="font-bold text-[10px] uppercase text-slate-400 mb-1">
                Eligibility & Notes
              </p>
              <p>{selected.eligibility_notes || '—'}</p>
            </div>

            {/* Documents */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Supporting Documents
                </h5>
                <div className="flex items-center gap-1">
                  <input
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="filename.pdf"
                    className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (docName) {
                        store.addBursaryDoc(selected.id, docName, Math.floor(50 + Math.random() * 500));
                        setDocName('');
                        setSelected({
                          ...selected,
                          documents: [
                            ...selected.documents,
                            {
                              id: `d-${Date.now()}`,
                              name: docName,
                              uploaded_at: new Date().toISOString().slice(0, 10),
                              size_kb: 200,
                            },
                          ],
                        });
                      }
                    }}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload
                  </Button>
                </div>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                {selected.documents.length === 0 && (
                  <li className="p-3 text-slate-400">No documents attached yet.</li>
                )}
                {selected.documents.map((d) => (
                  <li key={d.id} className="p-2.5 flex items-center justify-between">
                    <span className="font-mono">{d.name}</span>
                    <span className="text-slate-400">
                      {shortDate(d.uploaded_at)} · {d.size_kb} KB
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Communications */}
            <div>
              <h5 className="text-sm font-bold flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4" /> Communications
              </h5>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selected.communications.map((c) => (
                  <div
                    key={c.id}
                    className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{c.author}</span>
                      <span className="text-slate-400">{shortDate(c.date)}</span>
                    </div>
                    <p className="mt-1">{c.message}</p>
                  </div>
                ))}
                {selected.communications.length === 0 && (
                  <p className="text-xs text-slate-400">No messages yet.</p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note or communication log…"
                  className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (noteText) {
                      store.addBursaryNote(selected.id, 'You (Bursar)', noteText);
                      setSelected({
                        ...selected,
                        communications: [
                          ...selected.communications,
                          {
                            id: `c-${Date.now()}`,
                            date: new Date().toISOString().slice(0, 10),
                            author: 'You (Bursar)',
                            message: noteText,
                          },
                        ],
                      });
                      setNoteText('');
                    }
                  }}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              {(selected.status === 'Applied' || selected.status === 'Under Review') && (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setDecisionOpen({ b: selected, kind: 'Approved' })}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDecisionOpen({ b: selected, kind: 'Rejected' })}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </Button>
                </>
              )}
              {selected.status === 'Approved' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    store.disburseBursary(selected.id);
                    setSelected({ ...selected, status: 'Disbursed' });
                  }}
                >
                  Disburse to Student Account
                </Button>
              )}
              {selected.status === 'Disbursed' && (
                <Badge variant="success">
                  <CheckCircle2 className="w-3 h-3" /> Credit posted to learner account
                </Badge>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Decision modal */}
      <Dialog
        isOpen={Boolean(decisionOpen)}
        onClose={() => setDecisionOpen(null)}
        title={decisionOpen ? `${decisionOpen.kind} Bursary` : ''}
        maxWidth="sm"
      >
        {decisionOpen && (
          <div className="space-y-4">
            {decisionOpen.kind === 'Approved' && (
              <Input
                label="Award Amount"
                type="number"
                value={awardAmount || String(decisionOpen.b.requested_amount)}
                onChange={(e) => setAwardAmount(e.target.value)}
              />
            )}
            <Button
              variant={decisionOpen.kind === 'Approved' ? 'success' : 'danger'}
              className="w-full"
              onClick={() => {
                store.decideBursary(
                  decisionOpen.b.id,
                  decisionOpen.kind,
                  'Bursary Committee',
                  decisionOpen.kind === 'Approved'
                    ? Number(awardAmount) || decisionOpen.b.requested_amount
                    : undefined
                );
                setSelected(null);
                setDecisionOpen(null);
                setAwardAmount('');
              }}
            >
              Confirm {decisionOpen.kind}
            </Button>
          </div>
        )}
      </Dialog>

      {/* New Application */}
      <Dialog
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        title="New Bursary Application"
        maxWidth="lg"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Student"
              value={formStudent}
              onChange={(e) => setFormStudent(e.target.value)}
              options={store.students.map((s) => ({
                value: s.id,
                label: `${s.first_name} ${s.last_name}`,
              }))}
            />
            <Select
              label="Sponsor"
              value={formSponsor}
              onChange={(e) => setFormSponsor(e.target.value)}
              options={store.sponsors.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>
          <Input
            label="Program / Fund"
            value={formProgram}
            onChange={(e) => setFormProgram(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Requested Amount"
              type="number"
              value={formRequested}
              onChange={(e) => setFormRequested(e.target.value)}
            />
            <Select
              label="Term"
              value={formTerm}
              onChange={(e) => setFormTerm(e.target.value)}
              options={store.terms.map((t: string) => ({ value: t, label: t }))}
            />
          </div>
          <Textarea
            label="Eligibility Notes"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder="Family background, need level, previous support…"
          />
          <Button variant="primary" className="w-full" onClick={handleCreate}>
            Submit Application
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
