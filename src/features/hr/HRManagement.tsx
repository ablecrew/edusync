import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useEmployees, useCreateEmployee } from '../../hooks/useQueries';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Dialog } from '../../components/ui/dialog';
import { Spinner } from '../../components/ui/spinner';

export const HRManagement: React.FC = () => {
  const { data: employees = [], isLoading } = useEmployees();
  const createEmpMutation = useCreateEmployee();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [fn, setFn] = useState('');
  const [ln, setLn] = useState('');
  const [role, setRole] = useState('');
  const [dept, setDept] = useState('Finance & Admin');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('5000');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fn || !role) return;
    await createEmpMutation.mutateAsync({
      employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      first_name: fn,
      last_name: ln,
      role_title: role,
      department: dept,
      email: email || `${fn.toLowerCase()}@edusync.edu`,
      phone: '+1 (555) 000-0000',
      joining_date: new Date().toISOString().split('T')[0],
      basic_salary: Number(salary) || 5000,
      status: 'Active',
    });
    setIsAddOpen(false);
  };

  if (isLoading) return <Spinner size="lg" text="Loading HR & Staff Records..." />;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>HR, Staff & Payroll Register</span>
            <Badge variant="primary">{employees.length} Employees</Badge>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Maintain non-teaching staff, librarians, nurses, bursars, leave allocations, and payroll compensations.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Employee</span>
        </Button>
      </div>

      <Card variant="default" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Employee & ID</th>
                <th className="py-4 px-6">Role Title</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6 font-mono text-right">Basic Salary</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                    {emp.first_name} {emp.last_name}
                    <span className="block text-xs font-mono font-normal text-slate-400">{emp.employee_id}</span>
                  </td>
                  <td className="py-4 px-6 font-semibold">{emp.role_title}</td>
                  <td className="py-4 px-6 text-slate-500">{emp.department}</td>
                  <td className="py-4 px-6 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">${emp.basic_salary.toLocaleString()}</td>
                  <td className="py-4 px-6"><Badge variant="success">{emp.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Onboard New Employee">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" required value={fn} onChange={(e) => setFn(e.target.value)} />
            <Input label="Last Name" required value={ln} onChange={(e) => setLn(e.target.value)} />
          </div>
          <Input label="Role Title" placeholder="e.g. Head Nurse" required value={role} onChange={(e) => setRole(e.target.value)} />
          <Select label="Department" options={['Finance & Admin', 'Library System', 'Health & Medical', 'Transport'].map((d) => ({ value: d, label: d }))} value={dept} onChange={(e) => setDept(e.target.value)} />
          <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Basic Salary ($ USD)" type="number" required value={salary} onChange={(e) => setSalary(e.target.value)} />
          <Button type="submit" variant="primary" className="w-full" isLoading={createEmpMutation.isPending}>Save Employee</Button>
        </form>
      </Dialog>
    </div>
  );
};
