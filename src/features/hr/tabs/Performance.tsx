import React, { useMemo, useState } from 'react';
import { Award, Plus, Star, TrendingUp, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useHrStore } from '../store';
import { SKILL_LEVELS } from '../constants';

export const Performance: React.FC<{ store: ReturnType<typeof useHrStore> }> = ({ store }) => {
  const [staffId, setStaffId] = useState<string>('');
  const [appraisalOpen, setAppraisalOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [aForm, setAForm] = useState<any>({ period_label: '', status: 'Draft' });
  const [sForm, setSForm] = useState<any>({ skill: '', level: 'Intermediate' });

  const chosen = staffId ? store.staffById(staffId) : null;
  const myAppraisals = useMemo(() => store.appraisals.filter(a => a.staff_id === staffId), [store.appraisals, staffId]);
  const mySkills     = useMemo(() => store.skills.filter(s => s.staff_id === staffId), [store.skills, staffId]);

  const submitAppraisal = async () => {
    if (!staffId || !aForm.period_label) return;
    await store.upsertAppraisal.mutateAsync({
      staff_id: staffId,
      period_label: aForm.period_label,
      self_score: Number(aForm.self_score) || undefined,
      manager_score: Number(aForm.manager_score) || undefined,
      final_score: Number(aForm.final_score) || undefined,
      self_comments: aForm.self_comments,
      manager_comments: aForm.manager_comments,
      status: aForm.status,
      reviewer_name: aForm.reviewer_name,
      goals: [], competencies: [],
    });
    setAppraisalOpen(false); setAForm({ period_label: '', status: 'Draft' });
  };

  const submitSkill = async () => {
    if (!staffId || !sForm.skill) return;
    await store.addSkill.mutateAsync({
      staff_id: staffId, skill: sForm.skill, level: sForm.level,
      certified: !!sForm.certified, acquired_on: sForm.acquired_on, notes: sForm.notes,
    });
    setSkillOpen(false); setSForm({ skill: '', level: 'Intermediate' });
  };

  return (
    <div className="space-y-6">
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <Select label="Staff"
          options={[{ value: '', label: '— Choose a staff member —' }, ...store.staff.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name} · ${s.staff_code}` }))]}
          value={staffId} onChange={e => setStaffId(e.target.value)} />
      </Card>

      {!chosen ? (
        <EmptyState icon={Award} title="Choose a staff member" description="Pick a person from the dropdown to review or record appraisals and skills." />
      ) : (
        <>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Appraisals</h4>
                <p className="text-xs text-slate-500">Quarterly/annual reviews for {chosen.first_name}</p>
              </div>
              <Button size="sm" variant="primary" onClick={() => { setAForm({ period_label: `${new Date().getFullYear()} Q${Math.ceil((new Date().getMonth() + 1) / 3)}`, status: 'Draft' }); setAppraisalOpen(true); }}>
                <Plus className="w-3.5 h-3.5" /> New appraisal
              </Button>
            </div>
            {myAppraisals.length === 0 ? (
              <EmptyState icon={Award} title="No appraisals yet" description="Record self-scores, manager scores, and finalized ratings for this staff member." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 font-bold">
                    <th className="text-left py-2">Period</th>
                    <th className="text-right py-2">Self</th>
                    <th className="text-right py-2">Manager</th>
                    <th className="text-right py-2">Final</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Reviewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myAppraisals.map(a => (
                    <tr key={a.id}>
                      <td className="py-2 font-semibold">{a.period_label}</td>
                      <td className="py-2 text-right font-mono">{a.self_score ?? '—'}</td>
                      <td className="py-2 text-right font-mono">{a.manager_score ?? '—'}</td>
                      <td className="py-2 text-right font-mono font-bold">{a.final_score ?? '—'}</td>
                      <td className="py-2"><Badge variant={a.status === 'Finalized' ? 'success' : 'muted'}>{a.status}</Badge></td>
                      <td className="py-2 text-xs">{a.reviewer_name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Skills & competencies</h4>
                <p className="text-xs text-slate-500">Skill matrix for {chosen.first_name}</p>
              </div>
              <Button size="sm" variant="primary" onClick={() => setSkillOpen(true)}><Plus className="w-3.5 h-3.5" /> Add skill</Button>
            </div>
            {mySkills.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No skills tracked" description="Record certifications, teaching methodologies, tools, and competencies." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {mySkills.map(sk => (
                  <div key={sk.id} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
                    <div>
                      <p className="text-sm font-semibold">{sk.skill}</p>
                      <p className="text-[11px] text-slate-500">{sk.level ?? '—'}{sk.certified && ' · certified'}</p>
                    </div>
                    <button onClick={() => store.removeSkill.mutate(sk.id)} className="p-1 rounded-lg text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <Dialog isOpen={appraisalOpen} onClose={() => setAppraisalOpen(false)} title="Appraisal" maxWidth="lg">
        <div className="space-y-3">
          <Input label="Period label" value={aForm.period_label} onChange={e => setAForm({ ...aForm, period_label: e.target.value })} placeholder="e.g. 2026 Q1" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input label="Self score" type="number" step="0.1" value={aForm.self_score ?? ''} onChange={e => setAForm({ ...aForm, self_score: e.target.value })} />
            <Input label="Manager score" type="number" step="0.1" value={aForm.manager_score ?? ''} onChange={e => setAForm({ ...aForm, manager_score: e.target.value })} />
            <Input label="Final score" type="number" step="0.1" value={aForm.final_score ?? ''} onChange={e => setAForm({ ...aForm, final_score: e.target.value })} />
          </div>
          <Textarea label="Self comments" value={aForm.self_comments ?? ''} onChange={e => setAForm({ ...aForm, self_comments: e.target.value })} />
          <Textarea label="Manager comments" value={aForm.manager_comments ?? ''} onChange={e => setAForm({ ...aForm, manager_comments: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input label="Reviewer name" value={aForm.reviewer_name ?? ''} onChange={e => setAForm({ ...aForm, reviewer_name: e.target.value })} />
            <Select label="Status" options={['Draft','Self-Review','Manager-Review','Finalized'].map(x => ({ value: x, label: x }))}
              value={aForm.status} onChange={e => setAForm({ ...aForm, status: e.target.value })} />
          </div>
          <Button variant="primary" className="w-full" onClick={submitAppraisal}>Save appraisal</Button>
        </div>
      </Dialog>

      <Dialog isOpen={skillOpen} onClose={() => setSkillOpen(false)} title="Add skill" maxWidth="sm">
        <div className="space-y-3">
          <Input label="Skill" value={sForm.skill} onChange={e => setSForm({ ...sForm, skill: e.target.value })} placeholder="e.g. IB Physics teaching" />
          <Select label="Level" options={SKILL_LEVELS.map(l => ({ value: l, label: l }))} value={sForm.level} onChange={e => setSForm({ ...sForm, level: e.target.value })} />
          <Input label="Acquired on" type="date" value={sForm.acquired_on ?? ''} onChange={e => setSForm({ ...sForm, acquired_on: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!sForm.certified} onChange={e => setSForm({ ...sForm, certified: e.target.checked })} /> Certified
          </label>
          <Button variant="primary" className="w-full" onClick={submitSkill}>Save skill</Button>
        </div>
      </Dialog>
    </div>
  );
};