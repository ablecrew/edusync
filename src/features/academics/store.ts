import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

export function useAcademicsStore() {
  const qc = useQueryClient();

  const yearsQ           = useQuery({ queryKey: ['acad_years'],          queryFn: api.fetchYears });
  const termsQ           = useQuery({ queryKey: ['acad_terms'],          queryFn: api.fetchTerms });
  const subjectsQ        = useQuery({ queryKey: ['acad_subjects'],       queryFn: api.fetchSubjects });
  const classesQ         = useQuery({ queryKey: ['acad_classes'],        queryFn: api.fetchAcademicClasses });
  const classSubjectsQ   = useQuery({ queryKey: ['acad_class_subjects'], queryFn: api.fetchClassSubjects });
  const areasQ           = useQuery({ queryKey: ['acad_areas'],          queryFn: () => api.fetchLearningAreas() });
  const strandsQ         = useQuery({ queryKey: ['acad_strands'],        queryFn: () => api.fetchStrands() });
  const subStrandsQ      = useQuery({ queryKey: ['acad_substrands'],     queryFn: () => api.fetchSubStrands() });
  const schemesQ         = useQuery({ queryKey: ['acad_schemes'],        queryFn: api.fetchSchemes });
  const bandsQ           = useQuery({ queryKey: ['acad_bands'],          queryFn: () => api.fetchBands() });
  const competenciesQ    = useQuery({ queryKey: ['acad_competencies'],   queryFn: () => api.fetchCompetencies() });
  const sowQ             = useQuery({ queryKey: ['acad_sow'],            queryFn: () => api.fetchSchemesOfWork() });
  const examSchedulesQ   = useQuery({ queryKey: ['acad_exam_schedules'], queryFn: api.fetchExamSchedules });
  const examPapersQ      = useQuery({ queryKey: ['acad_exam_papers'],    queryFn: () => api.fetchExamPapers() });
  const reportsQ         = useQuery({ queryKey: ['acad_reports'],        queryFn: api.fetchReports });
  const portfolioQ       = useQuery({ queryKey: ['acad_portfolio'],      queryFn: () => api.fetchPortfolio() });
  const auditQ           = useQuery({ queryKey: ['acad_audit'],          queryFn: api.fetchAudit });
  const performanceQ     = useQuery({ queryKey: ['acad_performance'],    queryFn: api.fetchSubjectPerformance });
  const studentsQ        = useQuery({
    queryKey: ['acad_students_lite'],
    queryFn: async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const { data, error } = await supabase.from('students')
        .select('id, first_name, last_name, admission_number, class_name, status')
        .eq('status','Active').order('first_name');
      if (error) throw error; return data ?? [];
    },
  });
  const teachersQ = useQuery({
    queryKey: ['acad_teachers_lite'],
    queryFn: async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const { data, error } = await supabase.from('staff')
        .select('id, staff_code, first_name, last_name')
        .eq('staff_type','Teaching').eq('status','Active').order('first_name');
      if (error) throw error; return data ?? [];
    },
  });

  const years         = yearsQ.data ?? [];
  const terms         = termsQ.data ?? [];
  const subjects      = subjectsQ.data ?? [];
  const classes       = (classesQ.data ?? []) as any[];
  const classSubjects = classSubjectsQ.data ?? [];
  const areas         = areasQ.data ?? [];
  const strands       = strandsQ.data ?? [];
  const subStrands    = subStrandsQ.data ?? [];
  const schemes       = schemesQ.data ?? [];
  const bands         = bandsQ.data ?? [];
  const competencies  = competenciesQ.data ?? [];
  const sow           = sowQ.data ?? [];
  const examSchedules = examSchedulesQ.data ?? [];
  const examPapers    = examPapersQ.data ?? [];
  const reports       = reportsQ.data ?? [];
  const portfolio     = portfolioQ.data ?? [];
  const audit         = auditQ.data ?? [];
  const performance   = performanceQ.data ?? [];
  const students      = (studentsQ.data ?? []) as any[];
  const teachers      = (teachersQ.data ?? []) as any[];

  const isLoading = yearsQ.isLoading || subjectsQ.isLoading || classesQ.isLoading;
  const errors = [yearsQ.error, termsQ.error, subjectsQ.error, classesQ.error, classSubjectsQ.error, areasQ.error, strandsQ.error, subStrandsQ.error, schemesQ.error, bandsQ.error, competenciesQ.error, sowQ.error, examSchedulesQ.error, examPapersQ.error, reportsQ.error, portfolioQ.error, auditQ.error, performanceQ.error, studentsQ.error, teachersQ.error].filter(Boolean) as Error[];

  const inv = (k: string) => qc.invalidateQueries({ queryKey: [k] });
  const invAll = () => ['acad_years','acad_terms','acad_subjects','acad_classes','acad_class_subjects','acad_areas','acad_strands','acad_substrands','acad_schemes','acad_bands','acad_competencies','acad_sow','acad_exam_schedules','acad_exam_papers','acad_reports','acad_portfolio','acad_audit','acad_performance'].forEach(inv);

  // Years / terms / subjects
  const upsertYear = useMutation({ mutationFn: api.upsertYear, onSuccess: () => inv('acad_years') });
  const upsertTerm = useMutation({ mutationFn: api.upsertTerm, onSuccess: () => inv('acad_terms') });
  const createSubject = useMutation({ mutationFn: api.createSubject, onSuccess: () => inv('acad_subjects') });
  const updateSubject = useMutation({ mutationFn: (p: any) => api.updateSubject(p.id, p.patch), onSuccess: () => inv('acad_subjects') });
  const deleteSubject = useMutation({ mutationFn: (id: string) => api.deleteSubject(id), onSuccess: invAll });

  // Hierarchy
  const addArea      = useMutation({ mutationFn: api.addLearningArea, onSuccess: () => inv('acad_areas') });
  const addStrand    = useMutation({ mutationFn: api.addStrand,      onSuccess: () => inv('acad_strands') });
  const addSubStrand = useMutation({ mutationFn: api.addSubStrand,   onSuccess: () => inv('acad_substrands') });
  const removeHier   = useMutation({ mutationFn: (p: any) => api.deleteHierarchyRow(p.table, p.id), onSuccess: invAll });

  // Class subject mapping
  const assignClassSubject   = useMutation({ mutationFn: api.assignClassSubject,   onSuccess: () => inv('acad_class_subjects') });
  const unassignClassSubject = useMutation({ mutationFn: (id: string) => api.unassignClassSubject(id), onSuccess: () => inv('acad_class_subjects') });

  // Grading
  const upsertScheme = useMutation({ mutationFn: api.upsertScheme, onSuccess: () => inv('acad_schemes') });
  const addBand      = useMutation({ mutationFn: api.addBand,      onSuccess: () => inv('acad_bands') });
  const removeBand   = useMutation({ mutationFn: (id: string) => api.deleteBand(id), onSuccess: () => inv('acad_bands') });
  const addCompetency = useMutation({ mutationFn: api.addCompetency, onSuccess: () => inv('acad_competencies') });

  // SoW
  const createSoW       = useMutation({ mutationFn: api.createSchemeOfWork, onSuccess: () => inv('acad_sow') });
  const addSowTopic     = useMutation({ mutationFn: api.addSchemeTopic,     onSuccess: invAll });
  const updateSowTopic  = useMutation({ mutationFn: (p: any) => api.updateSchemeTopic(p.id, p.patch), onSuccess: invAll });

  // Exams
  const createSchedule   = useMutation({ mutationFn: api.createExamSchedule, onSuccess: () => inv('acad_exam_schedules') });
  const addPaper         = useMutation({ mutationFn: api.addExamPaper,       onSuccess: () => inv('acad_exam_papers') });
  const removePaper      = useMutation({ mutationFn: (id: string) => api.deleteExamPaper(id), onSuccess: () => inv('acad_exam_papers') });

  // Results
  const upsertResults    = useMutation({ mutationFn: api.upsertResults,      onSuccess: invAll });
  const moderateResult   = useMutation({ mutationFn: (p: any) => api.moderateResult(p.id, p.moderated_score, p.moderated_by), onSuccess: invAll });
  const finalizeResults  = useMutation({ mutationFn: (paperId: string) => api.finalizeResults(paperId), onSuccess: invAll });

  // Reports
  const buildReport      = useMutation({ mutationFn: (p: any) => api.buildReportCard(p.studentId, p.yearId, p.termId, p.actor), onSuccess: () => { inv('acad_reports'); inv('acad_audit'); } });
  const rankClass        = useMutation({ mutationFn: (p: any) => api.rankClass(p.className, p.yearId, p.termId), onSuccess: () => inv('acad_reports') });
  const updateReport     = useMutation({ mutationFn: (p: any) => api.updateReportCard(p.id, p.patch), onSuccess: () => inv('acad_reports') });
  const updateReportLine = useMutation({ mutationFn: (p: any) => api.updateReportLine(p.id, p.patch), onSuccess: () => inv('acad_reports') });

  // Portfolio
  const addPortfolio     = useMutation({ mutationFn: api.addPortfolioItem,   onSuccess: () => inv('acad_portfolio') });
  const removePortfolio  = useMutation({ mutationFn: (id: string) => api.deletePortfolioItem(id), onSuccess: () => inv('acad_portfolio') });

  // Helpers
  const currentYear = useMemo(() => years.find(y => y.is_current) ?? years[0], [years]);
  const currentTerm = useMemo(() => terms.find(t => t.is_current) ?? terms[0], [terms]);
  const defaultScheme = useMemo(() => schemes.find(s => s.is_default) ?? schemes[0], [schemes]);
  const defaultBands = useMemo(() => bands.filter(b => b.scheme_id === defaultScheme?.id).sort((a,b) => b.min_score - a.min_score), [bands, defaultScheme]);
  const subjectById = (id: string) => subjects.find(s => s.id === id);
  const classById   = (id: string) => classes.find((c: any) => c.id === id);
  const teacherById = (id: string) => teachers.find(t => t.id === id);
  const studentById = (id: string) => students.find(s => s.id === id);

  const stats = useMemo(() => ({
    subjects: subjects.length,
    classes: classes.length,
    schedules: examSchedules.length,
    papers: examPapers.length,
    reports: reports.length,
    published: reports.filter(r => r.status === 'Published').length,
    pending: reports.filter(r => r.status === 'Draft' || r.status === 'Ready-for-Review').length,
    schemesOfWork: sow.length,
  }), [subjects, classes, examSchedules, examPapers, reports, sow]);

  return {
    // data
    years, terms, subjects, classes, classSubjects, areas, strands, subStrands,
    schemes, bands, competencies, sow, examSchedules, examPapers, reports, portfolio,
    audit, performance, students, teachers,
    // derived
    currentYear, currentTerm, defaultScheme, defaultBands, stats,
    // helpers
    subjectById, classById, teacherById, studentById,
    // state
    isLoading, errors,
    // mutations
    upsertYear, upsertTerm, createSubject, updateSubject, deleteSubject,
    addArea, addStrand, addSubStrand, removeHier,
    assignClassSubject, unassignClassSubject,
    upsertScheme, addBand, removeBand, addCompetency,
    createSoW, addSowTopic, updateSowTopic,
    createSchedule, addPaper, removePaper,
    upsertResults, moderateResult, finalizeResults,
    buildReport, rankClass, updateReport, updateReportLine,
    addPortfolio, removePortfolio,
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