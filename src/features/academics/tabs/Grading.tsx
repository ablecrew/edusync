import React, { useMemo, useState } from 'react';
import { Award, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useAcademicsStore } from '../store';
import { CURRICULA, CBC_LEVEL_COLORS } from '../constants';

export const Grading: React.FC<{ store: ReturnType<typeof useAcademicsStore> }> = ({ store }) => {
  const [schemeOpen, setSchemeOpen] = useState(false);
  const [bandOpen, setBandOpen] = useState<{ schemeId: string } | null>(null);
  const [compOpen, setCompOpen] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<string | null>(store.defaultScheme?.id ?? null);

  const [schemeForm, setSchemeForm] = useState<any>({ curriculum: 'CBC' });
  const [bandForm, setBandForm] = useState<any>({});
  const [compForm, setCompForm] = useState<any>({});

  const bandsFor = useMemo(() => store.bands.filter(b => b.scheme_id === selectedScheme), [store.bands, selectedScheme]);

  const submitScheme = async () => {
    if (!schemeForm.name) return;
    const rec = await store.upsertScheme.mutateAsync(schemeForm);
    setSelectedScheme((rec as any).id);
    setSchemeOpen(false); setSchemeForm({ curriculum: 'CBC' });
  };
  const submitBand = async () => {
    if (!bandOpen || !bandForm.label) return;
    await store.addBand.mutateAsync({
      scheme_id: bandOpen.schemeId, label: bandForm.label, code: bandForm.code,
      min_score: Number(bandForm.min_score) || 0, max_score: Number(bandForm.max_score) || 100,
      points: Number(bandForm.points) || 0, descriptor: bandForm.descriptor, color: bandForm.color,
    } as any);
    setBandOpen(null); setBandForm({});
  };
  const submitCompetency = async () => {
    if (!compForm.name || !compForm.code) return;
    await store.addCompetency.mutateAsync(compForm as any);
    setCompOpen(false); setCompForm({});
  };

  return (
    <div className="space-y-6">
      {/* CBC descriptor cards (from default scheme) */}
      {store.defaultBands.length > 0 && (
        <Card className="p-5">
          <h4 className="font-bold mb-3 flex items-center gap-2"><Award className="w-4 h-4" /> CBC Descriptor Reference</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {store.defaultBands.map(b => (
              <div key={b.id} className="p-4 rounded-2xl border" style={{
                background: `${b.color ?? CBC_LEVEL_COLORS[b.label] ?? '#08428C'}10`,
                borderColor: b.color ?? CBC_LEVEL_COLORS[b.label] ?? '#08428C',
              }}>
                <p className="text-[10px] uppercase font-bold" style={{ color: b.color ?? CBC_LEVEL_COLORS[b.label] ?? '#08428C' }}>
                  {b.code} · {b.min_score.toFixed(0)}–{b.max_score.toFixed(0)}
                </p>
                <p className="font-black text-sm mt-1">{b.label}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{b.descriptor}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold">Grading Schemes</h4>
            <Button size="sm" variant="primary" onClick={() => setSchemeOpen(true)}><Plus className="w-3.5 h-3.5" /> New scheme</Button>
          </div>
          <ul className="space-y-1">
            {store.schemes.map(s => (
              <li key={s.id}>
                <button onClick={() => setSelectedScheme(s.id)}
                  className={`w-full text-left p-3 rounded-xl ${selectedScheme === s.id ? 'bg-[#08428C] text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{s.name}</p>
                    {s.is_default && <Badge variant="success">Default</Badge>}
                  </div>
                  <p className={`text-[11px] ${selectedScheme === s.id ? 'text-blue-100' : 'text-slate-500'}`}>{s.curriculum}</p>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold">Grade bands</h4>
            <Button size="sm" variant="primary" onClick={() => selectedScheme && setBandOpen({ schemeId: selectedScheme })} disabled={!selectedScheme}>
              <Plus className="w-3.5 h-3.5" /> Add band
            </Button>
          </div>
          {!selectedScheme ? (
            <EmptyState icon={Award} title="Pick a scheme" description="Select a scheme on the left to see and manage its bands." />
          ) : bandsFor.length === 0 ? (
            <EmptyState icon={Award} title="No bands yet" description="Add score bands (e.g. 80-100 = Exceeding)." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {bandsFor.map(b => (
                <li key={b.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{b.label} <span className="text-slate-400 font-mono text-[11px]">({b.code})</span></p>
                    <p className="text-[11px] text-slate-500">{b.min_score.toFixed(0)}–{b.max_score.toFixed(0)}{b.points != null && ` · ${b.points} pts`}</p>
                  </div>
                  <button onClick={() => store.removeBand.mutate(b.id)} className="p-1 rounded-lg text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold">Competency Library</h4>
          <Button size="sm" variant="primary" onClick={() => setCompOpen(true)}><Plus className="w-3.5 h-3.5" /> New competency</Button>
        </div>
        {store.competencies.length === 0 ? (
          <EmptyState icon={Award} title="No competencies yet" description="Define reusable competency descriptors mapped to subjects and sub-strands." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {store.competencies.map(c => (
              <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="font-mono text-[10px] font-bold text-slate-500">{c.code}</p>
                <p className="font-semibold text-sm mt-1">{c.name}</p>
                {c.descriptor && <p className="text-[11px] text-slate-500 mt-1">{c.descriptor}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <Dialog isOpen={schemeOpen} onClose={() => setSchemeOpen(false)} title="New grading scheme" maxWidth="lg">
        <div className="space-y-3">
          <Input label="Name" value={schemeForm.name ?? ''} onChange={e => setSchemeForm({ ...schemeForm, name: e.target.value })} placeholder="CBC 2025" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Curriculum" options={CURRICULA.map(c => ({ value: c, label: c }))} value={schemeForm.curriculum} onChange={e => setSchemeForm({ ...schemeForm, curriculum: e.target.value })} />
            <label className="flex items-center gap-2 text-sm pt-4">
              <input type="checkbox" checked={!!schemeForm.is_default} onChange={e => setSchemeForm({ ...schemeForm, is_default: e.target.checked })} /> Default scheme
            </label>
          </div>
          <Textarea label="Description" value={schemeForm.description ?? ''} onChange={e => setSchemeForm({ ...schemeForm, description: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={submitScheme}>Save scheme</Button>
        </div>
      </Dialog>

      <Dialog isOpen={!!bandOpen} onClose={() => setBandOpen(null)} title="Grade band" maxWidth="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Label" value={bandForm.label ?? ''} onChange={e => setBandForm({ ...bandForm, label: e.target.value })} placeholder="Exceeding Expectations" />
            <Input label="Code" value={bandForm.code ?? ''} onChange={e => setBandForm({ ...bandForm, code: e.target.value })} placeholder="EE" />
            <Input label="Points" type="number" value={bandForm.points ?? ''} onChange={e => setBandForm({ ...bandForm, points: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Min score" type="number" value={bandForm.min_score ?? ''} onChange={e => setBandForm({ ...bandForm, min_score: e.target.value })} />
            <Input label="Max score" type="number" value={bandForm.max_score ?? ''} onChange={e => setBandForm({ ...bandForm, max_score: e.target.value })} />
          </div>
          <Textarea label="Descriptor" value={bandForm.descriptor ?? ''} onChange={e => setBandForm({ ...bandForm, descriptor: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={submitBand}>Save band</Button>
        </div>
      </Dialog>

      <Dialog isOpen={compOpen} onClose={() => setCompOpen(false)} title="New competency" maxWidth="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Code" value={compForm.code ?? ''} onChange={e => setCompForm({ ...compForm, code: e.target.value })} placeholder="MATH.C1" />
            <Input label="Name" value={compForm.name ?? ''} onChange={e => setCompForm({ ...compForm, name: e.target.value })} />
          </div>
          <Select label="Subject" options={[{ value: '', label: '—' }, ...store.subjects.map(s => ({ value: s.id, label: s.name }))]}
            value={compForm.subject_id ?? ''} onChange={e => setCompForm({ ...compForm, subject_id: e.target.value })} />
          <Textarea label="Descriptor" value={compForm.descriptor ?? ''} onChange={e => setCompForm({ ...compForm, descriptor: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={submitCompetency}>Save competency</Button>
        </div>
      </Dialog>
    </div>
  );
};