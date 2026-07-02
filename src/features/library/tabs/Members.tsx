import React, { useMemo, useState } from 'react';
import { Users, Plus, Printer, Edit, PauseCircle, PlayCircle, Search, Settings2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useLibraryStore } from '../store';
import { MEMBER_TYPES } from '../constants';
import type { LibraryMember } from '../types';

export const Members: React.FC<{ store: ReturnType<typeof useLibraryStore> }> = ({ store }) => {
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [enrollStudentOpen, setEnrollStudentOpen] = useState(false);
  const [selStudentId, setSelStudentId] = useState('');
  const [form, setForm] = useState<any>({ member_type: 'Staff' });
  const [rulesOpen, setRulesOpen] = useState(false);
  const [cardMember, setCardMember] = useState<LibraryMember | null>(null);
  const [editing, setEditing] = useState<LibraryMember | null>(null);

  const filtered = useMemo(() => store.members.filter(m => {
    if (typeFilter !== 'ALL' && m.member_type !== typeFilter) return false;
    if (q && !`${m.full_name} ${m.card_no} ${m.email ?? ''} ${m.phone ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [store.members, q, typeFilter]);

  const nonMemberStudents = store.students.filter((s: any) =>
    !store.members.some(m => m.student_id === s.id)
  );

  return (
    <div className="space-y-6">
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, card, phone or email…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All types</option>{MEMBER_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={() => setRulesOpen(true)}><Settings2 className="w-3.5 h-3.5" /> Rules</Button>
        <Button variant="outline" size="sm" onClick={() => setEnrollStudentOpen(true)}><Plus className="w-3.5 h-3.5" /> Enroll student</Button>
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}><Plus className="w-3.5 h-3.5" /> New member</Button>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Users}
          title={store.members.length === 0 ? 'No library members yet' : 'No members match your filters'}
          description="Enroll a student, teacher or external member to start issuing books."
          actionLabel={store.members.length === 0 ? 'Add first member' : undefined}
          onAction={store.members.length === 0 ? () => setAddOpen(true) : undefined} />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 px-5 text-left">Member</th>
                <th className="py-3 px-5 text-left">Type</th>
                <th className="py-3 px-5 text-left">Contact</th>
                <th className="py-3 px-5 text-center">Active loans</th>
                <th className="py-3 px-5 text-right">Pending fines</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(m => {
                const activeCount = store.activeLoansForMember(m.id).length;
                const finesTotal = store.finesForMember(m.id).reduce((a, f) => a + Number(f.amount), 0);
                return (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-5">
                      <p className="font-semibold">{m.full_name}</p>
                      <p className="text-[11px] font-mono text-slate-500">{m.card_no}</p>
                    </td>
                    <td className="py-3 px-5"><Badge variant="muted">{m.member_type}</Badge></td>
                    <td className="py-3 px-5 text-xs">
                      {m.email && <p>{m.email}</p>}
                      {m.phone && <p className="font-mono text-slate-500">{m.phone}</p>}
                    </td>
                    <td className="py-3 px-5 text-center">{activeCount}</td>
                    <td className={`py-3 px-5 text-right font-mono ${finesTotal > 0 ? 'text-rose-600 font-bold' : ''}`}>
                      {finesTotal > 0 ? `KES ${finesTotal.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-5">
                      <Badge variant={m.active ? 'success' : 'danger'}>{m.active ? 'Active' : 'Suspended'}</Badge>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setCardMember(m)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc]" title="Card"><Printer className="w-4 h-4" /></button>
                        <button onClick={() => { setEditing(m); setForm({ ...m }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => store.updateMember.mutate({ id: m.id, patch: { active: !m.active } })} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900" title={m.active ? 'Suspend' : 'Reactivate'}>
                          {m.active ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
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

      {/* Add / edit member */}
      <Dialog isOpen={addOpen || !!editing} onClose={() => { setAddOpen(false); setEditing(null); }} title={editing ? 'Edit member' : 'New library member'} maxWidth="lg">
        <div className="space-y-3">
          <Select label="Type" options={MEMBER_TYPES.map(t => ({ value: t, label: t }))} value={form.member_type ?? 'Staff'} onChange={e => setForm({ ...form, member_type: e.target.value })} />
          <Input label="Full name" required value={form.full_name ?? ''} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Email" type="email" value={form.email ?? ''} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone ?? ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Button variant="primary" className="w-full"
            onClick={async () => {
              if (editing) { await store.updateMember.mutateAsync({ id: editing.id, patch: form }); setEditing(null); }
              else { await store.createMember.mutateAsync(form); setAddOpen(false); }
              setForm({ member_type: 'Staff' });
            }}>
            {editing ? 'Save' : 'Create member'}
          </Button>
        </div>
      </Dialog>

      {/* Enroll student */}
      <Dialog isOpen={enrollStudentOpen} onClose={() => setEnrollStudentOpen(false)} title="Enroll existing student" maxWidth="lg">
        <div className="space-y-3">
          <Select label="Student"
            options={[{ value: '', label: '— Select student —' },
              ...nonMemberStudents.map((s: any) => ({ value: s.id, label: `${s.first_name} ${s.last_name} · ${s.admission_number}` }))]}
            value={selStudentId} onChange={e => setSelStudentId(e.target.value)} />
          {nonMemberStudents.length === 0 && <p className="text-xs text-slate-500">Every student is already a library member.</p>}
          <Button variant="primary" className="w-full" disabled={!selStudentId}
            onClick={async () => { await store.enrollStudent.mutateAsync(selStudentId); setEnrollStudentOpen(false); setSelStudentId(''); }}>
            Enroll
          </Button>
        </div>
      </Dialog>

      {/* Rules */}
      <Dialog isOpen={rulesOpen} onClose={() => setRulesOpen(false)} title="Borrowing rules by member type" maxWidth="2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
              <th className="py-2 px-3 text-left">Type</th>
              <th className="py-2 px-3 text-right">Max active</th>
              <th className="py-2 px-3 text-right">Loan days</th>
              <th className="py-2 px-3 text-right">Renew allowed</th>
              <th className="py-2 px-3 text-right">Fine/day</th>
              <th className="py-2 px-3 text-right">Grace</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {store.rules.map(r => (
              <tr key={r.id}>
                <td className="py-2 px-3"><Badge variant="primary">{r.member_type}</Badge></td>
                {(['max_active', 'loan_days', 'renew_allowed', 'fine_per_day', 'grace_days'] as const).map(f => (
                  <td key={f} className="py-2 px-3 text-right">
                    <input type="number" defaultValue={r[f] as any}
                      onBlur={e => {
                        const v = Number(e.target.value);
                        if (v !== r[f]) store.updateRule.mutate({ id: r.id, patch: { [f]: v } });
                      }}
                      className="w-20 px-2 py-1 text-right font-mono text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-slate-400 mt-2">Click a cell, type a new value, then click away to save.</p>
      </Dialog>

      {/* Library card */}
      {cardMember && (
        <Dialog isOpen onClose={() => setCardMember(null)} title="Library card" maxWidth="sm">
          <div className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-[#08428C] to-[#041e42] text-white p-6 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
                <span className="font-black">🎓 EduSync Library</span>
                <span className="bg-white/20 px-2 py-0.5 rounded font-bold">{cardMember.member_type} Card</span>
              </div>
              <div>
                <p className="text-lg font-black">{cardMember.full_name}</p>
                <p className="text-xs font-mono text-blue-200 mt-1">{cardMember.card_no}</p>
                {cardMember.email && <p className="text-xs">{cardMember.email}</p>}
                {cardMember.phone && <p className="text-xs font-mono">{cardMember.phone}</p>}
              </div>
              <div className="pt-2 flex justify-between text-[10px] font-mono border-t border-white/10">
                <span>Issued: {cardMember.created_at?.slice(0, 10) ?? '—'}</span>
                <span>Status: {cardMember.active ? 'Active' : 'Suspended'}</span>
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print card</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};