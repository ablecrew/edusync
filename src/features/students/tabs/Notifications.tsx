import React, { useState, useMemo } from 'react';
import { Bell, CheckCheck, RefreshCw, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import type { useStudentsStore } from '../store';

const CAT_COLORS: Record<string, any> = {
  admission_status: 'primary', missing_document: 'warning',
  interview: 'info', credentials: 'success', general: 'muted',
};

export const Notifications: React.FC<{ store: ReturnType<typeof useStudentsStore> }> = ({ store }) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [q, setQ] = useState('');

  const list = useMemo(() => (store as any).notifications.filter((n: any) => {
    if (filter === 'unread' && n.read_at) return false;
    if (q && !`${n.title} ${n.message}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [(store as any).notifications, filter, q]);

  const unreadCount = (store as any).notifications.filter((n: any) => !n.read_at).length;

  return (
    <div className="space-y-4">
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search notifications…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#08428C]/30" />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {(['unread', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-bold rounded-md ${filter === f ? 'bg-white dark:bg-slate-900 text-[#08428C]' : 'text-slate-600'}`}>
              {f === 'unread' ? `Unread (${unreadCount})` : 'All'}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => (store as any).scanDocs.mutate()} isLoading={(store as any).scanDocs.isPending}>
          <RefreshCw className="w-3.5 h-3.5" /> Scan Missing Docs
        </Button>
        <Button size="sm" variant="primary" onClick={() => (store as any).markAllRead.mutate()} disabled={unreadCount === 0}>
          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
        </Button>
      </Card>

      {list.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="Alerts about admissions, missing documents and interviews will appear here." />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {list.map((n: any) => (
              <li key={n.id} className={`p-4 flex items-start gap-3 ${!n.read_at ? 'bg-sky-50/40 dark:bg-sky-900/10' : ''}`}>
                <div className={`w-2 h-2 rounded-full mt-2 ${n.read_at ? 'bg-slate-300' : 'bg-sky-500'}`} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={CAT_COLORS[n.category] ?? 'muted'}>{n.category.replace('_', ' ')}</Badge>
                    <span className="font-semibold text-sm">{n.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {new Date(n.created_at).toLocaleString()} · {n.recipient_type}
                    {n.contact && ` · ${n.contact}`}
                  </p>
                </div>
                {!n.read_at && (
                  <button onClick={() => (store as any).markRead.mutate(n.id)} className="text-[11px] text-[#08428C] hover:underline font-bold">
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};