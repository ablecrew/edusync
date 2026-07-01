import React, { useMemo, useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Search,
  Filter,
  Download,
  Layers,
  MessageSquare,
} from 'lucide-react';
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
import type { Invoice } from '../types';


export const FeeManagement: React.FC<{
  store: ReturnType<typeof useFinanceStore>;
  onOpenPayment: (inv: Invoice) => void;
  onOpenReceipt: (inv: Invoice) => void;
  onOpenStatement: (studentId: string) => void;
}> = ({ store, onOpenPayment, onOpenReceipt, onOpenStatement }) => {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [subTab, setSubTab] = useState<'invoices' | 'structures' | 'reminders'>('invoices');
  const [newOpen, setNewOpen] = useState(false);
  const [selStudent, setSelStudent] = useState(store.students[0]?.id || '');
  const [selTerm, setSelTerm] = useState('Term 1');
  const [selItems, setSelItems] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('2026-02-15');

  const filtered = useMemo(() => {
    return store.invoices.filter((inv) => {
      const st = store.studentById(inv.student_id);
      const name = `${st?.first_name} ${st?.last_name}`.toLowerCase();
      if (q && !name.includes(q.toLowerCase()) && !inv.invoice_number.toLowerCase().includes(q.toLowerCase())) return false;
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (classFilter !== 'all' && st?.class_name !== classFilter) return false;
      return true;
    });
  }, [store.invoices, q, statusFilter, classFilter, store]);

  const toggleItem = (id: string) =>
    setSelItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const previewTotal = store.feeItems
    .filter((f) => selItems.includes(f.id))
    .reduce((a, f) => a + f.amount, 0);

  const handleCreate = () => {
    const st = store.studentById(selStudent);
    if (!st || selItems.length === 0) return;
    const items = store.feeItems.filter((f) => selItems.includes(f.id));
    store.createInvoice({
      student_id: st.id,
      term: selTerm,
      academic_year: '2025/2026',
      due_date: dueDate,
      amount: items.reduce((a, i) => a + i.amount, 0),
      lines: items.map((it) => ({
        id: `l-${it.id}`,
        description: it.name,
        amount: it.amount,
        fee_item_id: it.id,
      })),
    });
    setNewOpen(false);
    setSelItems([]);
  };

  const exportCSV = () => {
    downloadCSV(
      'invoices.csv',
      filtered.map((i) => {
        const st = store.studentById(i.student_id);
        return {
          invoice: i.invoice_number,
          student: `${st?.first_name} ${st?.last_name}`,
          admission: st?.admission_no,
          class: st?.class_name,
          term: i.term,
          year: i.academic_year,
          amount: i.amount,
          paid: i.paid_amount,
          adjustments: i.adjustments,
          balance: i.amount - i.paid_amount - i.adjustments,
          status: i.status,
          due_date: i.due_date,
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(
            [
              { id: 'invoices', label: 'Invoices' },
              { id: 'structures', label: 'Fee Structures' },
              { id: 'reminders', label: 'Arrears & Reminders' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                subTab === t.id
                  ? 'bg-white dark:bg-slate-900 text-[#08428C] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> New Invoice
          </Button>
        </div>
      </div>

      {subTab === 'invoices' && (
        <Card className="overflow-hidden">
          <div className="p-4 flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search invoice # or student name…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#08428C]/30"
              />
            </div>
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="all">All statuses</option>
              {['Unpaid', 'Partial', 'Paid', 'Overdue', 'Cancelled', 'Draft'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="all">All classes</option>
              {store.classes.map((c: string) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-5">Invoice</th>
                  <th className="py-3 px-5">Student</th>
                  <th className="py-3 px-5">Term</th>
                  <th className="py-3 px-5 text-right">Billed</th>
                  <th className="py-3 px-5 text-right">Paid</th>
                  <th className="py-3 px-5 text-right">Adj.</th>
                  <th className="py-3 px-5 text-right">Balance</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((inv) => {
                  const st = store.studentById(inv.student_id);
                  const balance = store.balanceForInvoice(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-5">
                        <div className="font-mono font-bold text-[#08428C]">{inv.invoice_number}</div>
                        <div className="text-[11px] text-slate-400">Due {shortDate(inv.due_date)}</div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {st?.first_name} {st?.last_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {st?.class_name} · {st?.admission_no}
                        </div>
                      </td>
                      <td className="py-3 px-5 text-xs">{inv.term}</td>
                      <td className="py-3 px-5 text-right font-mono">{money(inv.amount)}</td>
                      <td className="py-3 px-5 text-right font-mono text-emerald-600">{money(inv.paid_amount)}</td>
                      <td className="py-3 px-5 text-right font-mono text-sky-600">{money(inv.adjustments)}</td>
                      <td className={`py-3 px-5 text-right font-mono font-bold ${balance <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {money(Math.max(0, balance))}
                      </td>
                      <td className="py-3 px-5">
                        <Badge
                          variant={
                            inv.status === 'Paid'
                              ? 'success'
                              : inv.status === 'Partial'
                              ? 'warning'
                              : inv.status === 'Overdue'
                              ? 'danger'
                              : 'muted'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="secondary" onClick={() => onOpenPayment(inv)}>
                            Pay
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onOpenStatement(inv.student_id)} title="Statement">
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onOpenReceipt(inv)} title="Receipt">
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <EmptyState icon={<FileText className="w-6 h-6" />} title="No invoices match your filters" />
            )}
          </div>
        </Card>
      )}

      {subTab === 'structures' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {store.feeStructures.map((fs) => (
            <Card key={fs.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#08428C]" />
                    <h4 className="font-bold text-slate-900 dark:text-white">{fs.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {fs.class_name} · {fs.term} · {fs.academic_year}
                  </p>
                </div>
                <Badge variant={fs.active ? 'success' : 'muted'}>
                  {fs.active ? 'Active' : 'Archived'}
                </Badge>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {fs.items.map((iid) => {
                  const it = store.feeItems.find((f) => f.id === iid);
                  if (!it) return null;
                  return (
                    <li key={iid} className="flex items-center justify-between py-2">
                      <span className="text-slate-700 dark:text-slate-300">
                        {it.name}{' '}
                        <span className="text-[10px] uppercase tracking-wide text-slate-400 ml-1">
                          {it.category}
                        </span>
                      </span>
                      <span className="font-mono font-semibold">{money(it.amount)}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-sm">
                <span className="text-slate-500">Total per learner</span>
                <span className="font-bold text-lg font-mono text-[#08428C]">{money(fs.total)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {subTab === 'reminders' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Arrears & Payment Follow-ups</h4>
              <p className="text-xs text-slate-500 mt-1">
                Send SMS / email reminders to guardians of learners with outstanding balances.
              </p>
            </div>
            <Button variant="primary" size="sm">
              <MessageSquare className="w-3.5 h-3.5" /> Send All Reminders
            </Button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {store.invoices
              .filter((i) => store.balanceForInvoice(i) > 0)
              .sort((a, b) => store.balanceForInvoice(b) - store.balanceForInvoice(a))
              .map((inv) => {
                const st = store.studentById(inv.student_id);
                return (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between py-3 gap-3">
                    <div>
                      <p className="font-semibold text-sm">
                        {st?.first_name} {st?.last_name}{' '}
                        <span className="text-slate-400 font-normal">· {inv.invoice_number}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {st?.guardian_name} · {st?.guardian_phone} · Due {shortDate(inv.due_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-rose-600">
                        {money(store.balanceForInvoice(inv))}
                      </span>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-3.5 h-3.5" /> Remind
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* new invoice modal */}
      <Dialog isOpen={newOpen} onClose={() => setNewOpen(false)} title="Generate New Invoice" maxWidth="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Student"
              value={selStudent}
              onChange={(e) => setSelStudent(e.target.value)}
              options={store.students.map((s) => ({
                value: s.id,
                label: `${s.first_name} ${s.last_name} · ${s.admission_no}`,
              }))}
            />
            <Select
              label="Term"
              value={selTerm}
              onChange={(e) => setSelTerm(e.target.value)}
              options={store.terms.map((t: string) => ({ value: t, label: t }))}
            />
          </div>
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              Fee items
            </label>
            <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {store.feeItems.map((f) => (
                <label
                  key={f.id}
                  className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selItems.includes(f.id)}
                      onChange={() => toggleItem(f.id)}
                    />
                    <span>{f.name}</span>
                    <span className="text-[10px] uppercase text-slate-400">{f.category}</span>
                  </span>
                  <span className="font-mono font-semibold">{money(f.amount)}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
            <span className="text-sm text-slate-500">Preview total</span>
            <span className="font-mono font-bold text-lg text-[#08428C]">{money(previewTotal)}</span>
          </div>
          <Button variant="primary" className="w-full" onClick={handleCreate} disabled={selItems.length === 0}>
            Issue Invoice
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
