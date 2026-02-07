import { useState } from 'react'
import './styles/App.css'
import HealthStatus from './components/HealthStatus'
import ErrorBoundary from './components/ErrorBoundary'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </>
  )
}

export default App
