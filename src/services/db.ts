import { supabase, getLocalDB, saveLocalDB } from '../lib/supabase/client';
import { Student, Teacher, AcademicClass, Subject, Invoice, Book, TransportRoute, Employee, InventoryItem, AIConversation } from '../types';

// Generic CRUD helper
export const dbService = {
  async getAll<T extends { id: string }>(tableName: string): Promise<T[]> {
    try {
      const { data, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data as T[];
      }
    } catch {
      // ignore
    }
    return getLocalDB<T>(tableName, []);
  },

  async create<T extends { id: string }>(tableName: string, item: Omit<T, 'id'>): Promise<T> {
    const newItem = {
      ...item,
      id: `id_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    } as unknown as T;

    try {
      const { data, error } = await supabase.from(tableName).insert([newItem]).select().single();
      if (!error && data) {
        return data as T;
      }
    } catch {
      // ignore
    }
    const current = getLocalDB<T>(tableName, []);
    const updated = [newItem, ...current];
    saveLocalDB(tableName, updated);
    return newItem;
  },

  async update<T extends { id: string }>(tableName: string, id: string, updates: Partial<T>): Promise<T> {
    try {
      const { data, error } = await supabase.from(tableName).update(updates as any).eq('id', id).select().single();
      if (!error && data) {
        return data as T;
      }
    } catch {
      // ignore
    }
    const current = getLocalDB<T>(tableName, []);
    const updated = current.map((i) => (i.id === id ? { ...i, ...updates } : i));
    saveLocalDB(tableName, updated);
    return updated.find((i) => i.id === id)!;
  },

  async delete<T extends { id: string }>(tableName: string, id: string): Promise<void> {
    try {
      await supabase.from(tableName).delete().eq('id', id);
    } catch {
      // ignore
    }
    const current = getLocalDB<T>(tableName, []);
    saveLocalDB(
      tableName,
      current.filter((i) => i.id !== id)
    );
  },
};

// Typed services
export const studentService = {
  getAll: () => dbService.getAll<Student>('students'),
  create: (item: Omit<Student, 'id'>) => dbService.create<Student>('students', item),
  update: (id: string, updates: Partial<Student>) => dbService.update<Student>('students', id, updates),
  delete: (id: string) => dbService.delete<Student>('students', id),
};

export const teacherService = {
  getAll: () => dbService.getAll<Teacher>('teachers'),
  create: (item: Omit<Teacher, 'id'>) => dbService.create<Teacher>('teachers', item),
  update: (id: string, updates: Partial<Teacher>) => dbService.update<Teacher>('teachers', id, updates),
  delete: (id: string) => dbService.delete<Teacher>('teachers', id),
};

export const classService = {
  getAll: () => dbService.getAll<AcademicClass>('academic_classes'),
  create: (item: Omit<AcademicClass, 'id'>) => dbService.create<AcademicClass>('academic_classes', item),
  update: (id: string, updates: Partial<AcademicClass>) => dbService.update<AcademicClass>('academic_classes', id, updates),
  delete: (id: string) => dbService.delete<AcademicClass>('academic_classes', id),
};

export const subjectService = {
  getAll: () => dbService.getAll<Subject>('subjects'),
  create: (item: Omit<Subject, 'id'>) => dbService.create<Subject>('subjects', item),
  update: (id: string, updates: Partial<Subject>) => dbService.update<Subject>('subjects', id, updates),
  delete: (id: string) => dbService.delete<Subject>('subjects', id),
};

export const financeService = {
  getAllInvoices: () => dbService.getAll<Invoice>('invoices'),
  createInvoice: (item: Omit<Invoice, 'id'>) => dbService.create<Invoice>('invoices', item),
  updateInvoice: (id: string, updates: Partial<Invoice>) => dbService.update<Invoice>('invoices', id, updates),
  deleteInvoice: (id: string) => dbService.delete<Invoice>('invoices', id),
};

export const libraryService = {
  getAllBooks: () => dbService.getAll<Book>('books'),
  createBook: (item: Omit<Book, 'id'>) => dbService.create<Book>('books', item),
  updateBook: (id: string, updates: Partial<Book>) => dbService.update<Book>('books', id, updates),
  deleteBook: (id: string) => dbService.delete<Book>('books', id),
};

export const transportService = {
  getAllRoutes: () => dbService.getAll<TransportRoute>('transport_routes'),
  createRoute: (item: Omit<TransportRoute, 'id'>) => dbService.create<TransportRoute>('transport_routes', item),
  updateRoute: (id: string, updates: Partial<TransportRoute>) => dbService.update<TransportRoute>('transport_routes', id, updates),
  deleteRoute: (id: string) => dbService.delete<TransportRoute>('transport_routes', id),
};

export const hrService = {
  getAllEmployees: () => dbService.getAll<Employee>('employees'),
  createEmployee: (item: Omit<Employee, 'id'>) => dbService.create<Employee>('employees', item),
  updateEmployee: (id: string, updates: Partial<Employee>) => dbService.update<Employee>('employees', id, updates),
  deleteEmployee: (id: string) => dbService.delete<Employee>('employees', id),
};

export const inventoryService = {
  getAllItems: () => dbService.getAll<InventoryItem>('inventory_items'),
  createItem: (item: Omit<InventoryItem, 'id'>) => dbService.create<InventoryItem>('inventory_items', item),
  updateItem: (id: string, updates: Partial<InventoryItem>) => dbService.update<InventoryItem>('inventory_items', id, updates),
  deleteItem: (id: string) => dbService.delete<InventoryItem>('inventory_items', id),
};

export const aiService = {
  getAllConversations: () => dbService.getAll<AIConversation>('ai_conversations'),
  saveConversation: (conv: AIConversation) => {
    const current = getLocalDB<AIConversation>('ai_conversations', []);
    const existing = current.findIndex((c) => c.id === conv.id);
    if (existing >= 0) {
      current[existing] = conv;
    } else {
      current.unshift(conv);
    }
    saveLocalDB('ai_conversations', current);
    return Promise.resolve(conv);
  },
};
