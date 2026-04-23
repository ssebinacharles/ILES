import React from 'react';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '200px', background: '#f5f5f5', padding: '1rem' }}>
        {/* Sidebar content (links) go here */}
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><a href="/student/dashboard">Dashboard</a></li>
            <li><a href="/student/placements">Placements</a></li>
            <li><a href="/student/logs">Weekly Logs</a></li>
            <li><a href="/student/results">Results</a></li>
          </ul>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '1rem' }}>
        <header style={{ marginBottom: '1rem' }}>
          {/* Top navigation / header area */}
          <h2>Internship Learning Evaluation System</h2>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;