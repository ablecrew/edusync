import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, RefreshCw, RotateCcw, AlertCircle, Search, Bookmark, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useLibraryStore } from '../store';
import { CONDITIONS } from '../constants';

type SubTab = 'active' | 'overdue' | 'returned' | 'reservations';

export const Circulation: React.FC<{ store: ReturnType<typeof useLibraryStore> }> = ({ store }) => {
  const [sub, setSub] = useState<SubTab>('active');
  const [q, setQ] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [scanMember, setScanMember] = useState('');
  const [returnDialog, setReturnDialog] = useState<any>(null);
  const [returnCondition, setReturnCondition] = useState('Good');
  const [lostDialog, setLostDialog] = useState<any>(null);
  const [lostCost, setLostCost] = useState('');

  const enriched = useMemo(() => store.loans.map(l => {
    const copy = store.copyById(l.copy_id);
    const resource = copy ? store.resourceById(copy.resource_id) : undefined;
    const member = store.memberById(l.member_id);
    const overdue = l.status === 'Overdue' || (l.status === 'Active' && new Date(l.due_date) < new Date());
    return { ...l, copy, resource, member, isOverdue: overdue };
  }), [store.loans, store.copies, store.resources, store.members]);

  const filtered = enriched.filter(l => {
    if (sub === 'active') { if (!(l.status === 'Active' && !l.isOverdue)) return false; }
    if (sub === 'overdue') { if (!l.isOverdue) return false; }
    if (sub === 'returned') { if (l.status !== 'Returned') return false; }
    if (q) {
      const t = q.toLowerCase();
      return `${l.resource?.title ?? ''} ${l.member?.full_name ?? ''} ${l.member?.card_no ?? ''} ${l.copy?.copy_code ?? ''}`.toLowerCase().includes(t);
    }
    return true;
  });

  const doQuickIssue = async () => {
    const copy = store.copies.find(c => c.copy_code.toLowerCase() === scanCode.toLowerCase());
    const member = store.members.find(m => m.card_no.toLowerCase() === scanMember.toLowerCase()) ||
                   store.memberById(scanMember);
    if (!copy) return alert('Copy code not found');
    if (!member) return alert('Member not found');
    if (copy.status !== 'Available') return alert(`Copy is currently ${copy.status}`);
    const rule = store.ruleFor(member.member_type);
    const active = store.activeLoansForMember(member.id).length;
    if (rule && active >= rule.max_active) return alert(`Member has reached max active loans (${rule.max_active})`);
    await store.issueLoan.mutateAsync({ copy_id: copy.id, member_id: member.id, days: rule?.loan_days ?? 14, issued_by: 'Librarian' });
    setScanCode(''); setScanMember('');
  };

  return (
    <div className="space-y-6">
      {/* Quick issue by barcode */}
      <Card className="p-5">
        <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" /> Quick issue (barcode / card scan)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <Input label="Copy code" value={scanCode} onChange={e => setScanCode(e.target.value.replace(/^LIB:/, ''))}
            onKeyDown={e => { if (e.key === 'Enter' && scanCode && scanMember) doQuickIssue(); }}
            placeholder="Scan or type BC-XXXXXXXX" autoFocus />
          <Input label="Member card no" value={scanMember} onChange={e => setScanMember(e.target.value.replace(/^MEM:/, ''))}
            onKeyDown={e => { if (e.key === 'Enter' && scanCode && scanMember) doQuickIssue(); }}
            placeholder="LMS-XXXXXXXX" />
          <Button variant="primary" onClick={doQuickIssue} isLoading={store.issueLoan.isPending}>Issue</Button>
        </div>
      </Card>

      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {([
            { id: 'active',       label: 'Active',       count: enriched.filter(l => l.status === 'Active' && !l.isOverdue).length },
            { id: 'overdue',      label: 'Overdue',      count: enriched.filter(l => l.isOverdue).length },
            { id: 'returned',     label: 'Returned',     count: enriched.filter(l => l.status === 'Returned').length },
            { id: 'reservations', label: 'Reservations', count: store.reservations.filter(r => r.status === 'Pending' || r.status === 'Ready').length },
          ] as { id: SubTab; label: string; count: number }[]).map(t => (
            <button key={t.id} onClick={() => setSub(t.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                sub === t.id ? 'bg-white dark:bg-slate-900 text-[#08428C] shadow-sm' : 'text-slate-600'
              }`}>
              {t.label}<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
              className="pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          </div>
          {sub === 'overdue' && (
            <Button size="sm" variant="outline" onClick={() => store.scanOverdue.mutate()} isLoading={store.scanOverdue.isPending}>
              <RefreshCw className="w-3.5 h-3.5" /> Scan
            </Button>
          )}
        </div>
      </div>

      {sub !== 'reservations' ? (
        filtered.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title={`No ${sub} loans`} description="Once loans are issued, they'll appear here." />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Title / Copy</th>
                  <th className="py-3 px-5 text-left">Member</th>
                  <th className="py-3 px-5 text-left">Issued</th>
                  <th className="py-3 px-5 text-left">Due</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-5">
                      <p className="font-semibold">{l.resource?.title ?? '—'}</p>
                      <p className="text-[11px] font-mono text-slate-500">{l.copy?.copy_code}</p>
                    </td>
                    <td className="py-3 px-5">
                      <p>{l.member?.full_name ?? '—'}</p>
                      <p className="text-[11px] font-mono text-slate-500">{l.member?.card_no}</p>
                    </td>
                    <td className="py-3 px-5 text-xs">{l.issue_date}</td>
                    <td className="py-3 px-5 text-xs">{l.due_date} {l.renewed_count > 0 && <Badge variant="muted">Renewed×{l.renewed_count}</Badge>}</td>
                    <td className="py-3 px-5">
                      {l.status === 'Returned'
                        ? <Badge variant="success">Returned {l.return_date}</Badge>
                        : l.isOverdue
                          ? <Badge variant="danger">Overdue</Badge>
                          : <Badge variant="primary">Active</Badge>}
                    </td>
                    <td className="py-3 px-5 text-right">
                      {l.status !== 'Returned' && l.status !== 'Lost' && (
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="secondary" onClick={() => { setReturnDialog(l); setReturnCondition(l.condition_out ?? 'Good'); }}>
                            <RotateCcw className="w-3.5 h-3.5" /> Return
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => store.renewLoan.mutate({ loanId: l.id })}>
                            <RefreshCw className="w-3.5 h-3.5" /> Renew
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setLostDialog(l); setLostCost(''); }}>
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Lost
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      ) : (
        store.reservations.filter(r => r.status === 'Pending' || r.status === 'Ready').length === 0 ? (
          <EmptyState icon={Bookmark} title="No active reservations" description="Members can reserve books from the catalog." />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Title</th>
                  <th className="py-3 px-5 text-left">Member</th>
                  <th className="py-3 px-5 text-left">Placed</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {store.reservations.filter(r => r.status === 'Pending' || r.status === 'Ready').map(r => {
                  const res = store.resourceById(r.resource_id);
                  const mem = store.memberById(r.member_id);
                  return (
                    <tr key={r.id}>
                      <td className="py-3 px-5 font-semibold">{res?.title ?? '—'}</td>
                      <td className="py-3 px-5">{mem?.full_name} <span className="text-[11px] font-mono text-slate-500">· {mem?.card_no}</span></td>
                      <td className="py-3 px-5 text-xs">{new Date(r.reserved_at).toLocaleDateString()}</td>
                      <td className="py-3 px-5"><Badge variant={r.status === 'Ready' ? 'success' : 'warning'}>{r.status}</Badge></td>
                      <td className="py-3 px-5 text-right">
                        <Button size="sm" variant="ghost" onClick={() => store.cancelReserve.mutate(r.id)}>
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )
      )}

      {/* Return dialog */}
      {returnDialog && (
        <Dialog isOpen onClose={() => setReturnDialog(null)} title="Return book" maxWidth="sm">
          <div className="space-y-3">
            <p className="text-xs">Returning <b>{returnDialog.resource?.title}</b> from <b>{returnDialog.member?.full_name}</b></p>
            <Select label="Condition on return" value={returnCondition} onChange={e => setReturnCondition(e.target.value)}
              options={CONDITIONS.map(c => ({ value: c, label: c }))} />
            <Button variant="primary" className="w-full"
              onClick={async () => { await store.returnLoan.mutateAsync({ loanId: returnDialog.id, opts: { condition_in: returnCondition, returned_to: 'Librarian' } }); setReturnDialog(null); }}>
              Confirm return
            </Button>
          </div>
        </Dialog>
      )}

      {/* Lost dialog */}
      {lostDialog && (
        <Dialog isOpen onClose={() => setLostDialog(null)} title="Mark as lost" maxWidth="sm">
          <div className="space-y-3">
            <p className="text-xs">Marking <b>{lostDialog.resource?.title}</b> as lost. A replacement fine will be created for the member.</p>
            <Input label="Replacement cost (KES)" type="number" value={lostCost} onChange={e => setLostCost(e.target.value)} />
            <Button variant="danger" className="w-full"
              onClick={async () => { await store.markLost.mutateAsync({ loanId: lostDialog.id, cost: Number(lostCost) || 0 }); setLostDialog(null); }}>
              Confirm lost
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};