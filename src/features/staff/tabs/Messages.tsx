import React, { useState } from 'react';
import { MessageSquare, Bell, Send, Upload, Trash2, FileText, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useStaffPortalStore } from '../store';
import { DOC_TYPES } from '../constants';

type SubTab = 'inbox' | 'notices' | 'documents';

export const Messages: React.FC<{ store: ReturnType<typeof useStaffPortalStore> }> = ({ store }) => {
  const [sub, setSub] = useState<SubTab>('inbox');
  const [composeOpen, setComposeOpen] = useState(false);
  const [msgForm, setMsgForm] = useState<any>({});
  const [docOpen, setDocOpen] = useState(false);
  const [docForm, setDocForm] = useState<any>({ doc_type: DOC_TYPES[0] });

  const sendMsg = async () => {
    if (!msgForm.subject || !msgForm.body) return;
    await store.sendMessage.mutateAsync(msgForm);
    setComposeOpen(false); setMsgForm({});
  };

  const uploadDoc = async () => {
    if (!docForm.file_name) return;
    await store.uploadDoc.mutateAsync(docForm);
    setDocOpen(false); setDocForm({ doc_type: DOC_TYPES[0] });
  };

  const expiringDocs = store.documents.filter(d => {
    if (!d.expires_on) return false;
    const days = Math.floor((new Date(d.expires_on).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 60;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'inbox',     label: 'Inbox',      count: store.messages.length, icon: MessageSquare },
            { id: 'notices',   label: 'Notices',    count: store.notices.length,  icon: Bell },
            { id: 'documents', label: 'Documents',  count: store.documents.length, icon: FileText },
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
        {sub === 'inbox'     && <Button size="sm" variant="primary" onClick={() => setComposeOpen(true)}><Send className="w-3.5 h-3.5" /> Compose</Button>}
        {sub === 'documents' && <Button size="sm" variant="primary" onClick={() => setDocOpen(true)}><Upload className="w-3.5 h-3.5" /> Upload document</Button>}
      </div>

      {sub === 'inbox' && (
        store.messages.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No messages yet" description="Messages from administration and colleagues will appear here." />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {store.messages.map(m => {
                const isInbound = m.to_staff_id === store.staffId;
                return (
                  <li key={m.id} className={`p-4 ${isInbound && !m.read_at ? 'bg-sky-50/40' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="muted">{m.scope}</Badge>
                          <p className="font-bold text-sm">{m.subject}</p>
                          {isInbound && !m.read_at && <Badge variant="primary">New</Badge>}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{isInbound ? 'From admin/staff' : 'Sent by you'} · {new Date(m.created_at).toLocaleString()}</p>
                        <p className="text-xs mt-2 whitespace-pre-line">{m.body}</p>
                      </div>
                      {isInbound && !m.read_at && (
                        <button onClick={() => store.readMessage.mutate(m.id)} className="text-[11px] font-bold text-[#08428C] hover:underline">Mark read</button>
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
          <EmptyState icon={Bell} title="No notices" description="School-wide notices from administration will show up here." />
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
                </div>
                <p className="text-xs whitespace-pre-line">{n.body}</p>
                <p className="text-[11px] text-slate-400 mt-2">{new Date(n.published_at).toLocaleString()}</p>
              </Card>
            ))}
          </div>
        )
      )}

      {sub === 'documents' && (
        <>
          {expiringDocs.length > 0 && (
            <Card className="p-4 border-amber-300 bg-amber-50">
              <p className="text-xs font-bold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {expiringDocs.length} document{expiringDocs.length === 1 ? '' : 's'} expiring within 60 days
              </p>
            </Card>
          )}
          {store.documents.length === 0 ? (
            <EmptyState icon={FileText} title="No documents" description="Upload certificates, IDs, licenses, or other compliance files."
              actionLabel="Upload document" onAction={() => setDocOpen(true)} />
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                    <th className="py-3 px-5 text-left">File</th>
                    <th className="py-3 px-5">Type</th>
                    <th className="py-3 px-5">Uploaded</th>
                    <th className="py-3 px-5">Expires</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {store.documents.map(d => {
                    const days = d.expires_on ? Math.floor((new Date(d.expires_on).getTime() - Date.now()) / 86400000) : null;
                    return (
                      <tr key={d.id}>
                        <td className="py-3 px-5">
                          <p className="font-semibold flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" /> {d.file_name}</p>
                          {d.notes && <p className="text-[11px] text-slate-500">{d.notes}</p>}
                        </td>
                        <td className="py-3 px-5"><Badge variant="info">{d.doc_type}</Badge></td>
                        <td className="py-3 px-5 text-xs">{d.uploaded_at?.slice(0, 10)}</td>
                        <td className="py-3 px-5 text-xs">
                          {d.expires_on ? (
                            <Badge variant={days! < 0 ? 'danger' : days! <= 30 ? 'warning' : 'muted'}>
                              {days! < 0 ? `Expired ${-days!}d ago` : `${days}d left`}
                            </Badge>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <div className="flex justify-end gap-1">
                            {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc]"><FileText className="w-4 h-4" /></a>}
                            <button onClick={() => store.removeDoc.mutate(d.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      {/* Compose */}
      <Dialog isOpen={composeOpen} onClose={() => setComposeOpen(false)} title="Send message" maxWidth="lg">
        <div className="space-y-3">
          <Input label="Subject" value={msgForm.subject ?? ''} onChange={e => setMsgForm({ ...msgForm, subject: e.target.value })} />
          <Textarea label="Message" value={msgForm.body ?? ''} onChange={e => setMsgForm({ ...msgForm, body: e.target.value })} rows={6} />
          <p className="text-[11px] text-slate-500">
            Messages are sent to the administration. HR staff will respond via this inbox.
          </p>
          <Button variant="primary" className="w-full" onClick={sendMsg}><Send className="w-4 h-4" /> Send</Button>
        </div>
      </Dialog>

      {/* Upload doc */}
      <Dialog isOpen={docOpen} onClose={() => setDocOpen(false)} title="Upload document" maxWidth="lg">
        <div className="space-y-3">
          <Select label="Document type" options={DOC_TYPES.map(t => ({ value: t, label: t }))} value={docForm.doc_type} onChange={e => setDocForm({ ...docForm, doc_type: e.target.value })} />
          <Input label="File name" value={docForm.file_name ?? ''} onChange={e => setDocForm({ ...docForm, file_name: e.target.value })} placeholder="drivers-license.pdf" />
          <Input label="File URL" value={docForm.file_url ?? ''} onChange={e => setDocForm({ ...docForm, file_url: e.target.value })} placeholder="https://…" />
          <Input label="Expires on" type="date" value={docForm.expires_on ?? ''} onChange={e => setDocForm({ ...docForm, expires_on: e.target.value })} />
          <Textarea label="Notes" value={docForm.notes ?? ''} onChange={e => setDocForm({ ...docForm, notes: e.target.value })} />
          <Button variant="primary" className="w-full" onClick={uploadDoc}><Upload className="w-4 h-4" /> Upload</Button>
        </div>
      </Dialog>
    </div>
  );
};