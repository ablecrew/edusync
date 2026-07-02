import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, User, ClipboardCheck, Award, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { useTeachersStore } from '../store';
import * as api from '../api';

export const Progress: React.FC<{ store: ReturnType<typeof useTeachersStore> }> = ({ store }) => {
  const [className, setClassName] = useState(store.myClassNames[0] ?? '');
  const [roster, setRoster] = useState<any[]>([]);
  const [studentId, setStudentId] = useState<string>('');

  useEffect(() => {
    if (!className) return;
    api.fetchStudentsForClass(className).then(r => {
      setRoster(r);
      if (r.length > 0) setStudentId(r[0].id);
    });
  }, [className]);

  const student = roster.find(s => s.id === studentId);

  const attendanceRows = store.attendance.filter(a => a.student_id === studentId);
  const attendanceRate = useMemo(() => {
    if (attendanceRows.length === 0) return null;
    const present = attendanceRows.filter(a => a.status === 'Present' || a.status === 'Late').length;
    return Math.round((present / attendanceRows.length) * 100);
  }, [attendanceRows]);

  const mySubs = store.submissions.filter(s => s.student_id === studentId && s.score != null);
  const scoreSeries = useMemo(() => mySubs.map(s => {
    const a = store.myAssessments.find(x => x.id === s.assessment_id);
    return {
      title: a?.title?.slice(0, 15) ?? '—',
      score: a?.max_score ? Math.round((Number(s.score) / a.max_score) * 100) : Number(s.score),
    };
  }).slice(0, 10), [mySubs, store.myAssessments]);

  const avgScore = scoreSeries.length > 0
    ? Math.round(scoreSeries.reduce((a, s) => a + s.score, 0) / scoreSeries.length)
    : null;

  const notes = store.behavior.filter(b => b.student_id === studentId).slice(0, 10);

  return (
    <div className="space-y-6">
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <Select label="Class" options={store.myClassNames.map(c => ({ value: c, label: c }))} value={className} onChange={e => setClassName(e.target.value)} />
        <Select label="Learner" options={roster.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))} value={studentId} onChange={e => setStudentId(e.target.value)} />
      </Card>

      {!student ? (
        <EmptyState icon={User} title="Pick a class and learner" description="Choose one of your classes above to see individual progress." />
      ) : (
        <>
          <Card className="p-5 flex items-center gap-4">
            {student.avatar_url
              ? <img src={student.avatar_url} className="w-16 h-16 rounded-full object-cover" alt="" />
              : <div className="w-16 h-16 rounded-full bg-[#e8f1fc] text-[#08428C] font-bold flex items-center justify-center text-xl">{student.first_name[0]}{student.last_name[0]}</div>}
            <div className="flex-1">
              <p className="text-lg font-black">{student.first_name} {student.last_name}</p>
              <p className="text-xs font-mono text-slate-500">{student.admission_number} · {student.class_name}</p>
            </div>
            <div className="flex gap-2">
              <div className="text-center px-3 py-2 rounded-xl bg-emerald-50">
                <p className="text-[10px] text-emerald-500 font-bold uppercase">Attendance</p>
                <p className="text-lg font-black text-emerald-600">{attendanceRate != null ? `${attendanceRate}%` : '—'}</p>
              </div>
              <div className="text-center px-3 py-2 rounded-xl bg-[#e8f1fc]">
                <p className="text-[10px] text-[#08428C] font-bold uppercase">Avg score</p>
                <p className="text-lg font-black text-[#08428C]">{avgScore != null ? `${avgScore}%` : '—'}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h4 className="font-bold flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4" /> Score trend</h4>
              {scoreSeries.length === 0 ? (
                <EmptyState icon={Award} title="No graded work yet" description="Once you grade this learner's submissions, trends appear here." />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <LineChart data={scoreSeries}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                      <XAxis dataKey="title" fontSize={10} />
                      <YAxis domain={[0, 100]} fontSize={10} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#08428C" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h4 className="font-bold flex items-center gap-2 mb-3"><ClipboardCheck className="w-4 h-4" /> Recent attendance</h4>
              {attendanceRows.length === 0 ? (
                <EmptyState icon={ClipboardCheck} title="No records yet" />
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                  {attendanceRows.slice(0, 15).map(a => (
                    <li key={a.id} className="py-2 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-mono text-xs">{a.date}</p>
                        <p className="text-[11px] text-slate-500">{a.subject ?? '—'}</p>
                      </div>
                      <Badge variant={a.status === 'Present' ? 'success' : a.status === 'Absent' ? 'danger' : 'warning'}>{a.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="p-5">
            <h4 className="font-bold flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4" /> Behavior & remarks</h4>
            {notes.length === 0 ? (
              <EmptyState icon={MessageSquare} title="No notes recorded" description="Log positive recognition, concerns, or interventions from the Attendance tab." />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {notes.map(n => (
                  <li key={n.id} className="py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={n.kind === 'Positive' ? 'success' : n.kind === 'Serious' ? 'danger' : 'warning'}>{n.kind}</Badge>
                      {n.category && <span className="text-[11px] text-slate-500">{n.category}</span>}
                      <span className="text-[11px] text-slate-400 ml-auto font-mono">{n.date}</span>
                    </div>
                    <p className="text-xs">{n.note}</p>
                    {n.action_taken && <p className="text-[11px] text-slate-500 mt-1"><b>Action:</b> {n.action_taken}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
};