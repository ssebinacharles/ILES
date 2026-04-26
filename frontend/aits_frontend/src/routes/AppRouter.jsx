import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext';
import DashboardLayout from './DashboardLayout';

