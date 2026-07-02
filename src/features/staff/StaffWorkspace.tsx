import React, { useState } from 'react';
import {
  UserCircle, LayoutDashboard, User, CalendarCheck, Plane, DollarSign, ClipboardList,
  MessageSquare, Heart, AlertTriangle, LogOut, KeyRound, HardHat, FolderOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import * as api from './api';
import { useStaffPortalSession, useStaffPortalStore } from './store';
import { Dashboard } from './tabs/Dashboard';
import { Profile } from './tabs/Profile';
import { Attendance } from './tabs/Attendance';
import { Leave } from './tabs/Leave';
import { Payslips } from './tabs/Payslips';
import { Duties } from './tabs/Duties';
import { Messages } from './tabs/Messages';
import { Clinic } from './tabs/Clinic';
import { Documents } from './tabs/Documents';

export const StaffWorkspace: React.FC = () => {
  const { session, setSession } = useStaffPortalSession();
  if (!session) return <StaffLoginPage onLogin={setSession} />;
  return <StaffPortalShell session={session} onLogout={() => setSession(null)} onSessionUpdate={setSession} />;
};

const StaffPortalShell: React.FC<{ session: any; onLogout: () => void; onSessionUpdate: (s: any) => void }> = ({ session, onLogout, onSessionUpdate }) => {
  const store = useStaffPortalStore(session);
  const [tab, setTab] = useState<string>('dashboard');
  const [showChangePw, setShowChangePw] = useState(!!session.must_change_password);

  const TABS = [
    { id: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
    { id: 'profile',    label: 'My Profile',  icon: User },
    { id: 'attendance', label: 'Attendance',  icon: CalendarCheck },
    { id: 'leave',      label: 'Leave',       icon: Plane },
    { id: 'payslips',   label: 'Payslips',    icon: DollarSign },
    { id: 'duties',     label: 'Duties',      icon: ClipboardList },
    { id: 'documents',  label: 'Documents',   icon: FolderOpen },
    ...(store.isClinical ? [{ id: 'clinic', label: 'Clinic', icon: Heart }] : []),
    { id: 'messages',   label: 'Messages',    icon: MessageSquare },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-[#08428C] text-white p-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black">Staff Portal</p>
            <p className="text-[11px] text-blue-200">
              {store.me?.full_name ?? session.full_name} · {store.me?.staff_code ?? ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {store.me?.designation && <Badge variant="warning">{store.me.designation}</Badge>}
          {store.me?.department_name && <Badge variant="muted">{store.me.department_name}</Badge>}
          <Button variant="outline" size="sm" onClick={onLogout} className="bg-white/10 border-white/30 text-white hover:bg-white/20">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </Button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-14">
        {showChangePw && <ChangePasswordCard session={session} onDone={() => { setShowChangePw(false); onSessionUpdate({ ...session, must_change_password: false }); }} />}

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {TABS.map(t => {
            const Icon = t.icon; const active = tab === t.id;
            const badge = t.id === 'messages' && store.unreadMessages > 0 ? store.unreadMessages
                         : t.id === 'leave'    && store.pendingLeaves > 0   ? store.pendingLeaves
                         : t.id === 'duties'   && store.openWorkOrders.length > 0 ? store.openWorkOrders.length
                         : null;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  active ? 'bg-[#08428C] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}>
                <Icon className="w-4 h-4" /> {t.label}
                {badge != null && (
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white text-[#08428C]' : 'bg-rose-500 text-white'}`}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {store.isLoading && <Card className="p-6"><Spinner size="md" text="Loading your workspace…" /></Card>}
        {!store.isLoading && store.errors.length > 0 && (
          <Card className="p-4 border-rose-300 bg-rose-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-rose-800">Some data failed to load.</p>
                <ul className="mt-1 text-rose-700 font-mono space-y-0.5">
                  {store.errors.slice(0, 3).map((e, i) => <li key={i}>· {e.message}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {!store.isLoading && !store.me && (
          <EmptyState
            icon={UserCircle}
            title="Account not linked"
            description="This portal account is not linked to a staff record. Contact HR to attach it to your staff profile."
          />
        )}

        {!store.isLoading && store.me && (
          <>
            {tab === 'dashboard'  && <Dashboard  store={store} onNavigate={setTab} />}
            {tab === 'profile'    && <Profile    store={store} />}
            {tab === 'attendance' && <Attendance store={store} />}
            {tab === 'leave'      && <Leave      store={store} />}
            {tab === 'payslips'   && <Payslips   store={store} />}
            {tab === 'duties'     && <Duties     store={store} />}
            {tab === 'clinic' && store.isClinical && <Clinic store={store} />}
            {tab === 'messages'   && <Messages   store={store} />}
          </>
        )}
      </div>
    </div>
  );
};

const StaffLoginPage: React.FC<{ onLogin: (s: any) => void }> = ({ onLogin }) => {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      const s = await api.portalLogin(u, p);
      if (!s) setErr('Invalid username or password.');
      else if (s.account_type !== 'staff') setErr('This portal is for support staff accounts only.');
      else onLogin(s);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#08428C] via-[#0a4fa8] to-[#041e42] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center text-white mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-white/10 items-center justify-center mb-3">
            <HardHat className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black">Support Staff Portal</h1>
          <p className="text-blue-200 text-sm mt-1">Sign in with the credentials issued by HR</p>
        </div>
        <Card className="p-6 space-y-3">
          <form onSubmit={submit} className="space-y-3">
            <Input label="Username" value={u} onChange={e => setU(e.target.value)} required />
            <Input label="Password" type="password" value={p} onChange={e => setP(e.target.value)} required />
            {err && <p className="text-xs text-rose-600">{err}</p>}
            <Button type="submit" variant="primary" className="w-full" isLoading={busy}>Sign in</Button>
          </form>
          {/*<p className="text-[11px] text-slate-500 text-center">
            For non-teaching support staff (nurse, cleaner, cook, driver, guard, groundskeeper, etc.).
          </p>*/}
        </Card>
      </div>
    </div>
  );
};

const ChangePasswordCard: React.FC<{ session: any; onDone: () => void }> = ({ session, onDone }) => {
  const [oldP, setOldP] = useState(''); const [newP, setNewP] = useState(''); const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await api.portalChangePassword(session.id, oldP, newP);
    if (!ok) setErr('Old password incorrect'); else onDone();
  };
  return (
    <Card className="p-5 border-amber-300 bg-amber-50">
      <h3 className="font-bold flex items-center gap-2"><KeyRound className="w-4 h-4" /> Change your temporary password</h3>
      <p className="text-xs text-slate-600 mt-1">Please set a permanent password before continuing.</p>
      <form onSubmit={submit} className="space-y-2 mt-3">
        <Input label="Current password" type="password" value={oldP} onChange={e => setOldP(e.target.value)} required />
        <Input label="New password" type="password" value={newP} onChange={e => setNewP(e.target.value)} required minLength={6} />
        {err && <p className="text-xs text-rose-600">{err}</p>}
        <Button type="submit" variant="primary" size="sm">Update password</Button>
      </form>
    </Card>
  );
};

export default StaffWorkspace;