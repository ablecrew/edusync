import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { AdmissionApplication, AdmissionInquiry, ApplicationStatus, InquiryStatus, LifecycleKind, SiblingLink, Student, StudentDocument, StudentStatus } from './types';

export function useStudentsStore() {
  const qc = useQueryClient();

  const studentsQ = useQuery({ queryKey: ['students'], queryFn: api.fetchStudents });
  const classesQ = useQuery({ queryKey: ['academic_classes'], queryFn: api.fetchClasses });
  const inquiriesQ = useQuery({ queryKey: ['admission_inquiries'], queryFn: api.fetchInquiries });
  const applicationsQ = useQuery({ queryKey: ['admission_applications'], queryFn: api.fetchApplications });
  const documentsQ = useQuery({ queryKey: ['student_documents', 'all'], queryFn: () => api.fetchStudentDocuments() });
  const lifecycleQ = useQuery({ queryKey: ['student_lifecycle_events', 'all'], queryFn: () => api.fetchLifecycleEvents() });
  const siblingsQ = useQuery({ queryKey: ['sibling_links', 'all'], queryFn: () => api.fetchSiblingLinks() });

  const notificationsQ = useQuery({ queryKey: ['notifications'], queryFn: () => api.fetchNotifications() });
  const attendanceQ = useQuery({ queryKey: ['attendance'], queryFn: () => api.fetchAttendance() });
  const healthQ = useQuery({ queryKey: ['health_records'], queryFn: () => api.fetchHealthRecords() });
  const disciplineQ = useQuery({ queryKey: ['discipline_records'], queryFn: () => api.fetchDisciplineRecords() });
  const academicQ = useQuery({ queryKey: ['academic_records'], queryFn: () => api.fetchAcademicRecords() });

  // ...append to returned object:
  const notifications = notificationsQ.data ?? [];
  const attendance = attendanceQ.data ?? [];
  const health = healthQ.data ?? [];
  const discipline = disciplineQ.data ?? [];
  const academic = academicQ.data ?? [];

  const markRead     = useMutation({ mutationFn: api.markNotificationRead, onSuccess: () => invalidate('notifications') });
  const markAllRead  = useMutation({ mutationFn: api.markAllNotificationsRead, onSuccess: () => invalidate('notifications') });
  const scanDocs     = useMutation({ mutationFn: api.scanForMissingDocuments, onSuccess: () => invalidate('notifications') });
  const provisionPortal = useMutation({ mutationFn: api.provisionPortalAccounts });

  const addAttendance = useMutation({ mutationFn: api.upsertAttendance, onSuccess: () => invalidate('attendance') });
  const addHealth     = useMutation({ mutationFn: api.addHealthRecord, onSuccess: () => invalidate('health_records') });
  const addDiscipline = useMutation({ mutationFn: api.addDisciplineRecord, onSuccess: () => invalidate('discipline_records') });
  const addAcademic   = useMutation({ mutationFn: api.addAcademicRecord, onSuccess: () => invalidate('academic_records') });

  // return:

  const students = studentsQ.data ?? [];
  const classes = classesQ.data ?? [];
  const inquiries = inquiriesQ.data ?? [];
  const applications = applicationsQ.data ?? [];
  const documents = documentsQ.data ?? [];
  const lifecycle = lifecycleQ.data ?? [];
  const siblings = siblingsQ.data ?? [];

  const isLoading = studentsQ.isLoading || classesQ.isLoading || inquiriesQ.isLoading || applicationsQ.isLoading;
  const errors = [studentsQ.error, classesQ.error, inquiriesQ.error, applicationsQ.error, documentsQ.error, lifecycleQ.error, siblingsQ.error].filter(Boolean) as Error[];

  const invalidate = (key: string) => qc.invalidateQueries({ queryKey: [key] });
  const invalidateAll = () => {
    ['students', 'admission_inquiries', 'admission_applications', 'student_documents', 'student_lifecycle_events', 'sibling_links'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
  };

  /* Students */
  const createStudent = useMutation({ mutationFn: api.createStudent, onSuccess: () => { invalidate('students'); invalidate('student_lifecycle_events'); } });
  const updateStudent = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Student> }) => api.updateStudent(id, patch),
    onSuccess: () => invalidate('students'),
  });
  const deleteStudent = useMutation({ mutationFn: (id: string) => api.deleteStudent(id), onSuccess: () => invalidate('students') });
  const changeStatus = useMutation({
    mutationFn: ({ id, status, reason, actor }: { id: string; status: StudentStatus; reason?: string; actor?: string }) =>
      api.changeStudentStatus(id, status, reason, actor),
    onSuccess: () => { invalidate('students'); invalidate('student_lifecycle_events'); },
  });
  const promoteStudent = useMutation({
    mutationFn: ({ id, newClass, actor }: { id: string; newClass: string; actor?: string }) =>
      api.promoteStudent(id, newClass, actor),
    onSuccess: () => { invalidate('students'); invalidate('student_lifecycle_events'); },
  });

  /* Inquiries */
  const createInquiry = useMutation({ mutationFn: api.createInquiry, onSuccess: () => invalidate('admission_inquiries') });
  const updateInquiryStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InquiryStatus }) => api.updateInquiryStatus(id, status),
    onSuccess: () => invalidate('admission_inquiries'),
  });

  /* Applications */
  const createApplication = useMutation({ mutationFn: api.createApplication, onSuccess: () => invalidate('admission_applications') });
  const updateApplication = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AdmissionApplication> }) => api.updateApplication(id, patch),
    onSuccess: () => invalidate('admission_applications'),
  });
  const decideApplication = useMutation({
    mutationFn: ({ id, status, decision_by, reason }: { id: string; status: ApplicationStatus; decision_by: string; reason?: string }) =>
      api.decideApplication(id, status, decision_by, reason),
    onSuccess: () => invalidate('admission_applications'),
  });
  const enrollApplication = useMutation({
    mutationFn: ({ appId, classId }: { appId: string; classId: string }) => api.enrollApplication(appId, classId),
    onSuccess: () => invalidateAll(),
  });

  /* Documents */
  const addDocument = useMutation({ mutationFn: api.addStudentDocument, onSuccess: () => invalidate('student_documents') });
  const removeDocument = useMutation({ mutationFn: (id: string) => api.deleteStudentDocument(id), onSuccess: () => invalidate('student_documents') });

  /* Siblings */
  const addSibling = useMutation({ mutationFn: api.addSiblingLink, onSuccess: () => invalidate('sibling_links') });
  const removeSibling = useMutation({ mutationFn: (id: string) => api.removeSiblingLink(id), onSuccess: () => invalidate('sibling_links') });

  /* Lifecycle */
  const addLifecycleEvent = useMutation({
    mutationFn: (e: { student_id: string; kind: LifecycleKind; from_value?: string; to_value?: string; reason?: string; actor?: string; effective_date?: string }) => api.logLifecycle(e),
    onSuccess: () => invalidate('student_lifecycle_events'),
  });

  /* Helpers */
  const studentById = (id: string) => students.find(s => s.id === id);
  const docsForStudent = (id: string) => documents.filter(d => d.student_id === id);
  const eventsForStudent = (id: string) => lifecycle.filter(e => e.student_id === id);
  const siblingsForStudent = (id: string) => siblings.filter(s => s.student_id === id);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter(s => s.status === 'Active').length,
    graduated: students.filter(s => s.status === 'Graduated').length,
    inquiriesOpen: inquiries.filter(i => !['Converted','Closed','Cold'].includes(i.status)).length,
    applicationsPending: applications.filter(a => ['Submitted','Under Review','Interview Scheduled','Merit List'].includes(a.status)).length,
    approvedThisTerm: applications.filter(a => a.status === 'Approved' || a.status === 'Enrolled').length,
    withOutstandingFees: students.filter(s => Number(s.fee_balance) > 0).length,
  }), [students, inquiries, applications]);

  return {
    students, classes, inquiries, applications, documents, lifecycle, siblings,
    isLoading, errors, stats, studentById, docsForStudent, eventsForStudent, siblingsForStudent,
    createStudent, updateStudent, deleteStudent, changeStatus, promoteStudent,
    createInquiry, updateInquiryStatus, createApplication, updateApplication, decideApplication, enrollApplication,
    addDocument, removeDocument, addSibling, removeSibling,addLifecycleEvent, notifications, attendance, health, discipline, academic,
    markRead, markAllRead, scanDocs, provisionPortal, addAttendance, addHealth, addDiscipline, addAcademic,
  };
}

/* CSV export helper (reused from finance) */
export function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}