import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  UserPlus, FileClock, CheckCircle2, XCircle, ArrowRight,
  Calendar, Award, MessageSquare, Search, Plus, KeyRound, Copy, Printer,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useStudentsStore } from '../store';
import type { AdmissionApplication, AdmissionInquiry } from '../types';
import { APPLICATION_STATUSES, GENDERS, INQUIRY_SOURCES, INQUIRY_STATUSES } from '../constants';

const inquirySchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  guardian_name: z.string().min(2),
  guardian_phone: z.string().min(5),
  guardian_email: z.string().email().or(z.literal('')),
  interested_class: z.string().optional(),
  desired_start_date: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});
type InquiryForm = z.infer<typeof inquirySchema>;

const applicationSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  gender: z.enum(['Male', 'Female', 'Other']),
  date_of_birth: z.string().min(1),
  applying_for_class: z.string().min(1),
  guardian_name: z.string().min(2),
  guardian_phone: z.string().min(5),
  guardian_email: z.string().email().or(z.literal('')),
  address: z.string().optional(),
  previous_school: z.string().optional(),
});
type ApplicationForm = z.infer<typeof applicationSchema>;

type IssuedCredential = { account_type: 'student' | 'guardian'; username: string; password: string };

export const Admissions: React.FC<{ store: ReturnType<typeof useStudentsStore> }> = ({ store }) => {
  const s = store as any;
  const [sub, setSub] = useState<'inquiries' | 'applications' | 'merit'>('inquiries');
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [appOpen, setAppOpen] = useState(false);
  const [convertFrom, setConvertFrom] = useState<AdmissionInquiry | null>(null);
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [decisionKind, setDecisionKind] = useState<'Approved' | 'Rejected' | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [enrollClassId, setEnrollClassId] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [entranceScore, setEntranceScore] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Credential handover state (shown once after enrollment)
  const [credentials, setCredentials] = useState<IssuedCredential[] | null>(null);
  const [enrolledStudentName, setEnrolledStudentName] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const inquiryForm = useForm<InquiryForm>({ resolver: zodResolver(inquirySchema) });
  const appForm = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { gender: 'Female' },
  });

  const filteredInquiries = useMemo(() => store.inquiries.filter(i => {
    const term = q.toLowerCase();
    if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
    if (!term) return true;
    return `${i.first_name} ${i.last_name} ${i.guardian_name} ${i.guardian_phone}`.toLowerCase().includes(term);
  }), [store.inquiries, q, statusFilter]);

  const filteredApplications = useMemo(() => store.applications.filter(a => {
    const term = q.toLowerCase();
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (!term) return true;
    return `${a.first_name} ${a.last_name} ${a.guardian_name} ${a.application_no}`.toLowerCase().includes(term);
  }), [store.applications, q, statusFilter]);

  const meritList = useMemo(() => [...store.applications]
    .filter(a => a.entrance_score != null && ['Merit List', 'Under Review', 'Interview Scheduled', 'Approved'].includes(a.status))
    .sort((a, b) => (b.entrance_score ?? 0) - (a.entrance_score ?? 0))
    .map((a, i) => ({ ...a, rank: i + 1 })),
    [store.applications]);

  const submitInquiry = async (data: InquiryForm) => {
    await store.createInquiry.mutateAsync(data);
    setInquiryOpen(false);
    inquiryForm.reset();
  };

  const submitApplication = async (data: ApplicationForm) => {
    await store.createApplication.mutateAsync({
      ...data,
      inquiry_id: convertFrom?.id,
    });
    if (convertFrom) {
      await store.updateInquiryStatus.mutateAsync({ id: convertFrom.id, status: 'Converted' });
    }
    setAppOpen(false);
    setConvertFrom(null);
    appForm.reset({ gender: 'Female' });
  };

  const runDecision = async () => {
    if (!selectedApp || !decisionKind) return;
    await store.decideApplication.mutateAsync({
      id: selectedApp.id,
      status: decisionKind,
      decision_by: 'Admissions Committee',
      reason: decisionReason,
    });
    setDecisionKind(null);
    setDecisionReason('');
    setSelectedApp(null);
  };

  const runEnroll = async () => {
    if (!selectedApp || !enrollClassId) return;
    const student: any = await store.enrollApplication.mutateAsync({
      appId: selectedApp.id,
      classId: enrollClassId,
    });

    // The DB trigger already provisioned accounts; re-call the RPC to fetch the
    // clear-text passwords ONE TIME so we can hand them over to the guardian.
    // If provisionPortal isn't exposed on the store, fail gracefully.
    try {
      if (s.provisionPortal && student?.id) {
        const creds: IssuedCredential[] = await s.provisionPortal.mutateAsync(student.id);
        if (creds && creds.length > 0) {
          setCredentials(creds);
          setEnrolledStudentName(`${student.first_name} ${student.last_name}`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch portal credentials:', err);
    }

    setSelectedApp(null);
    setEnrollClassId('');
  };

  const saveInterview = async () => {
    if (!selectedApp) return;
    await store.updateApplication.mutateAsync({
      id: selectedApp.id,
      patch: {
        interview_date: interviewDate || undefined,
        entrance_score: entranceScore ? Number(entranceScore) : undefined,
        status: interviewDate ? 'Interview Scheduled' : selectedApp.status,
      },
    });
    setInterviewDate('');
    setEntranceScore('');
    setSelectedApp(null);
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // ignore
    }
  };

  const printCredentials = () => {
    if (!credentials) return;
    const win = window.open('', '_blank', 'width=600,height=700');
    if (!win) return;
    const rows = credentials.map(c => `
      <div style="border:1px solid #ccc;border-radius:12px;padding:16px;margin-bottom:12px;font-family:monospace;">
        <div style="text-transform:uppercase;font-size:11px;color:#666;font-weight:bold;letter-spacing:1px">
          ${c.account_type} account
        </div>
        <div style="margin-top:8px;font-size:14px"><b>Username:</b> ${c.username}</div>
        <div style="font-size:14px"><b>Password:</b> ${c.password}</div>
      </div>`).join('');
    win.document.write(`
      <html>
        <head><title>Portal Credentials — ${enrolledStudentName}</title></head>
        <body style="font-family:system-ui,sans-serif;padding:24px;max-width:520px;margin:0 auto">
          <h2 style="margin:0 0 4px 0">EduSync Family Portal</h2>
          <p style="color:#555;margin:0 0 16px 0">Credentials for <b>${enrolledStudentName}</b></p>
          <p style="background:#fef3c7;padding:10px 12px;border-radius:8px;font-size:12px;color:#92400e">
            ⚠️ Keep this document secure. The guardian will be asked to change the password on first login.
          </p>
          ${rows}
          <p style="color:#666;font-size:11px;margin-top:20px">
            Portal URL: <b>${window.location.origin}/portal</b>
          </p>
        </body>
      </html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const statusOptions = ['ALL', ...(sub === 'inquiries' ? INQUIRY_STATUSES : APPLICATION_STATUSES)];

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'inquiries', label: 'Inquiries', count: store.inquiries.length },
            { id: 'applications', label: 'Applications', count: store.applications.length },
            { id: 'merit', label: 'Merit List', count: meritList.length },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setSub(t.id as any); setStatusFilter('ALL'); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                sub === t.id ? 'bg-white dark:bg-slate-900 text-[#08428C] shadow-sm' : 'text-slate-600'
              }`}
            >
              {t.label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {sub === 'inquiries' && (
            <Button variant="primary" size="sm" onClick={() => setInquiryOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> New Inquiry
            </Button>
          )}
          {sub === 'applications' && (
            <Button variant="primary" size="sm" onClick={() => setAppOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> New Application
            </Button>
          )}
        </div>
      </div>

      {/* Search + filter */}
      {sub !== 'merit' && (
        <Card className="p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={`Search ${sub}…`}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#08428C]/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            {statusOptions.map(o => <option key={o} value={o}>{o === 'ALL' ? 'All statuses' : o}</option>)}
          </select>
        </Card>
      )}

      {/* Inquiries */}
      {sub === 'inquiries' && (
        filteredInquiries.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title={store.inquiries.length === 0 ? 'No inquiries yet' : 'No inquiries match your filters'}
            description="Prospective families' interest capture goes here."
            actionLabel={store.inquiries.length === 0 ? 'Log First Inquiry' : undefined}
            onAction={store.inquiries.length === 0 ? () => setInquiryOpen(true) : undefined}
          />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Applicant</th>
                  <th className="py-3 px-5 text-left">Guardian</th>
                  <th className="py-3 px-5 text-left">Interested In</th>
                  <th className="py-3 px-5 text-left">Source</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInquiries.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-5 font-semibold">{i.first_name} {i.last_name}</td>
                    <td className="py-3 px-5">
                      <p>{i.guardian_name}</p>
                      <p className="text-[11px] font-mono text-slate-500">{i.guardian_phone}</p>
                    </td>
                    <td className="py-3 px-5 text-xs">{i.interested_class || '—'}</td>
                    <td className="py-3 px-5 text-xs">
                      <Badge variant="muted">{i.source || 'Unknown'}</Badge>
                    </td>
                    <td className="py-3 px-5">
                      <select
                        value={i.status}
                        onChange={e => store.updateInquiryStatus.mutate({ id: i.id, status: e.target.value as any })}
                        className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        {INQUIRY_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-5 text-right">
                      {i.status !== 'Converted' && (
                        <Button size="sm" variant="outline" onClick={() => {
                          setConvertFrom(i);
                          appForm.reset({
                            first_name: i.first_name,
                            last_name: i.last_name,
                            guardian_name: i.guardian_name,
                            guardian_phone: i.guardian_phone,
                            guardian_email: i.guardian_email ?? '',
                            applying_for_class: i.interested_class ?? '',
                            gender: 'Female',
                          } as any);
                          setAppOpen(true);
                        }}>
                          <ArrowRight className="w-3.5 h-3.5" /> Convert
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      )}

      {/* Applications */}
      {sub === 'applications' && (
        filteredApplications.length === 0 ? (
          <EmptyState
            icon={FileClock}
            title={store.applications.length === 0 ? 'No applications yet' : 'No applications match your filters'}
            description="Formal admission applications appear here for review, scoring, interview, and approval."
            actionLabel={store.applications.length === 0 ? 'Start Application' : undefined}
            onAction={store.applications.length === 0 ? () => setAppOpen(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredApplications.map(a => (
              <Card key={a.id} className="p-4 hover:shadow-md cursor-pointer" onClick={() => setSelectedApp(a)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{a.first_name} {a.last_name}</p>
                    <p className="text-[11px] font-mono text-[#08428C] mt-0.5">{a.application_no}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Applying for <b>{a.applying_for_class}</b> · {a.guardian_name}
                    </p>
                  </div>
                  <Badge variant={
                    a.status === 'Approved' || a.status === 'Enrolled' ? 'success' :
                    a.status === 'Rejected' ? 'danger' :
                    a.status === 'Under Review' || a.status === 'Interview Scheduled' ? 'warning' :
                    'muted'
                  }>{a.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
                  {a.entrance_score != null && (
                    <span className="flex items-center gap-1"><Award className="w-3 h-3 text-amber-500" /> Score {a.entrance_score}</span>
                  )}
                  {a.interview_date && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-sky-500" /> Interview {a.interview_date}</span>
                  )}
                  {a.merit_rank && (
                    <span className="flex items-center gap-1"><Award className="w-3 h-3 text-emerald-500" /> Rank #{a.merit_rank}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Merit list */}
      {sub === 'merit' && (
        meritList.length === 0 ? (
          <EmptyState icon={Award} title="No merit ranking yet" description="Applicants with entrance scores will be ranked here automatically." />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Rank</th>
                  <th className="py-3 px-5 text-left">Applicant</th>
                  <th className="py-3 px-5 text-left">Applying For</th>
                  <th className="py-3 px-5 text-right">Score</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {meritList.map(a => (
                  <tr key={a.id}>
                    <td className="py-3 px-5">
                      <span className={`inline-flex w-8 h-8 rounded-lg items-center justify-center font-black text-sm ${
                        a.rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>#{a.rank}</span>
                    </td>
                    <td className="py-3 px-5 font-semibold">{a.first_name} {a.last_name}</td>
                    <td className="py-3 px-5 text-xs">{a.applying_for_class}</td>
                    <td className="py-3 px-5 text-right font-mono font-bold">{a.entrance_score}</td>
                    <td className="py-3 px-5"><Badge variant="muted">{a.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      )}

      {/* New inquiry dialog */}
      <Dialog isOpen={inquiryOpen} onClose={() => setInquiryOpen(false)} title="Log New Admission Inquiry" maxWidth="lg">
        <form onSubmit={inquiryForm.handleSubmit(submitInquiry)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="First Name" {...inquiryForm.register('first_name')} error={inquiryForm.formState.errors.first_name?.message} />
            <Input label="Last Name" {...inquiryForm.register('last_name')} error={inquiryForm.formState.errors.last_name?.message} />
            <Input label="Guardian Name" {...inquiryForm.register('guardian_name')} error={inquiryForm.formState.errors.guardian_name?.message} />
            <Input label="Guardian Phone" {...inquiryForm.register('guardian_phone')} error={inquiryForm.formState.errors.guardian_phone?.message} />
            <Input label="Guardian Email" type="email" {...inquiryForm.register('guardian_email')} />
            <Select label="Interested Class" options={[{ value: '', label: '—' }, ...store.classes.map(c => ({ value: c.name, label: c.name }))]} {...inquiryForm.register('interested_class')} />
            <Input label="Desired Start Date" type="date" {...inquiryForm.register('desired_start_date')} />
            <Select label="Source" options={[{ value: '', label: '—' }, ...INQUIRY_SOURCES.map(s => ({ value: s, label: s }))]} {...inquiryForm.register('source')} />
          </div>
          <Textarea label="Notes" {...inquiryForm.register('notes')} placeholder="Anything else worth remembering about this lead…" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setInquiryOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={store.createInquiry.isPending}>Save Inquiry</Button>
          </div>
        </form>
      </Dialog>

      {/* New application dialog */}
      <Dialog isOpen={appOpen} onClose={() => { setAppOpen(false); setConvertFrom(null); }} title={convertFrom ? `Convert Inquiry to Application` : 'New Admission Application'} maxWidth="2xl">
        <form onSubmit={appForm.handleSubmit(submitApplication)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="First Name" {...appForm.register('first_name')} error={appForm.formState.errors.first_name?.message} />
            <Input label="Last Name" {...appForm.register('last_name')} error={appForm.formState.errors.last_name?.message} />
            <Select label="Gender" options={GENDERS.map(g => ({ value: g, label: g }))} {...appForm.register('gender')} />
            <Input label="Date of Birth" type="date" {...appForm.register('date_of_birth')} error={appForm.formState.errors.date_of_birth?.message} />
            <Select label="Applying For" options={store.classes.map(c => ({ value: c.name, label: c.name }))} {...appForm.register('applying_for_class')} />
            <Input label="Previous School" {...appForm.register('previous_school')} />
            <Input label="Guardian Name" {...appForm.register('guardian_name')} error={appForm.formState.errors.guardian_name?.message} />
            <Input label="Guardian Phone" {...appForm.register('guardian_phone')} error={appForm.formState.errors.guardian_phone?.message} />
            <Input label="Guardian Email" type="email" {...appForm.register('guardian_email')} />
            <Input label="Home Address" {...appForm.register('address')} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { setAppOpen(false); setConvertFrom(null); }}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={store.createApplication.isPending}>Submit Application</Button>
          </div>
        </form>
      </Dialog>

      {/* Application detail + workflow */}
      {selectedApp && (
        <Dialog isOpen onClose={() => setSelectedApp(null)} title={`${selectedApp.application_no} — ${selectedApp.first_name} ${selectedApp.last_name}`} maxWidth="2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><p className="text-slate-400 font-bold uppercase text-[10px]">Class</p><p className="font-semibold mt-0.5">{selectedApp.applying_for_class}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[10px]">Status</p><Badge variant="primary">{selectedApp.status}</Badge></div>
              <div><p className="text-slate-400 font-bold uppercase text-[10px]">Score</p><p className="font-mono font-bold mt-0.5">{selectedApp.entrance_score ?? '—'}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[10px]">Interview</p><p className="mt-0.5">{selectedApp.interview_date ?? '—'}</p></div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
              <p className="font-bold uppercase text-[10px] text-slate-400 mb-1">Guardian & Contact</p>
              <p>{selectedApp.guardian_name} · <span className="font-mono">{selectedApp.guardian_phone}</span></p>
              <p className="text-slate-500">{selectedApp.guardian_email} · {selectedApp.address}</p>
              {selectedApp.previous_school && <p className="mt-1">Previous school: <b>{selectedApp.previous_school}</b></p>}
            </div>

            {/* Interview + score */}
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Schedule Interview & Score</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <Input label="Interview Date" type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} />
                <Input label="Entrance Score" type="number" value={entranceScore} onChange={e => setEntranceScore(e.target.value)} />
                <Button variant="outline" onClick={saveInterview}>Save</Button>
              </div>
            </div>

            {/* Decision */}
            {!['Enrolled', 'Rejected'].includes(selectedApp.status) && (
              <div className="flex flex-wrap gap-2 border-t pt-3 border-slate-100 dark:border-slate-800">
                <Button variant="success" size="sm" onClick={() => setDecisionKind('Approved')}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDecisionKind('Rejected')}>
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
                {selectedApp.status === 'Approved' && (
                  <div className="flex items-center gap-2 ml-auto">
                    <Select
                      options={[{ value: '', label: 'Assign class…' }, ...store.classes.map(c => ({ value: c.id, label: c.name }))]}
                      value={enrollClassId}
                      onChange={e => setEnrollClassId(e.target.value)}
                    />
                    <Button variant="primary" size="sm" onClick={runEnroll} disabled={!enrollClassId} isLoading={store.enrollApplication.isPending}>
                      Enroll & Create Student
                    </Button>
                  </div>
                )}
              </div>
            )}

            {selectedApp.status === 'Enrolled' && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Enrolled — student record created with ID <b className="font-mono">{selectedApp.enrolled_student_id}</b>
              </div>
            )}

            {selectedApp.decision_reason && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                <p className="font-bold uppercase text-[10px] text-slate-400 mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Decision Reason</p>
                <p>{selectedApp.decision_reason}</p>
                {selectedApp.decision_by && <p className="text-slate-400 text-[11px] mt-1">— {selectedApp.decision_by}, {selectedApp.decision_at?.slice(0, 10)}</p>}
              </div>
            )}
          </div>
        </Dialog>
      )}

      {/* Decision confirmation modal */}
      {decisionKind && selectedApp && (
        <Dialog isOpen onClose={() => setDecisionKind(null)} title={`${decisionKind} Application`} maxWidth="sm">
          <div className="space-y-3">
            <Textarea label="Reason / Notes" value={decisionReason} onChange={e => setDecisionReason(e.target.value)} placeholder="Optional explanation shown in the audit trail…" />
            <Button variant={decisionKind === 'Approved' ? 'success' : 'danger'} className="w-full" onClick={runDecision}>
              Confirm {decisionKind}
            </Button>
          </div>
        </Dialog>
      )}

      {/* Portal credentials — shown ONCE after enrollment */}
      {credentials && (
        <Dialog
          isOpen
          onClose={() => setCredentials(null)}
          title="Portal Credentials — hand over to guardian"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
              <KeyRound className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Passwords are shown only once.</p>
                <p className="mt-0.5">Print or copy them now — the guardian must change them on first sign-in at <b>{typeof window !== 'undefined' ? `${window.location.origin}/portal` : '/portal'}</b>.</p>
              </div>
            </div>

            {enrolledStudentName && (
              <div className="text-xs text-slate-500">
                Issued for <b className="text-slate-800 dark:text-slate-200">{enrolledStudentName}</b>
              </div>
            )}

            <div className="space-y-3">
              {credentials.map(c => (
                <div key={c.username} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {c.account_type} account
                    </span>
                    <Badge variant={c.account_type === 'guardian' ? 'primary' : 'info'}>
                      {c.account_type === 'guardian' ? 'Parent / Guardian' : 'Student'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-2 font-mono text-sm">
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-sans uppercase font-bold">Username</p>
                        <p className="truncate">{c.username}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(c.username, `${c.username}-u`)}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                        title="Copy"
                      >
                        {copiedField === `${c.username}-u` ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-sans uppercase font-bold">Temporary Password</p>
                        <p className="truncate">{c.password}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(c.password, `${c.username}-p`)}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                        title="Copy"
                      >
                        {copiedField === `${c.username}-p` ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={printCredentials}>
                <Printer className="w-4 h-4" /> Print handover slip
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setCredentials(null)}>
                Done
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};