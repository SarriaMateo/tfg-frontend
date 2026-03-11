import { useState } from 'react'
import './styles/App.css'
import HealthStatus from './components/HealthStatus'
import ErrorBoundary from './components/ErrorBoundary'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { BranchSelectionProvider } from './context/BranchSelectionContext';
import { PrivateRoute } from './components/PrivateRoute';
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import TransactionsPage from "./pages/TransactionsPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ErrorBoundary>
        <AuthProvider>
          <BranchSelectionProvider>
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
                  path="/inventory/items/:itemId" 
                  element={
                    <PrivateRoute>
                      <ItemDetailPage />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/transactions" 
                  element={
                    <PrivateRoute>
                      <TransactionsPage />
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
              </Routes>
            </Router>
          </BranchSelectionProvider>
        </AuthProvider>
      </ErrorBoundary>
    </>
  )
}

export default App
