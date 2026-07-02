import React from 'react';

export interface KenyanPayslipEmployer {
  name: string;
  kra_pin: string;
  nssf_no: string;
  nhif_no: string;
  address: string;
  logo_url?: string;
}
export interface KenyanPayslipEmployee {
  full_name: string;
  staff_code: string;
  designation?: string;
  department?: string;
  kra_pin?: string;
  nssf_no?: string;
  nhif_no?: string;
  bank_name?: string;
  bank_account_no?: string;
  date_of_hire: string;
}

interface Props {
  employer: KenyanPayslipEmployer;
  employee: KenyanPayslipEmployee;
  period: string;
  slip: any;
  lines: any[];
}

export const KenyanPayslip: React.FC<Props> = ({ employer, employee, period, slip, lines }) => {
  const grouped = (kinds: string[]) => lines.filter(l => kinds.includes(l.kind));
  const earnings = grouped(['Basic','Allowance','Bonus','Overtime']);
  const statutory = grouped(['Tax','Pension']).concat(lines.filter(l => l.code === 'NHIF'));
  const deductions = lines.filter(l => l.kind === 'Deduction' && l.code !== 'NHIF').concat(grouped(['Loan','Advance']));

  return (
    <div className="p-6 bg-white border-2 border-slate-900 text-xs font-sans max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
        <div className="flex items-center gap-3">
          {employer.logo_url && <img src={employer.logo_url} className="w-14 h-14 object-contain" alt="" />}
          <div>
            <p className="font-black text-base uppercase">{employer.name}</p>
            <p className="text-[10px] text-slate-600">{employer.address}</p>
            <p className="text-[10px] font-mono">KRA PIN: {employer.kra_pin} · NSSF: {employer.nssf_no} · NHIF: {employer.nhif_no}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-black text-sm uppercase text-[#08428C]">PAYSLIP</p>
          <p className="text-[10px] font-mono">{period}</p>
        </div>
      </div>

      {/* Employee block */}
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-300 text-[11px]">
        <div>
          <p className="text-slate-500">Employee</p>
          <p className="font-bold">{employee.full_name}</p>
          <p className="text-slate-500">Staff no: <span className="font-mono">{employee.staff_code}</span></p>
          <p className="text-slate-500">Designation: <b className="text-slate-900">{employee.designation ?? '—'}</b></p>
          <p className="text-slate-500">Department: <b className="text-slate-900">{employee.department ?? '—'}</b></p>
          <p className="text-slate-500">Date of hire: <b className="text-slate-900">{employee.date_of_hire}</b></p>
        </div>
        <div>
          <p className="text-slate-500">KRA PIN: <span className="font-mono">{employee.kra_pin ?? '—'}</span></p>
          <p className="text-slate-500">NSSF: <span className="font-mono">{employee.nssf_no ?? '—'}</span></p>
          <p className="text-slate-500">NHIF: <span className="font-mono">{employee.nhif_no ?? '—'}</span></p>
          <p className="text-slate-500 mt-1">Bank: <b>{employee.bank_name ?? '—'}</b></p>
          <p className="text-slate-500">A/C: <span className="font-mono">{employee.bank_account_no ?? '—'}</span></p>
          <p className="text-slate-500">Days worked: <b>{slip.days_present}/{slip.working_days}</b></p>
        </div>
      </div>

      {/* Earnings vs deductions two-column */}
      <div className="grid grid-cols-2 gap-4 py-2">
        <div>
          <p className="font-bold uppercase text-[10px] text-emerald-600 border-b border-emerald-200 pb-1 mb-1">Earnings</p>
          {earnings.length === 0 && <p className="text-[10px] text-slate-400 italic py-1">No earnings recorded</p>}
          {earnings.map(l => (
            <div key={l.id} className="flex justify-between text-[11px] py-0.5">
              <span>{l.name}</span>
              <span className="font-mono">{Number(l.amount).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-emerald-600 pt-1 mt-1 font-bold">
            <span>Gross pay</span>
            <span className="font-mono text-emerald-700">KES {Number(slip.gross_pay).toLocaleString()}</span>
          </div>
        </div>
        <div>
          <p className="font-bold uppercase text-[10px] text-rose-600 border-b border-rose-200 pb-1 mb-1">Statutory</p>
          {statutory.length === 0 && <p className="text-[10px] text-slate-400 italic py-1">None</p>}
          {statutory.map(l => (
            <div key={l.id} className="flex justify-between text-[11px] py-0.5">
              <span>{l.name}</span>
              <span className="font-mono text-rose-600">-{Number(l.amount).toLocaleString()}</span>
            </div>
          ))}
          <p className="font-bold uppercase text-[10px] text-rose-600 border-b border-rose-200 pb-1 mb-1 mt-2">Other deductions</p>
          {deductions.length === 0 && <p className="text-[10px] text-slate-400 italic py-1">None</p>}
          {deductions.map(l => (
            <div key={l.id} className="flex justify-between text-[11px] py-0.5">
              <span>{l.name}</span>
              <span className="font-mono text-rose-600">-{Number(l.amount).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-rose-600 pt-1 mt-1 font-bold">
            <span>Total deductions</span>
            <span className="font-mono text-rose-700">-KES {Number(slip.total_deductions).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Net */}
      <div className="mt-3 p-3 bg-[#08428C] text-white flex justify-between items-center rounded">
        <span className="font-black uppercase">Net pay (Take home)</span>
        <span className="font-mono font-black text-lg">KES {Number(slip.net_pay).toLocaleString()}</span>
      </div>

      {/* Stamp footer */}
      <div className="mt-4 pt-3 border-t border-dashed border-slate-400 flex justify-between items-end text-[10px] text-slate-500">
        <div>
          <p>This payslip is system-generated. No manual signature required.</p>
          <p>Queries: hr@edusync.school</p>
        </div>
        <div className="border-2 border-slate-400 border-dashed px-3 py-2 text-center rotate-[-8deg] text-emerald-700 font-black">
          ✓ PAID
        </div>
      </div>
    </div>
  );
};