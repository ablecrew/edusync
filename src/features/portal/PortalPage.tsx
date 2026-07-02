import React, { useState, useEffect } from 'react';
import { GraduationCap, LogOut, Bell, User, KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import * as api from './api';

interface Session {
  id: string; account_type: string; student_id: string; full_name: string;
  must_change_password: boolean; email?: string; phone?: string;
}
const KEY = 'edusync_portal_session';

export const PortalPage: React.FC = () => {
  const [session, setSession] = useState<Session | null>(() => {
    try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [mode, setMode] = useState<'login' | 'track'>('login');

  const handleLogout = () => { localStorage.removeItem(KEY); setSession(null); };
  const handleLogin = (s: Session) => { localStorage.setItem(KEY, JSON.stringify(s)); setSession(s); };

  if (session) return <PortalDashboard session={session} onLogout={handleLogout} onSessionUpdate={handleLogin} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#08428C] via-[#0a4fa8] to-[#041e42] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center text-white mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-white/10 items-center justify-center mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black">EduSync Family Portal</h1>
          <p className="text-blue-200 text-sm mt-1">Track applications and manage your enrollment</p>
        </div>

        <div className="flex bg-white/10 p-1 rounded-xl">
          {(['login', 'track'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg ${mode === m ? 'bg-white text-[#08428C]' : 'text-white/70'}`}>
              {m === 'login' ? 'Portal Login' : 'Track Application'}
            </button>
          ))}
        </div>

        {mode === 'login' ? <LoginCard onLogin={handleLogin} /> : <TrackCard />}
      </div>
    </div>
  );
};

const LoginCard: React.FC<{ onLogin: (s: Session) => void }> = ({ onLogin }) => {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      const s = await api.portalLogin(u, p);
      if (!s) setErr('Invalid username or password'); else onLogin(s as any);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <Card className="p-6 space-y-3">
      <form onSubmit={submit} className="space-y-3">
        <Input label="Username" value={u} onChange={e => setU(e.target.value)} required />
        <Input label="Password" type="password" value={p} onChange={e => setP(e.target.value)} required />
        {err && <p className="text-xs text-rose-600">{err}</p>}
        <Button type="submit" variant="primary" className="w-full" isLoading={busy}>Sign in</Button>
      </form>
      <p className="text-[11px] text-slate-500 text-center">Credentials are issued upon enrollment. Contact the school office if you need them.</p>
    </Card>
  );
};

const TrackCard: React.FC = () => {
  const [appNo, setAppNo] = useState(''); const [phone4, setPhone4] = useState('');
  const [result, setResult] = useState<any>(null); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true); setResult(null);
    try {
      const r = await api.trackApplication(appNo.trim(), phone4.trim());
      if (!r) setErr('No matching application. Check your details.'); else setResult(r);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <Card className="p-6 space-y-3">
      <form onSubmit={submit} className="space-y-3">
        <Input label="Application Number" placeholder="APP-2026-1234" value={appNo} onChange={e => setAppNo(e.target.value)} required />
        <Input label="Last 4 digits of guardian phone" maxLength={4} value={phone4} onChange={e => setPhone4(e.target.value.replace(/\D/g, ''))} required />
        {err && <p className="text-xs text-rose-600">{err}</p>}
        <Button type="submit" variant="primary" className="w-full" isLoading={busy}>Check status</Button>
      </form>
      {result && (
        <div className="mt-3 p-3 rounded-xl bg-slate-50 space-y-1 text-xs">
          <p className="font-mono font-bold">{result.application_no}</p>
          <p>Applying for: <b>{result.applying_for_class}</b></p>
          <p>Status: <Badge variant="primary">{result.status}</Badge></p>
          {result.interview_date && <p>Interview: <b>{result.interview_date}</b></p>}
          {result.decision_at && <p>Decision on: {new Date(result.decision_at).toLocaleDateString()}</p>}
          {result.decision_reason && <p className="text-slate-600 italic">"{result.decision_reason}"</p>}
        </div>
      )}
    </Card>
  );
};

const PortalDashboard: React.FC<{ session: Session; onLogout: () => void; onSessionUpdate: (s: Session) => void }> = ({ session, onLogout, onSessionUpdate }) => {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [showChangePw, setShowChangePw] = useState(session.must_change_password);
  useEffect(() => {
    api.fetchPortalStudent(session.student_id).then(setStudent).catch(() => {});
    api.fetchPortalNotifications(session.student_id).then(setNotifs).catch(() => {});
  }, [session.student_id]);
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#08428C] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2"><GraduationCap className="w-5 h-5" /><span className="font-black">Family Portal</span></div>
        <div className="flex items-center gap-2">
          <span className="text-xs"><User className="w-3 h-3 inline mr-1" />{session.full_name}</span>
          <Button variant="outline" size="sm" onClick={onLogout}><LogOut className="w-3.5 h-3.5" /> Logout</Button>
        </div>
      </header>
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {showChangePw && <ChangePasswordCard session={session} onDone={() => { setShowChangePw(false); onSessionUpdate({ ...session, must_change_password: false }); }} />}
        {student && (
          <Card className="p-5">
            <h2 className="text-lg font-bold">{student.first_name} {student.last_name}</h2>
            <p className="text-xs text-slate-500">{student.admission_number} · {student.class_name}</p>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <Info label="Status" value={student.status} />
              <Info label="Enrolled" value={student.enrolled_date} />
              <Info label="Guardian" value={student.guardian_name} />
              <Info label="Fee balance" value={`KES ${Number(student.fee_balance ?? 0).toLocaleString()}`} />
            </div>
          </Card>
        )}
        <Card className="p-5">
          <h3 className="font-bold flex items-center gap-2 mb-3"><Bell className="w-4 h-4" /> Notifications</h3>
          {notifs.length === 0 ? <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
            : <ul className="divide-y">
                {notifs.map(n => (
                  <li key={n.id} className="py-2.5">
                    <div className="flex items-center gap-2"><Badge variant="muted">{n.category.replace('_', ' ')}</Badge><span className="font-semibold text-sm">{n.title}</span></div>
                    <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ul>}
        </Card>
      </div>
    </div>
  );
};

const Info: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div className="p-2 rounded-lg bg-slate-50"><p className="text-[10px] uppercase text-slate-400 font-bold">{label}</p><p className="font-semibold">{value}</p></div>
);

const ChangePasswordCard: React.FC<{ session: Session; onDone: () => void }> = ({ session, onDone }) => {
  const [oldP, setOldP] = useState(''); const [newP, setNewP] = useState(''); const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await api.portalChangePassword(session.id, oldP, newP);
    if (!ok) setErr('Old password incorrect'); else onDone();
  };
  return (
    <Card className="p-5 border-amber-300 bg-amber-50">
      <h3 className="font-bold flex items-center gap-2"><KeyRound className="w-4 h-4" /> Change your password</h3>
      <p className="text-xs text-slate-600 mt-1">You're using a temporary password. Please set a permanent one.</p>
      <form onSubmit={submit} className="space-y-2 mt-3">
        <Input label="Current password" type="password" value={oldP} onChange={e => setOldP(e.target.value)} required />
        <Input label="New password" type="password" value={newP} onChange={e => setNewP(e.target.value)} required minLength={6} />
        {err && <p className="text-xs text-rose-600">{err}</p>}
        <Button type="submit" variant="primary" size="sm">Update password</Button>
      </form>
    </Card>
  );
};