import React, { useMemo, useState } from 'react';
import { CalendarDays, Plus, Trash2, Palette } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useTeachersStore } from '../store';
import { DAYS, SLOTS } from '../constants';

const COLOR_PALETTE = ['#08428C', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#22c55e', '#f43f5e'];

export const Timetable: React.FC<{ store: ReturnType<typeof useTeachersStore> }> = ({ store }) => {
  const [addOpen, setAddOpen] = useState<{ day: string; slot: string } | null>(null);
  const [form, setForm] = useState<any>({ subject: '', class_name: '', room: '', color: COLOR_PALETTE[0] });

  const grid = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    DAYS.forEach(d => { map[d] = {}; });
    store.myTimetable.forEach(t => {
      map[t.day] = map[t.day] ?? {};
      map[t.day][t.slot] = t;
    });
    return map;
  }, [store.myTimetable]);

  const submit = async () => {
    if (!addOpen || !form.subject || !form.class_name) return;
    await store.addTimetable.mutateAsync({
      staff_id: store.activeTeacherId,
      day: addOpen.day as any,
      slot: addOpen.slot as any,
      subject: form.subject,
      class_name: form.class_name,
      room: form.room,
      color: form.color,
      academic_year: String(new Date().getFullYear()),
    } as any);
    setAddOpen(null);
    setForm({ subject: '', class_name: '', room: '', color: COLOR_PALETTE[0] });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 text-xs text-slate-500 flex items-start gap-2">
        <CalendarDays className="w-4 h-4 mt-0.5 text-[#08428C] shrink-0" />
        <div>
          <b className="text-slate-700 dark:text-slate-200">Weekly timetable</b> for {store.activeTeacher?.first_name} {store.activeTeacher?.last_name}.
          Click any empty cell to assign a lesson. Click a cell to delete it.
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase text-slate-400">
              <th className="py-3 px-3 text-left w-24">Period</th>
              {DAYS.map(d => <th key={d} className="py-3 px-2 text-center min-w-[130px]">{d}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {SLOTS.map(slot => {
              const period = store.periods.find(p => p.slot === slot);
              const isBreak = period?.is_break;
              return (
                <tr key={slot} className={isBreak ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}>
                  <td className="py-2 px-3">
                    <p className="font-bold text-xs">{slot}</p>
                    {period && <p className="text-[10px] font-mono text-slate-400">{period.starts_at.slice(0, 5)}</p>}
                  </td>
                  {DAYS.map(day => {
                    const cell = grid[day]?.[slot];
                    if (isBreak) return <td key={day} className="py-2 px-1 text-center text-slate-400 text-[10px] italic">— {slot} —</td>;
                    return (
                      <td key={day} className="py-2 px-1">
                        {cell ? (
                          <button
                            onClick={() => { if (confirm(`Remove ${cell.subject} from ${day} ${slot}?`)) store.deleteTimetable.mutate(cell.id); }}
                            className="w-full rounded-lg p-2 text-left text-white text-xs shadow-sm hover:shadow-md transition-all"
                            style={{ backgroundColor: cell.color ?? '#08428C' }}
                          >
                            <p className="font-bold truncate">{cell.subject}</p>
                            <p className="text-[10px] opacity-90 truncate">{cell.class_name}</p>
                            {cell.room && <p className="text-[9px] opacity-75">Room {cell.room}</p>}
                          </button>
                        ) : (
                          <button
                            onClick={() => setAddOpen({ day, slot })}
                            className="w-full h-14 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 hover:border-[#08428C] hover:text-[#08428C] transition-colors flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Add cell dialog */}
      {addOpen && (
        <Dialog isOpen onClose={() => setAddOpen(null)} title={`Add lesson — ${addOpen.day} ${addOpen.slot}`} maxWidth="md">
          <div className="space-y-3">
            <Input label="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" />
            <Input label="Class" value={form.class_name} onChange={e => setForm({ ...form, class_name: e.target.value })} placeholder="e.g. Grade 10 North" />
            <Input label="Room" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="Optional" />
            <div>
              <p className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1"><Palette className="w-3 h-3" /> Color</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-lg border-2 ${form.color === c ? 'border-slate-900 scale-110' : 'border-transparent'} transition-all`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={submit} isLoading={store.addTimetable.isPending}>Save entry</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};