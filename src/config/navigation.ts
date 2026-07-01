import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  DollarSign,
  Library,
  Bus,
  Briefcase,
  Package,
  Settings,
  Bot,
  FileBarChart2,
} from 'lucide-react';
import { UserRole } from '../types';

export interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
  roles?: UserRole[];
  description?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [
      'Super Admin',
      'School Admin',
      'Principal',
      'Deputy Principal',
      'Bursar',
      'Teacher',
      'Class Teacher',
      'Librarian',
      'Nurse',
      'Parent',
      'Student',
      'Receptionist',
      'Transport Manager',
      'HR',
      'Store Manager',
      'Board Member',
    ],
    description: 'Enterprise executive overview & quick metrics',
  },
  {
    title: 'Students & Admissions',
    href: '/dashboard/students',
    icon: GraduationCap,
    roles: [
      'Super Admin',
      'School Admin',
      'Principal',
      'Deputy Principal',
      'Teacher',
      'Class Teacher',
      'Receptionist',
      'Nurse',
    ],
    description: 'Enrollment, student profiles, medical, and ID cards',
  },
  {
    title: 'Teachers & Staff',
    href: '/dashboard/teachers',
    icon: Users,
    roles: [
      'Super Admin',
      'School Admin',
      'Principal',
      'Deputy Principal',
      'HR',
      'Board Member',
    ],
    description: 'Faculty management, departments, and timetable assignment',
  },
  {
    title: 'Academics & CBC',
    href: '/dashboard/academics',
    icon: BookOpen,
    roles: [
      'Super Admin',
      'School Admin',
      'Principal',
      'Deputy Principal',
      'Teacher',
      'Class Teacher',
      'Student',
      'Parent',
    ],
    description: 'Curriculum, classes, timetable matrix, exams, and report cards',
  },
  {
    title: 'Finance & Bursary',
    href: '/dashboard/finance',
    icon: DollarSign,
    roles: [
      'Super Admin',
      'School Admin',
      'Principal',
      'Bursar',
      'Board Member',
    ],
    description: 'Invoices, fees collection, budget analysis, and payroll',
  },
  {
    title: 'Library System',
    href: '/dashboard/library',
    icon: Library,
    roles: [
      'Super Admin',
      'School Admin',
      'Principal',
      'Librarian',
      'Teacher',
      'Student',
    ],
    description: 'Book repository, borrowing workflow, and QR scan generator',
  },
  {
    title: 'Transport Fleet',
    href: '/dashboard/transport',
    icon: Bus,
    roles: [
      'Super Admin',
      'School Admin',
      'Principal',
      'Transport Manager',
      'Receptionist',
    ],
    description: 'Bus routes, GPS tracker simulation, driver assignments',
  },
  {
    title: 'HR & Payroll',
    href: '/dashboard/hr',
    icon: Briefcase,
    roles: [
      'Super Admin',
      'School Admin',
      'Principal',
      'HR',
      'Bursar',
    ],
    description: 'Employee records, leave approvals, recruitment pipeline',
  },
  {
    title: 'Inventory & Store',
    href: '/dashboard/inventory',
    icon: Package,
    roles: [
      'Super Admin',
      'School Admin',
      'Principal',
      'Store Manager',
      'Bursar',
    ],
    description: 'School assets, consumables, purchase orders, suppliers',
  },
  {
    title: 'Reports & Analytics',
    href: '/dashboard/reports',
    icon: FileBarChart2,
    roles: [
      'Super Admin',
      'School Admin',
      'Principal',
      'Deputy Principal',
      'Bursar',
      'HR',
      'Board Member',
    ],
    description: 'Multi-format PDF/Excel reports and custom query builder',
  },
  {
    title: 'System Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: [
      'Super Admin',
      'School Admin',
    ],
    description: 'Academic terms, roles & permissions matrix, audit logs, SQL installer',
  },
];
