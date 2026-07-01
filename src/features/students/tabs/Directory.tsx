import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, Plus, GraduationCap, Trash2, Edit, Eye, HeartPulse, Printer, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useStudentsStore } from '../store';
import type { Student } from '../types';
import { GENDERS, STUDENT_STATUSES } from '../constants';

const schema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  gender: z.enum(['Male', 'Female', 'Other']),
  date_of_birth: z.string().min(1),
  class_id: z.string().min(1, 'Class is required'),
  stream: z.string().optional().or(z.literal('')),
  status: z.enum(['Active', 'Graduated', 'Suspended', 'Transferred', 'Withdrawn']),
  guardian_name: z.string().min(2),
  guardian_phone: z.string().min(5),
  guardian_email: z.string().email().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  medical_conditions: z.string().optional(),
  blood_group: z.string().optional(),
  allergies: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export const Directory: React.FC<{ store: ReturnType<typeof useStudentsStore> }> = ({ store }) => {
  const [q, setQ] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [viewing, setViewing] = useState<Student | null>(null);
  const [idCard, setIdCard] = useState<Student | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: 'Female', status: 'Active' },
  });

  const filtered = useMemo(() => {
    return store.students.filter(s => {
      const term = q.toLowerCase();
      const matches = !term ||
        s.first_name.toLowerCase().includes(term) ||
        s.last_name.toLowerCase().includes(term) ||
        s.admission_number.toLowerCase().includes(term) ||
        s.guardian_name.toLowerCase().includes(term);
      const cls = classFilter === 'ALL' || s.class_name === classFilter;
      const st = statusFilter === 'ALL' || s.status === statusFilter;
      return matches && cls && st;
    });
  }, [store.students, q, classFilter, statusFilter]);

  const classOptions = [{ value: 'ALL', label: 'All Classes' }, ...store.classes.map(c => ({ value: c.name, label: c.name }))];
  const statusOptions = [{ value: 'ALL', label: 'All Statuses' }, ...STUDENT_STATUSES.map(s => ({ value: s, label: s }))];

  const onAdd = async (data: FormData) => {
    const cls = store.classes.find(c => c.id === data.class_id);
    await store.createStudent.mutateAsync({
      first_name: data.first_name, last_name: data.last_name, gender: data.gender,
      date_of_birth: data.date_of_birth, class_id: data.class_id, class_name: cls?.name ?? '',
      stream: data.stream, status: data.status,
      guardian_name: data.guardian_name, guardian_phone: data.guardian_phone,
      guardian_email: data.guardian_email, address: data.address,
      medical_conditions: data.medical_conditions, blood_group: data.blood_group, allergies: data.allergies,
    });
    setAddOpen(false); reset();
  };

  const onEdit = async (data: FormData) => {
    if (!editing) return;
    const cls = store.classes.find(c => c.id === data.class_id);
    await store.updateStudent.mutateAsync({
      id: editing.id,
      patch: { ...data, class_name: cls?.name ?? editing.class_name },
    });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <Card className="p-3 flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, admission no, or guardian…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#08428C]/30" />
          </div>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {classOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Card>
        <Button variant="primary" onClick={() => { reset(); setAddOpen(true); }}>
          <Plus className="w-4 h-4 mr-1.5" /> New Admission
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={store.students.length === 0 ? 'No students yet' : 'No students match your filters'}
          description={store.students.length === 0
            ? 'Register your first learner to get started.'
            : 'Try clearing the filters above.'}
          actionLabel={store.students.length === 0 ? 'Register First Student' : undefined}
          onAction={store.students.length === 0 ? () => setAddOpen(true) : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-5 text-left">Student</th>
                  <th className="py-3 px-5 text-left">Class</th>
                  <th className="py-3 px-5 text-left">Guardian</th>
                  <th className="py-3 px-5 text-left">Medical</th>
                  <th className="py-3 px-5 text-right">Fee Balance</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {s.avatar_url
                          ? <img src={s.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                          : <div className="w-9 h-9 rounded-full bg-[#e8f1fc] text-[#08428C] font-bold flex items-center justify-center text-xs">{s.first_name[0]}{s.last_name[0]}</div>}
                        <div>
                          <p className="font-bold">{s.first_name} {s.last_name}</p>
                          <p className="text-[11px] font-mono text-slate-500">{s.admission_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <p className="font-semibold">{s.class_name}</p>
                      {s.stream && <p className="text-[11px] text-slate-500">{s.stream}</p>}
                    </td>
                    <td className="py-3 px-5">
                      <p>{s.guardian_name}</p>
                      <p className="text-[11px] font-mono text-slate-500">{s.guardian_phone}</p>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate max-w-[150px]">{s.medical_conditions || 'None'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Blood: {s.blood_group || '—'}</span>
                    </td>
                    <td className={`py-3 px-5 text-right font-mono font-bold ${s.fee_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {s.fee_balance.toLocaleString()}
                    </td>
                    <td className="py-3 px-5">
                      <Badge variant={s.status === 'Active' ? 'success' : s.status === 'Graduated' ? 'primary' : s.status === 'Suspended' ? 'danger' : 'warning'}>{s.status}</Badge>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewing(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc]" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => setIdCard(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title="ID Card"><Printer className="w-4 h-4" /></button>
                        <button onClick={() => { setEditing(s); reset({ ...s as any, class_id: s.class_id }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm(`Delete ${s.first_name}?`)) store.deleteStudent.mutate(s.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add / Edit dialogs share the same form */}
      {[
        { isOpen: addOpen, close: () => setAddOpen(false), submit: onAdd, title: 'Register New Student', loading: store.createStudent.isPending, label: 'Enroll' },
        { isOpen: !!editing, close: () => setEditing(null), submit: onEdit, title: 'Edit Student', loading: store.updateStudent.isPending, label: 'Save' },
      ].map((d, i) => d.isOpen && (
        <Dialog key={i} isOpen={d.isOpen} onClose={d.close} title={d.title} maxWidth="2xl">
          <form onSubmit={handleSubmit(d.submit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="First Name" {...register('first_name')} error={errors.first_name?.message} />
              <Input label="Last Name" {...register('last_name')} error={errors.last_name?.message} />
              <Select label="Gender" options={GENDERS.map(g => ({ value: g, label: g }))} {...register('gender')} />
              <Input label="Date of Birth" type="date" {...register('date_of_birth')} error={errors.date_of_birth?.message} />
              <Select label="Class" options={store.classes.map(c => ({ value: c.id, label: c.name }))} {...register('class_id')} />
              <Input label="Stream / Section" {...register('stream')} />
              <Select label="Status" options={STUDENT_STATUSES.map(s => ({ value: s, label: s }))} {...register('status')} />
              <Input label="Blood Group" {...register('blood_group')} />
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Guardian & Address</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Guardian Name" {...register('guardian_name')} error={errors.guardian_name?.message} />
                <Input label="Guardian Phone" {...register('guardian_phone')} error={errors.guardian_phone?.message} />
                <Input label="Guardian Email" type="email" {...register('guardian_email')} />
                <Input label="Home Address" {...register('address')} />
              </div>
              <Input label="Medical Conditions / Allergies" {...register('medical_conditions')} />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={d.close}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={d.loading}>{d.label}</Button>
            </div>
          </form>
        </Dialog>
      ))}

      {viewing && <ProfileDialog student={viewing} onClose={() => setViewing(null)} store={store} />}
      {idCard && <IDCardDialog student={idCard} onClose={() => setIdCard(null)} />}
    </div>
  );
};

/* View + ID card dialogs (kept compact) */
const ProfileDialog: React.FC<{ student: Student; onClose: () => void; store: ReturnType<typeof useStudentsStore> }> = ({ student, onClose, store }) => (
  <Dialog isOpen onClose={onClose} title="Student Profile" maxWidth="2xl">
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        {student.avatar_url
          ? <img src={student.avatar_url} className="w-16 h-16 rounded-full object-cover" alt="" />
          : <div className="w-16 h-16 rounded-full bg-[#e8f1fc] text-[#08428C] font-bold flex items-center justify-center">{student.first_name[0]}{student.last_name[0]}</div>}
        <div>
          <h3 className="text-lg font-black">{student.first_name} {student.last_name}</h3>
          <p className="text-xs font-mono text-[#08428C]">{student.admission_number} · {student.class_name}</p>
          <Badge variant={student.status === 'Active' ? 'success' : 'warning'}>{student.status}</Badge>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
          <p className="font-bold uppercase text-[10px] text-slate-400 mb-1">Guardian</p>
          <p>{student.guardian_name}</p><p className="font-mono">{student.guardian_phone}</p><p>{student.guardian_email}</p><p className="text-slate-500 mt-1">{student.address}</p>
        </div>
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30">
          <p className="font-bold uppercase text-[10px] text-rose-400 mb-1">Medical</p>
          <p><b>Conditions:</b> {student.medical_conditions || 'None'}</p>
          <p><b>Blood:</b> {student.blood_group || '—'}</p>
          <p><b>Allergies:</b> {student.allergies || 'None'}</p>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Documents ({store.docsForStudent(student.id).length})</p>
        <ul className="text-xs">
          {store.docsForStudent(student.id).map(d => <li key={d.id}>· {d.doc_type} — {d.file_name}</li>)}
          {store.docsForStudent(student.id).length === 0 && <li className="text-slate-400">No documents uploaded yet</li>}
        </ul>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Lifecycle ({store.eventsForStudent(student.id).length})</p>
        <ul className="text-xs">
          {store.eventsForStudent(student.id).slice(0, 5).map(e => (
            <li key={e.id}>· {e.effective_date} — <b>{e.kind}</b> {e.from_value ? `${e.from_value} → ${e.to_value}` : e.to_value}</li>
          ))}
        </ul>
      </div>
    </div>
  </Dialog>
);

const IDCardDialog: React.FC<{ student: Student; onClose: () => void }> = ({ student, onClose }) => (
  <Dialog isOpen onClose={onClose} title="Student ID Card" maxWidth="sm">
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-[#08428C] to-[#041e42] text-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <span className="font-black">🎓 EduSync Academy</span>
          <span className="text-[9px] uppercase bg-white/20 px-2 py-0.5 rounded font-bold">Student ID</span>
        </div>
        <div className="flex items-center gap-4">
          {student.avatar_url && <img src={student.avatar_url} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/40" alt="" />}
          <div>
            <p className="text-lg font-black">{student.first_name} {student.last_name}</p>
            <p className="text-xs font-mono text-blue-200">{student.admission_number}</p>
            <p className="text-xs">{student.class_name}</p>
          </div>
        </div>
        <div className="pt-2 flex justify-between text-[10px] font-mono border-t border-white/10">
          <span>DOB: {student.date_of_birth}</span><span>Enrolled: {student.enrolled_date}</span>
        </div>
      </div>
      <Button variant="primary" className="w-full" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print</Button>
    </div>
  </Dialog>
);