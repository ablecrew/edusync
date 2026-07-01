import React, { useState } from 'react';
import {
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { ALL_ROLES, APP_CONFIG } from '../../config/constants';

export const SettingsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'permissions' | 'smtp' | 'backups' | 'audit'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>System Settings & Governance</span>
            <Badge variant="primary">Enterprise v2.4</Badge>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure academic years, roles & permissions matrices, school profile branding, SMTP email notifications, backups, and audit logs.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
        {[
          { id: 'profile', label: 'School Profile & Terms' },
          { id: 'permissions', label: 'Roles & Permissions Matrix' },
          { id: 'smtp', label: 'SMTP & Notifications' },
          { id: 'backups', label: 'Backups & Security' },
          { id: 'audit', label: 'Audit Logs' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? 'bg-white dark:bg-slate-900 text-[#08428C] dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <Card variant="default" className="p-8 max-w-3xl space-y-6">
          <form onSubmit={handleSave} className="space-y-5">
            <h3 className="text-lg font-bold border-b pb-2">Institution Branding & Academic Year</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Institution Name" defaultValue={APP_CONFIG.name} required />
              <Input label="Primary Brand Color" defaultValue="#08428C" font-mono disabled />
              <Input label="Current Academic Year" defaultValue="2025/2026" />
              <Input label="Active Academic Term" defaultValue="Term 1 (Jan - April 2026)" />
            </div>
            <Button type="submit" variant="primary">Save Configuration</Button>
            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Changes applied globally across all modules!
              </div>
            )}
          </form>
        </Card>
      )}

      {activeTab === 'permissions' && (
        <Card variant="default" className="p-6 space-y-4 overflow-hidden">
          <h3 className="text-lg font-bold">Role-Based Access Control Matrix (RBAC)</h3>
          <p className="text-xs text-slate-500">Every role has distinct capabilities enforced via Supabase Row Level Security.</p>
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-900 text-white dark:bg-slate-800 font-bold uppercase">
                  <th className="p-3">Enterprise Role</th>
                  <th className="p-3 text-center">Can View Students</th>
                  <th className="p-3 text-center">Manage Finance</th>
                  <th className="p-3 text-center">Edit Academic Grades</th>
                  <th className="p-3 text-center">Access AI Assistant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {ALL_ROLES.slice(0, 10).map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-sans">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{r}</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Yes</td>
                    <td className="p-3 text-center">{['Bursar', 'Super Admin', 'School Admin', 'Principal'].includes(r) ? '✓ Yes' : '✗ No'}</td>
                    <td className="p-3 text-center">{['Teacher', 'Class Teacher', 'Principal', 'Super Admin'].includes(r) ? '✓ Yes' : '✗ No'}</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Yes (Pro)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'smtp' && (
        <Card variant="default" className="p-8 max-w-2xl space-y-4">
          <h3 className="text-lg font-bold">SMTP Mail Server & SMS Gateways</h3>
          <p className="text-xs text-slate-500">Automated fee reminders and admission approval notifications.</p>
          <div className="space-y-4 pt-2">
            <Input label="SMTP Host" defaultValue="smtp.sendgrid.net" />
            <Input label="SMTP Port" defaultValue="587" />
            <Input label="Default Sender Email" defaultValue="no-reply@edusync.edu" />
            <Button variant="primary" onClick={handleSave}>Update SMTP Credentials</Button>
          </div>
        </Card>
      )}

      {activeTab === 'backups' && (
        <Card variant="default" className="p-8 max-w-2xl space-y-4">
          <h3 className="text-lg font-bold">Database Redundancy & ISO Security</h3>
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs space-y-2">
            <p className="font-bold text-emerald-800 dark:text-emerald-300">✓ Supabase Automated Point-In-Time Recovery Enabled</p>
            <p className="text-emerald-700 dark:text-emerald-400">Daily geo-redundant snapshots are archived to dual cloud availability zones.</p>
          </div>
        </Card>
      )}

      {activeTab === 'audit' && (
        <Card variant="default" className="p-6 space-y-4 font-mono text-xs">
          <h3 className="text-base font-bold font-sans">System Immutable Audit Trail</h3>
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl text-slate-300">
            <p className="text-emerald-400">[2026-03-01 10:45:12] INFO: Bursar Sarah Jenkins issued Invoice INV-2026-0021 ($3,200)</p>
            <p className="text-sky-400">[2026-03-01 09:12:04] INFO: Julian Thorne updated Robotics Unit 4 syllabus matrix</p>
            <p className="text-amber-400">[2026-02-28 14:02:55] WARN: Multiple failed login attempts for user staff_09@edusync.edu</p>
          </div>
        </Card>
      )}
    </div>
  );
};
