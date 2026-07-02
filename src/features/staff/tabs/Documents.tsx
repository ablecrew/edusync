import React, { useMemo, useState } from 'react';
import { FileText, Upload, Trash2, AlertTriangle, Search, Download, Calendar, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useStaffPortalStore, downloadCSV } from '../store';
import { DOC_TYPES } from '../constants';

export const Documents: React.FC<{ store: ReturnType<typeof useStaffPortalStore> }> = ({ store }) => {
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'valid' | 'expiring' | 'expired'>('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<any>({ doc_type: DOC_TYPES[0] });

  const enriched = useMemo(() => store.documents.map(d => {
    let status: 'valid' | 'expiring' | 'expired' | 'no-expiry' = 'no-expiry';
    let daysLeft: number | null = null;
    if (d.expires_on) {
      daysLeft = Math.floor((new Date(d.expires_on).getTime() - Date.now()) / 86400000);
      if (daysLeft < 0) status = 'expired';
      else if (daysLeft <= 60) status = 'expiring';
      else status = 'valid';
    }
    return { ...d, status, daysLeft };
  }), [store.documents]);

  const filtered = enriched.filter(d => {
    if (typeFilter !== 'ALL' && d.doc_type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (q && !`${d.file_name} ${d.doc_type} ${d.notes ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const stats = useMemo(() => ({
    total: enriched.length,
    valid: enriched.filter(d => d.status === 'valid').length,
    expiring: enriched.filter(d => d.status === 'expiring').length,
    expired: enriched.filter(d => d.status === 'expired').length,
  }), [enriched]);

  const upload = async () => {
    if (!form.file_name) return;
    await store.uploadDoc.mutateAsync(form);
    setAddOpen(false); setForm({ doc_type: DOC_TYPES[0] });
  };

  const exportCSV = () => downloadCSV('my-documents.csv', filtered.map(d => ({
    file: d.file_name, type: d.doc_type,
    uploaded: d.uploaded_at?.slice(0, 10),
    expires: d.expires_on ?? '', status: d.status,
    notes: d.notes ?? '',
  })));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-[11px] uppercase text-slate-400 font-bold flex items-center gap-1"><FileText className="w-3 h-3" /> Total</p>
          <p className="text-2xl font-black text-[#08428C] mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase text-slate-400 font-bold">Valid</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.valid}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase text-slate-400 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Expiring</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.expiring}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase text-slate-400 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Expired</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{stats.expired}</p>
        </Card>
      </div>

      {/* Warnings */}
      {stats.expired > 0 && (
        <Card className="p-4 border-rose-300 bg-rose-50">
          <p className="text-xs font-bold text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {stats.expired} document{stats.expired === 1 ? ' has' : 's have'} expired
          </p>
          <p className="text-[11px] text-rose-700 mt-1">Please upload a renewed copy before HR is notified.</p>
        </Card>
      )}
      {stats.expiring > 0 && stats.expired === 0 && (
        <Card className="p-4 border-amber-300 bg-amber-50">
          <p className="text-xs font-bold text-amber-800 flex items-center gap-2">
            <Clock className="w-4 h-4" /> {stats.expiring} document{stats.expiring === 1 ? '' : 's'} expiring within 60 days
          </p>
        </Card>
      )}

      {/* Toolbar */}
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search file name, type, notes…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All types</option>
          {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All statuses</option>
          <option value="valid">Valid</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
        </select>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="w-3.5 h-3.5" /> Export CSV</Button>
        <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}><Upload className="w-3.5 h-3.5" /> Upload</Button>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={store.documents.length === 0 ? 'No documents uploaded' : 'No documents match your filters'}
          description="Keep your certificates, licenses, insurance, and other compliance files up to date here."
          actionLabel={store.documents.length === 0 ? 'Upload first document' : undefined}
          onAction={store.documents.length === 0 ? () => setAddOpen(true) : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 px-5 text-left">File</th>
                <th className="py-3 px-5 text-left">Type</th>
                <th className="py-3 px-5 text-left">Uploaded</th>
                <th className="py-3 px-5 text-left">Expires</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(d => (
                <tr key={d.id} className={d.status === 'expired' ? 'bg-rose-50/40' : d.status === 'expiring' ? 'bg-amber-50/40' : ''}>
                  <td className="py-3 px-5">
                    <p className="font-semibold flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" /> {d.file_name}</p>
                    {d.notes && <p className="text-[11px] text-slate-500 mt-0.5">{d.notes}</p>}
                  </td>
                  <td className="py-3 px-5"><Badge variant="info">{d.doc_type}</Badge></td>
                  <td className="py-3 px-5 text-xs font-mono">{d.uploaded_at?.slice(0, 10)}</td>
                  <td className="py-3 px-5 text-xs font-mono">{d.expires_on ?? '—'}</td>
                  <td className="py-3 px-5">
                    {d.status === 'no-expiry' && <Badge variant="muted">No expiry</Badge>}
                    {d.status === 'valid' && <Badge variant="success">Valid</Badge>}
                    {d.status === 'expiring' && <Badge variant="warning">{d.daysLeft}d left</Badge>}
                    {d.status === 'expired' && <Badge variant="danger">Expired {-(d.daysLeft ?? 0)}d</Badge>}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex justify-end gap-1">
                      {d.file_url && (
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc]"
                          title="Open">
                          <FileText className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => { if (confirm(`Delete "${d.file_name}"?`)) store.removeDoc.mutate(d.id); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Upload dialog */}
      <Dialog isOpen={addOpen} onClose={() => setAddOpen(false)} title="Upload document" maxWidth="lg">
        <div className="space-y-3">
          <Select
            label="Document type"
            options={DOC_TYPES.map(t => ({ value: t, label: t }))}
            value={form.doc_type}
            onChange={e => setForm({ ...form, doc_type: e.target.value })}
          />
          <Input
            label="File name"
            value={form.file_name ?? ''}
            onChange={e => setForm({ ...form, file_name: e.target.value })}
            placeholder="e.g. drivers-license-2026.pdf"
          />
          <Input
            label="File URL"
            value={form.file_url ?? ''}
            onChange={e => setForm({ ...form, file_url: e.target.value })}
            placeholder="https://storage.supabase.co/…"
            hint="If your school uses Supabase Storage, paste the public URL here."
          />
          <Input
            label="Expires on (if applicable)"
            type="date"
            value={form.expires_on ?? ''}
            onChange={e => setForm({ ...form, expires_on: e.target.value })}
          />
          <Textarea
            label="Notes (optional)"
            value={form.notes ?? ''}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />
          <Button variant="primary" className="w-full" onClick={upload} isLoading={store.uploadDoc.isPending}>
            <Upload className="w-4 h-4" /> Upload document
          </Button>
        </div>
      </Dialog>
    </div>
  );
};