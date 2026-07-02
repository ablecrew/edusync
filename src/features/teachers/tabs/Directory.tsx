import React, { useMemo, useState } from 'react';
import { Search, Users, Eye, Award, BookOpen, DollarSign, Trash2, Edit } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useTeachersStore } from '../store';

export const Directory: React.FC<{ store: ReturnType<typeof useTeachersStore> }> = ({ store }) => {
  const [q, setQ] = useState('');
  const [view, setView] = useState<any>(null);

  const rows = useMemo(() => {
    return store.teachers
      .map(t => {
        const dash = store.dashboard.find(d => d.staff_id === t.id);
        return { ...t, ...dash };
      })
      .filter(t => !q || `${t.first_name} ${t.last_name} ${t.staff_code} ${t.email ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  }, [store.teachers, store.dashboard, q]);

  return (
    <div className="space-y-6">
      <Card className="p-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search teachers…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        </div>
        <Badge variant="muted">Manage full HR records in the HR module</Badge>
      </Card>

      {rows.length === 0 ? (
        <EmptyState icon={Users} title={store.teachers.length === 0 ? 'No teaching staff on the roster' : 'No teachers match your search'}
          description="Add staff with staff_type = 'Teaching' in the HR module." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 px-5 text-left">Teacher</th>
                <th className="py-3 px-5 text-left">Contact</th>
                <th className="py-3 px-5 text-center">Classes</th>
                <th className="py-3 px-5 text-center">Subjects</th>
                <th className="py-3 px-5 text-center">Today</th>
                <th className="py-3 px-5 text-right">Pending grading</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      {t.photo_url
                        ? <img src={t.photo_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                        : <div className="w-9 h-9 rounded-full bg-[#e8f1fc] text-[#08428C] font-bold flex items-center justify-center text-xs">{t.first_name[0]}{t.last_name[0]}</div>}
                      <div>
                        <p className="font-bold">{t.first_name} {t.last_name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{t.staff_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-xs">
                    {t.email && <p>{t.email}</p>}
                    {t.phone && <p className="font-mono text-slate-500">{t.phone}</p>}
                  </td>
                  <td className="py-3 px-5 text-center font-bold">{t.class_count ?? 0}</td>
                  <td className="py-3 px-5 text-center font-bold">{t.subject_count ?? 0}</td>
                  <td className="py-3 px-5 text-center">
                    {t.lessons_today > 0 ? <Badge variant="primary">{t.lessons_today}</Badge> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 px-5 text-right font-mono">
                    {t.pending_grading > 0 ? <span className="text-rose-600 font-bold">{t.pending_grading}</span> : <span className="text-slate-400">0</span>}
                  </td>
                  <td className="py-3 px-5"><Badge variant={t.status === 'Active' ? 'success' : 'warning'}>{t.status}</Badge></td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setView(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc]"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => store.setActiveTeacherId(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title="Switch to this teacher">
                        <Award className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {view && (
        <Dialog isOpen onClose={() => setView(null)} title={`${view.first_name} ${view.last_name}`} maxWidth="xl">
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              {view.photo_url
                ? <img src={view.photo_url} className="w-16 h-16 rounded-full object-cover ring-4 ring-[#08428C]/20" alt="" />
                : <div className="w-16 h-16 rounded-full bg-[#e8f1fc] text-[#08428C] font-bold flex items-center justify-center text-lg">{view.first_name[0]}{view.last_name[0]}</div>}
              <div>
                <p className="text-xs font-mono text-[#08428C] font-bold">{view.staff_code}</p>
                <p className="text-sm">{view.designation ?? 'Teacher'}</p>
                <div className="flex gap-1 mt-1">
                  <Badge variant={view.status === 'Active' ? 'success' : 'warning'}>{view.status}</Badge>
                  <Badge variant="info">{view.staff_type}</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <p className="font-bold uppercase text-[10px] text-slate-400 mb-1">Contact</p>
                {view.email && <p>{view.email}</p>}
                {view.phone && <p className="font-mono">{view.phone}</p>}
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <p className="font-bold uppercase text-[10px] text-emerald-500 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Compensation</p>
                <p className="font-mono font-bold text-lg">KES {Number(view.basic_salary ?? 0).toLocaleString()}</p>
              </div>
            </div>
            {(view.subjects_taught?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-2 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Subjects</p>
                <div className="flex flex-wrap gap-1">
                  {view.subjects_taught.map((s: string, i: number) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-[#e8f1fc] text-[#08428C] text-xs font-bold">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="primary" className="w-full" onClick={() => { store.setActiveTeacherId(view.id); setView(null); }}>
                Switch to this teacher's workspace
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};