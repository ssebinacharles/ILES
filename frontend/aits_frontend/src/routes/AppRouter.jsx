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


