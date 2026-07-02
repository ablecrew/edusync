import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Play, CheckCircle2, Printer, Wallet, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useHrStore } from '../store';
import * as api from '../api';
import { MONTHS } from '../constants';
import type { Payslip, PayslipLine } from '../types';

export const Payroll: React.FC<{ store: ReturnType<typeof useHrStore> }> = ({ store }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [slips, setSlips] = useState<Payslip[]>([]);
  const [viewSlip, setViewSlip] = useState<Payslip | null>(null);
  const [slipLines, setSlipLines] = useState<PayslipLine[]>([]);
  const [assignOpen, setAssignOpen] = useState<{ staffId: string } | null>(null);

  useEffect(() => {
    if (!selectedRun) { setSlips([]); return; }
    api.fetchPayslipsForRun(selectedRun).then(setSlips).catch(() => setSlips([]));
  }, [selectedRun]);

  useEffect(() => {
    if (!viewSlip) { setSlipLines([]); return; }
    api.fetchPayslipLines(viewSlip.id).then(setSlipLines).catch(() => setSlipLines([]));
  }, [viewSlip]);

  const currentRun = store.runs.find(r => r.id === selectedRun);
  const runTotal = useMemo(() => slips.reduce((a, s) => a + Number(s.net_pay), 0), [slips]);

  const runPayroll = async () => {
    const runId = await store.runPayroll.mutateAsync({ year, month, actor: 'HR' });
    setSelectedRun(runId);
  };

  return (
    <div className="space-y-6">
      {/* Run panel */}
      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h4 className="font-bold flex items-center gap-2"><Play className="w-4 h-4 text-[#08428C]" /> Process a payroll run</h4>
            <p className="text-xs text-slate-500 mt-1">Auto-computes basic (pro-rated for absence), allowances, deductions, overtime from attendance.</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
              className="w-24 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <Button variant="primary" size="sm" onClick={runPayroll} isLoading={store.runPayroll.isPending}>Run</Button>
          </div>
        </div>
      </Card>

      {/* Runs */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h4 className="font-bold">Payroll runs</h4>
        </div>
        {store.runs.length === 0 ? (
          <EmptyState icon={DollarSign} title="No payroll runs yet"
            description="Choose a month above and click Run to generate the first payroll." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 px-5 text-left">Period</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-left">Run by</th>
                <th className="py-3 px-5 text-left">Paid on</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {store.runs.map(r => (
                <tr key={r.id} className={selectedRun === r.id ? 'bg-slate-50 dark:bg-slate-800/40' : ''}>
                  <td className="py-3 px-5 font-semibold">{MONTHS[r.period_month - 1]} {r.period_year}</td>
                  <td className="py-3 px-5">
                    <Badge variant={r.status === 'Paid' ? 'success' : r.status === 'Approved' ? 'primary' : 'warning'}>{r.status}</Badge>
                  </td>
                  <td className="py-3 px-5 text-xs">{r.run_by ?? '—'}</td>
                  <td className="py-3 px-5 text-xs">{r.paid_on ?? '—'}</td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedRun(r.id)}>Open</Button>
                      {r.status === 'Draft' && <Button size="sm" variant="success" onClick={() => store.approveRun.mutate({ runId: r.id, approver: 'Principal' })}>Approve</Button>}
                      {r.status === 'Approved' && <Button size="sm" variant="primary" onClick={() => store.payRun.mutate(r.id)}><Wallet className="w-3.5 h-3.5" /> Mark paid</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Payslips for selected run */}
      {selectedRun && currentRun && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="font-bold">Payslips — {MONTHS[currentRun.period_month - 1]} {currentRun.period_year}</h4>
              <p className="text-xs text-slate-500">Total net: <b className="text-emerald-600 font-mono">KES {runTotal.toLocaleString()}</b></p>
            </div>
            <Badge variant={currentRun.status === 'Paid' ? 'success' : 'primary'}>{currentRun.status}</Badge>
          </div>
          {slips.length === 0 ? (
            <EmptyState icon={DollarSign} title="No payslips generated" description="Try running payroll again — check that staff have Active status." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Staff</th>
                  <th className="py-3 px-5 text-right">Basic</th>
                  <th className="py-3 px-5 text-right">Gross</th>
                  <th className="py-3 px-5 text-right">Deductions</th>
                  <th className="py-3 px-5 text-right">Net pay</th>
                  <th className="py-3 px-5 text-right">Attendance</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {slips.map(p => {
                  const s = store.staffById(p.staff_id);
                  return (
                    <tr key={p.id}>
                      <td className="py-3 px-5">
                        <p className="font-semibold">{s?.first_name} {s?.last_name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{s?.staff_code}</p>
                      </td>
                      <td className="py-3 px-5 text-right font-mono">{Number(p.basic_salary).toLocaleString()}</td>
                      <td className="py-3 px-5 text-right font-mono">{Number(p.gross_pay).toLocaleString()}</td>
                      <td className="py-3 px-5 text-right font-mono text-rose-600">-{Number(p.total_deductions).toLocaleString()}</td>
                      <td className="py-3 px-5 text-right font-mono font-bold text-emerald-600">{Number(p.net_pay).toLocaleString()}</td>
                      <td className="py-3 px-5 text-right text-[11px] text-slate-500">
                        {p.days_present}/{p.working_days} days
                        {p.overtime_mins ? <p className="text-amber-600">+{p.overtime_mins}m OT</p> : null}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setViewSlip(p)}><Printer className="w-3.5 h-3.5" /> Slip</Button>
                          <Button size="sm" variant="outline" onClick={() => setAssignOpen({ staffId: p.staff_id })}><Plus className="w-3.5 h-3.5" /> Components</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* Payslip preview */}
      {viewSlip && (
        <Dialog isOpen onClose={() => setViewSlip(null)} title="Payslip" maxWidth="lg">
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border-2 border-slate-900 bg-white text-xs font-mono space-y-2">
              <div className="flex items-center justify-between font-sans border-b pb-2">
                <div>
                  <p className="font-black text-sm text-[#08428C]">🎓 EDUSYNC ACADEMY — PAYSLIP</p>
                  <p className="text-[10px] text-slate-500">
                    {store.staffById(viewSlip.staff_id)?.first_name} {store.staffById(viewSlip.staff_id)?.last_name} · {store.staffById(viewSlip.staff_id)?.staff_code}
                  </p>
                </div>
                <div className="text-right text-[10px]">
                  {currentRun && <p>{MONTHS[currentRun.period_month - 1]} {currentRun.period_year}</p>}
                  <p>{viewSlip.days_present}/{viewSlip.working_days} days</p>
                </div>
              </div>
              <table className="w-full font-sans text-xs">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase font-bold">
                    <th className="text-left py-1">Code</th>
                    <th className="text-left">Description</th>
                    <th className="text-left">Kind</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {slipLines.map(l => (
                    <tr key={l.id}>
                      <td className="py-0.5 font-mono">{l.code}</td>
                      <td>{l.name}</td>
                      <td className="text-slate-500">{l.kind}</td>
                      <td className={`text-right font-mono ${['Deduction','Tax','Pension','Loan','Advance'].includes(l.kind) ? 'text-rose-600' : ''}`}>
                        {['Deduction','Tax','Pension','Loan','Advance'].includes(l.kind) ? '-' : ''}{Number(l.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t pt-2 font-sans text-sm space-y-0.5">
                <div className="flex justify-between"><span>Gross</span><span className="font-mono font-bold">KES {Number(viewSlip.gross_pay).toLocaleString()}</span></div>
                <div className="flex justify-between text-rose-600"><span>Deductions</span><span className="font-mono">-KES {Number(viewSlip.total_deductions).toLocaleString()}</span></div>
                <div className="flex justify-between font-black text-emerald-600 border-t pt-1"><span>Net pay</span><span className="font-mono">KES {Number(viewSlip.net_pay).toLocaleString()}</span></div>
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print</Button>
          </div>
        </Dialog>
      )}

      {/* Assign / adjust recurring components */}
      {assignOpen && (
        <ComponentsDialog staffId={assignOpen.staffId} onClose={() => setAssignOpen(null)} store={store} />
      )}
    </div>
  );
};

const ComponentsDialog: React.FC<{ staffId: string; onClose: () => void; store: ReturnType<typeof useHrStore> }> = ({ staffId, onClose, store }) => {
  const s = store.staffById(staffId);
  const mine = store.assignments.filter(a => a.staff_id === staffId);
  const [compId, setCompId] = useState('');
  const [amount, setAmount] = useState('');
  return (
    <Dialog isOpen onClose={onClose} title={`Pay components — ${s?.first_name} ${s?.last_name}`} maxWidth="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
          <Select label="Component" options={[{ value: '', label: '— Select —' }, ...store.components.map(c => ({ value: c.id, label: `${c.name} (${c.kind})` }))]}
            value={compId} onChange={e => setCompId(e.target.value)} />
          <Input label="Amount (KES)" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          <Button variant="primary" onClick={async () => {
            if (!compId || !amount) return;
            await store.addPayAssign.mutateAsync({ staffId, componentId: compId, amount: Number(amount) });
            setCompId(''); setAmount('');
          }}><Plus className="w-3.5 h-3.5" /> Add / Update</Button>
        </div>

        {mine.length === 0
          ? <p className="text-xs text-slate-500">No recurring components yet. Add allowances, deductions, loan repayments, etc. above.</p>
          : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {mine.map(a => {
                const c = store.components.find(x => x.id === a.component_id);
                return (
                  <li key={a.id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{c?.name} <span className="text-[11px] font-normal text-slate-400 ml-1">{c?.kind}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold">KES {Number(a.amount).toLocaleString()}</span>
                      <button onClick={() => store.removePayAssign.mutate(a.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
      </div>
    </Dialog>
  );
};