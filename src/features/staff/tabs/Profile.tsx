import React, { useState } from 'react';
import { User, Save, Phone, Mail, MapPin, HeartPulse, Landmark } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useStaffPortalStore } from '../store';

export const Profile: React.FC<{ store: ReturnType<typeof useStaffPortalStore> }> = ({ store }) => {
  const me = store.me!;
  const [form, setForm] = useState({
    phone: me.phone ?? '',
    email: me.email ?? '',
    address: me.address ?? '',
    emergency_name: me.emergency_name ?? '',
    emergency_phone: me.emergency_phone ?? '',
    emergency_relation: me.emergency_relation ?? '',
    bank_name: me.bank_name ?? '',
    bank_account_no: me.bank_account_no ?? '',
  });

  const save = () => store.updateProfile.mutate(form);

  return (
    <div className="space-y-6">
      {/* Identity header */}
      <Card className="p-6 flex items-center gap-4 flex-wrap">
        {me.photo_url
          ? <img src={me.photo_url} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#08428C]/20" alt="" />
          : <div className="w-20 h-20 rounded-2xl bg-[#e8f1fc] text-[#08428C] font-black flex items-center justify-center text-2xl">
              {me.full_name.split(' ').map(x => x[0]).slice(0, 2).join('')}
            </div>}
        <div className="flex-1">
          <p className="text-xs font-mono text-[#08428C] font-bold">{me.staff_code}</p>
          <p className="text-xl font-black">{me.full_name}</p>
          <p className="text-sm text-slate-500">{me.designation ?? '—'} · {me.department_name ?? 'Unassigned'}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            <Badge variant="success">{me.status}</Badge>
            <Badge variant="muted">{me.staff_type}</Badge>
            <Badge variant="info">{me.work_category}</Badge>
            {me.is_clinical && <Badge variant="danger"><HeartPulse className="w-3 h-3" /> Clinical</Badge>}
          </div>
        </div>
      </Card>

      {/* Read-only employment */}
      <Card className="p-5">
        <h4 className="font-bold mb-3 text-sm flex items-center gap-2"><User className="w-4 h-4" /> Employment details</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Info label="Staff code" value={me.staff_code} />
          <Info label="Type" value={me.staff_type} />
          <Info label="Category" value={me.work_category} />
          <Info label="Status" value={me.status} />
          <Info label="Department" value={me.department_name ?? '—'} />
          <Info label="Designation" value={me.designation ?? '—'} />
          <Info label="Hired" value={me.date_of_hire} />
          <Info label="Basic salary" value={`KES ${Number(me.basic_salary).toLocaleString()}`} />
        </div>
        <p className="text-[11px] text-slate-400 mt-3">These fields are managed by HR. Contact them if any of these details are wrong.</p>
      </Card>

      {/* Editable */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm flex items-center gap-2"><Phone className="w-4 h-4" /> Contact & emergency</h4>
          <Button size="sm" variant="primary" onClick={save} isLoading={store.updateProfile.isPending}>
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="Home address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="mt-4 p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/40">
          <p className="text-[11px] font-bold uppercase text-rose-500 mb-2">Emergency contact</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Name" value={form.emergency_name} onChange={e => setForm({ ...form, emergency_name: e.target.value })} />
            <Input label="Phone" value={form.emergency_phone} onChange={e => setForm({ ...form, emergency_phone: e.target.value })} />
            <Input label="Relation" value={form.emergency_relation} onChange={e => setForm({ ...form, emergency_relation: e.target.value })} placeholder="Spouse / Parent / Sibling" />
          </div>
        </div>
      </Card>

      {/* Bank / payroll */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm flex items-center gap-2"><Landmark className="w-4 h-4" /> Bank & payroll</h4>
          <Button size="sm" variant="primary" onClick={save} isLoading={store.updateProfile.isPending}>
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Bank name" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} />
          <Input label="Account number" value={form.bank_account_no} onChange={e => setForm({ ...form, bank_account_no: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
          <Info label="KRA PIN" value={me.tax_pin ?? '—'} />
          <Info label="NSSF" value={me.nssf_no ?? '—'} />
          <Info label="NHIF" value={me.nhif_no ?? '—'} />
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Statutory numbers are managed by HR.</p>
      </Card>
    </div>
  );
};

const Info: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
    <p className="text-[10px] uppercase text-slate-400 font-bold">{label}</p>
    <p className="font-semibold mt-0.5">{value}</p>
  </div>
);