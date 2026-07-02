import React, { useState } from 'react';
import { MessageSquare, Send, Megaphone, DoorOpen, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useTeachersStore } from '../store';
import { MESSAGE_SCOPES, NOTICE_AUDIENCES } from '../constants';

type SubTab = 'messages' | 'notices' | 'gate';

export const Communication: React.FC<{ store: ReturnType<typeof useTeachersStore> }> = ({ store }) => {
  const [sub, setSub] = useState<SubTab>('messages');
  const [composeOpen, setComposeOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [msgForm, setMsgForm] = useState<any>({ scope: 'Guardian' });
  const [noticeForm, setNoticeForm] = useState<any>({ audience: 'All' });
  const [gateForm, setGateForm] = useState<any>({});

  const sendMsg = async () => {
    if (!msgForm.subject || !msgForm.body) return;
    await store.sendMessage.mutateAsync({
      from_staff_id: store.activeTeacherId,
      scope: msgForm.scope,
      to_student_id: msgForm.to_student_id || undefined,
      to_class_name: msgForm.to_class_name || undefined,
      to_staff_id: msgForm.to_staff_id || undefined,
      subject: msgForm.subject, body: msgForm.body,
    });
    setComposeOpen(false); setMsgForm({ scope: 'Guardian' });
  };

  const postNotice = async () => {
    if (!noticeForm.title || !noticeForm.body) return;
    await store.postNotice.mutateAsync({
      posted_by: store.activeTeacherId,
      audience: noticeForm.audience, title: noticeForm.title, body: noticeForm.body,
      pinned: !!noticeForm.pinned, expires_at: noticeForm.expires_at || undefined,
    });
    setNoticeOpen(false); setNoticeForm({ audience: 'All' });
  };

  const createGate = async () => {
    if (!gateForm.student_id || !gateForm.reason) return;
    await store.createGatePass.mutateAsync({
      student_id: gateForm.student_id, issued_by: store.activeTeacherId,
      reason: gateForm.reason, notes: gateForm.notes,
    });
    setGateOpen(false); setGateForm({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'messages', label: 'Messages', count: store.messages.length, icon: MessageSquare },
            { id: 'notices',  label: 'Notices',  count: store.notices.length,  icon: Megaphone },
            { id: 'gate',     label: 'Gate passes', count: store.gatePasses.length, icon: DoorOpen },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setSub(t.id as SubTab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                  sub === t.id ? 'bg-white dark:bg-slate-900 text-[#08428C] shadow-sm' : 'text-slate-600'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">{t.count}</span>
              </button>
            );
          })}
        </div>
        {sub === 'messages' && <Button size="sm" variant="primary" onClick={() => setComposeOpen(true)}><Send className="w-3.5 h-3.5" /> Compose</Button>}
        {sub === 'notices'  && <Button size="sm" variant="primary" onClick={() => setNoticeOpen(true)}><Plus className="w-3.5 h-3.5" /> Post notice</Button>}
        {sub === 'gate'     && <Button size="sm" variant="primary" onClick={() => setGateOpen(true)}><Plus className="w-3.5 h-3.5" /> Issue pass</Button>}
      </div>

      {sub === 'messages' && (
        store.messages.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No messages yet" description="Compose a message to a guardian, student, class or another staff member." />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {store.messages.map(m => {
                const isInbound = m.to_staff_id === store.activeTeacherId;
                const student = m.to_student_id ? store.studentById(m.to_student_id) : null;
                const toStaff = m.to_staff_id ? store.teacherById(m.to_staff_id) : null;
                return (
                  <li key={m.id} className={`p-4 ${isInbound && !m.read_at ? 'bg-sky-50/40' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="muted">{m.scope}</Badge>
                          <p className="font-bold text-sm truncate">{m.subject}</p>
                          {isInbound && !m.read_at && <Badge variant="primary">New</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {isInbound ? 'From' : 'To'}: {
                            student ? `${student.first_name} ${student.last_name} (guardian)` :
                            toStaff ? `${toStaff.first_name} ${toStaff.last_name}` :
                            m.to_class_name ? `Class ${m.to_class_name}` :
                            'Broadcast'
                          }
                        </p>
                        <p className="text-xs mt-2 line-clamp-2">{m.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                      </div>
                      {isInbound && !m.read_at && (
                        <button onClick={() => store.markMessageRead.mutate(m.id)} className="text-[11px] font-bold text-[#08428C] hover:underline">
                          Mark read
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )
      )}

      {sub === 'notices' && (
        store.notices.length === 0 ? (
          <EmptyState icon={Megaphone} title="No notices" description="Post school-wide announcements, exam schedules, or meeting reminders." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {store.notices.map(n => (
              <Card key={n.id} className={`p-4 ${n.pinned ? 'ring-2 ring-amber-300' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {n.pinned && <span className="text-amber-500">📌</span>}
                      <p className="font-bold">{n.title}</p>
                    </div>
                    <Badge variant="muted">{n.audience}</Badge>
                  </div>
                  <button onClick={() => { if (confirm('Delete notice?')) store.removeNotice.mutate(n.id); }} className="p-1 rounded-lg text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line">{n.body}</p>
                <p className="text-[11px] text-slate-400 mt-2">{new Date(n.published_at).toLocaleString()}</p>
              </Card>
            ))}
          </div>
        )
      )}

      {sub === 'gate' && (
        store.gatePasses.length === 0 ? (
          <EmptyState icon={DoorOpen} title="No gate passes" description="Issue early-release passes for learners as needed." />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Learner</th>
                  <th className="py-3 px-5 text-left">Reason</th>
                  <th className="py-3 px-5 text-left">Time out</th>
                  <th className="py-3 px-5 text-left">Return</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {store.gatePasses.map(g => {
                  const s = store.studentById(g.student_id);
                  return (
                    <tr key={g.id}>
                      <td className="py-3 px-5">
                        <p className="font-semibold">{s?.first_name} {s?.last_name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{s?.admission_number}</p>
                      </td>
                      <td className="py-3 px-5 text-xs">{g.reason}</td>
                      <td className="py-3 px-5 text-xs font-mono">{new Date(g.leave_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 px-5 text-xs font-mono">{g.return_time ? new Date(g.return_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="py-3 px-5">
                        <select value={g.status}
                          onChange={e => store.updateGatePass.mutate({ id: g.id, patch: { status: e.target.value, return_time: e.target.value === 'Returned' ? new Date().toISOString() : g.return_time } })}
                          className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 border border-slate-200">
                          {['Pending','Approved','Denied','Returned'].map(x => <option key={x}>{x}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )
      )}

      {/* Compose message */}
      <Dialog isOpen={composeOpen} onClose={() => setComposeOpen(false)} title="Compose message" maxWidth="lg">
        <div className="space-y-3">
          <Select label="Scope" options={MESSAGE_SCOPES.map(s => ({ value: s, label: s }))} value={msgForm.scope} onChange={e => setMsgForm({ ...msgForm, scope: e.target.value })} />
          {(msgForm.scope === 'Student' || msgForm.scope === 'Guardian') && (
            <Select label="Learner" options={[{ value: '', label: '—' }, ...store.students.map((s: any) => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))]}
              value={msgForm.to_student_id ?? ''} onChange={e => setMsgForm({ ...msgForm, to_student_id: e.target.value })} />
          )}
          {msgForm.scope === 'Class' && (
            <Select label="Class" options={[{ value: '', label: '—' }, ...store.myClassNames.map(c => ({ value: c, label: c }))]}
              value={msgForm.to_class_name ?? ''} onChange={e => setMsgForm({ ...msgForm, to_class_name: e.target.value })} />
          )}
          {msgForm.scope === 'Staff' && (
            <Select label="Staff" options={[{ value: '', label: '—' }, ...store.teachers.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))]}
              value={msgForm.to_staff_id ?? ''} onChange={e => setMsgForm({ ...msgForm, to_staff_id: e.target.value })} />
          )}
          <Input label="Subject" value={msgForm.subject ?? ''} onChange={e => setMsgForm({ ...msgForm, subject: e.target.value })} />
          <Textarea label="Message" value={msgForm.body ?? ''} onChange={e => setMsgForm({ ...msgForm, body: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={sendMsg}><Send className="w-4 h-4" /> Send</Button>
        </div>
      </Dialog>

      {/* Post notice */}
      <Dialog isOpen={noticeOpen} onClose={() => setNoticeOpen(false)} title="Post school notice" maxWidth="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Audience" options={NOTICE_AUDIENCES.map(a => ({ value: a, label: a }))} value={noticeForm.audience} onChange={e => setNoticeForm({ ...noticeForm, audience: e.target.value })} />
            <Input label="Expires on (optional)" type="date" value={noticeForm.expires_at ?? ''} onChange={e => setNoticeForm({ ...noticeForm, expires_at: e.target.value })} />
          </div>
          <Input label="Title" value={noticeForm.title ?? ''} onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })} />
          <Textarea label="Body" value={noticeForm.body ?? ''} onChange={e => setNoticeForm({ ...noticeForm, body: e.target.value })} rows={6} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!noticeForm.pinned} onChange={e => setNoticeForm({ ...noticeForm, pinned: e.target.checked })} /> Pin to top
          </label>
          <Button variant="primary" className="w-full" onClick={postNotice}>Publish</Button>
        </div>
      </Dialog>

      {/* Gate pass */}
      <Dialog isOpen={gateOpen} onClose={() => setGateOpen(false)} title="Issue gate pass" maxWidth="md">
        <div className="space-y-3">
          <Select label="Learner" options={[{ value: '', label: '—' }, ...store.students.map((s: any) => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))]}
            value={gateForm.student_id ?? ''} onChange={e => setGateForm({ ...gateForm, student_id: e.target.value })} />
          <Input label="Reason" value={gateForm.reason ?? ''} onChange={e => setGateForm({ ...gateForm, reason: e.target.value })} placeholder="e.g. Medical appointment" />
          <Textarea label="Notes" value={gateForm.notes ?? ''} onChange={e => setGateForm({ ...gateForm, notes: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={createGate}>Issue pass</Button>
        </div>
      </Dialog>
    </div>
  );
};