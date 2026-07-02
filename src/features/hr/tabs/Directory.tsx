import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Users, Plus, Search, Trash2, Edit, Eye, Printer, Upload, FileText,
  Mail, Phone, IdCard, KeyRound, Copy, CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useHrStore } from '../store';
import * as api from '../api';
import { DOC_TYPES, GENDERS, STAFF_STATUSES, STAFF_TYPES, WORK_CATEGORIES } from '../constants';
import type { Staff } from '../types';

type HrStore = ReturnType<typeof useHrStore>;

const schema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  email: z.string().email().or(z.literal('')),
  phone: z.string().min(5),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  national_id: z.string().optional(),
  address: z.string().optional(),
  emergency_name: z.string().optional(),
  emergency_phone: z.string().optional(),
  staff_type: z.enum(['Teaching', 'Non-Teaching', 'Support', 'Administrative', 'Executive']),
  work_category: z.enum(['Full-time', 'Part-time', 'Contract', 'Intern', 'Consultant']),
  department_id: z.string().optional(),
  designation: z.string().optional(),
  status: z.enum(['Active', 'On Leave', 'Suspended', 'Resigned', 'Terminated', 'Retired']),
  basic_salary: z.number().or(z.string()).transform(v => Number(v) || 0),
  tax_pin: z.string().optional(),
  nssf_no: z.string().optional(),
  nhif_no: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export const Directory: React.FC<{ store: HrStore }> = ({ store }) => {
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [viewing, setViewing] = useState<Staff | null>(null);
  const [idCard, setIdCard] = useState<Staff | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { staff_type: 'Teaching', work_category: 'Full-time', status: 'Active', basic_salary: 0 },
  });

  const filtered = useMemo(() => store.staff.filter(s => {
    if (typeFilter !== 'ALL' && s.staff_type !== typeFilter) return false;
    if (deptFilter !== 'ALL' && s.department_id !== deptFilter) return false;
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (q) {
      const t = q.toLowerCase();
      return `${s.first_name} ${s.last_name} ${s.staff_code} ${s.email ?? ''} ${s.phone ?? ''}`.toLowerCase().includes(t);
    }
    return true;
  }), [store.staff, q, typeFilter, deptFilter, statusFilter]);

  const onSubmit = async (data: FormData) => {
    if (editing) {
      await store.updateStaff.mutateAsync({ id: editing.id, patch: data as any });
      setEditing(null);
    } else {
      await store.createStaff.mutateAsync(data as any);
      setAddOpen(false);
    }
    reset();
  };

  return (
    <div className="space-y-6">
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, code, email, phone…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#08428C]/30" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All types</option>{STAFF_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All departments</option>
          {store.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All statuses</option>{STAFF_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <Button variant="primary" size="sm" onClick={() => { reset(); setAddOpen(true); }}><Plus className="w-3.5 h-3.5" /> New staff</Button>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={store.staff.length === 0 ? 'No staff on the roster yet' : 'No staff match your filters'}
          description="Add your first faculty or non-teaching member."
          actionLabel={store.staff.length === 0 ? 'Add first staff' : undefined}
          onAction={store.staff.length === 0 ? () => setAddOpen(true) : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Staff</th>
                  <th className="py-3 px-5 text-left">Type / Department</th>
                  <th className="py-3 px-5 text-left">Contact</th>
                  <th className="py-3 px-5 text-right">Salary</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {s.photo_url
                          ? <img src={s.photo_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                          : <div className="w-9 h-9 rounded-full bg-[#e8f1fc] text-[#08428C] font-bold flex items-center justify-center text-xs">{s.first_name[0]}{s.last_name[0]}</div>}
                        <div>
                          <p className="font-bold">{s.first_name} {s.last_name}</p>
                          <p className="text-[11px] font-mono text-slate-500">{s.staff_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <Badge variant="muted">{s.staff_type}</Badge>
                      <p className="text-[11px] text-slate-500 mt-1">{store.deptById(s.department_id ?? '')?.name ?? '—'}</p>
                    </td>
                    <td className="py-3 px-5">
                      {s.email && <p className="text-xs flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {s.email}</p>}
                      {s.phone && <p className="text-[11px] font-mono flex items-center gap-1 text-slate-500 mt-0.5"><Phone className="w-3 h-3" /> {s.phone}</p>}
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-bold">KES {Number(s.basic_salary).toLocaleString()}</td>
                    <td className="py-3 px-5">
                      <Badge variant={s.status === 'Active' ? 'success' : s.status === 'On Leave' ? 'warning' : 'danger'}>{s.status}</Badge>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewing(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc]" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => setIdCard(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title="ID Card"><IdCard className="w-4 h-4" /></button>
                        <button onClick={() => { setEditing(s); reset({ ...s } as any); }} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm(`Delete ${s.first_name}? This cannot be undone.`)) store.deleteStaff.mutate(s.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add / Edit dialog */}
      <Dialog isOpen={addOpen || !!editing} onClose={() => { setAddOpen(false); setEditing(null); }} title={editing ? 'Edit staff' : 'Onboard new staff'} maxWidth="2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="First name" {...register('first_name')} error={errors.first_name?.message} />
            <Input label="Last name" {...register('last_name')} error={errors.last_name?.message} />
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
            <Select label="Gender" options={[{ value: '', label: '—' }, ...GENDERS.map(g => ({ value: g, label: g }))]} {...register('gender')} />
            <Input label="Date of birth" type="date" {...register('date_of_birth')} />
            <Input label="National ID / Passport" {...register('national_id')} />
            <Input label="Address" {...register('address')} />
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Staff type" options={STAFF_TYPES.map(t => ({ value: t, label: t }))} {...register('staff_type')} />
            <Select label="Work category" options={WORK_CATEGORIES.map(w => ({ value: w, label: w }))} {...register('work_category')} />
            <Select label="Department" options={[{ value: '', label: '—' }, ...store.departments.map(d => ({ value: d.id, label: d.name }))]} {...register('department_id')} />
            <Input label="Designation" {...register('designation')} placeholder="e.g. Head of Sciences" />
            <Select label="Status" options={STAFF_STATUSES.map(s => ({ value: s, label: s }))} {...register('status')} />
            <Input label="Basic salary (KES)" type="number" {...register('basic_salary', { valueAsNumber: true })} />
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Emergency contact name" {...register('emergency_name')} />
            <Input label="Emergency contact phone" {...register('emergency_phone')} />
            <Input label="KRA PIN" {...register('tax_pin')} />
            <Input label="NSSF no." {...register('nssf_no')} />
            <Input label="NHIF no." {...register('nhif_no')} />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => { setAddOpen(false); setEditing(null); }}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={store.createStaff.isPending || store.updateStaff.isPending}>{editing ? 'Save' : 'Add staff'}</Button>
          </div>
        </form>
      </Dialog>

      {/* Profile dialog */}
      {viewing && <ProfileDialog staff={viewing} onClose={() => setViewing(null)} store={store} />}

      {/* ID card */}
      {idCard && <IdCardDialog staff={idCard} deptName={store.deptById(idCard.department_id ?? '')?.name} onClose={() => setIdCard(null)} />}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Profile dialog (module-level component with portal-credentials UX) */
/* ------------------------------------------------------------------ */

const ProfileDialog: React.FC<{ staff: Staff; onClose: () => void; store: HrStore }> = ({ staff, onClose, store }) => {
  const [docType, setDocType] = useState(DOC_TYPES[0] as string);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [expiresOn, setExpiresOn] = useState('');

  // Portal credentials state
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [existingAccount, setExistingAccount] = useState<any>(null);
  const [accountLoading, setAccountLoading] = useState(true);

  const docs = store.docsForStaff(staff.id);
  const canIssuePortal = staff.staff_type !== 'Teaching' && staff.status === 'Active';

  // Load existing portal account info on open
  useEffect(() => {
    let cancelled = false;
    setAccountLoading(true);
    api.fetchStaffPortalAccount(staff.id)
      .then(r => { if (!cancelled) { setExistingAccount(r); setAccountLoading(false); } })
      .catch(() => { if (!cancelled) setAccountLoading(false); });
    return () => { cancelled = true; };
  }, [staff.id]);

  const upload = async () => {
    if (!fileName) return;
    await store.addDoc.mutateAsync({
      staff_id: staff.id, doc_type: docType, file_name: fileName,
      file_url: fileUrl || undefined, expires_on: expiresOn || undefined, uploaded_by: 'You',
    });
    setFileName(''); setFileUrl(''); setExpiresOn('');
  };

  const provisionCredentials = async () => {
    if (
      existingAccount &&
      !confirm(
        `${staff.first_name} already has a portal account (${existingAccount.username}). ` +
        `This will reset their password and force them to change it on next login. Continue?`
      )
    ) {
      return;
    }
    const creds = await store.issueCredentials.mutateAsync(staff.id);
    if (creds) {
      setCredentials(creds);
      // refresh the existing-account snapshot
      const acc = await api.fetchStaffPortalAccount(staff.id);
      setExistingAccount(acc);
    }
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

  const printSlip = () => {
    if (!credentials) return;
    const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/staff` : '/staff';
    const win = window.open('', '_blank', 'width=520,height=640');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Portal credentials — ${staff.first_name} ${staff.last_name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 32px; max-width: 480px; margin: 0 auto; color: #1e293b; }
            h2 { margin: 0 0 4px 0; color: #08428C; }
            .sub { color: #64748b; margin: 0 0 20px 0; font-size: 13px; }
            .warn { background: #fef3c7; padding: 12px 14px; border-radius: 8px; font-size: 12px; color: #92400e; margin-bottom: 16px; }
            .card { border: 2px solid #08428C; border-radius: 14px; padding: 20px; font-family: 'JetBrains Mono', monospace; }
            .row { margin: 8px 0; font-size: 15px; }
            .label { color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; display: block; margin-bottom: 2px; font-family: system-ui; }
            .footer { color: #64748b; font-size: 11px; margin-top: 20px; text-align: center; }
            .footer b { color: #08428C; }
          </style>
        </head>
        <body>
          <h2>EduSync Staff Portal</h2>
          <p class="sub">Login credentials for <b>${staff.first_name} ${staff.last_name}</b> (${staff.staff_code})</p>
          <div class="warn">⚠️ Keep this document secure. You will be asked to change the password on first login.</div>
          <div class="card">
            <div class="row">
              <span class="label">Username</span>
              <b>${credentials.username}</b>
            </div>
            <div class="row">
              <span class="label">Temporary password</span>
              <b>${credentials.password}</b>
            </div>
          </div>
          <p class="footer">Portal URL: <b>${portalUrl}</b></p>
          <script>setTimeout(() => window.print(), 200);</script>
        </body>
      </html>`);
    win.document.close();
  };

  return (
    <Dialog isOpen onClose={onClose} title={`${staff.first_name} ${staff.last_name}`} maxWidth="2xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          {staff.photo_url
            ? <img src={staff.photo_url} className="w-16 h-16 rounded-full object-cover ring-4 ring-[#08428C]/20" alt="" />
            : <div className="w-16 h-16 rounded-full bg-[#e8f1fc] text-[#08428C] font-bold flex items-center justify-center text-lg">{staff.first_name[0]}{staff.last_name[0]}</div>}
          <div className="flex-1">
            <p className="text-xs font-mono text-[#08428C] font-bold">{staff.staff_code}</p>
            <p className="text-sm font-semibold">{staff.designation ?? '—'} · {store.deptById(staff.department_id ?? '')?.name ?? 'Unassigned'}</p>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant={staff.status === 'Active' ? 'success' : 'warning'}>{staff.status}</Badge>
              <Badge variant="muted">{staff.staff_type}</Badge>
              <Badge variant="info">{staff.work_category}</Badge>
            </div>
          </div>
        </div>

        {/* Portal access section — only for non-teaching active staff */}
        {canIssuePortal ? (
          <div className="p-4 rounded-xl border border-[#08428C]/20 bg-[#e8f1fc]/40 dark:bg-blue-950/20">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-2">
                <KeyRound className="w-4 h-4 text-[#08428C] mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#08428C]">Staff Portal Access</p>
                  {accountLoading ? (
                    <p className="text-[11px] text-slate-500 mt-0.5">Checking account status…</p>
                  ) : existingAccount ? (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 space-y-0.5">
                      <p>Username: <span className="font-mono font-bold">{existingAccount.username}</span></p>
                      <p>
                        Status:{' '}
                        <Badge variant={existingAccount.is_active ? 'success' : 'muted'}>
                          {existingAccount.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                        {existingAccount.must_change_password && (
                          <Badge variant="warning" className="ml-1">Password reset pending</Badge>
                        )}
                      </p>
                      <p>
                        Last login:{' '}
                        {existingAccount.last_login_at
                          ? new Date(existingAccount.last_login_at).toLocaleString()
                          : <span className="italic text-slate-400">Never</span>}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-0.5">No portal account yet.</p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant={existingAccount ? 'outline' : 'primary'}
                onClick={provisionCredentials}
                isLoading={store.issueCredentials?.isPending}
              >
                <KeyRound className="w-3.5 h-3.5" />
                {existingAccount ? ' Reset password' : ' Issue credentials'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5" />
            The staff portal is for active non-teaching staff only.
          </div>
        )}

        {/* Contact / Emergency / Employment / Statutory grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <p className="font-bold uppercase text-[10px] text-slate-400 mb-1">Contact</p>
            {staff.email && <p>{staff.email}</p>}
            <p className="font-mono">{staff.phone}</p>
            {staff.alt_phone && <p className="font-mono text-slate-500">Alt: {staff.alt_phone}</p>}
            {staff.address && <p className="text-slate-500 mt-1">{staff.address}</p>}
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30">
            <p className="font-bold uppercase text-[10px] text-rose-400 mb-1">Emergency contact</p>
            <p>{staff.emergency_name ?? '—'}</p>
            <p className="font-mono">{staff.emergency_phone ?? '—'}</p>
            <p className="text-slate-500">{staff.emergency_relation}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <p className="font-bold uppercase text-[10px] text-slate-400 mb-1">Employment</p>
            <p>Hired: {staff.date_of_hire}</p>
            {staff.contract_end_date && <p>Contract ends: {staff.contract_end_date}</p>}
            <p>Basic: <b>KES {Number(staff.basic_salary).toLocaleString()}</b></p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
            <p className="font-bold uppercase text-[10px] text-emerald-500 mb-1">Statutory</p>
            <p>KRA PIN: <span className="font-mono">{staff.tax_pin ?? '—'}</span></p>
            <p>NSSF: <span className="font-mono">{staff.nssf_no ?? '—'}</span></p>
            <p>NHIF: <span className="font-mono">{staff.nhif_no ?? '—'}</span></p>
          </div>
        </div>

        {/* Qualifications */}
        {(staff.qualifications?.length ?? 0) > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Qualifications</p>
            <ul className="text-xs space-y-1">
              {staff.qualifications.map((q, i) => (
                <li key={i}>· <b>{q.qualification}</b>{q.institution && ` — ${q.institution}`}{q.year && ` (${q.year})`}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Documents */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase text-slate-400">Documents ({docs.length})</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
            <Select label="Type" options={DOC_TYPES.map(t => ({ value: t, label: t }))} value={docType} onChange={e => setDocType(e.target.value)} />
            <Input label="File name" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="contract-2026.pdf" />
            <Input label="URL (optional)" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://…" />
            <Input label="Expires on" type="date" value={expiresOn} onChange={e => setExpiresOn(e.target.value)} />
            <Button variant="outline" onClick={upload}><Upload className="w-3.5 h-3.5" /> Upload</Button>
          </div>
          {docs.length > 0 && (
            <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {docs.map(d => (
                <li key={d.id} className="py-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" /> {d.file_name}</p>
                    <p className="text-[11px] text-slate-500">{d.doc_type} · {d.uploaded_at?.slice(0, 10)}{d.expires_on && ` · expires ${d.expires_on}`}</p>
                  </div>
                  <button onClick={() => store.removeDoc.mutate(d.id)} className="text-rose-500 hover:underline text-[11px]">Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* One-time credentials handover dialog */}
      {credentials && (
        <Dialog
          isOpen
          onClose={() => setCredentials(null)}
          title="Portal credentials — hand over to staff"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
              <KeyRound className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Password is shown only once.</p>
                <p className="mt-0.5">
                  Print or copy now — the staff member must change it on first sign-in at{' '}
                  <b>{typeof window !== 'undefined' ? `${window.location.origin}/staff` : '/staff'}</b>.
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Issued for <b className="text-slate-800 dark:text-slate-200">{staff.first_name} {staff.last_name}</b> ({staff.staff_code})
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Username</p>
                  <p className="font-mono text-sm truncate">{credentials.username}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(credentials.username, 'u')}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  title="Copy"
                >
                  {copiedField === 'u' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Temporary password</p>
                  <p className="font-mono text-sm truncate">{credentials.password}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(credentials.password, 'p')}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  title="Copy"
                >
                  {copiedField === 'p' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={printSlip}>
                <Printer className="w-4 h-4" /> Print handover slip
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setCredentials(null)}>Done</Button>
            </div>
          </div>
        </Dialog>
      )}
    </Dialog>
  );
};

/* ------------------------------------------------------------------ */
/* ID card dialog                                                     */
/* ------------------------------------------------------------------ */

const IdCardDialog: React.FC<{ staff: Staff; deptName?: string; onClose: () => void }> = ({ staff, deptName, onClose }) => (
  <Dialog isOpen onClose={onClose} title="Staff ID Card" maxWidth="sm">
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-[#08428C] to-[#041e42] text-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
          <span className="font-black">🎓 EduSync Academy</span>
          <span className="bg-white/20 px-2 py-0.5 rounded font-bold">Staff ID</span>
        </div>
        <div className="flex items-center gap-4">
          {staff.photo_url
            ? <img src={staff.photo_url} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/40" alt="" />
            : <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-black">{staff.first_name[0]}{staff.last_name[0]}</div>}
          <div>
            <p className="text-lg font-black">{staff.first_name} {staff.last_name}</p>
            <p className="text-xs font-mono text-blue-200">{staff.staff_code}</p>
            <p className="text-xs">{staff.designation ?? staff.staff_type}</p>
            <p className="text-[11px] text-blue-100">{deptName ?? '—'}</p>
          </div>
        </div>
        <div className="pt-2 flex justify-between text-[10px] font-mono border-t border-white/10">
          <span>Since: {staff.date_of_hire}</span>
          <span>Valid Thru: 2027</span>
        </div>
      </div>
      <Button variant="primary" className="w-full" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print</Button>
    </div>
  </Dialog>
);