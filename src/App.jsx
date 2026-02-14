import { useState } from 'react'
import './styles/App.css'
import HealthStatus from './components/HealthStatus'
import ErrorBoundary from './components/ErrorBoundary'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import OperationsPage from "./pages/OperationsPage";
import SettingsPage from "./pages/SettingsPage";
import TestDashboard from "./pages/test/TestDashboard";
import AdminTestPage from "./pages/test/AdminTestPage";
import ManagerTestPage from "./pages/test/ManagerTestPage";
import EmployeeTestPage from "./pages/test/EmployeeTestPage";
import TestBranchPage from "./pages/test/TestBranchPage";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/inventory" 
                element={
                  <PrivateRoute>
                    <InventoryPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/operations" 
                element={
                  <PrivateRoute>
                    <OperationsPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <PrivateRoute>
                    <SettingsPage />
                  </PrivateRoute>
                } 
              />
              
              {/* Test Routes */}
              <Route 
                path="/test" 
                element={
                  <PrivateRoute>
                    <TestDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/test/admin" 
                element={
                  <PrivateRoute requiredRoles="ADMIN">
                    <AdminTestPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/test/manager" 
                element={
                  <PrivateRoute requiredRoles="MANAGER">
                    <ManagerTestPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/test/employee" 
                element={
                  <PrivateRoute requiredRoles="EMPLOYEE">
                    <EmployeeTestPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/test/branch" 
                element={
                  <PrivateRoute>
                    <TestBranchPage />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </>
  )
}

export default App
