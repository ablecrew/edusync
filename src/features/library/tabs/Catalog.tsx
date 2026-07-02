import React, { useMemo, useState } from 'react';
import { BookOpen, Plus, Search, QrCode, Printer, Trash2, Edit, Layers, Bookmark, ArrowLeftRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useLibraryStore } from '../store';
import { BOOK_CATEGORIES, RESOURCE_TYPES } from '../constants';
import type { LibraryResourceSummary } from '../types';
import { QRCodeSVG } from 'qrcode.react';

export const Catalog: React.FC<{ store: ReturnType<typeof useLibraryStore> }> = ({ store }) => {
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [availOnly, setAvailOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryResourceSummary | null>(null);
  const [detailOf, setDetailOf] = useState<LibraryResourceSummary | null>(null);
  const [qrCopy, setQrCopy] = useState<{ code: string; title: string } | null>(null);
  const [issueFrom, setIssueFrom] = useState<{ copyId: string; title: string } | null>(null);
  const [selMember, setSelMember] = useState('');
  const [reserveTarget, setReserveTarget] = useState<LibraryResourceSummary | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const [form, setForm] = useState<any>({ resource_type: 'Book', language: 'English', copies: 1 });

  const filtered = useMemo(() => store.resources.filter((r: any) => {
    if (availOnly && r.available_copies === 0) return false;
    if (catFilter !== 'ALL' && r.category !== catFilter) return false;
    if (typeFilter !== 'ALL' && r.resource_type !== typeFilter) return false;
    if (q) {
      const t = q.toLowerCase();
      return `${r.title} ${r.authors ?? ''} ${r.isbn ?? ''} ${r.keywords ?? ''}`.toLowerCase().includes(t);
    }
    return true;
  }), [store.resources, q, catFilter, typeFilter, availOnly]);

  const submit = async () => {
    if (!form.title) return;
    if (editing) {
      await store.updateResource.mutateAsync({ id: editing.id, patch: { ...form } });
      setEditing(null);
    } else {
      await store.createResource.mutateAsync({ input: { ...form }, copies: Number(form.copies ?? 1) });
      setAddOpen(false);
    }
    setForm({ resource_type: 'Book', language: 'English', copies: 1 });
  };

  const submitBulk = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const [title, authors = '', isbn = '', category = '', copies = '1'] = line.split('|').map(s => s.trim());
      if (title) {
        await store.createResource.mutateAsync({
          input: { title, authors, isbn, category, resource_type: 'Book' },
          copies: Number(copies) || 1,
        });
      }
    }
    setBulkOpen(false); setBulkText('');
  };

  const openQr = (code: string, title: string) => setQrCopy({ code, title });

  return (
    <div className="space-y-6">
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="OPAC search — title, author, ISBN, keyword…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#08428C]/30" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All types</option>{RESOURCE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <option value="ALL">All categories</option>{BOOK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <input type="checkbox" checked={availOnly} onChange={e => setAvailOnly(e.target.checked)} />
          Available only
        </label>
        <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}><Layers className="w-3.5 h-3.5" /> Bulk import</Button>
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}><Plus className="w-3.5 h-3.5" /> New title</Button>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen}
          title={store.resources.length === 0 ? 'No titles in the catalog yet' : 'No titles match your filters'}
          description="Catalog books, journals, magazines and other media here."
          actionLabel={store.resources.length === 0 ? 'Add first title' : undefined}
          onAction={store.resources.length === 0 ? () => setAddOpen(true) : undefined} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r: any) => (
            <Card key={r.id} className="p-4 flex flex-col justify-between hover:shadow-md">
              <div className="space-y-2 cursor-pointer" onClick={() => setDetailOf(r)}>
                <div className="flex items-start justify-between">
                  <Badge variant={r.available_copies > 0 ? 'success' : 'danger'}>
                    {r.available_copies > 0 ? `${r.available_copies}/${r.total_copies} available` : 'None available'}
                  </Badge>
                  <Badge variant="muted">{r.resource_type}</Badge>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2">{r.title}</h3>
                {r.authors && <p className="text-xs text-slate-500">{r.authors}</p>}
                <div className="text-[11px] font-mono text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                  {r.isbn && <span>ISBN: {r.isbn}</span>}
                  {r.shelf_location && <span>Shelf: {r.shelf_location}</span>}
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button size="sm" variant="ghost" onClick={() => setReserveTarget(r)}>
                  <Bookmark className="w-3.5 h-3.5" /> Reserve
                </Button>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(r); setForm({ ...r, copies: 0 }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50" title="Edit"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm('Delete title and ALL its copies?')) store.deleteResource.mutate(r.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog isOpen={addOpen || !!editing} onClose={() => { setAddOpen(false); setEditing(null); }} title={editing ? 'Edit title' : 'Catalog new title'} maxWidth="2xl">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Type" options={RESOURCE_TYPES.map(t => ({ value: t, label: t }))} value={form.resource_type ?? 'Book'} onChange={e => setForm({ ...form, resource_type: e.target.value })} />
            <Select label="Category" options={[{ value: '', label: '—' }, ...BOOK_CATEGORIES.map(c => ({ value: c, label: c }))]} value={form.category ?? ''} onChange={e => setForm({ ...form, category: e.target.value })} />
          </div>
          <Input label="Title" required value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input label="Subtitle" value={form.subtitle ?? ''} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Author(s)" value={form.authors ?? ''} onChange={e => setForm({ ...form, authors: e.target.value })} placeholder="Comma-separated" />
            <Input label="Publisher" value={form.publisher ?? ''} onChange={e => setForm({ ...form, publisher: e.target.value })} />
            <Input label="ISBN" value={form.isbn ?? ''} onChange={e => setForm({ ...form, isbn: e.target.value })} />
            <Input label="ISSN" value={form.issn ?? ''} onChange={e => setForm({ ...form, issn: e.target.value })} />
            <Input label="Edition" value={form.edition ?? ''} onChange={e => setForm({ ...form, edition: e.target.value })} />
            <Input label="Year" type="number" value={form.publication_year ?? ''} onChange={e => setForm({ ...form, publication_year: Number(e.target.value) })} />
            <Input label="Language" value={form.language ?? 'English'} onChange={e => setForm({ ...form, language: e.target.value })} />
            <Input label="Shelf location" value={form.shelf_location ?? ''} onChange={e => setForm({ ...form, shelf_location: e.target.value })} placeholder="e.g. Shelf B-4" />
          </div>
          <Input label="Keywords / tags" value={form.keywords ?? ''} onChange={e => setForm({ ...form, keywords: e.target.value })} placeholder="Searchable tags, comma-separated" />
          <Textarea label="Description" value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} />
          {!editing && (
            <Input label="Initial copies" type="number" min={1} value={form.copies ?? 1} onChange={e => setForm({ ...form, copies: Number(e.target.value) })} />
          )}
          <Button variant="primary" className="w-full" onClick={submit}>{editing ? 'Save changes' : 'Add to catalog'}</Button>
        </div>
      </Dialog>

      {/* Detail dialog (copies + QR) */}
      {detailOf && (
        <Dialog isOpen onClose={() => setDetailOf(null)} title={detailOf.title} maxWidth="2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <Info label="Type" value={detailOf.resource_type} />
              <Info label="Author(s)" value={detailOf.authors ?? '—'} />
              <Info label="ISBN" value={detailOf.isbn ?? '—'} />
              <Info label="Shelf" value={detailOf.shelf_location ?? '—'} />
            </div>
            {detailOf.description && <p className="text-xs text-slate-500">{detailOf.description}</p>}
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-sm">Copies</h5>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => store.addCopies.mutate({ resourceId: detailOf.id, n: 1 })}>+1 copy</Button>
                <Button size="sm" variant="outline" onClick={() => store.addCopies.mutate({ resourceId: detailOf.id, n: 5 })}>+5 copies</Button>
              </div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 font-bold">
                  <th className="text-left py-1">Copy code</th>
                  <th className="text-left py-1">Status</th>
                  <th className="text-left py-1">Condition</th>
                  <th className="text-right py-1">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {store.copies.filter(c => c.resource_id === detailOf.id).map(c => (
                  <tr key={c.id}>
                    <td className="py-1.5 font-mono">{c.copy_code}</td>
                    <td className="py-1.5"><Badge variant={c.status === 'Available' ? 'success' : c.status === 'Issued' ? 'warning' : 'muted'}>{c.status}</Badge></td>
                    <td className="py-1.5">{c.condition ?? '—'}</td>
                    <td className="py-1.5 text-right">
                      <div className="flex justify-end gap-1">
                        {c.status === 'Available' && (
                          <Button size="sm" variant="secondary" onClick={() => setIssueFrom({ copyId: c.id, title: detailOf.title })}>
                            <ArrowLeftRight className="w-3 h-3" /> Issue
                          </Button>
                        )}
                        <button onClick={() => openQr(c.copy_code, detailOf.title)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc]" title="QR"><QrCode className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {store.copies.filter(c => c.resource_id === detailOf.id).length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-400">No copies yet — add one above.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Dialog>
      )}

      {/* Issue from catalog */}
      {issueFrom && (
        <Dialog isOpen onClose={() => setIssueFrom(null)} title={`Issue "${issueFrom.title}"`} maxWidth="sm">
          <div className="space-y-3">
            <Select label="Member"
              options={[{ value: '', label: '— Select member —' },
                ...store.members.filter(m => m.active).map(m => ({ value: m.id, label: `${m.full_name} · ${m.card_no}` }))]}
              value={selMember} onChange={e => setSelMember(e.target.value)} />
            <Button variant="primary" className="w-full" disabled={!selMember}
              onClick={async () => {
                const mem = store.memberById(selMember);
                const rule = mem ? store.ruleFor(mem.member_type) : undefined;
                await store.issueLoan.mutateAsync({ copy_id: issueFrom.copyId, member_id: selMember, days: rule?.loan_days ?? 14, issued_by: 'Librarian' });
                setIssueFrom(null); setSelMember('');
              }}>
              Confirm issue
            </Button>
            {store.issueLoan.error && <p className="text-xs text-rose-600">{(store.issueLoan.error as any).message}</p>}
          </div>
        </Dialog>
      )}

      {/* Reserve */}
      {reserveTarget && (
        <Dialog isOpen onClose={() => setReserveTarget(null)} title={`Reserve "${reserveTarget.title}"`} maxWidth="sm">
          <div className="space-y-3">
            <Select label="Member"
              options={[{ value: '', label: '— Select member —' },
                ...store.members.filter(m => m.active).map(m => ({ value: m.id, label: `${m.full_name} · ${m.card_no}` }))]}
              value={selMember} onChange={e => setSelMember(e.target.value)} />
            <Button variant="primary" className="w-full" disabled={!selMember}
              onClick={async () => { await store.reserve.mutateAsync({ resourceId: reserveTarget.id, memberId: selMember }); setReserveTarget(null); setSelMember(''); }}>
              Place hold
            </Button>
          </div>
        </Dialog>
      )}

      {/* QR sticker */}
      {qrCopy && <QrDialog code={qrCopy.code} title={qrCopy.title} onClose={() => setQrCopy(null)} />}

      {/* Bulk import */}
      <Dialog isOpen={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk import books" maxWidth="lg">
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Paste one book per line, pipe-separated:<br />
            <code className="font-mono">Title | Author(s) | ISBN | Category | Copies</code>
          </p>
          <Textarea rows={10} value={bulkText} onChange={e => setBulkText(e.target.value)}
            placeholder={`Campbell Biology | Urry, Cain | 978-0134093413 | Science | 5\nA Brief History of Time | Stephen Hawking | 978-0553380163 | Science | 3`} />
          <Button variant="primary" className="w-full" onClick={submitBulk}>Import</Button>
        </div>
      </Dialog>
    </div>
  );
};

const Info: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div><p className="text-slate-400 font-bold uppercase text-[10px]">{label}</p><p className="font-semibold mt-0.5">{value}</p></div>
);

const QrDialog: React.FC<{ code: string; title: string; onClose: () => void }> = ({ code, title, onClose }) => {
  const qrValue = `LIB:${code}`;  // scanners will decode this back to LIB:<copy_code>

  const printSticker = () => {
    // Render to a hidden window with an inline SVG for crisp printing
    const svg = document.getElementById(`qr-${code}`)?.outerHTML ?? '';
    const w = window.open('', '_blank', 'width=400,height=500');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>${code}</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 24px; }
            .card { border: 2px solid #08428C; border-radius: 14px; padding: 20px; max-width: 300px; margin: 0 auto; }
            h3 { margin: 0 0 4px 0; font-size: 14px; color: #08428C; }
            .title { color: #444; font-size: 12px; margin-bottom: 12px; max-width: 250px; margin-left: auto; margin-right: auto; }
            .code { font-family: monospace; font-weight: bold; font-size: 16px; margin-top: 10px; letter-spacing: 1px; }
            .hint { color: #888; font-size: 10px; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h3>🎓 EduSync Library</h3>
            <div class="title">${title}</div>
            ${svg}
            <div class="code">${code}</div>
            <div class="hint">Scan at circulation desk</div>
          </div>
          <script>setTimeout(() => window.print(), 200);</script>
        </body>
      </html>`);
    w.document.close();
  };

  return (
    <Dialog isOpen onClose={onClose} title="Copy barcode / QR" maxWidth="sm">
      <div className="space-y-4 text-center">
        <div className="p-6 rounded-2xl bg-white border-2 border-slate-900 space-y-3">
          <p className="font-black text-sm text-[#08428C]">🎓 EduSync Library</p>
          <p className="text-xs text-slate-600 line-clamp-2">{title}</p>
          <div className="flex justify-center">
            <QRCodeSVG
              id={`qr-${code}`}
              value={qrValue}
              size={180}
              level="M"
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          </div>
          <p className="font-mono font-bold text-sm">{code}</p>
        </div>
        <Button variant="primary" className="w-full" onClick={printSticker}>
          <Printer className="w-4 h-4" /> Print sticker
        </Button>
      </div>
    </Dialog>
  );
};