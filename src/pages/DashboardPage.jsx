import { useState } from "react";
import { Container, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";
import { useAuthorization } from "../hooks/useAuthorization";
import { useDashboard } from "../hooks/useDashboard";

// Component sections will be implemented in stages
// Placeholder component for each section
const DashboardSummarySection = ({ loading, error, activityData, stockRiskData, selectedPeriod, selectedBranch }) => {
  if (loading) {
    return (
      <Card className="shadow-sm border-0">
        <Card.Body className="p-4 text-center">
          <Spinner animation="border" size="sm" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-4">
        <h5 className="text-dark fw-bold mb-4">Resumen</h5>
        {/* To be implemented in Stage 2-3 */}
        <p className="text-muted">Sección de resumen - En desarrollo</p>
      </Card.Body>
    </Card>
  );
};

const DashboardAlertsSection = ({ loading, error, stockRiskData }) => {
  if (loading) {
    return (
      <Card className="shadow-sm border-0">
        <Card.Body className="p-4 text-center">
          <Spinner animation="border" size="sm" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-4">
        <h5 className="text-dark fw-bold mb-4">Alertas</h5>
        {/* To be implemented in Stage 4 */}
        <p className="text-muted">Sección de alertas - En desarrollo</p>
      </Card.Body>
    </Card>
  );
};

const DashboardRecentOperationsSection = ({ loading, error, stockRiskData }) => {
  if (loading) {
    return (
      <Card className="shadow-sm border-0">
        <Card.Body className="p-4 text-center">
          <Spinner animation="border" size="sm" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-4">
        <h5 className="text-dark fw-bold mb-4">Últimas Operaciones</h5>
        {/* To be implemented in Stage 5 */}
        <p className="text-muted">Sección de últimas operaciones - En desarrollo</p>
      </Card.Body>
    </Card>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { hasRole } = useAuthorization();
  
  // Dashboard state
  const [selectedPeriod, setSelectedPeriod] = useState("day");
  const [selectedBranch, setSelectedBranch] = useState(null);
  
  // Check if user is central (can see all branches)
  const isCentralUser = hasRole(["CENTRAL_ADMIN"]);
  
  // Fetch dashboard data
  const { activityData, stockRiskData, loading, error, refetch } = useDashboard({
    period: selectedPeriod,
    branchId: selectedBranch || (isCentralUser ? null : user?.branch_id),
  });

  if (!user) {
    return (
      <Container className="py-5">
        <p className="text-muted">Cargando información del usuario...</p>
      </Container>
    );
  }

  return (
    <>
      <Navbar />
      <Container fluid className="py-5">
        {/* Header */}
        <div className="mb-5">
          <h1 className="display-5 fw-bold text-primary mb-2">Dashboard</h1>
          <p className="text-muted">Información relevante de tus operaciones e inventario</p>
        </div>

        {/* Error alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => {}}>
            {error}
          </Alert>
        )}

        {/* Controls (Period and Branch) - To be implemented in Stage 2 */}
        <div className="mb-4">
          {/* Period selector and branch selector will go here */}
        </div>

        {/* Main Layout: 2 columns (left: summary + alerts, right: recent operations) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", minHeight: "calc(100vh - 300px)" }}>
          {/* Left Column: Summary (top) and Alerts (bottom) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Section 1: Summary */}
            <div style={{ flex: "1 1 50%", minHeight: 0 }}>
              <DashboardSummarySection
                loading={loading}
                error={error}
                activityData={activityData}
                stockRiskData={stockRiskData}
                selectedPeriod={selectedPeriod}
                selectedBranch={selectedBranch}
              />
            </div>

            {/* Section 2: Alerts */}
            <div style={{ flex: "1 1 50%", minHeight: 0 }}>
              <DashboardAlertsSection
                loading={loading}
                error={error}
                stockRiskData={stockRiskData}
              />
            </div>
          </div>

          {/* Right Column: Recent Operations (full height) */}
          <div style={{ flex: "1 1 100%", minHeight: 0 }}>
            <DashboardRecentOperationsSection
              loading={loading}
              error={error}
              stockRiskData={stockRiskData}
            />
          </div>
        </div>
      </Container>
    </>
  );
}