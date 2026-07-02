import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Printer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useStaffPortalStore } from '../store';
import * as api from '../api';
import { KenyanPayslip } from '../components/KenyanPayslip';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Employer details — edit these once and every payslip uses them.
// You can also move this to a `settings` table and load it from Supabase.
const EMPLOYER = {
  name: 'EduSync Academy',
  kra_pin: 'A123456789Z',
  nssf_no: 'NSSF-000123',
  nhif_no: 'NHIF-000456',
  address: 'P.O. Box 1234-00100, Nairobi, Kenya',
  logo_url: undefined as string | undefined,   // e.g. '/logo.png'
};

export const Payslips: React.FC<{ store: ReturnType<typeof useStaffPortalStore> }> = ({ store }) => {
  const [view, setView] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [run, setRun] = useState<any>(null);

  useEffect(() => {
    if (!view) { setLines([]); setRun(null); return; }
    api.fetchMyPayslipLines(view.id).then(setLines).catch(() => setLines([]));
    api.fetchPayrollRun(view.payroll_run_id).then(setRun).catch(() => setRun(null));
  }, [view]);

  const ytd = useMemo(() => ({
    gross: store.payslips.reduce((a, p) => a + Number(p.gross_pay), 0),
    deductions: store.payslips.reduce((a, p) => a + Number(p.total_deductions), 0),
    net: store.payslips.reduce((a, p) => a + Number(p.net_pay), 0),
  }), [store.payslips]);

  const period = run
    ? `${MONTHS[run.period_month - 1]} ${run.period_year}`
    : view?.created_at
      ? new Date(view.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : '—';

  const employee = store.me
    ? {
        full_name: store.me.full_name,
        staff_code: store.me.staff_code,
        designation: store.me.designation,
        department: store.me.department_name,
        kra_pin: store.me.tax_pin,
        nssf_no: store.me.nssf_no,
        nhif_no: store.me.nhif_no,
        bank_name: store.me.bank_name,
        bank_account_no: store.me.bank_account_no,
        date_of_hire: store.me.date_of_hire,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* YTD */}
      <Card className="p-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] uppercase text-emerald-100 font-bold">YTD Gross</p>
            <p className="text-2xl font-black font-mono">KES {ytd.gross.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-emerald-100 font-bold">YTD Deductions</p>
            <p className="text-2xl font-black font-mono">KES {ytd.deductions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-emerald-100 font-bold">YTD Take-home</p>
            <p className="text-2xl font-black font-mono">KES {ytd.net.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* List */}
      {store.payslips.length === 0 ? (
        <EmptyState icon={DollarSign} title="No payslips yet" description="Your monthly payslips will appear here once HR processes payroll." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 px-5 text-left">Period</th>
                <th className="py-3 px-5 text-right">Gross</th>
                <th className="py-3 px-5 text-right">Deductions</th>
                <th className="py-3 px-5 text-right">Net</th>
                <th className="py-3 px-5">Attendance</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {store.payslips.map(p => (
                <tr key={p.id}>
                  <td className="py-3 px-5 font-semibold text-xs">
                    {new Date(p.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-5 text-right font-mono">{Number(p.gross_pay).toLocaleString()}</td>
                  <td className="py-3 px-5 text-right font-mono text-rose-600">-{Number(p.total_deductions).toLocaleString()}</td>
                  <td className="py-3 px-5 text-right font-mono font-bold text-emerald-600">{Number(p.net_pay).toLocaleString()}</td>
                  <td className="py-3 px-5 text-xs text-slate-500 text-center">
                    {p.days_present}/{p.working_days}
                    {p.overtime_mins > 0 && <p className="text-amber-600">+{p.overtime_mins}m</p>}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setView(p)}><Printer className="w-3.5 h-3.5" /> Slip</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Slip preview — Kenyan-formatted */}
      {view && employee && (
        <Dialog isOpen onClose={() => setView(null)} title="Payslip" maxWidth="2xl">
          <div className="space-y-4">
            <KenyanPayslip
              employer={EMPLOYER}
              employee={employee}
              period={period}
              slip={view}
              lines={lines}
            />
            <Button variant="primary" className="w-full" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};