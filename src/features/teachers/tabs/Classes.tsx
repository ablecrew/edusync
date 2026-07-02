import React, { useMemo, useState, useEffect } from 'react';
import { Users, Search, Phone, Mail, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useTeachersStore } from '../store';
import * as api from '../api';

export const Classes: React.FC<{ store: ReturnType<typeof useTeachersStore> }> = ({ store }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [q, setQ] = useState('');

  const classSummary = useMemo(() => {
    const map: Record<string, { subjects: Set<string>; totalHours: number }> = {};
    store.myTimetable.forEach(t => {
      map[t.class_name] = map[t.class_name] ?? { subjects: new Set(), totalHours: 0 };
      map[t.class_name].subjects.add(t.subject);
      map[t.class_name].totalHours += 1;
    });
    return Object.entries(map).map(([name, v]) => ({ name, subjects: Array.from(v.subjects), lessons: v.totalHours }));
  }, [store.myTimetable]);

  useEffect(() => {
    if (!selected) { setRoster([]); return; }
    api.fetchStudentsForClass(selected).then(setRoster).catch(() => setRoster([]));
  }, [selected]);

  const filteredRoster = roster.filter(s => {
    if (!q) return true;
    return `${s.first_name} ${s.last_name} ${s.admission_number}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {classSummary.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No classes assigned"
          description="Add timetable entries in the Timetable tab and your classes will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classSummary.map(c => (
            <Card
              key={c.name}
              className={`p-4 cursor-pointer transition-all ${selected === c.name ? 'ring-2 ring-[#08428C] shadow-md' : 'hover:shadow-md'}`}
              onClick={() => setSelected(c.name)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{c.subjects.length} subject{c.subjects.length === 1 ? '' : 's'}</p>
                </div>
                <Badge variant="primary">{c.lessons} lesson{c.lessons === 1 ? '' : 's'}/wk</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.subjects.map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 font-semibold">{s}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <Card>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-bold">Roster — {selected}</h4>
              <p className="text-[11px] text-slate-500">{roster.length} active learner{roster.length === 1 ? '' : 's'}</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
                className="pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
          </div>
          {filteredRoster.length === 0 ? (
            <EmptyState icon={Users} title={roster.length === 0 ? 'No learners in this class' : 'No learners match your search'}
              description="Confirm class name matches the students table." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Learner</th>
                  <th className="py-3 px-5 text-left">Admission</th>
                  <th className="py-3 px-5 text-left">Guardian</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRoster.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {s.avatar_url
                          ? <img src={s.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                          : <div className="w-9 h-9 rounded-full bg-[#e8f1fc] text-[#08428C] font-bold flex items-center justify-center text-xs">{s.first_name[0]}{s.last_name[0]}</div>}
                        <div>
                          <p className="font-bold">{s.first_name} {s.last_name}</p>
                          <p className="text-[11px] text-slate-500">{s.gender ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-mono text-xs">{s.admission_number}</td>
                    <td className="py-3 px-5">
                      <p className="text-xs">{s.guardian_name}</p>
                      {s.guardian_phone && <a href={`tel:${s.guardian_phone}`} className="text-[11px] font-mono text-[#08428C] flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {s.guardian_phone}</a>}
                      {s.guardian_email && <a href={`mailto:${s.guardian_email}`} className="text-[11px] text-[#08428C] flex items-center gap-1"><Mail className="w-3 h-3" /> {s.guardian_email}</a>}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <a href={`#/dashboard/students?id=${s.id}`} className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc] inline-block" title="Full profile">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
};