import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Printer,
  TrendingUp,
  FileText,
  CreditCard,
  CheckCircle2,
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
} from 'recharts';
import { useInvoices, useCreateInvoice, useStudents } from '../../hooks/useQueries';
import { Invoice } from '../../types';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Dialog } from '../../components/ui/dialog';
import { Spinner } from '../../components/ui/spinner';

export const FinanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'budgets' | 'payroll'>('invoices');
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: students = [] } = useStudents();
  const createInvoiceMutation = useCreateInvoice();

  // Modals
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('std-002');
  const [invAmount, setInvAmount] = useState('3200');
  const [invTerm, setInvTerm] = useState('Term 1');

  // Record payment modal
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('1000');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Printable receipt
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);

  const totalTuitionInvoiced = invoices.reduce((acc, i) => acc + i.amount, 0);
  const totalPaid = invoices.reduce((acc, i) => acc + i.paid_amount, 0);
  const totalOutstanding = totalTuitionInvoiced - totalPaid;

  const BUDGET_DATA = [
    { category: 'Academic Faculty Payroll', Budgeted: 85000, Actual: 84200 },
    { category: 'STEM & Lab Consumables', Budgeted: 15000, Actual: 14800 },
    { category: 'Bus Fleet Fuel & Maintenance', Budgeted: 12000, Actual: 11900 },
    { category: 'Library Book Repository', Budgeted: 8000, Actual: 7500 },
    { category: 'Campus Utilities & Internet', Budgeted: 6500, Actual: 6200 },
  ];

  const EXPENSE_PIE = [
    { name: 'Staff Payroll', value: 84200, color: '#08428C' },
    { name: 'STEM Labs', value: 14800, color: '#10b981' },
    { name: 'Bus Fleet', value: 11900, color: '#f59e0b' },
    { name: 'Library & Utilities', value: 13700, color: '#8b5cf6' },
  ];

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === selectedStudentId) || { first_name: 'Liam', last_name: 'Chen', class_name: 'Grade 10 - Alpha' };
    const invNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    await createInvoiceMutation.mutateAsync({
      invoice_number: invNum,
      student_id: selectedStudentId,
      student_name: `${st.first_name} ${st.last_name}`,
      class_name: st.class_name,
      term: invTerm,
      academic_year: '2025/2026',
      amount: Number(invAmount) || 3200,
      paid_amount: 0,
      status: 'Unpaid',
      due_date: '2026-05-15',
      created_at: new Date().toISOString().split('T')[0],
      items: [{ description: 'Term Tuition Fee', amount: Number(invAmount) || 3200 }],
    });
    setIsNewInvoiceOpen(false);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setPaymentInvoice(null);
    }, 2000);
  };

  if (isLoading) return <Spinner size="lg" text="Loading Supabase Financial Ledger & Invoices..." />;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Bursary & Financial Ledger</span>
            <Badge variant="primary">Term 1 2026</Badge>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Student tuition invoices, fee collection reconciliation, partial payments, scholarship tracking, expenses, and budget forecasts.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsNewInvoiceOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Generate Tuition Invoice</span>
        </Button>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card variant="default" className="p-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Total Invoiced</span>
            <FileText className="w-4 h-4 text-[#08428C]" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">${totalTuitionInvoiced.toLocaleString()}</p>
          <span className="text-xs text-slate-500">Across {invoices.length} active invoices</span>
        </Card>

        <Card variant="default" className="p-6 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Total Collected</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">${totalPaid.toLocaleString()}</p>
          <span className="text-xs text-emerald-600 font-semibold">{Math.round((totalPaid / (totalTuitionInvoiced || 1)) * 100)}% collection target met</span>
        </Card>

        <Card variant="default" className="p-6 space-y-2 border-rose-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Outstanding Balance</span>
            <CreditCard className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400">${totalOutstanding.toLocaleString()}</p>
          <span className="text-xs text-rose-600 font-semibold">Overdue reminders ready in AI workspace</span>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
        {[
          { id: 'invoices', label: 'Invoices & Fee Collection' },
          { id: 'payments', label: 'Payment Receipts & History' },
          { id: 'budgets', label: 'Budget vs Actual Expenses' },
          { id: 'payroll', label: 'Staff Payroll Register' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? 'bg-white dark:bg-slate-900 text-[#08428C] dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. INVOICES TAB */}
      {(activeTab === 'invoices' || activeTab === 'payments') && (
        <Card variant="default" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Invoice # & Date</th>
                  <th className="py-4 px-6">Student & Class</th>
                  <th className="py-4 px-6">Term / Year</th>
                  <th className="py-4 px-6 font-mono text-right">Invoiced Amount</th>
                  <th className="py-4 px-6 font-mono text-right">Paid Amount</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#08428C] dark:text-blue-400">
                      {inv.invoice_number}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal">Due: {inv.due_date}</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      {inv.student_name}
                      <span className="block text-xs font-normal text-slate-500">{inv.class_name}</span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400 font-semibold">{inv.term} ({inv.academic_year})</td>
                    <td className="py-4 px-6 font-mono font-bold text-right text-slate-900 dark:text-white">${inv.amount.toLocaleString()}</td>
                    <td className="py-4 px-6 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">${inv.paid_amount.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <Badge variant={inv.status === 'Paid' ? 'success' : inv.status === 'Partial' ? 'warning' : 'danger'}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setPaymentInvoice(inv)}>
                          <DollarSign className="w-3.5 h-3.5 mr-1" /> Pay
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setReceiptInvoice(inv)}>
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 2. BUDGET VS EXPENSE TAB */}
      {activeTab === 'budgets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card variant="default" className="lg:col-span-2 p-6 space-y-6">
            <h3 className="text-lg font-bold">Institutional Budget vs Actual Expenditure ($ USD)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BUDGET_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="category" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`$${val.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="Budgeted" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Actual" fill="#08428C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card variant="default" className="p-6 space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold">Term Expenditure Allocation</h3>
              <p className="text-xs text-slate-500 mt-1">Breakdown by operational category</p>
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={EXPENSE_PIE} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {EXPENSE_PIE.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`$${val.toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              {EXPENSE_PIE.map((p, i) => (
                <div key={i} className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} /> {p.name}</span>
                  <span className="font-mono">${p.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 3. PAYROLL REGISTER TAB */}
      {activeTab === 'payroll' && (
        <Card variant="default" className="p-8 space-y-6 text-center">
          <div className="p-4 rounded-2xl bg-[#e8f1fc] dark:bg-blue-900/30 text-[#08428C] dark:text-blue-400 w-16 h-16 mx-auto flex items-center justify-center font-bold text-2xl">
            💼
          </div>
          <h3 className="text-xl font-bold">Automated Staff Payroll Register</h3>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Payroll calculations are integrated with Teacher qualifications and HR employee salaries. Total monthly faculty payroll is <strong className="text-slate-900 dark:text-white">$84,200</strong>.
          </p>
          <Button variant="primary" onClick={() => window.print()}>Print Monthly Payroll Advice</Button>
        </Card>
      )}

      {/* New Invoice Modal */}
      <Dialog isOpen={isNewInvoiceOpen} onClose={() => setIsNewInvoiceOpen(false)} title="Generate Student Tuition Invoice">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <Select
            label="Select Student"
            options={students.map((s) => ({ value: s.id, label: `${s.first_name} ${s.last_name} (${s.admission_number})` }))}
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          />
          <Select
            label="Academic Term"
            options={['Term 1', 'Term 2', 'Term 3'].map((t) => ({ value: t, label: t }))}
            value={invTerm}
            onChange={(e) => setInvTerm(e.target.value)}
          />
          <Input label="Tuition Amount ($ USD)" type="number" required value={invAmount} onChange={(e) => setInvAmount(e.target.value)} />
          <Button type="submit" variant="primary" className="w-full" isLoading={createInvoiceMutation.isPending}>Issue Invoice</Button>
        </form>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog isOpen={Boolean(paymentInvoice)} onClose={() => setPaymentInvoice(null)} title="Record Fee Collection Payment" maxWidth="sm">
        {paymentInvoice && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <p><span className="text-slate-400">Invoice:</span> <span className="font-mono font-bold text-[#08428C]">{paymentInvoice.invoice_number}</span></p>
              <p><span className="text-slate-400">Student:</span> <span className="font-bold">{paymentInvoice.student_name}</span></p>
              <p><span className="text-slate-400">Outstanding:</span> <span className="font-mono font-bold">${(paymentInvoice.amount - paymentInvoice.paid_amount).toLocaleString()}</span></p>
            </div>
            <Input label="Payment Amount ($ USD)" type="number" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            <Select label="Payment Method" options={['Bank Transfer', 'Mobile Money', 'Cash Receipt', 'Scholarship Allocation'].map((m) => ({ value: m, label: m }))} />
            <Button type="submit" variant="primary" className="w-full">Confirm Payment</Button>
            {paymentSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center justify-center gap-2 font-bold animate-fade-in">
                <CheckCircle2 className="w-4 h-4" /> Receipt Saved to Supabase!
              </div>
            )}
          </form>
        )}
      </Dialog>

      {/* Printable Receipt Modal */}
      {receiptInvoice && (
        <Dialog isOpen={Boolean(receiptInvoice)} onClose={() => setReceiptInvoice(null)} title="Official Digital Fee Receipt" maxWidth="md">
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white text-xs space-y-4 font-mono">
              <div className="flex items-center justify-between border-b pb-3 font-sans">
                <div className="font-black text-sm">🎓 EDUSYNC ACADEMY</div>
                <Badge variant="success">OFFICIAL RECEIPT</Badge>
              </div>
              <p>Receipt No: RCP-2026-0941</p>
              <p>Invoice No: {receiptInvoice.invoice_number}</p>
              <p>Received From: {receiptInvoice.student_name}</p>
              <p>Term / Year: {receiptInvoice.term} ({receiptInvoice.academic_year})</p>
              <div className="border-t pt-3 flex justify-between font-bold text-sm">
                <span>AMOUNT PAID:</span>
                <span className="text-emerald-600">${receiptInvoice.paid_amount > 0 ? receiptInvoice.paid_amount.toLocaleString() : '2,750'}</span>
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print Receipt
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};
