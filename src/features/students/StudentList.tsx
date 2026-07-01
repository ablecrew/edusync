import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Search,
  Plus,
  GraduationCap,
  Trash2,
  Edit,
  Eye,
  HeartPulse,
  Printer,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '../../hooks/useQueries';
import { Student } from '../../types';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Dialog } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { Spinner } from '../../components/ui/spinner';

const studentSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  class_name: z.string().min(1, 'Class selection is required'),
  stream: z.string().min(1, 'Stream is required'),
  status: z.enum(['Active', 'Graduated', 'Suspended', 'Transferred']),
  guardian_name: z.string().min(2, 'Guardian name is required'),
  guardian_phone: z.string().min(5, 'Guardian phone is required'),
  guardian_email: z.string().email('Invalid guardian email').or(z.literal('')),
  address: z.string().min(5, 'Residential address is required'),
  medical_conditions: z.string().optional(),
  blood_group: z.string().optional(),
  allergies: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

export const StudentList: React.FC = () => {
  const { data: students = [], isLoading } = useStudents();
  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null);
  const [isPromotionOpen, setIsPromotionOpen] = useState(false);
  const [promotionSuccess, setPromotionSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      gender: 'Female',
      class_name: 'Grade 10 - Alpha',
      stream: 'Science & STEM',
      status: 'Active',
      medical_conditions: 'None',
      blood_group: 'O+',
      allergies: 'None',
    },
  });

  const onAddSubmit = async (data: StudentFormData) => {
    const admissionNumber = `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await createStudentMutation.mutateAsync({
      admission_number: admissionNumber,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender,
      date_of_birth: data.date_of_birth,
      class_id: data.class_name.includes('10') ? 'cls-101' : 'cls-102',
      class_name: data.class_name,
      stream: data.stream,
      status: data.status,
      guardian_name: data.guardian_name,
      guardian_phone: data.guardian_phone,
      guardian_email: data.guardian_email || '',
      address: data.address,
      medical_conditions: data.medical_conditions || 'None',
      blood_group: data.blood_group || 'O+',
      allergies: data.allergies || 'None',
      enrolled_date: new Date().toISOString().split('T')[0],
      fee_balance: 0,
      avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    });
    setIsAddModalOpen(false);
    reset();
  };

  const onEditSubmit = async (data: StudentFormData) => {
    if (!editingStudent) return;
    await updateStudentMutation.mutateAsync({
      id: editingStudent.id,
      updates: data,
    });
    setEditingStudent(null);
  };

  const handlePromoteAll = async () => {
    const active = students.filter((s) => s.status === 'Active');
    for (const st of active) {
      const nextGrade = st.class_name.includes('Grade 10') ? 'Grade 11 - STEM' : 'Grade 10 - Alpha';
      await updateStudentMutation.mutateAsync({
        id: st.id,
        updates: { class_name: nextGrade },
      });
    }
    setPromotionSuccess(true);
    setTimeout(() => {
      setPromotionSuccess(false);
      setIsPromotionOpen(false);
    }, 2500);
  };

  const filtered = students.filter((st) => {
    const matchesSearch =
      st.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.admission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.guardian_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = classFilter === 'ALL' || st.class_name === classFilter;
    const matchesStatus = statusFilter === 'ALL' || st.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  if (isLoading) return <Spinner size="lg" text="Querying student records from Supabase..." />;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Student Information System</span>
            <Badge variant="primary">{students.length} Enrolled</Badge>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage admissions, medical records, guardian contacts, promotion workflows, and ID cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setIsPromotionOpen(true)}>
            <ArrowUpRight className="w-4 h-4 mr-1.5 text-[#08428C]" />
            <span>Promote Students</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              reset();
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Admission</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <Card variant="default" className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Search student name, admission #, guardian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />

          <Select
            options={[
              { value: 'ALL', label: 'All Classes' },
              { value: 'Grade 10 - Alpha', label: 'Grade 10 - Alpha' },
              { value: 'Grade 9 - Beta', label: 'Grade 9 - Beta' },
              { value: 'Grade 11 - STEM', label: 'Grade 11 - STEM' },
            ]}
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          />

          <Select
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Graduated', label: 'Graduated' },
              { value: 'Suspended', label: 'Suspended' },
              { value: 'Transferred', label: 'Transferred' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Student Data Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No Students Found"
          description="We couldn't find any enrolled students matching your search filters."
          actionLabel="Admit First Student"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <Card variant="default" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Student & Adm #</th>
                  <th className="py-4 px-6">Class & Stream</th>
                  <th className="py-4 px-6">Guardian Contact</th>
                  <th className="py-4 px-6">Medical Alert</th>
                  <th className="py-4 px-6">Fee Balance</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
                {filtered.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={st.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={st.first_name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#08428C]/20"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {st.first_name} {st.last_name}
                          </p>
                          <p className="text-xs font-mono text-slate-500">{st.admission_number}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{st.class_name}</p>
                      <p className="text-xs text-slate-500">{st.stream}</p>
                    </td>

                    <td className="py-4 px-6">
                      <p className="text-slate-900 dark:text-slate-100">{st.guardian_name}</p>
                      <p className="text-xs font-mono text-slate-500">{st.guardian_phone}</p>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate max-w-[150px]">{st.medical_conditions || 'None'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Blood: {st.blood_group || 'O+'}</span>
                    </td>

                    <td className="py-4 px-6 font-mono font-bold">
                      <span className={st.fee_balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        ${st.fee_balance.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <Badge
                        variant={
                          st.status === 'Active'
                            ? 'success'
                            : st.status === 'Graduated'
                            ? 'primary'
                            : st.status === 'Suspended'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {st.status}
                      </Badge>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewStudent(st)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc] dark:hover:bg-blue-900/40 transition-colors"
                          title="View Full Profile & Documents"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setIdCardStudent(st)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Print Digital ID Card"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingStudent(st);
                            reset({ ...st });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit Student"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteStudentMutation.mutate(st.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Admissions Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Student Enrollment & Admission Form"
        description="Enter comprehensive student demographics, medical alerts, and primary guardian details."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" {...register('first_name')} error={errors.first_name?.message} placeholder="e.g. Sophia" />
            <Input label="Last Name" {...register('last_name')} error={errors.last_name?.message} placeholder="e.g. Vance" />
            <Select
              label="Gender"
              options={['Male', 'Female', 'Other'].map((g) => ({ value: g, label: g }))}
              {...register('gender')}
            />
            <Input label="Date of Birth" type="date" {...register('date_of_birth')} error={errors.date_of_birth?.message} />
            <Select
              label="Assigned Class"
              options={['Grade 10 - Alpha', 'Grade 9 - Beta', 'Grade 11 - STEM'].map((c) => ({ value: c, label: c }))}
              {...register('class_name')}
            />
            <Input label="Academic Stream" {...register('stream')} error={errors.stream?.message} placeholder="e.g. Science & STEM" />
            <Select
              label="Status"
              options={['Active', 'Graduated', 'Suspended', 'Transferred'].map((s) => ({ value: s, label: s }))}
              {...register('status')}
            />
            <Input label="Blood Group" {...register('blood_group')} placeholder="e.g. O+" />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Guardian & Residential Profile</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Primary Guardian Name" {...register('guardian_name')} error={errors.guardian_name?.message} placeholder="e.g. Marcus Vance" />
              <Input label="Guardian Phone" {...register('guardian_phone')} error={errors.guardian_phone?.message} placeholder="+1 (555) 000-0000" />
              <Input label="Guardian Email" type="email" {...register('guardian_email')} error={errors.guardian_email?.message} placeholder="parent@gmail.com" />
              <Input label="Home Address" {...register('address')} error={errors.address?.message} placeholder="442 Maple Drive, Beverly Hills" />
            </div>
            <Input label="Medical Conditions / Allergies" {...register('medical_conditions')} placeholder="e.g. Mild Asthma, Peanuts allergy" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createStudentMutation.isPending}>Enroll Student</Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        isOpen={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        title="Edit Student Demographics"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" {...register('first_name')} error={errors.first_name?.message} />
            <Input label="Last Name" {...register('last_name')} error={errors.last_name?.message} />
            <Select label="Gender" options={['Male', 'Female', 'Other'].map((g) => ({ value: g, label: g }))} {...register('gender')} />
            <Input label="Date of Birth" type="date" {...register('date_of_birth')} />
            <Select label="Assigned Class" options={['Grade 10 - Alpha', 'Grade 9 - Beta', 'Grade 11 - STEM'].map((c) => ({ value: c, label: c }))} {...register('class_name')} />
            <Select label="Status" options={['Active', 'Graduated', 'Suspended', 'Transferred'].map((s) => ({ value: s, label: s }))} {...register('status')} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setEditingStudent(null)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={updateStudentMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </Dialog>

      {/* View Student Profile Modal */}
      {viewStudent && (
        <Dialog isOpen={Boolean(viewStudent)} onClose={() => setViewStudent(null)} title="Comprehensive Student Dossier" maxWidth="2xl">
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <img src={viewStudent.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover ring-4 ring-[#08428C]/20" />
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{viewStudent.first_name} {viewStudent.last_name}</h3>
                <p className="text-xs font-mono text-[#08428C] font-bold">{viewStudent.admission_number} • {viewStudent.class_name}</p>
                <Badge variant={viewStudent.status === 'Active' ? 'success' : 'warning'} size="sm" className="mt-1">{viewStudent.status}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Guardian & Emergency Contact</h4>
                <p><span className="text-slate-400">Guardian:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{viewStudent.guardian_name}</span></p>
                <p><span className="text-slate-400">Phone:</span> <span className="font-mono font-semibold">{viewStudent.guardian_phone}</span></p>
                <p><span className="text-slate-400">Address:</span> <span>{viewStudent.address}</span></p>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200">
                <h4 className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1"><HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Medical & Health Dossier</h4>
                <p><span className="text-rose-400">Conditions:</span> <span className="font-bold">{viewStudent.medical_conditions || 'None'}</span></p>
                <p><span className="text-rose-400">Blood Group:</span> <span className="font-mono font-bold">{viewStudent.blood_group || 'O+'}</span></p>
                <p><span className="text-rose-400">Allergies:</span> <span>{viewStudent.allergies || 'None'}</span></p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#e8f1fc] dark:bg-blue-950/40 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#08428C] dark:text-blue-300">Current Tuition Fee Status</p>
                <p className="text-[10px] text-slate-500">Bursary records synchronized with Supabase Finance table</p>
              </div>
              <span className={`text-lg font-mono font-bold ${viewStudent.fee_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                Balance: ${viewStudent.fee_balance.toLocaleString()}
              </span>
            </div>
          </div>
        </Dialog>
      )}

      {/* Promotion Modal */}
      <Dialog isOpen={isPromotionOpen} onClose={() => setIsPromotionOpen(false)} title="Batch Academic Student Promotion" maxWidth="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            This will promote all active students to the subsequent grade level for the upcoming academic year.
          </p>
          <Button variant="primary" className="w-full" onClick={handlePromoteAll}>
            Promote All Active Students
          </Button>
          {promotionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center justify-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4" /> Batch Promotion Completed!
            </div>
          )}
        </div>
      </Dialog>

      {/* ID Card Generator Modal */}
      {idCardStudent && (
        <Dialog isOpen={Boolean(idCardStudent)} onClose={() => setIdCardStudent(null)} title="Official Digital Student ID Card" maxWidth="sm">
          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-[#08428C] to-[#041e42] text-white p-6 shadow-2xl space-y-4 border border-white/20 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/20">
                <div className="flex items-center gap-2 font-black text-sm tracking-wide">
                  <GraduationCap className="w-5 h-5" /> EduSync Academy
                </div>
                <span className="text-[9px] uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded font-bold">Student ID</span>
              </div>

              <div className="flex items-center gap-4">
                <img src={idCardStudent.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/40" />
                <div>
                  <h4 className="text-lg font-black leading-tight">{idCardStudent.first_name} {idCardStudent.last_name}</h4>
                  <p className="text-xs font-mono text-blue-200 mt-1">{idCardStudent.admission_number}</p>
                  <p className="text-xs text-blue-100 mt-0.5 font-semibold">{idCardStudent.class_name}</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] text-blue-200 border-t border-white/10 font-mono">
                <span>DOB: {idCardStudent.date_of_birth}</span>
                <span>Valid Thru: 2027</span>
              </div>
            </div>

            <Button variant="primary" className="w-full" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print Official Badge
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};
