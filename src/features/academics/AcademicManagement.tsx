import React, { useState } from 'react';
import {
  Plus,
  Printer,
} from 'lucide-react';
import { useClasses, useSubjects, useCreateClass, useCreateSubject } from '../../hooks/useQueries';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Dialog } from '../../components/ui/dialog';
import { Spinner } from '../../components/ui/spinner';

export const AcademicManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'classes' | 'timetable' | 'exams' | 'reports'>('subjects');
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();

  const createClassMutation = useCreateClass();
  const createSubjectMutation = useCreateSubject();

  // Modal states
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubDept, setNewSubDept] = useState('Mathematics');

  const [selectedReportStudent, setSelectedReportStudent] = useState('Liam Chen (ADM-2026-002)');

  const TIMETABLE_MATRIX = [
    { day: 'Monday', '08:00': 'Advanced Calculus (R-204)', '10:00': 'Honors Physics (Lab 1)', '12:00': 'Robotics & AI', '14:00': 'Literature' },
    { day: 'Tuesday', '08:00': 'Honors Physics (Lab 1)', '10:00': 'Advanced Calculus (R-204)', '12:00': 'Literature', '14:00': 'Sports & CBC' },
    { day: 'Wednesday', '08:00': 'Robotics & AI (Lab 3)', '10:00': 'Modern Languages', '12:00': 'Honors Physics', '14:00': 'Calculus' },
    { day: 'Thursday', '08:00': 'Literature (Main Hall)', '10:00': 'Robotics & AI', '12:00': 'Calculus', '14:00': 'CBC Projects' },
    { day: 'Friday', '08:00': 'Calculus (R-204)', '10:00': 'Physics Lab Inquiry', '12:00': 'Assembly', '14:00': 'Clubs & Societies' },
  ];

  const CBC_RESULTS_SAMPLE = [
    { subject: 'Advanced Calculus', teacher: 'Dr. Evelyn Hartford', marks: 92, max: 100, cbc: 'Exceeding', remarks: 'Exceptional mastery of integration principles' },
    { subject: 'Honors Physics', teacher: 'Dr. Evelyn Hartford', marks: 88, max: 100, cbc: 'Exceeding', remarks: 'Outstanding experimental inquiry skills' },
    { subject: 'Robotics Engineering', teacher: 'Julian Thorne', marks: 84, max: 100, cbc: 'Meeting', remarks: 'Consistently demonstrates solid automation logic' },
    { subject: 'English Literature', teacher: 'Miriam Abbas', marks: 78, max: 100, cbc: 'Meeting', remarks: 'Good analytical essay writing structure' },
  ];

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !newClassCode) return;
    await createClassMutation.mutateAsync({
      name: newClassName,
      code: newClassCode,
      level: 10,
      room_number: 'Room 304',
      capacity: 40,
      current_students: 0,
    });
    setNewClassName('');
    setNewClassCode('');
    setIsClassModalOpen(false);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || !newSubCode) return;
    await createSubjectMutation.mutateAsync({
      name: newSubName,
      code: newSubCode,
      department: newSubDept,
      credits: 4,
      is_cbc: true,
      description: 'New academic competency',
    });
    setNewSubName('');
    setNewSubCode('');
    setIsSubjectModalOpen(false);
  };

  if (classesLoading || subjectsLoading) return <Spinner size="lg" text="Synchronizing academic curriculum & CBC matrices..." />;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Academics, CBC & Examination Engine</span>
            <Badge variant="primary">Term 1 2026</Badge>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Curriculum setup, timetable matrices, lesson plans, examination papers, CBC grading rubrics, and report cards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'classes' && (
            <Button variant="primary" onClick={() => setIsClassModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              <span>New Academic Class</span>
            </Button>
          )}
          {activeTab === 'subjects' && (
            <Button variant="primary" onClick={() => setIsSubjectModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              <span>New CBC Subject</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
        {[
          { id: 'subjects', label: 'Subjects & CBC' },
          { id: 'classes', label: 'Classes & Streams' },
          { id: 'timetable', label: 'Timetable Matrix' },
          { id: 'exams', label: 'Exams & Grading Rubrics' },
          { id: 'reports', label: 'Report Cards & Transcripts' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? 'bg-white dark:bg-slate-900 text-[#08428C] dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. SUBJECTS TAB */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <Card key={sub.id} variant="default" hoverEffect className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <Badge variant={sub.is_cbc ? 'success' : 'primary'} size="sm">
                  {sub.is_cbc ? 'CBC Competency' : 'Elective'}
                </Badge>
                <span className="text-xs font-mono font-bold text-slate-400">{sub.code}</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{sub.name}</h3>
                <p className="text-xs text-[#08428C] dark:text-blue-400 font-semibold mt-0.5">{sub.department} Department</p>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{sub.description}</p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Credits: {sub.credits} Units</span>
                <span>Rubric: CBC Level 4</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 2. CLASSES TAB */}
      {activeTab === 'classes' && (
        <Card variant="default" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Class Name & Code</th>
                  <th className="py-4 px-6">Assigned Class Teacher</th>
                  <th className="py-4 px-6">Room / Lab</th>
                  <th className="py-4 px-6">Enrollment Capacity</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {classes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      {c.name} <span className="text-xs font-mono text-slate-400">({c.code})</span>
                    </td>
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-semibold">
                      Dr. Evelyn Hartford
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">{c.room_number}</td>
                    <td className="py-4 px-6 font-mono">
                      <span className="font-bold text-[#08428C]">{c.current_students || 34}</span> / {c.capacity} students
                    </td>
                    <td className="py-4 px-6"><Badge variant="success">Active Term 1</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 3. TIMETABLE MATRIX TAB */}
      {activeTab === 'timetable' && (
        <Card variant="default" className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Master Campus Timetable Matrix</h3>
              <p className="text-xs text-slate-500">Grade 10 — Alpha Stream Core Weekly Schedule</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" /> Print Timetable
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-center">
              <thead>
                <tr className="bg-[#08428C] text-white font-bold tracking-wider uppercase">
                  <th className="p-3.5 border border-blue-800">Day / Time</th>
                  <th className="p-3.5 border border-blue-800">08:00 AM - 09:30 AM</th>
                  <th className="p-3.5 border border-blue-800">10:00 AM - 11:30 AM</th>
                  <th className="p-3.5 border border-blue-800">12:00 PM - 01:30 PM</th>
                  <th className="p-3.5 border border-blue-800">02:00 PM - 03:30 PM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {TIMETABLE_MATRIX.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-medium">
                    <td className="p-4 bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">{row.day}</td>
                    <td className="p-4 border border-slate-200 dark:border-slate-800 bg-blue-50/40 dark:bg-blue-950/20 text-[#08428C] dark:text-blue-300 font-semibold">{row['08:00']}</td>
                    <td className="p-4 border border-slate-200 dark:border-slate-800 bg-purple-50/40 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 font-semibold">{row['10:00']}</td>
                    <td className="p-4 border border-slate-200 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-semibold">{row['12:00']}</td>
                    <td className="p-4 border border-slate-200 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-semibold">{row['14:00']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 4. EXAMS & GRADING RUBRICS TAB */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <Card variant="default" className="p-6 space-y-4">
            <h3 className="text-lg font-bold">CBC Competency Descriptors & Grading Matrix</h3>
            <p className="text-xs text-slate-500">
              Official CBC evaluation guidelines utilized across report cards and transcripts.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-800 dark:text-emerald-300 space-y-1">
                <span className="font-black uppercase text-sm block">1. Exceeding</span>
                <p className="opacity-90 leading-relaxed">Demonstrates exceptional inquiry, creativity, and analytical problem solving beyond benchmark criteria.</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#e8f1fc] dark:bg-blue-950/50 border border-[#08428C]/20 text-[#08428C] dark:text-blue-300 space-y-1">
                <span className="font-black uppercase text-sm block">2. Meeting</span>
                <p className="opacity-90 leading-relaxed">Consistently meets all academic grade level competencies independently with high precision.</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 text-amber-800 dark:text-amber-300 space-y-1">
                <span className="font-black uppercase text-sm block">3. Approaching</span>
                <p className="opacity-90 leading-relaxed">Demonstrates basic understanding of concepts but requires occasional teacher scaffolding and guidance.</p>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-800 dark:text-rose-300 space-y-1">
                <span className="font-black uppercase text-sm block">4. Below</span>
                <p className="opacity-90 leading-relaxed">Requires intensive individualized academic support and intervention to master core competencies.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 5. REPORT CARDS & TRANSCRIPTS TAB */}
      {activeTab === 'reports' && (
        <Card variant="default" className="p-6 sm:p-10 space-y-8 max-w-5xl mx-auto border-2 border-slate-300 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 dark:border-white pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#08428C] text-white flex items-center justify-center font-bold text-2xl shadow-lg">
                🎓
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">EduSync Heritage Academy</h2>
                <p className="text-xs text-slate-500 font-mono">Official CBC Academic Term 1 Report Card & Transcript (2025/2026)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 print:hidden">
              <Select
                options={[
                  { value: 'Liam Chen (ADM-2026-002)', label: 'Liam Chen (Grade 10 - Alpha)' },
                  { value: 'Sophia Vance (ADM-2026-001)', label: 'Sophia Vance (Grade 10 - Alpha)' },
                ]}
                value={selectedReportStudent}
                onChange={(e) => setSelectedReportStudent(e.target.value)}
              />
              <Button variant="primary" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1.5" />
                <span>Print Official PDF</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl text-xs font-medium">
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px]">Student Name</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{selectedReportStudent.split('(')[0]}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px]">Admission #</p>
              <p className="text-base font-mono font-bold text-[#08428C] mt-0.5">{selectedReportStudent.split('(')[1]?.replace(')', '') || 'ADM-2026-002'}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px]">Class & Level</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">Grade 10 — Alpha</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px]">Overall CBC Mastery</p>
              <p className="text-base font-bold text-emerald-600 mt-0.5">Exceeding Expectations</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900 text-white dark:bg-slate-800 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Academic Subject</th>
                  <th className="py-3 px-4">Faculty Teacher</th>
                  <th className="py-3 px-4 text-center">Score %</th>
                  <th className="py-3 px-4 text-center">CBC Level</th>
                  <th className="py-3 px-4">Teacher Competency Descriptor Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {CBC_RESULTS_SAMPLE.map((res, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">{res.subject}</td>
                    <td className="py-4 px-4 text-xs text-slate-500">{res.teacher}</td>
                    <td className="py-4 px-4 font-mono font-bold text-center">{res.marks}%</td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant={res.cbc === 'Exceeding' ? 'success' : 'primary'} size="sm">{res.cbc}</Badge>
                    </td>
                    <td className="py-4 px-4 text-xs italic text-slate-600 dark:text-slate-300">&quot;{res.remarks}&quot;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-2 p-4 rounded-2xl bg-[#e8f1fc] dark:bg-blue-950/40">
              <p className="font-bold text-[#08428C] dark:text-blue-300">Class Teacher Remarks:</p>
              <p className="text-slate-700 dark:text-slate-300 italic">&quot;An exemplary student who consistently demonstrates high critical inquiry and leadership during lab experiments.&quot;</p>
              <p className="font-bold text-right pt-2 text-slate-900 dark:text-white">— Dr. Evelyn Hartford</p>
            </div>
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
              <p className="font-bold text-slate-900 dark:text-white">Principal Approval & Verification:</p>
              <p className="text-slate-500">Official stamp affixed digitally via Supabase Verified Signature.</p>
              <div className="pt-4 flex justify-between font-mono font-bold text-[10px]">
                <span>Date: Apr 14, 2026</span>
                <span>Signature: Dr. Arthur Pendelton</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* New Class Modal */}
      <Dialog isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Create New Academic Class">
        <form onSubmit={handleAddClass} className="space-y-4">
          <Input label="Class Name" placeholder="e.g. Grade 11 - STEM" required value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
          <Input label="Class Code" placeholder="e.g. G11-S" required value={newClassCode} onChange={(e) => setNewClassCode(e.target.value)} />
          <Button type="submit" variant="primary" className="w-full" isLoading={createClassMutation.isPending}>Provision Class</Button>
        </form>
      </Dialog>

      {/* New Subject Modal */}
      <Dialog isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="Create New CBC Subject">
        <form onSubmit={handleAddSubject} className="space-y-4">
          <Input label="Subject Name" placeholder="e.g. Creative Arts" required value={newSubName} onChange={(e) => setNewSubName(e.target.value)} />
          <Input label="Subject Code" placeholder="e.g. ART-101" required value={newSubCode} onChange={(e) => setNewSubCode(e.target.value)} />
          <Select label="Department" options={['Mathematics', 'Science', 'Languages', 'Technology', 'Arts'].map((d) => ({ value: d, label: d }))} value={newSubDept} onChange={(e) => setNewSubDept(e.target.value)} />
          <Button type="submit" variant="primary" className="w-full" isLoading={createSubjectMutation.isPending}>Add Subject</Button>
        </form>
      </Dialog>
    </div>
  );
};
