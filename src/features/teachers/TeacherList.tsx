import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, Plus, Users, Trash2, Edit, Eye, BookOpen, DollarSign, ShieldCheck } from 'lucide-react';
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from '../../hooks/useQueries';
import { useAuth } from '../auth/AuthContext';
import { Teacher } from '../../types';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Dialog } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { Spinner } from '../../components/ui/spinner';

const teacherSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid official email'),
  phone: z.string().min(5, 'Phone contact is required'),
  gender: z.enum(['Male', 'Female']),
  department: z.string().min(2, 'Department is required'),
  qualification: z.string().min(2, 'Qualification is required'),
  specialization: z.string().optional(),
  status: z.enum(['Active', 'On Leave', 'Resigned']),
  salary: z.string().or(z.number()),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

export const TeacherList: React.FC = () => {
  const { user, currentRole } = useAuth();
  const { data: teachers = [], isLoading } = useTeachers();
  const createTeacherMutation = useCreateTeacher();
  const updateTeacherMutation = useUpdateTeacher();
  const deleteTeacherMutation = useDeleteTeacher();

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      gender: 'Female',
      department: 'Mathematics & Physics',
      status: 'Active',
      salary: 7500,
      qualification: 'M.Sc. Education',
    },
  });

  const canManageStaff = ['Super Admin', 'School Admin', 'Principal', 'HR'].includes(currentRole);

  const onAddSubmit = async (data: TeacherFormData) => {
    const staffId = `STF-${Math.floor(100 + Math.random() * 900)}`;
    await createTeacherMutation.mutateAsync({
      staff_id: staffId,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      department: data.department,
      qualification: data.qualification,
      specialization: data.specialization || 'General',
      joining_date: new Date().toISOString().split('T')[0],
      status: data.status,
      salary: Number(data.salary) || 7500,
      subjects: ['Core Mathematics', 'General Science'],
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    });
    setIsAddOpen(false);
    reset();
  };

  const onEditSubmit = async (data: TeacherFormData) => {
    if (!editingTeacher) return;
    await updateTeacherMutation.mutateAsync({
      id: editingTeacher.id,
      updates: {
        ...data,
        salary: Number(data.salary) || editingTeacher.salary,
      },
    });
    setEditingTeacher(null);
  };

  const filtered = teachers.filter((t) => {
    const matchSearch =
      t.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.staff_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = deptFilter === 'ALL' || t.department === deptFilter;
    return matchSearch && matchDept;
  });

  if (isLoading) return <Spinner size="lg" text="Loading faculty database..." />;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Super Admin Authorization Notice */}
      {user?.email === 'dandemarasighan@gmail.com' && (
        <Card variant="glass" className="p-5 bg-gradient-to-r from-[#08428C] to-[#0a56b8] text-white shadow-lg border border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl shrink-0 backdrop-blur-md border border-white/20">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base">Production Super Admin Workspace</span>
                <Badge variant="warning" size="sm" className="bg-amber-400 text-slate-950 font-black uppercase">Authorized</Badge>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Logged in as <strong>{user.full_name} ({user.email})</strong>. You have unrestricted Row Level Security permissions to add staff members, assign academic roles, and manage institutional compensation.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Faculty & Teacher Management</span>
            <Badge variant="primary">{teachers.length} Active</Badge>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Maintain staff credentials, departmental allocations, payroll salary records, and timetable leaves.
          </p>
        </div>

        {canManageStaff && (
          <Button
            variant="primary"
            onClick={() => {
              reset();
              setIsAddOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add New Teacher</span>
          </Button>
        )}
      </div>

      {/* Filter toolbar */}
      <Card variant="default" className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Search faculty name, staff ID, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />

          <Select
            options={[
              { value: 'ALL', label: 'All Departments' },
              { value: 'Mathematics & Physics', label: 'Mathematics & Physics' },
              { value: 'Computer Science & Robotics', label: 'Computer Science & Robotics' },
              { value: 'Modern Languages & Literature', label: 'Modern Languages & Literature' },
            ]}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Teachers Found"
          description="No faculty members match your search or department filter."
          actionLabel="Add Teacher"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <Card variant="default" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Faculty Member & ID</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Qualification</th>
                  <th className="py-4 px-6">Assigned Subjects</th>
                  <th className="py-4 px-6 font-mono text-right">Monthly Payroll</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map((tch) => (
                  <tr key={tch.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-medium">
                      <div className="flex items-center gap-3">
                        <img
                          src={tch.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
                          alt={tch.first_name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#08428C]/20"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {tch.first_name} {tch.last_name}
                          </p>
                          <p className="text-xs font-mono text-slate-500">{tch.staff_id} • {tch.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                      {tch.department}
                    </td>

                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{tch.qualification}</p>
                      <p>{tch.specialization}</p>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {tch.subjects?.map((sub, i) => (
                          <span key={i} className="text-[10px] bg-[#e8f1fc] dark:bg-blue-900/30 text-[#08428C] dark:text-blue-300 px-2 py-0.5 rounded font-semibold">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono font-bold text-right text-slate-900 dark:text-white">
                      ${tch.salary.toLocaleString()}
                    </td>

                    <td className="py-4 px-6">
                      <Badge variant={tch.status === 'Active' ? 'success' : tch.status === 'On Leave' ? 'warning' : 'danger'}>
                        {tch.status}
                      </Badge>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewTeacher(tch)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc] transition-colors"
                          title="View Profile & Timetable"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManageStaff && (
                          <>
                            <button
                              onClick={() => {
                                setEditingTeacher(tch);
                                reset({ ...tch });
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Edit Teacher"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteTeacherMutation.mutate(tch.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Teacher"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Modal */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Onboard New Teacher / Faculty" maxWidth="2xl">
        <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" {...register('first_name')} error={errors.first_name?.message} />
            <Input label="Last Name" {...register('last_name')} error={errors.last_name?.message} />
            <Input label="Email Address" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Phone Number" {...register('phone')} error={errors.phone?.message} />
            <Select label="Gender" options={['Female', 'Male'].map((g) => ({ value: g, label: g }))} {...register('gender')} />
            <Select
              label="Department"
              options={['Mathematics & Physics', 'Computer Science & Robotics', 'Modern Languages & Literature'].map((d) => ({ value: d, label: d }))}
              {...register('department')}
            />
            <Input label="Qualification" {...register('qualification')} error={errors.qualification?.message} placeholder="e.g. Ph.D. Physics" />
            <Input label="Specialization" {...register('specialization')} placeholder="e.g. Quantum Mechanics" />
            <Select label="Status" options={['Active', 'On Leave', 'Resigned'].map((s) => ({ value: s, label: s }))} {...register('status')} />
            <Input label="Basic Monthly Salary ($ USD)" type="number" {...register('salary')} error={errors.salary?.message} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createTeacherMutation.isPending}>Onboard Teacher</Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Modal */}
      <Dialog isOpen={Boolean(editingTeacher)} onClose={() => setEditingTeacher(null)} title="Update Teacher Profile" maxWidth="2xl">
        <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" {...register('first_name')} error={errors.first_name?.message} />
            <Input label="Last Name" {...register('last_name')} error={errors.last_name?.message} />
            <Input label="Email Address" type="email" {...register('email')} />
            <Input label="Phone Number" {...register('phone')} />
            <Select label="Gender" options={['Female', 'Male'].map((g) => ({ value: g, label: g }))} {...register('gender')} />
            <Select label="Department" options={['Mathematics & Physics', 'Computer Science & Robotics', 'Modern Languages & Literature'].map((d) => ({ value: d, label: d }))} {...register('department')} />
            <Select label="Status" options={['Active', 'On Leave', 'Resigned'].map((s) => ({ value: s, label: s }))} {...register('status')} />
            <Input label="Basic Monthly Salary ($ USD)" type="number" {...register('salary')} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setEditingTeacher(null)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={updateTeacherMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </Dialog>

      {/* View Teacher Dossier Modal */}
      {viewTeacher && (
        <Dialog isOpen={Boolean(viewTeacher)} onClose={() => setViewTeacher(null)} title="Faculty Comprehensive Dossier" maxWidth="xl">
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <img src={viewTeacher.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover ring-4 ring-[#08428C]/20" />
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{viewTeacher.first_name} {viewTeacher.last_name}</h3>
                <p className="text-xs font-mono text-[#08428C] font-bold">{viewTeacher.staff_id} • {viewTeacher.department}</p>
                <Badge variant="success" size="sm" className="mt-1">{viewTeacher.status}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
              <p><span className="text-slate-400">Email:</span> <span className="font-semibold">{viewTeacher.email}</span></p>
              <p><span className="text-slate-400">Phone:</span> <span className="font-mono font-semibold">{viewTeacher.phone}</span></p>
              <p><span className="text-slate-400">Qualification:</span> <span className="font-bold">{viewTeacher.qualification}</span></p>
              <p><span className="text-slate-400">Joining Date:</span> <span>{viewTeacher.joining_date}</span></p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#08428C]" /> Assigned Academic Subjects
              </h4>
              <div className="flex flex-wrap gap-2">
                {viewTeacher.subjects?.map((sub, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-xl bg-[#e8f1fc] dark:bg-blue-900/30 text-[#08428C] dark:text-blue-300 font-bold text-xs">
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 flex items-center justify-between border border-emerald-200">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold">Monthly Payroll Disbursement</p>
                  <p className="text-[10px] text-emerald-600">Synchronized with HR & Finance accounts</p>
                </div>
              </div>
              <span className="text-lg font-mono font-extrabold">${viewTeacher.salary.toLocaleString()}</span>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
