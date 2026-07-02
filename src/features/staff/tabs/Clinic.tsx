import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Plus, Search, Pill, Ambulance, Download, HeartPulse } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useStaffPortalStore, downloadCSV } from '../store';
import * as api from '../api';
import { CLINIC_VISIT_KINDS, CLINIC_OUTCOMES, CLINIC_ROUTES } from '../constants';

export const Clinic: React.FC<{ store: ReturnType<typeof useStaffPortalStore> }> = ({ store }) => {
  const [q, setQ] = useState('');
  const [kindFilter, setKindFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState<any>({ kind: 'Consultation', outcome: 'Discharged' });
  const [detail, setDetail] = useState<any>(null);
  const [dispensations, setDispensations] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [dispForm, setDispForm] = useState<any>({});
  const [refForm, setRefForm] = useState<any>({});

  useEffect(() => {
    if (!detail) { setDispensations([]); setReferrals([]); return; }
    api.fetchDispensations(detail.id).then(setDispensations).catch(() => setDispensations([]));
    api.fetchReferrals(detail.id).then(setReferrals).catch(() => setReferrals([]));
  }, [detail]);

  const filtered = useMemo(() => store.clinicVisits.filter(v => {
    if (kindFilter !== 'ALL' && v.kind !== kindFilter) return false;
    if (outcomeFilter !== 'ALL' && v.outcome !== outcomeFilter) return false;
    if (q) {
      const t = q.toLowerCase();
      const student = v.student_id ? store.students.find((s: any) => s.id === v.student_id) : null;
      const name = student ? `${student.first_name} ${student.last_name} ${student.admission_number}` : '';
      return `${v.visit_number} ${v.symptoms ?? ''} ${v.diagnosis ?? ''} ${name}`.toLowerCase().includes(t);
    }
    return true;
  }), [store.clinicVisits, store.students, q, kindFilter, outcomeFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      today: store.clinicVisits.filter(v => v.visit_date.slice(0, 10) === today).length,
      referred: store.clinicVisits.filter(v => v.outcome === 'Referred').length,
      followups: store.clinicVisits.filter(v => v.follow_up_date && new Date(v.follow_up_date) >= new Date()).length,
      total: store.clinicVisits.length,
    };
  }, [store.clinicVisits]);

  const submitVisit = async () => {
    if (!newForm.symptoms && !newForm.diagnosis) return;
    await store.createVisit.mutateAsync({
      ...newForm,
      seen_by: store.staffId,
      temperature: newForm.temperature ? Number(newForm.temperature) : undefined,
      pulse: newForm.pulse ? Number(newForm.pulse) : undefined,
      weight: newForm.weight ? Number(newForm.weight) : undefined,
      height: newForm.height ? Number(newForm.height) : undefined,
    });
    setNewOpen(false); setNewForm({ kind: 'Consultation', outcome: 'Discharged' });
  };

  const addDisp = async () => {
    if (!detail || !dispForm.medication) return;
    await store.addDispensation.mutateAsync({ ...dispForm, visit_id: detail.id });
    const refreshed = await api.fetchDispensations(detail.id);
    setDispensations(refreshed);
    setDispForm({});
  };
  const addRef = async () => {
    if (!detail || !refForm.referred_to) return;
    await store.addReferral.mutateAsync({ ...refForm, visit_id: detail.id });
    const refreshed = await api.fetchReferrals(detail.id);
    setReferrals(refreshed);
    setRefForm({});
  };

  const exportCSV = () => downloadCSV('clinic-visits.csv', filtered.map(v => {
    const student = v.student_id ? store.students.find((s: any) => s.id === v.student_id) : null;
    return {
      visit_number: v.visit_number, date: v.visit_date, kind: v.kind,
      patient: student ? `${student.first_name} ${student.last_name}` : 'Staff member',
      diagnosis: v.diagnosis ?? '', outcome: v.outcome, follow_up: v.follow_up_date ?? '',
    };
  }));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><p className="text-[11px] uppercase text-slate-400 font-bold">Visits today</p><p className="text-2xl font-black text-rose-600 mt-1">{stats.today}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase text-slate-400 font-bold">Referrals</p><p className="text-2xl font-black text-amber-600 mt-1">{stats.referred}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase text-slate-400 font-bold">Upcoming follow-ups</p><p className="text-2xl font-black text-sky-600 mt-1">{stats.followups}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase text-slate-400 font-bold">Total on record</p><p className="text-2xl font-black text-[#08428C] mt-1">{stats.total}</p></Card>
      </div>

      {/* Toolbar */}
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search visit, symptom, diagnosis, patient…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        </div>
        <select value={kindFilter} onChange={e => setKindFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All kinds</option>{CLINIC_VISIT_KINDS.map(k => <option key={k}>{k}</option>)}
        </select>
        <select value={outcomeFilter} onChange={e => setOutcomeFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All outcomes</option>{CLINIC_OUTCOMES.map(k => <option key={k}>{k}</option>)}
        </select>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="w-3.5 h-3.5" /> Export</Button>
        <Button size="sm" variant="primary" onClick={() => setNewOpen(true)}><Plus className="w-3.5 h-3.5" /> New visit</Button>
      </Card>

      {/* Visits */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={store.clinicVisits.length === 0 ? 'No clinic visits yet' : 'No visits match your filters'}
          description="Record a consultation, first-aid, follow-up, or emergency."
          actionLabel={store.clinicVisits.length === 0 ? 'Record first visit' : undefined}
          onAction={store.clinicVisits.length === 0 ? () => setNewOpen(true) : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 px-5 text-left">Visit</th>
                <th className="py-3 px-5 text-left">Patient</th>
                <th className="py-3 px-5 text-left">Complaint / Diagnosis</th>
                <th className="py-3 px-5">Kind</th>
                <th className="py-3 px-5">Outcome</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(v => {
                const student = v.student_id ? store.students.find((s: any) => s.id === v.student_id) : null;
                return (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => setDetail(v)}>
                    <td className="py-3 px-5">
                      <p className="font-mono text-xs font-bold text-rose-600">{v.visit_number}</p>
                      <p className="text-[11px] text-slate-500">{new Date(v.visit_date).toLocaleString()}</p>
                    </td>
                    <td className="py-3 px-5">
                      {student
                        ? <>
                            <p className="font-semibold text-sm">{student.first_name} {student.last_name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{student.admission_number} · {student.class_name}</p>
                          </>
                        : <span className="text-xs text-slate-500 italic">Staff member</span>}
                    </td>
                    <td className="py-3 px-5 text-xs">
                      <p className="font-semibold">{v.diagnosis ?? '—'}</p>
                      <p className="text-slate-500 line-clamp-1">{v.symptoms ?? ''}</p>
                    </td>
                    <td className="py-3 px-5"><Badge variant="info">{v.kind}</Badge></td>
                    <td className="py-3 px-5">
                      <Badge variant={v.outcome === 'Discharged' ? 'success' : v.outcome === 'Referred' ? 'warning' : v.outcome === 'Admitted' ? 'danger' : 'muted'}>{v.outcome}</Badge>
                    </td>
                    <td className="py-3 px-5 text-right text-[11px] text-slate-400">
                      {v.follow_up_date && <span>FU: {v.follow_up_date}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* New visit dialog */}
      <Dialog isOpen={newOpen} onClose={() => setNewOpen(false)} title="Record clinic visit" maxWidth="3xl">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Patient — student"
              options={[{ value: '', label: '— Not a student —' }, ...store.students.map((s: any) => ({ value: s.id, label: `${s.first_name} ${s.last_name} (${s.admission_number})` }))]}
              value={newForm.student_id ?? ''} onChange={e => setNewForm({ ...newForm, student_id: e.target.value || undefined })} />
            <Select label="Visit kind" options={CLINIC_VISIT_KINDS.map(k => ({ value: k, label: k }))} value={newForm.kind} onChange={e => setNewForm({ ...newForm, kind: e.target.value })} />
            <Select label="Outcome" options={CLINIC_OUTCOMES.map(k => ({ value: k, label: k }))} value={newForm.outcome} onChange={e => setNewForm({ ...newForm, outcome: e.target.value })} />
          </div>
          <Textarea label="Symptoms / complaint" value={newForm.symptoms ?? ''} onChange={e => setNewForm({ ...newForm, symptoms: e.target.value })} />
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <p className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1"><HeartPulse className="w-3 h-3" /> Vitals</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <Input label="Temp (°C)" type="number" step="0.1" value={newForm.temperature ?? ''} onChange={e => setNewForm({ ...newForm, temperature: e.target.value })} />
              <Input label="BP" value={newForm.blood_pressure ?? ''} onChange={e => setNewForm({ ...newForm, blood_pressure: e.target.value })} placeholder="120/80" />
              <Input label="Pulse" type="number" value={newForm.pulse ?? ''} onChange={e => setNewForm({ ...newForm, pulse: e.target.value })} />
              <Input label="Weight (kg)" type="number" step="0.1" value={newForm.weight ?? ''} onChange={e => setNewForm({ ...newForm, weight: e.target.value })} />
              <Input label="Height (cm)" type="number" step="0.1" value={newForm.height ?? ''} onChange={e => setNewForm({ ...newForm, height: e.target.value })} />
            </div>
          </div>
          <Input label="Diagnosis" value={newForm.diagnosis ?? ''} onChange={e => setNewForm({ ...newForm, diagnosis: e.target.value })} />
          <Textarea label="Treatment summary" value={newForm.treatment_summary ?? ''} onChange={e => setNewForm({ ...newForm, treatment_summary: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Follow-up date" type="date" value={newForm.follow_up_date ?? ''} onChange={e => setNewForm({ ...newForm, follow_up_date: e.target.value })} />
            <label className="flex items-center gap-2 text-sm pt-6">
              <input type="checkbox" checked={!!newForm.guardian_notified} onChange={e => setNewForm({ ...newForm, guardian_notified: e.target.checked })} /> Guardian notified
            </label>
          </div>
          <Textarea label="Notes" value={newForm.notes ?? ''} onChange={e => setNewForm({ ...newForm, notes: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={submitVisit} isLoading={store.createVisit.isPending}>Save visit</Button>
        </div>
      </Dialog>

      {/* Detail */}
      {detail && (
        <Dialog isOpen onClose={() => setDetail(null)} title={`Visit ${detail.visit_number}`} maxWidth="3xl">
          <div className="space-y-4">
            {/* Header */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><p className="text-slate-400 font-bold uppercase text-[10px]">Date</p><p className="font-semibold mt-0.5">{new Date(detail.visit_date).toLocaleString()}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[10px]">Kind</p><Badge variant="info">{detail.kind}</Badge></div>
              <div><p className="text-slate-400 font-bold uppercase text-[10px]">Outcome</p><Badge variant="success">{detail.outcome}</Badge></div>
              <div><p className="text-slate-400 font-bold uppercase text-[10px]">Follow-up</p><p className="mt-0.5">{detail.follow_up_date ?? '—'}</p></div>
            </div>

            {/* Vitals */}
            {(detail.temperature || detail.blood_pressure || detail.pulse) && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {[
                  { l: 'Temp', v: detail.temperature ? `${detail.temperature}°C` : '—' },
                  { l: 'BP', v: detail.blood_pressure ?? '—' },
                  { l: 'Pulse', v: detail.pulse ?? '—' },
                  { l: 'Weight', v: detail.weight ? `${detail.weight}kg` : '—' },
                  { l: 'Height', v: detail.height ? `${detail.height}cm` : '—' },
                ].map(x => (
                  <div key={x.l} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 font-bold">{x.l}</p>
                    <p className="font-mono font-bold">{x.v}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Symptoms / diagnosis / treatment */}
            {detail.symptoms && <div><p className="text-[10px] font-bold uppercase text-slate-400">Symptoms</p><p className="text-sm">{detail.symptoms}</p></div>}
            {detail.diagnosis && <div><p className="text-[10px] font-bold uppercase text-slate-400">Diagnosis</p><p className="text-sm font-semibold">{detail.diagnosis}</p></div>}
            {detail.treatment_summary && <div><p className="text-[10px] font-bold uppercase text-slate-400">Treatment</p><p className="text-sm">{detail.treatment_summary}</p></div>}

            {/* Dispensations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-bold flex items-center gap-2"><Pill className="w-4 h-4 text-emerald-600" /> Dispensations</h5>
              </div>
              {dispensations.length === 0 && <p className="text-xs text-slate-400 mb-2">None recorded yet.</p>}
              {dispensations.length > 0 && (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs mb-2">
                  {dispensations.map(d => (
                    <li key={d.id} className="py-1.5">
                      <p className="font-semibold">{d.medication} <span className="text-slate-400 text-[11px]">— {d.dosage} · {d.frequency}</span></p>
                      {d.route && <p className="text-[11px] text-slate-500">Route: {d.route} · Qty: {d.quantity ?? '—'}</p>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <Input label="Medication" value={dispForm.medication ?? ''} onChange={e => setDispForm({ ...dispForm, medication: e.target.value })} />
                  <Input label="Dosage" value={dispForm.dosage ?? ''} onChange={e => setDispForm({ ...dispForm, dosage: e.target.value })} />
                  <Input label="Qty" type="number" value={dispForm.quantity ?? ''} onChange={e => setDispForm({ ...dispForm, quantity: e.target.value })} />
                  <Select label="Route" options={[{ value: '', label: '—' }, ...CLINIC_ROUTES.map(r => ({ value: r, label: r }))]} value={dispForm.route ?? ''} onChange={e => setDispForm({ ...dispForm, route: e.target.value })} />
                  <Input label="Frequency" value={dispForm.frequency ?? ''} onChange={e => setDispForm({ ...dispForm, frequency: e.target.value })} placeholder="3x/day 5 days" />
                </div>
                <Button size="sm" variant="primary" onClick={addDisp}><Plus className="w-3.5 h-3.5" /> Add dispensation</Button>
              </div>
            </div>

            {/* Referrals */}
            <div>
              <h5 className="text-sm font-bold flex items-center gap-2 mb-2"><Ambulance className="w-4 h-4 text-amber-600" /> Referrals</h5>
              {referrals.length === 0 && <p className="text-xs text-slate-400 mb-2">None recorded yet.</p>}
              {referrals.length > 0 && (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs mb-2">
                  {referrals.map(r => (
                    <li key={r.id} className="py-1.5">
                      <p className="font-semibold">{r.referred_to} <Badge variant="warning">{r.urgency}</Badge></p>
                      {r.reason && <p className="text-[11px] text-slate-500">{r.reason}</p>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input label="Referred to" value={refForm.referred_to ?? ''} onChange={e => setRefForm({ ...refForm, referred_to: e.target.value })} placeholder="Hospital name" />
                  <Select label="Urgency" options={['Routine','Same-day','Emergency'].map(x => ({ value: x, label: x }))} value={refForm.urgency ?? 'Routine'} onChange={e => setRefForm({ ...refForm, urgency: e.target.value })} />
                  <Input label="Transported by" value={refForm.transported_by ?? ''} onChange={e => setRefForm({ ...refForm, transported_by: e.target.value })} placeholder="Ambulance / parent" />
                </div>
                <Textarea label="Reason" value={refForm.reason ?? ''} onChange={e => setRefForm({ ...refForm, reason: e.target.value })} />
                <Button size="sm" variant="primary" onClick={addRef}><Ambulance className="w-3.5 h-3.5" /> Add referral</Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};