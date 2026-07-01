import React from 'react';
import { Users, UserPlus, GraduationCap, AlertCircle, TrendingUp, FileClock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useStudentsStore } from '../store';

export const Dashboard: React.FC<{
  store: ReturnType<typeof useStudentsStore>;
  onNavigate: (t: any) => void;
}> = ({ store, onNavigate }) => {
  const kpis = [
    { label: 'Total Enrolled', value: store.stats.total, icon: Users, color: 'text-[#08428C]' },
    { label: 'Active Learners', value: store.stats.active, icon: GraduationCap, color: 'text-emerald-600' },
    { label: 'Open Inquiries', value: store.stats.inquiriesOpen, icon: UserPlus, color: 'text-sky-600' },
    { label: 'Applications Pending', value: store.stats.applicationsPending, icon: FileClock, color: 'text-amber-600' },
    { label: 'Approved / Enrolled', value: store.stats.approvedThisTerm, icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'With Fee Balance', value: store.stats.withOutstandingFees, icon: AlertCircle, color: 'text-rose-600' },
  ];

  const recentInquiries = store.inquiries.slice(0, 5);
  const recentApplications = store.applications.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="p-4">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
                {k.label}<Icon className={`w-3.5 h-3.5 ${k.color}`} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{k.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-900 dark:text-white">Recent Inquiries</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('admissions')}>View all</Button>
          </div>
          {recentInquiries.length === 0 ? (
            <EmptyState icon={UserPlus} title="No inquiries yet" description="New enquiry leads captured from the web form or walk-ins will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentInquiries.map(i => (
                <li key={i.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{i.first_name} {i.last_name}</p>
                    <p className="text-xs text-slate-500">{i.guardian_name} · {i.guardian_phone}</p>
                  </div>
                  <Badge variant={i.status === 'New' ? 'primary' : i.status === 'Converted' ? 'success' : 'muted'}>{i.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-900 dark:text-white">Applications Awaiting Decision</h4>
            <Button size="sm" variant="outline" onClick={() => onNavigate('admissions')}>Review</Button>
          </div>
          {recentApplications.length === 0 ? (
            <EmptyState icon={FileClock} title="No applications yet" description="Formal admission applications will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentApplications.map(a => (
                <li key={a.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{a.first_name} {a.last_name} <span className="text-slate-400 font-normal font-mono text-xs">· {a.application_no}</span></p>
                    <p className="text-xs text-slate-500">{a.applying_for_class}</p>
                  </div>
                  <Badge variant={a.status === 'Approved' || a.status === 'Enrolled' ? 'success' : a.status === 'Rejected' ? 'danger' : 'warning'}>{a.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};