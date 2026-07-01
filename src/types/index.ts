export type UserRole =
  | 'Super Admin'
  | 'School Admin'
  | 'Principal'
  | 'Deputy Principal'
  | 'Bursar'
  | 'Teacher'
  | 'Class Teacher'
  | 'Librarian'
  | 'Nurse'
  | 'Parent'
  | 'Student'
  | 'Receptionist'
  | 'Transport Manager'
  | 'HR'
  | 'Store Manager'
  | 'Board Member';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  department?: string;
  created_at: string;
}

export interface Permission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  class_id: string;
  class_name: string;
  stream: string;
  status: 'Active' | 'Graduated' | 'Suspended' | 'Transferred';
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  address: string;
  medical_conditions?: string;
  blood_group?: string;
  allergies?: string;
  enrolled_date: string;
  avatar_url?: string;
  fee_balance: number;
}

export interface Teacher {
  id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female';
  department: string;
  qualification: string;
  specialization: string;
  joining_date: string;
  status: 'Active' | 'On Leave' | 'Resigned';
  salary: number;
  avatar_url?: string;
  subjects: string[];
}

export interface AcademicClass {
  id: string;
  name: string;
  code: string;
  level: number;
  class_teacher_id?: string;
  class_teacher_name?: string;
  room_number: string;
  capacity: number;
  current_students: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  credits: number;
  is_cbc: boolean;
  description: string;
}

export interface ExamResult {
  id: string;
  student_id: string;
  student_name: string;
  exam_name: string;
  subject_name: string;
  marks: number;
  max_marks: number;
  grade: string;
  cbc_level?: 'Exceeding' | 'Meeting' | 'Approaching' | 'Below';
  remarks: string;
  recorded_date: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  student_id: string;
  student_name: string;
  class_name: string;
  term: string;
  academic_year: string;
  amount: number;
  paid_amount: number;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
  due_date: string;
  created_at: string;
  items: { description: string; amount: number }[];
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  total_copies: number;
  available_copies: number;
  shelf_location: string;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
}

export interface TransportRoute {
  id: string;
  route_name: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  capacity: number;
  enrolled_students: number;
  monthly_fee: number;
  status: 'Active' | 'Maintenance';
}

export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  role_title: string;
  department: string;
  email: string;
  phone: string;
  joining_date: string;
  basic_salary: number;
  status: 'Active' | 'On Leave' | 'Terminated';
}

export interface InventoryItem {
  id: string;
  item_code: string;
  name: string;
  category: 'Asset' | 'Consumable' | 'Electronics' | 'Furniture' | 'Sports';
  quantity: number;
  unit_price: number;
  supplier: string;
  purchase_date: string;
  status: 'In Stock' | 'Needs Reorder' | 'Damaged';
}

export interface AIConversation {
  id: string;
  title: string;
  messages: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    chartData?: any[];
    codeBlock?: string;
  }[];
  created_at: string;
}
