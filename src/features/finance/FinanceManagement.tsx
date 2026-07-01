import React, { useMemo, useState } from 'react';
import {
  DollarSign,
  FileText,
  CreditCard,
  TrendingUp,
  Award,
  BarChart3,
  Settings as CogIcon,
  LayoutDashboard,
  CheckCircle2,
  Printer,
  Users,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useFinanceStore } from './store';
import type { Invoice, PaymentMethod } from './types';
import { money, shortDate } from '../../utils/cn';
import { PAYMENT_METHODS } from './constants';
import { FeeManagement } from './tabs/FeeManagement';
import { Payments } from './tabs/Payments';
import { Bursaries } from './tabs/Bursaries';
import { Reports } from './tabs/Reports';
import { Settings } from './tabs/Settings';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'fees', label: 'Fee Management', icon: FileText },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'bursaries', label: 'Bursaries & Scholarships', icon: Award },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: CogIcon },
] as const;

type TabId = (typeof TABS)[number]['id'];

export const FinanceManagement: React.FC = () => {
  const store = useFinanceStore();
  const [tab, setTab] = useState<TabId>('dashboard');

  // Shared modals
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('MPESA');
  const [payReference, setPayReference] = useState('');
  const [payToast, setPayToast] = useState<string | null>(null);

  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);
  const [statementStudentId, setStatementStudentId] = useState<string | null>(null);

  const openPayment = (inv: Invoice) => {
    setPayInvoice(inv);
    setPayAmount(String(store.balanceForInvoice(inv)));
    setPayReference('');
    setPayMethod('MPESA');
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoice) return;
    try {
      const p = await store.recordPayment({
        invoice_id: payInvoice.id,
        amount: Number(payAmount),
        method: payMethod,
        reference: payReference || `${payMethod}-${Date.now().toString().slice(-6)}`,
        received_by: 'You (Bursar)',
      });
      setPayToast(p ? `Receipt ${p.receipt_no} recorded` : 'Payment recorded');
    } catch (err: any) {
      setPayToast(`Failed: ${err.message ?? 'Unknown error'}`);
    }
    setTimeout(() => setPayToast(null), 2500);
    setPayInvoice(null);
  };

  // Dashboard analytics
  const kpi = store.totals;
  const collectionsByClass = useMemo(() => {
    const map: Record<string, { class: string; billed: number; collected: number }> = {};
    store.invoices.forEach((i) => {
      const c = store.studentById(i.student_id)?.class_name || 'Unknown';
      map[c] = map[c] || { class: c, billed: 0, collected: 0 };
      map[c].billed += i.amount;
      map[c].collected += i.paid_amount;
    });
    return Object.values(map);
  }, [store.invoices, store]);

  const bursaryUsage = useMemo(() => {
    const totalAwarded = store.bursaries.reduce((a, b) => a + b.awarded_amount, 0);
    const disbursed = store.bursaries
      .filter((b) => b.status === 'Disbursed')
      .reduce((a, b) => a + b.awarded_amount, 0);
    const pending = totalAwarded - disbursed;
    return [
      { name: 'Disbursed', value: disbursed, color: '#10b981' },
      { name: 'Pending Disbursement', value: pending, color: '#f59e0b' },
    ];
  }, [store.bursaries]);

  const paymentMix = useMemo(() => {
    const map: Record<string, number> = {};
    store.payments.forEach((p) => (map[p.method] = (map[p.method] || 0) + p.amount));
    const palette = ['#08428C', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#22c55e', '#64748b'];
    return Object.entries(map).map(([name, value], i) => ({
      name,
      value,
      color: palette[i % palette.length],
    }));
  }, [store.payments]);

  const overdueList = useMemo(
    () =>
      store.invoices
        .filter((i) => store.balanceForInvoice(i) > 0)
        .sort((a, b) => store.balanceForInvoice(b) - store.balanceForInvoice(a))
        .slice(0, 5),
    [store.invoices, store]
  );

  const statementStudent = statementStudentId ? store.studentById(statementStudentId) : null;
  const statementInvoices = statementStudentId
    ? store.invoices.filter((i) => i.student_id === statementStudentId)
    : [];
  const statementPayments = statementStudentId
    ? store.payments.filter((p) => p.student_id === statementStudentId)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top toast */}
      {payToast && (
        <div className="fixed top-6 right-6 z-[60] px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" /> {payToast}
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-14">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#08428C] to-[#0a4fa8] flex items-center justify-center shadow-md shadow-[#08428C]/25">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
                  Finance & Bursary
                  <Badge variant="primary">Term 1 · 2025/2026</Badge>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Billing, payments, reconciliation, adjustments, sponsors, and bursary management — all in one place.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex items-center gap-1 overflow-x-auto bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#08428C] text-white shadow-md shadow-[#08428C]/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Global loading + error banners */}
        {store.isLoading && (
          <Card className="p-6">
            <Spinner size="md" text="Loading data from Supabase…" />
          </Card>
        )}
        {!store.isLoading && store.errors.length > 0 && (
          <Card className="p-4 border-rose-300 bg-rose-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-rose-800">
                  Could not load some Supabase tables.
                </p>
                <ul className="mt-1 space-y-0.5 text-rose-700 font-mono">
                  {store.errors.slice(0, 3).map((e, i) => (
                    <li key={i}>· {e.message}</li>
                  ))}
                </ul>
                <p className="mt-2 text-rose-600">
                  Ensure the required tables exist and your RLS policies allow SELECT for the
                  authenticated / anon role. See <code>db/schema.sql</code>.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Dashboard */}
        {tab === 'dashboard' && !store.isLoading && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="p-4">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
                  Total Invoiced
                  <FileText className="w-3.5 h-3.5 text-[#08428C]" />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {money(kpi.invoiced)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {store.invoices.length} active invoices
                </p>
              </Card>
              <Card className="p-4 border-emerald-500/30">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
                  Collected
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-emerald-600 mt-1">{money(kpi.collected)}</p>
                <p className="text-[11px] text-emerald-600 mt-1">
                  {Math.round((kpi.collected / (kpi.invoiced || 1)) * 100)}% of billed
                </p>
              </Card>
              <Card className="p-4 border-rose-500/30">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
                  Outstanding
                  <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <p className="text-2xl font-black text-rose-600 mt-1">{money(kpi.outstanding)}</p>
                <p className="text-[11px] text-rose-600 mt-1">
                  {money(kpi.overdue)} overdue
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
                  Bursary Credits
                  <Award className="w-3.5 h-3.5 text-[#08428C]" />
                </div>
                <p className="text-2xl font-black text-[#08428C] mt-1">
                  {money(store.bursaries.reduce((a, b) => a + b.awarded_amount, 0))}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {store.bursaries.length} active awards
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Collections vs Billed (by class)
                  </h4>
                  <Badge variant="muted">This term</Badge>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={collectionsByClass}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                      <XAxis dataKey="class" fontSize={11} stroke="#64748b" />
                      <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip formatter={(v: any) => money(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="billed" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="collected" fill="#08428C" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5">
                <h4 className="font-bold text-slate-900 dark:text-white mb-3">Payment Channel Mix</h4>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMix}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                      >
                        {paymentMix.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => money(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="text-[11px] mt-3 space-y-1">
                  {paymentMix.map((p) => (
                    <li key={p.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        {p.name}
                      </span>
                      <span className="font-mono font-semibold">{money(p.value)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" /> Top Outstanding Balances
                  </h4>
                  <Button size="sm" variant="outline" onClick={() => setTab('fees')}>
                    Manage all
                  </Button>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {overdueList.map((inv) => {
                    const st = store.studentById(inv.student_id);
                    return (
                      <li
                        key={inv.id}
                        className="py-3 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-semibold text-sm">
                            {st?.first_name} {st?.last_name}{' '}
                            <span className="text-slate-400 font-normal">
                              · {inv.invoice_number}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {st?.class_name} · Due {shortDate(inv.due_date)} ·{' '}
                            {st?.guardian_phone}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-rose-600">
                            {money(store.balanceForInvoice(inv))}
                          </span>
                          <Button size="sm" variant="secondary" onClick={() => openPayment(inv)}>
                            Record Payment
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                  {overdueList.length === 0 && (
                    <li className="py-6 text-center text-xs text-slate-400">
                      🎉 All invoices are fully paid.
                    </li>
                  )}
                </ul>
              </Card>

              <Card className="p-5">
                <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#08428C]" /> Bursary Utilization
                </h4>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bursaryUsage}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={70}
                      >
                        {bursaryUsage.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => money(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs space-y-1.5 mt-3">
                  {bursaryUsage.map((b) => (
                    <div key={b.name} className="flex justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                        {b.name}
                      </span>
                      <span className="font-mono font-bold">{money(b.value)}</span>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setTab('bursaries')}
                >
                  Manage Bursaries
                </Button>
              </Card>
            </div>

            <Card className="p-5">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Sponsors Active This Term
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {store.sponsors.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                  >
                    <p className="font-bold text-sm">{s.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="muted">{s.type}</Badge>
                      <span className="text-[11px] text-slate-500">
                        {s.students.length} learner(s)
                      </span>
                    </div>
                    <div className="mt-2 text-xs flex justify-between">
                      <span className="text-slate-500">Remitted</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {money(s.total_remitted)}
                      </span>
                    </div>
                    <div className="text-xs flex justify-between">
                      <span className="text-slate-500">Pending</span>
                      <span className="font-mono font-bold text-amber-600">
                        {money(s.total_committed - s.total_remitted)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 'fees' && (
          <FeeManagement
            store={store}
            onOpenPayment={openPayment}
            onOpenReceipt={setReceiptInvoice}
            onOpenStatement={setStatementStudentId}
          />
        )}
        {tab === 'payments' && <Payments store={store} />}
        {tab === 'bursaries' && <Bursaries store={store} />}
        {tab === 'reports' && <Reports store={store} />}
        {tab === 'settings' && <Settings store={store} />}
      </div>

      {/* Record Payment Modal */}
      <Dialog
        isOpen={Boolean(payInvoice)}
        onClose={() => setPayInvoice(null)}
        title="Record Payment"
        description="Log a receipt against the selected invoice. Bank / mobile-money payments will be queued for reconciliation."
        maxWidth="md"
      >
        {payInvoice && (
          <form onSubmit={submitPayment} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <p>
                <span className="text-slate-400">Invoice:</span>{' '}
                <span className="font-mono font-bold text-[#08428C]">
                  {payInvoice.invoice_number}
                </span>
              </p>
              <p>
                <span className="text-slate-400">Student:</span>{' '}
                <span className="font-bold">
                  {store.studentById(payInvoice.student_id)?.first_name}{' '}
                  {store.studentById(payInvoice.student_id)?.last_name}
                </span>
              </p>
              <p>
                <span className="text-slate-400">Balance:</span>{' '}
                <span className="font-mono font-bold">
                  {money(store.balanceForInvoice(payInvoice))}
                </span>
              </p>
            </div>
            <Input
              label="Amount"
              type="number"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
            <Select
              label="Payment Method"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              options={PAYMENT_METHODS.map((m: string) => ({ value: m, label: m }))}
            />
            <Input
              label="Reference / Transaction ID"
              value={payReference}
              onChange={(e) => setPayReference(e.target.value)}
              placeholder="MPESA code, cheque #, bank ref…"
            />
            <Button type="submit" variant="primary" className="w-full">
              Confirm Payment
            </Button>
          </form>
        )}
      </Dialog>

      {/* Receipt Modal */}
      <Dialog
        isOpen={Boolean(receiptInvoice)}
        onClose={() => setReceiptInvoice(null)}
        title="Official Fee Receipt"
        maxWidth="md"
      >
        {receiptInvoice && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-xs font-mono space-y-2 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between font-sans border-b pb-3 border-slate-200 dark:border-slate-800">
                <div className="font-black text-sm text-[#08428C]">🎓 EDUSYNC ACADEMY</div>
                <Badge variant="success">OFFICIAL</Badge>
              </div>
              <p>Receipt No: RCP-2026-AUTO</p>
              <p>Invoice No: {receiptInvoice.invoice_number}</p>
              <p>
                Received From:{' '}
                {store.studentById(receiptInvoice.student_id)?.first_name}{' '}
                {store.studentById(receiptInvoice.student_id)?.last_name}
              </p>
              <p>
                Term: {receiptInvoice.term} ({receiptInvoice.academic_year})
              </p>
              <p>Issued: {shortDate(receiptInvoice.issue_date)}</p>
              <table className="w-full font-sans mt-2 text-[11px]">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left">Item</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptInvoice.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="py-0.5">{l.description}</td>
                      <td className="py-0.5 text-right font-mono">{money(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t pt-2 mt-2 border-slate-200 dark:border-slate-800 text-sm flex justify-between font-bold font-sans">
                <span>PAID</span>
                <span className="text-emerald-600">{money(receiptInvoice.paid_amount)}</span>
              </div>
              <div className="text-xs flex justify-between font-sans">
                <span>Balance</span>
                <span className="font-mono font-bold">
                  {money(store.balanceForInvoice(receiptInvoice))}
                </span>
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print Receipt
            </Button>
          </div>
        )}
      </Dialog>

      {/* Statement Modal */}
      <Dialog
        isOpen={Boolean(statementStudentId)}
        onClose={() => setStatementStudentId(null)}
        title={statementStudent ? `Statement — ${statementStudent.first_name} ${statementStudent.last_name}` : ''}
        maxWidth="2xl"
      >
        {statementStudent && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <p className="text-slate-400 font-bold uppercase">Admission</p>
                <p className="font-mono font-bold">{statementStudent.admission_no}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Class</p>
                <p className="font-bold">{statementStudent.class_name}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Guardian</p>
                <p className="font-bold">{statementStudent.guardian_name}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Balance</p>
                <p
                  className={`font-mono font-bold ${
                    store.studentBalance(statementStudent.id) > 0
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {money(Math.max(0, store.studentBalance(statementStudent.id)))}
                </p>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase text-slate-400 mb-2">Invoices</h5>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 font-bold">
                    <th className="text-left py-1">Invoice</th>
                    <th className="text-left py-1">Term</th>
                    <th className="text-right py-1">Billed</th>
                    <th className="text-right py-1">Paid</th>
                    <th className="text-right py-1">Adj.</th>
                    <th className="text-right py-1">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {statementInvoices.map((i) => (
                    <tr key={i.id}>
                      <td className="py-1.5 font-mono">{i.invoice_number}</td>
                      <td className="py-1.5">{i.term}</td>
                      <td className="py-1.5 text-right font-mono">{money(i.amount)}</td>
                      <td className="py-1.5 text-right font-mono text-emerald-600">
                        {money(i.paid_amount)}
                      </td>
                      <td className="py-1.5 text-right font-mono text-sky-600">
                        {money(i.adjustments)}
                      </td>
                      <td className="py-1.5 text-right font-mono font-bold">
                        {money(Math.max(0, store.balanceForInvoice(i)))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase text-slate-400 mb-2">Payments</h5>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 font-bold">
                    <th className="text-left py-1">Receipt</th>
                    <th className="text-left py-1">Date</th>
                    <th className="text-left py-1">Method</th>
                    <th className="text-left py-1">Ref</th>
                    <th className="text-right py-1">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {statementPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-1.5 font-mono">{p.receipt_no}</td>
                      <td className="py-1.5">{shortDate(p.date)}</td>
                      <td className="py-1.5">{p.method}</td>
                      <td className="py-1.5 font-mono text-slate-500">{p.reference}</td>
                      <td className="py-1.5 text-right font-mono font-bold text-emerald-600">
                        {money(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button variant="primary" className="w-full" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print Statement
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default FinanceManagement;
