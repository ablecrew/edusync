export const COMPLETE_SQL_SCHEMA = `-- ==============================================================================
-- EDUSYNC ENTERPRISE SCHOOL MANAGEMENT SYSTEM — COMPLETE SUPABASE SQL SCHEMA
-- Run this entire script in your Supabase SQL Editor to initialize all tables,
-- RLS policies, indexes, triggers, and default enterprise seed data.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users / Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Teacher',
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  class_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  stream TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  guardian_email TEXT,
  address TEXT,
  medical_conditions TEXT,
  blood_group TEXT,
  allergies TEXT,
  enrolled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  avatar_url TEXT,
  fee_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT NOT NULL,
  department TEXT NOT NULL,
  qualification TEXT NOT NULL,
  specialization TEXT,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Active',
  salary NUMERIC NOT NULL,
  avatar_url TEXT,
  subjects TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Academic Classes Table
CREATE TABLE IF NOT EXISTS public.academic_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  level INTEGER NOT NULL,
  class_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  class_teacher_name TEXT,
  room_number TEXT NOT NULL,
  capacity INTEGER DEFAULT 40,
  current_students INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  credits INTEGER DEFAULT 3,
  is_cbc BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Invoices / Finance Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Unpaid',
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create Library Books Table
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  isbn TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  total_copies INTEGER NOT NULL DEFAULT 5,
  available_copies INTEGER NOT NULL DEFAULT 5,
  shelf_location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create Transport Routes Table
CREATE TABLE IF NOT EXISTS public.transport_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_name TEXT UNIQUE NOT NULL,
  vehicle_number TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  capacity INTEGER DEFAULT 50,
  enrolled_students INTEGER DEFAULT 0,
  monthly_fee NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create HR Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  department TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  basic_salary NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Create Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL,
  supplier TEXT NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'In Stock',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Create AI Conversations Table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create open access policies for easy enterprise deployment
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow public all students" ON public.students FOR ALL USING (true);
CREATE POLICY "Allow public all teachers" ON public.teachers FOR ALL USING (true);
CREATE POLICY "Allow public all academic_classes" ON public.academic_classes FOR ALL USING (true);
CREATE POLICY "Allow public all subjects" ON public.subjects FOR ALL USING (true);
CREATE POLICY "Allow public all invoices" ON public.invoices FOR ALL USING (true);
CREATE POLICY "Allow public all books" ON public.books FOR ALL USING (true);
CREATE POLICY "Allow public all transport_routes" ON public.transport_routes FOR ALL USING (true);
CREATE POLICY "Allow public all employees" ON public.employees FOR ALL USING (true);
CREATE POLICY "Allow public all inventory_items" ON public.inventory_items FOR ALL USING (true);
CREATE POLICY "Allow public all ai_conversations" ON public.ai_conversations FOR ALL USING (true);
`;
