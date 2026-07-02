export const CURRICULA = ['CBC','8-4-4','IGCSE','IB','Other'] as const;
export const SUBJECT_KINDS = ['Core','Optional','Co-curricular','Life-skill'] as const;
export const ASSESSMENT_TYPES = ['Formative','Summative','Continuous','Project','Practical','End-of-Term'] as const;
export const REPORT_STATUSES = ['Draft','Ready-for-Review','Approved','Published','Archived'] as const;
export const PATHWAYS = ['STEM','Arts and Sports Science','Social Sciences','Languages','None'] as const;
export const EVIDENCE_KINDS = ['Document','Image','Video','Audio','Link','Reflection'] as const;
export const CBC_LEVELS = ['Exceeding Expectations','Meeting Expectations','Approaching Expectations','Below Expectations'] as const;
export const CBC_LEVEL_COLORS: Record<string, string> = {
  'Exceeding Expectations': '#10b981',
  'Meeting Expectations':   '#08428C',
  'Approaching Expectations':'#f59e0b',
  'Below Expectations':     '#f43f5e',
};