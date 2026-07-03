import {
  LayoutDashboard, Users, GraduationCap, BookOpen, DollarSign,
  Library, Bus, HardHat, Package, BarChart3, Settings, UserCircle, HeartPulse,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string | number;
  roles?: string[];   // if omitted, all roles see it
}
export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', path: '/dashboard',            icon: LayoutDashboard },
    ],
  },
  {
    title: 'Academic',
    items: [
      { label: 'Students',    path: '/dashboard/students',   icon: Users },
      { label: 'Teachers',    path: '/dashboard/teachers',   icon: GraduationCap },
      { label: 'Academics',   path: '/dashboard/academics',  icon: BookOpen },
      { label: 'Library',     path: '/dashboard/library',    icon: Library },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Finance',    path: '/dashboard/finance',    icon: DollarSign },
      { label: 'Transport',  path: '/dashboard/transport',  icon: Bus },
      { label: 'HR',         path: '/dashboard/hr',         icon: HardHat },
      { label: 'Inventory',  path: '/dashboard/inventory',  icon: Package },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Reports',    path: '/dashboard/reports',    icon: BarChart3 },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings',   path: '/dashboard/settings',   icon: Settings },
    ],
  },
];

// External portal links (open in new tab)
export const PORTAL_LINKS = [
  { label: 'Family Portal', path: '/portal',  icon: UserCircle,  description: 'For parents and students' },
  { label: 'Staff Portal',  path: '/staff',   icon: HeartPulse,  description: 'For non-teaching staff' },
];