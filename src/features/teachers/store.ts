import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

/** Which teacher is "viewing" the workspace — persisted in localStorage so refresh keeps context */
const ACTIVE_KEY = 'edusync_active_teacher';

export function useTeachersStore() {
  const qc = useQueryClient();

  const [activeTeacherId, setActiveTeacherIdState] = useState<string>(() => {
    try { return localStorage.getItem(ACTIVE_KEY) ?? ''; } catch { return ''; }
  });
  const setActiveTeacherId = (id: string) => {
    setActiveTeacherIdState(id);
    try { localStorage.setItem(ACTIVE_KEY, id); } catch {}
  };

  const teachersQ    = useQuery({ queryKey: ['tch_teachers_full'], queryFn: api.fetchAllTeachersFull });
  const activeTeachersQ = useQuery({ queryKey: ['tch_teachers_active'], queryFn: api.fetchTeachers });
  const periodsQ     = useQuery({ queryKey: ['tch_periods'],       queryFn: api.fetchPeriods });
  const timetableQ   = useQuery({ queryKey: ['tch_timetable'],     queryFn: () => api.fetchTimetable() });
  const lessonsQ     = useQuery({ queryKey: ['tch_lessons'],       queryFn: () => api.fetchLessons() });
  const materialsQ   = useQuery({ queryKey: ['tch_materials'],     queryFn: () => api.fetchMaterials() });
  const assessmentsQ = useQuery({ queryKey: ['tch_assessments'],   queryFn: () => api.fetchAssessments() });
  const submissionsQ = useQuery({ queryKey: ['tch_submissions', activeTeacherId], queryFn: () => activeTeacherId ? api.fetchAllSubmissionsForStaff(activeTeacherId) : Promise.resolve([]), enabled: !!activeTeacherId });
  const attendanceQ  = useQuery({ queryKey: ['tch_class_attendance'], queryFn: () => api.fetchClassAttendance() });
  const behaviorQ    = useQuery({ queryKey: ['tch_behavior'],      queryFn: () => api.fetchBehaviorNotes() });
  const messagesQ    = useQuery({ queryKey: ['tch_messages', activeTeacherId], queryFn: () => api.fetchMessages(activeTeacherId || undefined) });
  const noticesQ     = useQuery({ queryKey: ['tch_notices'],       queryFn: api.fetchNotices });
  const gatePassesQ  = useQuery({ queryKey: ['tch_gatepasses'],    queryFn: api.fetchGatePasses });
  const studentsQ    = useQuery({ queryKey: ['tch_students_lite'], queryFn: api.fetchAllStudentsLite });
  const dashboardQ   = useQuery({ queryKey: ['tch_dashboard'],     queryFn: api.fetchTeacherDashboard });

  const teachers    = teachersQ.data ?? [];
  const activeTeachers = activeTeachersQ.data ?? [];
  const periods     = periodsQ.data ?? [];
  const timetable   = timetableQ.data ?? [];
  const lessons     = lessonsQ.data ?? [];
  const materials   = materialsQ.data ?? [];
  const assessments = assessmentsQ.data ?? [];
  const submissions = submissionsQ.data ?? [];
  const attendance  = attendanceQ.data ?? [];
  const behavior    = behaviorQ.data ?? [];
  const messages    = messagesQ.data ?? [];
  const notices     = noticesQ.data ?? [];
  const gatePasses  = gatePassesQ.data ?? [];
  const students    = (studentsQ.data ?? []) as any[];
  const dashboard   = dashboardQ.data ?? [];

  // Auto-select first active teacher if none set
  useEffect(() => {
    if (!activeTeacherId && activeTeachers.length > 0) setActiveTeacherId(activeTeachers[0].id);
  }, [activeTeacherId, activeTeachers]);

  const isLoading = teachersQ.isLoading || periodsQ.isLoading || timetableQ.isLoading;
  const errors = [teachersQ.error, periodsQ.error, timetableQ.error, lessonsQ.error, materialsQ.error, assessmentsQ.error, submissionsQ.error, attendanceQ.error, behaviorQ.error, messagesQ.error, noticesQ.error, gatePassesQ.error, studentsQ.error, dashboardQ.error].filter(Boolean) as Error[];

  const inv = (k: string) => qc.invalidateQueries({ queryKey: [k] });
  const invAll = () => ['tch_teachers_full','tch_teachers_active','tch_periods','tch_timetable','tch_lessons','tch_materials','tch_assessments','tch_submissions','tch_class_attendance','tch_behavior','tch_messages','tch_notices','tch_gatepasses','tch_dashboard'].forEach(inv);

  // Mutations — timetable
  const addTimetable    = useMutation({ mutationFn: api.addTimetableEntry, onSuccess: () => inv('tch_timetable') });
  const deleteTimetable = useMutation({ mutationFn: (id: string) => api.deleteTimetableEntry(id), onSuccess: () => inv('tch_timetable') });

  // Lessons + materials
  const createLesson  = useMutation({ mutationFn: api.createLesson,  onSuccess: () => inv('tch_lessons') });
  const updateLesson  = useMutation({ mutationFn: (p: any) => api.updateLesson(p.id, p.patch), onSuccess: () => inv('tch_lessons') });
  const addMaterial   = useMutation({ mutationFn: api.addMaterial,   onSuccess: () => inv('tch_materials') });
  const removeMaterial= useMutation({ mutationFn: (id: string) => api.deleteMaterial(id), onSuccess: () => inv('tch_materials') });

  // Attendance + behavior
  const upsertAttendance = useMutation({ mutationFn: api.upsertClassAttendance, onSuccess: () => inv('tch_class_attendance') });
  const addBehavior      = useMutation({ mutationFn: api.addBehaviorNote,       onSuccess: () => inv('tch_behavior') });

  // Assessments + submissions
  const createAssessment = useMutation({ mutationFn: api.createAssessment, onSuccess: () => { inv('tch_assessments'); inv('tch_submissions'); } });
  const deleteAssessment = useMutation({ mutationFn: (id: string) => api.deleteAssessment(id), onSuccess: () => { inv('tch_assessments'); inv('tch_submissions'); } });
  const upsertSubmission = useMutation({ mutationFn: api.upsertSubmission, onSuccess: () => inv('tch_submissions') });
  const gradeSubmission  = useMutation({ mutationFn: (p: any) => api.gradeSubmission(p.id, p.score, p.feedback, p.graderId), onSuccess: () => inv('tch_submissions') });
  const scanMissing      = useMutation({ mutationFn: api.scanMissingSubmissions, onSuccess: () => inv('tch_submissions') });

  // Messaging
  const sendMessage    = useMutation({ mutationFn: api.sendMessage,    onSuccess: () => inv('tch_messages') });
  const markMessageRead = useMutation({ mutationFn: (id: string) => api.markMessageRead(id), onSuccess: () => inv('tch_messages') });
  const postNotice     = useMutation({ mutationFn: api.postNotice,     onSuccess: () => inv('tch_notices') });
  const removeNotice   = useMutation({ mutationFn: (id: string) => api.deleteNotice(id), onSuccess: () => inv('tch_notices') });

  // Gate passes
  const createGatePass = useMutation({ mutationFn: api.createGatePass, onSuccess: () => inv('tch_gatepasses') });
  const updateGatePass = useMutation({ mutationFn: (p: any) => api.updateGatePass(p.id, p.patch), onSuccess: () => inv('tch_gatepasses') });

  // Helpers
  const activeTeacher = useMemo(() => teachers.find(t => t.id === activeTeacherId), [teachers, activeTeacherId]);
  const teacherById = (id: string) => teachers.find(t => t.id === id);
  const studentById = (id: string) => students.find(s => s.id === id);

  const myTimetable   = useMemo(() => timetable.filter(e => e.staff_id === activeTeacherId), [timetable, activeTeacherId]);
  const myLessons     = useMemo(() => lessons.filter(l => l.staff_id === activeTeacherId), [lessons, activeTeacherId]);
  const myMaterials   = useMemo(() => materials.filter(m => m.staff_id === activeTeacherId), [materials, activeTeacherId]);
  const myAssessments = useMemo(() => assessments.filter(a => a.staff_id === activeTeacherId), [assessments, activeTeacherId]);
  const myBehavior    = useMemo(() => behavior.filter(b => b.staff_id === activeTeacherId), [behavior, activeTeacherId]);
  const myClassNames  = useMemo(() => Array.from(new Set(myTimetable.map(t => t.class_name))), [myTimetable]);
  const mySubjects    = useMemo(() => Array.from(new Set(myTimetable.map(t => t.subject))), [myTimetable]);
  const myDashboardRow = useMemo(() => dashboard.find(d => d.staff_id === activeTeacherId), [dashboard, activeTeacherId]);

  const pendingGrading = useMemo(() => submissions.filter(s => s.status === 'Submitted' || s.status === 'Late'), [submissions]);

  return {
    // state
    activeTeacherId, setActiveTeacherId, activeTeacher,
    // data
    teachers, activeTeachers, periods, timetable, lessons, materials, assessments, submissions,
    attendance, behavior, messages, notices, gatePasses, students, dashboard,
    // slices for "me"
    myTimetable, myLessons, myMaterials, myAssessments, myBehavior, myClassNames, mySubjects, myDashboardRow, pendingGrading,
    // helpers
    teacherById, studentById,
    // state
    isLoading, errors,
    // mutations
    addTimetable, deleteTimetable,
    createLesson, updateLesson,
    addMaterial, removeMaterial,
    upsertAttendance, addBehavior,
    createAssessment, deleteAssessment, upsertSubmission, gradeSubmission, scanMissing,
    sendMessage, markMessageRead, postNotice, removeNotice,
    createGatePass, updateGatePass,
    invAll,
  };
}

export function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}