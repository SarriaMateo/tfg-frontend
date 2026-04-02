import { useState } from "react";
import { Container, Row, Col, Card, Spinner, Alert, ButtonGroup, Button } from "react-bootstrap";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";
import { useDashboard } from "../hooks/useDashboard";

// Component sections will be implemented in stages
// Placeholder component for each section
const DashboardControls = ({ selectedPeriod, onPeriodChange, selectedBranch, onBranchChange, isCentralUser, workBranchId, workBranchName }) => {
  const periodOptions = [
    { value: "day", label: "Día" },
    { value: "week", label: "Semana" },
    { value: "month", label: "Mes" },
    { value: "total", label: "Total" },
  ];

  return (
    <div className="d-flex gap-4 align-items-center flex-wrap">
      {/* Period selector */}
      <div>
        <label className="small text-muted d-block mb-2">Periodo</label>
        <ButtonGroup>
          {periodOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedPeriod === option.value ? "secondary" : "outline-secondary"}
              size="sm"
              onClick={() => onPeriodChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      {/* Branch selector (only for central users) */}
      {isCentralUser && (
        <div>
          <label className="small text-muted d-block mb-2">Sede</label>
          <ButtonGroup>
            <Button
              variant={selectedBranch === null ? "secondary" : "outline-secondary"}
              size="sm"
              onClick={() => onBranchChange(null)}
            >
              Total
            </Button>
            <Button
              variant={selectedBranch === workBranchId ? "secondary" : "outline-secondary"}
              size="sm"
              onClick={() => onBranchChange(workBranchId)}
              disabled={!workBranchId}
            >
              {workBranchName || "Sede de trabajo"}
            </Button>
          </ButtonGroup>
        </div>
      )}
    </div>
  );
};

const DashboardSummarySection = ({ loading, error, activityData, stockRiskData }) => {
  if (loading) {
    return (
      <Card className="shadow-sm border-0 h-100">
        <Card.Body className="p-4 text-center">
          <Spinner animation="border" size="sm" />
        </Card.Body>
      </Card>
    );
  }

  // Extract aggregate data from all branches
  const aggregatedData = activityData?.data?.reduce(
    (acc, branchData) => ({
      totalOperations: acc.totalOperations + (branchData.operations_count || 0),
      totalIncoming: acc.totalIncoming + (branchData.incoming_transaction_lines_count || 0),
      totalOutgoing: acc.totalOutgoing + (branchData.outgoing_transaction_lines_count || 0),
    }),
    { totalOperations: 0, totalIncoming: 0, totalOutgoing: 0 }
  ) || { totalOperations: 0, totalIncoming: 0, totalOutgoing: 0 };

  // Get pending operations from stock risk data
  const pendingOperations = stockRiskData?.data?.reduce(
    (acc, branchData) => acc + (branchData.pending_operations_count || 0),
    0
  ) || 0;

  return (
    <Card className="shadow-sm border-0 h-100">
      <Card.Body className="p-4">
        <div className="d-flex flex-column h-100">
          <h5 className="text-dark fw-bold mb-4">Resumen</h5>

          {/* Big numbers section */}
          <div className="d-flex gap-4 flex-grow-1 align-items-center">
            {/* Completed operations */}
            <div className="text-center flex-grow-1">
              <p className="text-muted small mb-2">Operaciones Completadas</p>
              <p className="display-4 fw-bold text-primary mb-0">
                {aggregatedData.totalOperations}
              </p>
            </div>

            {/* Pending operations */}
            <div className="text-center flex-grow-1">
              <p className="text-muted small mb-2">Operaciones Pendientes</p>
              <p className="display-4 fw-bold text-warning mb-0">
                {pendingOperations}
              </p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="mt-4 pt-4 border-top">
            <div className="row g-3">
              <div className="col-6">
                <small className="text-muted d-block">Líneas Entrantes</small>
                <p className="mb-0 fw-bold text-info">{aggregatedData.totalIncoming}</p>
              </div>
              <div className="col-6">
                <small className="text-muted d-block">Líneas Salientes</small>
                <p className="mb-0 fw-bold text-danger">{aggregatedData.totalOutgoing}</p>
              </div>
            </div>
          </div>
        </div>
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

  const parsedStoredBranchId = Number(localStorage.getItem("selectedBranchId"));
  const workBranchId = Number.isInteger(parsedStoredBranchId) && parsedStoredBranchId > 0
    ? parsedStoredBranchId
    : null;

  // Dashboard state
  const [selectedPeriod, setSelectedPeriod] = useState("day");
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Check if user is central (can see all branches)
  const isCentralUser = user?.branch_id == null;

  const resolvedBranchId = isCentralUser
    ? selectedBranch
    : user?.branch_id;

  // Fetch dashboard data
  const { activityData, stockRiskData, loading, error } = useDashboard({
    period: selectedPeriod,
    branchId: resolvedBranchId,
  });

  const workBranchName = activityData?.data?.find(
    (branchData) => Number(branchData?.branch?.branch_id) === Number(workBranchId)
  )?.branch?.branch_name || null;

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

        {/* Controls (Period and Branch selectors) */}
        <div className="mb-4">
          <DashboardControls
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            selectedBranch={selectedBranch}
            onBranchChange={setSelectedBranch}
            isCentralUser={isCentralUser}
            workBranchId={workBranchId}
            workBranchName={workBranchName}
          />
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