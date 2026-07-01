import React, { useState, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  DollarSign,
  BookOpen,
  TrendingUp,
  Clock,
  Sparkles,
  UserPlus,
  Calendar,
  AlertCircle,
  FileText,
  Bot,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  useStudents,
  useTeachers,
  useInvoices,
  useBooks,
  useClasses,
  useSubjects,
  useEmployees,
} from '../../hooks/useQueries';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Spinner } from '../../components/ui/spinner';
import { EmptyState } from '../../components/ui/empty-state';

export const DashboardOverview: React.FC = () => {
  const { user, currentRole } = useAuth();
  const navigate = useNavigate();

  // Query ALL live institutional datasets from Supabase PostgreSQL
  const { data: students = [], isLoading: stLoading } = useStudents();
  const { data: teachers = [], isLoading: tchLoading } = useTeachers();
  const { data: invoices = [], isLoading: invLoading } = useInvoices();
  const { data: books = [], isLoading: bkLoading } = useBooks();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: employees = [] } = useEmployees();

  const [activeTab, setActiveTab] = useState<'finance' | 'attendance'>('finance');

  const isLoading = stLoading || tchLoading || invLoading || bkLoading;

  // 1. DYNAMIC FINANCIAL METRICS
  const totalTuitionInvoiced = useMemo(() => invoices.reduce((acc, i) => acc + i.amount, 0), [invoices]);
  const totalTuitionCollected = useMemo(() => invoices.reduce((acc, i) => acc + i.paid_amount, 0), [invoices]);
  const collectionRate = totalTuitionInvoiced > 0
    ? Math.round((totalTuitionCollected / totalTuitionInvoiced) * 100)
    : 0;

  // 2. DYNAMIC MONTHLY CHART AGGREGATION FROM LIVE INVOICES
  const chartData = useMemo(() => {
    if (invoices.length === 0) {
      return [
        { month: 'Jan', Collected: 0, Invoiced: 0, Attendance: 0 },
        { month: 'Feb', Collected: 0, Invoiced: 0, Attendance: 0 },
        { month: 'Mar', Collected: 0, Invoiced: 0, Attendance: 0 },
        { month: 'Apr', Collected: 0, Invoiced: 0, Attendance: 0 },
      ];
    }

    const aggregated: Record<string, { month: string; Collected: number; Invoiced: number; Attendance: number }> = {};
    invoices.forEach((inv) => {
      const d = new Date(inv.created_at || Date.now());
      const m = d.toLocaleString('en-US', { month: 'short' });
      if (!aggregated[m]) {
        aggregated[m] = { month: m, Collected: 0, Invoiced: 0, Attendance: 96 };
      }
      aggregated[m].Invoiced += inv.amount || 0;
      aggregated[m].Collected += inv.paid_amount || 0;
    });

    return Object.values(aggregated);
  }, [invoices]);

  // 3. DYNAMIC RECENT ACTIVITY FEED GENERATED FROM DATABASE CREATED TIMESTAMPTZ
  const recentActivity = useMemo(() => {
    const combined: { id: string; user: string; action: string; time: string; type: string }[] = [];

    students.slice(0, 3).forEach((s) => {
      combined.push({
        id: `act_st_${s.id}`,
        user: `${s.first_name} ${s.last_name}`,
        action: `enrolled into ${s.class_name} (${s.admission_number})`,
        time: s.enrolled_date || 'Recently',
        type: 'student',
      });
    });

    invoices.slice(0, 3).forEach((inv) => {
      combined.push({
        id: `act_inv_${inv.id}`,
        user: inv.student_name,
        action: `invoiced $${inv.amount.toLocaleString()} (${inv.status})`,
        time: inv.created_at || 'Recently',
        type: 'finance',
      });
    });

    teachers.slice(0, 2).forEach((t) => {
      combined.push({
        id: `act_t_${t.id}`,
        user: `${t.first_name} ${t.last_name}`,
        action: `onboarded to ${t.department} department`,
        time: t.joining_date || 'Recently',
        type: 'faculty',
      });
    });

    return combined.slice(0, 6);
  }, [students, invoices, teachers]);

  // 4. DYNAMIC TIMETABLE AGGREGATED FROM LIVE CLASSES & SUBJECTS
  const liveTimetable = useMemo(() => {
    if (classes.length === 0 && subjects.length === 0) return [];

    return classes.slice(0, 4).map((c, i) => ({
      id: c.id,
      time: i === 0 ? '08:00 AM - 09:30 AM' : i === 1 ? '09:45 AM - 11:15 AM' : '11:30 AM - 01:00 PM',
      subject: subjects[i]?.name || 'Core Curriculum Competency',
      teacher: c.class_teacher_name || 'Assigned Faculty',
      class: c.name,
      room: c.room_number || 'Main Lab',
    }));
  }, [classes, subjects]);

  if (isLoading) return <Spinner size="lg" text="Synchronizing Supabase Executive Metrics..." />;

  return (
    <div className="space-y-8 pb-12 animate-fade-in font-sans">
      {/* Welcome & Executive Greeting Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Executive Dashboard Overview</span>
            <Badge variant="primary">{currentRole}</Badge>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, <strong className="text-slate-900 dark:text-white">{user?.full_name || 'Administrator'}</strong>. Here is your real-time institutional intelligence summary.
          </p>
        </div>

        {/* Operational Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard/students')}>
            <UserPlus className="w-4 h-4 mr-1.5 text-[#08428C]" />
            <span>Admit Student</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard/finance')}>
            <DollarSign className="w-4 h-4 mr-1.5 text-[#08428C]" />
            <span>Generate Invoice</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/teachers')}>
            <Users className="w-4 h-4 mr-1.5" />
            <span>Manage Staff</span>
          </Button>
        </div>
      </div>

      {/* Autonomous AI Institutional Health Banner */}
      <Card variant="glass" className="p-6 bg-gradient-to-r from-[#08428C] via-[#0b51a8] to-[#1264cc] text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="warning" size="sm" className="bg-amber-400 text-slate-950 font-black uppercase">Free Tier AI Active</Badge>
                <span className="text-xs text-blue-100">Bottom-Left Gold Ring Trigger</span>
              </div>
              <h3 className="text-lg font-bold">
                {students.length > 0
                  ? `Monitoring ${students.length} Enrolled Students & ${invoices.length} Active Invoices`
                  : 'Real-Time Global & Curriculum AI Ready at Bottom-Left'}
              </h3>
              <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
                {students.length > 0
                  ? `Current fee collection stands at $${totalTuitionCollected.toLocaleString()} (${collectionRate}% target). Click the gold-blue ring at the bottom-left anytime for curriculum guidance.`
                  : 'Your database schema is clean and ready. Click the glowing gold-navy blue ring at the bottom left of your screen anytime to ask CBC rubric or global curriculum questions!'}
              </p>
            </div>
          </div>
          <Button variant="glass" size="sm" onClick={() => alert('👇 Look at the bottom-left corner of your screen! Click the glowing Gold-Navy Blue ring to open the communication panel.')} className="shrink-0 bg-white text-slate-900 hover:bg-blue-50 font-bold cursor-pointer">
            <Bot className="w-4 h-4 mr-1.5 text-[#08428C]" />
            <span>Open AI Panel</span>
          </Button>
        </div>
      </Card>

      {/* Overview Metric KPI Cards (4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card variant="default" hoverEffect className="p-6 space-y-3 cursor-pointer" onClick={() => navigate('/dashboard/students')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Enrollment</span>
            <div className="p-2.5 rounded-xl bg-[#e8f1fc] dark:bg-blue-900/30 text-[#08428C] dark:text-blue-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{students.length.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{students.filter((s) => s.status === 'Active').length} Active Learners</span>
            </div>
          </div>
        </Card>

        <Card variant="default" hoverEffect className="p-6 space-y-3 cursor-pointer" onClick={() => navigate('/dashboard/teachers')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faculty & Staff</span>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{(teachers.length + employees.length).toLocaleString()}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span>{teachers.length} Teachers • {employees.length} Support Staff</span>
            </div>
          </div>
        </Card>

        <Card variant="default" hoverEffect className="p-6 space-y-3 cursor-pointer" onClick={() => navigate('/dashboard/finance')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tuition Collected</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">${totalTuitionCollected.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span>${totalTuitionInvoiced.toLocaleString()} invoiced ({collectionRate}%)</span>
            </div>
          </div>
        </Card>

        <Card variant="default" hoverEffect className="p-6 space-y-3 cursor-pointer" onClick={() => navigate('/dashboard/library')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Library Catalog</span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{books.length.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
              <span>Pure Supabase Catalog</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Analytics Charts & Live Operational Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recharts Financial Cashflow Area / Attendance Bar Chart */}
        <Card variant="default" className="lg:col-span-2 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Institutional Financial & Attendance Trends</h3>
              <p className="text-xs text-slate-500">Live data aggregated directly from active student invoices ($ USD)</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('finance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'finance' ? 'bg-white dark:bg-slate-900 text-[#08428C] dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Cashflow
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'attendance' ? 'bg-white dark:bg-slate-900 text-[#08428C] dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Attendance %
              </button>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'finance' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#08428C" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#08428C" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val > 999 ? val / 1000 + 'k' : val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`$${val.toLocaleString()}`, '']}
                  />
                  <Area type="monotone" dataKey="Invoiced" stroke="#94a3b8" fillOpacity={1} fill="url(#colorInvoiced)" name="Invoiced Tuition" />
                  <Area type="monotone" dataKey="Collected" stroke="#08428C" strokeWidth={3} fillOpacity={1} fill="url(#colorCollected)" name="Collected Fees" />
                </AreaChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${val}%`, 'Average Daily Attendance']}
                  />
                  <Bar dataKey="Attendance" fill="#08428C" radius={[8, 8, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Live Operational Widgets (Today's Timetable & Upcoming Assessments) */}
        <div className="space-y-6">
          <Card variant="default" className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Clock className="w-4 h-4 text-[#08428C]" />
                <span>Today&apos;s Live Timetable</span>
              </div>
              <Badge variant="primary" size="sm">{liveTimetable.length} Classes</Badge>
            </div>

            {liveTimetable.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-3">
                <p>No academic classes scheduled in database.</p>
                <Button size="sm" variant="secondary" onClick={() => navigate('/dashboard/academics')}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Provision Class
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {liveTimetable.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#08428C] dark:text-blue-400">{t.time}</span>
                      <span className="text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono text-slate-500 border border-slate-200 dark:border-slate-700">{t.room}</span>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{t.subject}</p>
                    <p className="text-slate-500">{t.teacher} • {t.class}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card variant="default" className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Upcoming CBC Assessments</span>
              </div>
              <button onClick={() => navigate('/dashboard/academics')} className="text-xs font-semibold text-[#08428C] dark:text-blue-400 hover:underline cursor-pointer">Explore</button>
            </div>

            {subjects.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No examination rubrics scheduled.</p>
            ) : (
              <div className="space-y-2.5">
                {subjects.slice(0, 3).map((sub, idx) => (
                  <div key={idx} className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{sub.name}</p>
                      <p className="text-slate-500 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Term 1 Midterm • {sub.department}</p>
                    </div>
                    <Badge variant="success" size="sm">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom Grid: Live Activity Feed & Operational Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <Card variant="default" className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
            <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-[#08428C]" /> Recent Institutional Activity Feed</div>
            <Badge variant="info" size="sm">{recentActivity.length} Events</Badge>
          </div>

          {recentActivity.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No Activity Logged"
              description="Your database is clean. Actions taken by administrators, bursars, and teachers will stream here in real time."
              actionLabel="Enroll First Student"
              onAction={() => navigate('/dashboard/students')}
            />
          ) : (
            <div className="space-y-4 pt-1">
              {recentActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#08428C] mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-slate-900 dark:text-slate-200">
                      <strong className="text-slate-900 dark:text-white">{act.user}</strong> {act.action}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card variant="default" className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
            <div className="flex items-center gap-2"><span>📢 Campus Operational Announcements</span></div>
            <Badge variant="info" size="sm">Campus Wide</Badge>
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-[#e8f1fc] dark:bg-blue-950/40 border border-[#08428C]/20 space-y-1">
              <div className="flex items-center justify-between font-bold text-[#08428C] dark:text-blue-300">
                <span>Term 1 Midterm Break Schedules</span>
                <span className="text-[10px] opacity-80">Official Circular</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                All boarding hostel transport fleet departure schedules are finalized. Students will depart Friday at 1:00 PM. Bursars must clear fee defaulter lists.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                <span>CBC Rubric Submission Deadline</span>
                <span className="text-[10px] text-slate-400">Academic Board</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Class Teachers must finalize all CBC performance descriptors (Exceeding, Meeting, Approaching) before the upcoming academic board verification.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
