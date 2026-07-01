import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardOverview } from '../features/dashboard/DashboardOverview';
import { StudentList } from '../features/students/StudentList';
import { TeacherList } from '../features/teachers/TeacherList';
import { AcademicManagement } from '../features/academics/AcademicManagement';
import { FinanceManagement } from '../features/finance/FinanceManagement';
import { LibraryManagement } from '../features/library/LibraryManagement';
import { TransportManagement } from '../features/transport/TransportManagement';
import { HRManagement } from '../features/hr/HRManagement';
import { InventoryManagement } from '../features/inventory/InventoryManagement';
import { SettingsManagement } from '../features/settings/SettingsManagement';
import { ReportsAnalytics } from '../features/reports/ReportsAnalytics';
import { NotFoundPage } from '../features/common/NotFoundPage';
import { UnauthorizedPage } from '../features/common/UnauthorizedPage';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Enterprise Routes governed by RBAC & Session state */}
      <Route path="/dashboard" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<DashboardOverview />} />
        <Route path="students" element={<StudentList />} />
        <Route path="teachers" element={<TeacherList />} />
        <Route path="academics" element={<AcademicManagement />} />
        <Route path="finance" element={<FinanceManagement />} />
        <Route path="library" element={<LibraryManagement />} />
        <Route path="transport" element={<TransportManagement />} />
        <Route path="hr" element={<HRManagement />} />
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="settings" element={<SettingsManagement />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
