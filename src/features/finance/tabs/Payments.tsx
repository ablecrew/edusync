import React, { useMemo, useState } from 'react';
import { CheckCircle2, Download, Search, Wallet, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { useFinanceStore, downloadCSV } from '../store';
import { money, shortDate } from '@/utils/cn';
import { PAYMENT_METHODS } from '../constants';

export const Payments: React.FC<{ store: ReturnType<typeof useFinanceStore> }> = ({ store }) => {
  const [q, setQ] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [showUnreconciledOnly, setShowUnreconciledOnly] = useState(false);
  const [reconcileTarget, setReconcileTarget] = useState<{ id: string; receipt_no: string } | null>(null);
  const [bankRef, setBankRef] = useState('');

  const filtered = useMemo(() => {
    return store.payments.filter((p) => {
      const st = store.studentById(p.student_id);
      if (showUnreconciledOnly && p.reconciled) return false;
      if (methodFilter !== 'all' && p.method !== methodFilter) return false;
      if (q) {
        const s = q.toLowerCase();
        const name = `${st?.first_name} ${st?.last_name}`.toLowerCase();
        if (
          !p.receipt_no.toLowerCase().includes(s) &&
          !p.reference.toLowerCase().includes(s) &&
          !name.includes(s)
        )
          return false;
      }
      return true;
    });
  }, [store.payments, q, methodFilter, showUnreconciledOnly, store]);

  const summary = useMemo(() => {
    const total = store.payments.reduce((a, p) => a + p.amount, 0);
    const rec = store.payments.filter((p) => p.reconciled).reduce((a, p) => a + p.amount, 0);
    const unrec = total - rec;
    const byMethod: Record<string, number> = {};
    store.payments.forEach((p) => (byMethod[p.method] = (byMethod[p.method] || 0) + p.amount));
    return { total, rec, unrec, byMethod };
  }, [store.payments]);

  const exportCSV = () =>
    downloadCSV(
      'payments.csv',
      filtered.map((p) => {
        const inv = store.invoiceById(p.invoice_id);
        const st = store.studentById(p.student_id);
        return {
          receipt: p.receipt_no,
          date: p.date,
          student: `${st?.first_name} ${st?.last_name}`,
          invoice: inv?.invoice_number,
          amount: p.amount,
          method: p.method,
          reference: p.reference,
          reconciled: p.reconciled ? 'Yes' : 'No',
          bank_ref: p.bank_statement_ref || '',
        };
      })
    );

  return (
    <div className="space-y-6">
      {/* summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase text-slate-400">Total Receipts</p>
          <p className="text-xl font-black text-[#08428C] mt-1">{money(summary.total)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{store.payments.length} transactions</p>
        </Card>
        <Card className="p-4 border-emerald-500/30">
          <p className="text-[11px] font-bold uppercase text-slate-400">Reconciled</p>
          <p className="text-xl font-black text-emerald-600 mt-1">{money(summary.rec)}</p>
          <p className="text-[11px] text-emerald-600 mt-1">
            {Math.round((summary.rec / (summary.total || 1)) * 100)}% of total
          </p>
        </Card>
        <Card className="p-4 border-amber-500/30">
          <p className="text-[11px] font-bold uppercase text-slate-400">Awaiting Reconciliation</p>
          <p className="text-xl font-black text-amber-600 mt-1">{money(summary.unrec)}</p>
          <p className="text-[11px] text-amber-600 mt-1">
            {store.payments.filter((p) => !p.reconciled).length} pending
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase text-slate-400">Top Channel</p>
          {(() => {
            const top = Object.entries(summary.byMethod).sort((a, b) => b[1] - a[1])[0];
            return top ? (
              <>
                <p className="text-xl font-black text-[#08428C] mt-1">{top[0]}</p>
                <p className="text-[11px] text-slate-500 mt-1">{money(top[1])} received</p>
              </>
            ) : null;
          })()}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search receipt #, txn ref, or student…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#08428C]/30"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="all">All methods</option>
            {PAYMENT_METHODS.map((m: string) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showUnreconciledOnly}
              onChange={(e) => setShowUnreconciledOnly(e.target.checked)}
            />
            Unreconciled only
          </label>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-5">Receipt</th>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Student / Invoice</th>
                <th className="py-3 px-5">Method / Reference</th>
                <th className="py-3 px-5 text-right">Amount</th>
                <th className="py-3 px-5">Reconciliation</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((p) => {
                const inv = store.invoiceById(p.invoice_id);
                const st = store.studentById(p.student_id);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-5 font-mono font-bold text-[#08428C]">{p.receipt_no}</td>
                    <td className="py-3 px-5 text-xs">{shortDate(p.date)}</td>
                    <td className="py-3 px-5">
                      <div className="font-semibold">
                        {st?.first_name} {st?.last_name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{inv?.invoice_number}</div>
                    </td>
                    <td className="py-3 px-5">
                      <Badge variant="info">{p.method}</Badge>
                      <div className="text-[11px] text-slate-500 font-mono mt-1">{p.reference}</div>
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-bold text-emerald-600">
                      {money(p.amount)}
                    </td>
                    <td className="py-3 px-5">
                      {p.reconciled ? (
                        <div>
                          <Badge variant="success">
                            <CheckCircle2 className="w-3 h-3" /> Matched
                          </Badge>
                          <div className="text-[11px] text-slate-500 mt-1 font-mono">
                            {p.bank_statement_ref}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right">
                      {!p.reconciled && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReconcileTarget({ id: p.id, receipt_no: p.receipt_no })}
                        >
                          <Link2 className="w-3.5 h-3.5" /> Reconcile
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState icon={<Wallet className="w-6 h-6" />} title="No payments match your filters" />
          )}
        </div>
      </Card>

      <Dialog
        isOpen={Boolean(reconcileTarget)}
        onClose={() => setReconcileTarget(null)}
        title="Bank Reconciliation"
        description="Match this receipt to a line on your bank / MPESA statement."
        maxWidth="sm"
      >
        {reconcileTarget && (
          <div className="space-y-4">
            <div className="text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-mono">
              Receipt: <b>{reconcileTarget.receipt_no}</b>
            </div>
            <Input
              label="Bank / MPESA Statement Ref"
              value={bankRef}
              onChange={(e) => setBankRef(e.target.value)}
              placeholder="e.g. EQBK-STMT-02-04-LN178"
            />
            <Button
              variant="primary"
              className="w-full"
              onClick={async () => {
                await store.reconcilePayment(reconcileTarget.id, bankRef || 'MANUAL-MATCH');
                setReconcileTarget(null);
                setBankRef('');
              }}
            >
              Confirm Reconciliation
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
};
