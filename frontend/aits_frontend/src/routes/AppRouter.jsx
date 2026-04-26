import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext';
import DashboardLayout from './DashboardLayout';

import LoginPage from '../LoginPage';
import NotFoundPage from '../NotFoundPage';

import StudentDashboard from '../StudentDashboard';
import StudentPlacementsPage from '../StudentPlacementsPage';
import StudentWeeklyLogsPage from '../StudentWeeklyLogsPage';
import StudentResultsPage from '../StudentResultsPage';

import SupervisorDashboard from '../SupervisorDashboard';
import SupervisorReviewsPage from '../SupervisorReviewsPage';
import SupervisorEvaluationsPage from '../SupervisorEvaluationsPage';

import AdminDashboard from '../AdminDashboard';
import AdminPlacementsPage from '../AdminPlacementsPage';
import AdminAssignmentsPage from '../AdminAssignmentsPage';
import AdminReportsPage from '../AdminReportsPage';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Student routes */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="placements" element={<StudentPlacementsPage />} />
            <Route path="logs" element={<StudentWeeklyLogsPage />} />
            <Route path="results" element={<StudentResultsPage />} />
          </Route>


