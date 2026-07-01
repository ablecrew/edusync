import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Download, Users, GraduationCap, FileText, UserPlus, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useStudentsStore, downloadCSV } from '../store';

const COLORS = ['#08428C', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#22c55e', '#64748b'];

export const Reports: React.FC<{ store: ReturnType<typeof useStudentsStore> }> = ({ store }) => {
  const [kind, setKind] = useState<'roster' | 'admissions' | 'guardians' | 'documents'>('roster');

  const byClass = useMemo(() => {
    const map: Record<string, number> = {};
    store.students.forEach(s => { map[s.class_name] = (map[s.class_name] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [store.students]);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    store.students.forEach(s => { map[s.status] = (map[s.status] ?? 0) + 1; });
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [store.students]);

  const admissionFunnel = useMemo(() => [
    { stage: 'Inquiries', count: store.inquiries.length },
    { stage: 'Applications', count: store.applications.length },
    { stage: 'Approved', count: store.applications.filter(a => a.status === 'Approved' || a.status === 'Enrolled').length },
    { stage: 'Enrolled', count: store.applications.filter(a => a.status === 'Enrolled').length },
  ], [store.inquiries, store.applications]);

  const inquirySources = useMemo(() => {
    const map: Record<string, number> = {};
    store.inquiries.forEach(i => { map[i.source || 'Unknown'] = (map[i.source || 'Unknown'] ?? 0) + 1; });
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [store.inquiries]);

  const rosterRows = () => store.students.map(s => ({
    admission_number: s.admission_number,
    first_name: s.first_name,
    last_name: s.last_name,
    gender: s.gender,
    class_name: s.class_name,
    stream: s.stream ?? '',
    section: s.section ?? '',
    status: s.status,
    enrolled_date: s.enrolled_date,
    guardian_name: s.guardian_name,
    guardian_phone: s.guardian_phone,
    guardian_email: s.guardian_email ?? '',
    fee_balance: s.fee_balance,
  }));

  const admissionRows = () => store.applications.map(a => ({
    application_no: a.application_no,
    first_name: a.first_name,
    last_name: a.last_name,
    applying_for: a.applying_for_class,
    status: a.status,
    entrance_score: a.entrance_score ?? '',
    interview_date: a.interview_date ?? '',
    guardian_name: a.guardian_name,
    guardian_phone: a.guardian_phone,
    submitted_at: a.submitted_at,
    decision_by: a.decision_by ?? '',
    decision_reason: a.decision_reason ?? '',
  }));

  const guardianRows = () => store.students.map(s => ({
    student: `${s.first_name} ${s.last_name}`,
    admission_number: s.admission_number,
    class: s.class_name,
    guardian_name: s.guardian_name,
    guardian_phone: s.guardian_phone,
    guardian_email: s.guardian_email ?? '',
    address: s.address ?? '',
  }));

  const documentRows = () => store.documents.map(d => {
    const s = store.studentById(d.student_id);
    return {
      admission_number: s?.admission_number ?? '',
      student: s ? `${s.first_name} ${s.last_name}` : '',
      doc_type: d.doc_type,
      file_name: d.file_name,
      uploaded_by: d.uploaded_by ?? '',
      uploaded_at: d.uploaded_at,
    };
  });

  const exportCurrent = () => {
    if (kind === 'roster') downloadCSV('student-roster.csv', rosterRows());
    if (kind === 'admissions') downloadCSV('admissions.csv', admissionRows());
    if (kind === 'guardians') downloadCSV('guardian-contacts.csv', guardianRows());
    if (kind === 'documents') downloadCSV('documents.csv', documentRows());
  };

  return (
    <div className="space-y-6">
      {/* KPI band */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">Enrolled<Users className="w-3.5 h-3.5 text-[#08428C]" /></div>
          <p className="text-2xl font-black mt-1">{store.stats.total}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">Graduated<GraduationCap className="w-3.5 h-3.5 text-emerald-600" /></div>
          <p className="text-2xl font-black mt-1">{store.stats.graduated}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">Applications<UserPlus className="w-3.5 h-3.5 text-amber-600" /></div>
          <p className="text-2xl font-black mt-1">{store.applications.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">Documents<FileText className="w-3.5 h-3.5 text-sky-600" /></div>
          <p className="text-2xl font-black mt-1">{store.documents.length}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <h4 className="font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#08428C]" /> Admission Funnel</h4>
          {admissionFunnel.every(a => a.count === 0) ? (
            <EmptyState icon={TrendingUp} title="No admissions activity yet" description="Once inquiries and applications flow in, the funnel will visualize here." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={admissionFunnel}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="stage" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#08428C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h4 className="font-bold mb-3">By Status</h4>
          {byStatus.length === 0 ? (
            <EmptyState icon={Users} title="No students yet" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                    {byStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h4 className="font-bold mb-3">Class Distribution</h4>
          {byClass.length === 0 ? (
            <EmptyState icon={Users} title="No students to plot" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={byClass} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                  <XAxis type="number" allowDecimals={false} fontSize={11} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={140} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h4 className="font-bold mb-3">Inquiry Sources</h4>
          {inquirySources.length === 0 ? (
            <EmptyState icon={UserPlus} title="No inquiries yet" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={inquirySources} dataKey="value" nameKey="name" outerRadius={80}>
                    {inquirySources.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Report exporter */}
      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h4 className="font-bold flex items-center gap-2"><Download className="w-4 h-4" /> Export Reports</h4>
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { id: 'roster', label: 'Student Roster' },
              { id: 'admissions', label: 'Admissions' },
              { id: 'guardians', label: 'Guardian Contacts' },
              { id: 'documents', label: 'Documents' },
            ].map(k => (
              <button
                key={k.id}
                onClick={() => setKind(k.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full cursor-pointer ${
                  kind === k.id ? 'bg-[#08428C] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                {k.label}
              </button>
            ))}
            <Button variant="outline" size="sm" onClick={exportCurrent}><Download className="w-3.5 h-3.5" /> Export CSV</Button>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Currently selected: <Badge variant="primary">{kind}</Badge> —{' '}
          {kind === 'roster' && `${rosterRows().length} rows`}
          {kind === 'admissions' && `${admissionRows().length} rows`}
          {kind === 'guardians' && `${guardianRows().length} rows`}
          {kind === 'documents' && `${documentRows().length} rows`}
        </p>
      </Card>
    </div>
  );
};