import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  studentService,
  teacherService,
  classService,
  subjectService,
  financeService,
  libraryService,
  transportService,
  hrService,
  inventoryService,
  aiService,
} from '../services/db';
import { Student, Teacher, AcademicClass, Subject, Invoice, Book, TransportRoute, Employee, InventoryItem } from '../types';

// STUDENTS
export function useStudents() {
  return useQuery({ queryKey: ['students'], queryFn: studentService.getAll });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newStudent: Omit<Student, 'id'>) => studentService.create(newStudent),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Student> }) => studentService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });
}

// TEACHERS
export function useTeachers() {
  return useQuery({ queryKey: ['teachers'], queryFn: teacherService.getAll });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTeacher: Omit<Teacher, 'id'>) => teacherService.create(newTeacher),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teachers'] }),
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Teacher> }) => teacherService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teachers'] }),
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teachers'] }),
  });
}

// CLASSES
export function useClasses() {
  return useQuery({ queryKey: ['classes'], queryFn: classService.getAll });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newClass: Omit<AcademicClass, 'id'>) => classService.create(newClass),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes'] }),
  });
}

// SUBJECTS
export function useSubjects() {
  return useQuery({ queryKey: ['subjects'], queryFn: subjectService.getAll });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newSub: Omit<Subject, 'id'>) => subjectService.create(newSub),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });
}

// FINANCE
export function useInvoices() {
  return useQuery({ queryKey: ['invoices'], queryFn: financeService.getAllInvoices });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newInv: Omit<Invoice, 'id'>) => financeService.createInvoice(newInv),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

// LIBRARY
export function useBooks() {
  return useQuery({ queryKey: ['books'], queryFn: libraryService.getAllBooks });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newBk: Omit<Book, 'id'>) => libraryService.createBook(newBk),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });
}

// TRANSPORT
export function useRoutes() {
  return useQuery({ queryKey: ['routes'], queryFn: transportService.getAllRoutes });
}

export function useCreateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newRt: Omit<TransportRoute, 'id'>) => transportService.createRoute(newRt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routes'] }),
  });
}

// HR EMPLOYEES
export function useEmployees() {
  return useQuery({ queryKey: ['employees'], queryFn: hrService.getAllEmployees });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newEmp: Omit<Employee, 'id'>) => hrService.createEmployee(newEmp),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });
}

// INVENTORY
export function useInventory() {
  return useQuery({ queryKey: ['inventory'], queryFn: inventoryService.getAllItems });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newIt: Omit<InventoryItem, 'id'>) => inventoryService.createItem(newIt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

// AI CONVERSATIONS
export function useAIConversations() {
  return useQuery({ queryKey: ['ai_conversations'], queryFn: aiService.getAllConversations });
}
