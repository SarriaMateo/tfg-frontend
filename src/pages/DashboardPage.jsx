import { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, Spinner, Alert, ButtonGroup, Button, DropdownButton, Dropdown } from "react-bootstrap";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";
import { useDashboard } from "../hooks/useDashboard";
import { DASHBOARD_COLORS } from "../constants/colors";
import { useNavigate } from "react-router-dom";
import { branchService } from "../services/branchService";
import { transactionService } from "../services/transactionService";
import {
  BsDownload,
  BsArrowLeftRight,
  BsUpload,
  BsGear,
  BsInfoCircle,
} from "react-icons/bs";

const DISMISSED_ALERTS_STORAGE_KEY = "dashboard:dismissedAlerts";

// Component sections will be implemented in stages
// Placeholder component for each section
const DashboardControls = ({
  selectedPeriod,
  onPeriodChange,
  selectedBranch,
  onBranchChange,
  isCentralUser,
  branchOptions,
  selectedBranchName,
}) => {
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
          <ButtonGroup>
            <Button
              variant={selectedBranch === null ? "secondary" : "outline-secondary"}
              size="sm"
              onClick={() => onBranchChange(null)}
            >
              Total
            </Button>
            <DropdownButton
              title={selectedBranchName || "Seleccionar sede"}
              variant={selectedBranch === null ? "outline-secondary" : "secondary"}
              size="sm"
              align="end"
            >
              {branchOptions.map((branch) => (
                <Dropdown.Item
                  key={branch.id}
                  active={selectedBranch === branch.id}
                  onClick={() => onBranchChange(branch.id)}
                >
                  {branch.name}
                </Dropdown.Item>
              ))}
            </DropdownButton>
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

  const pieOperationTypes = ["IN", "OUT", "TRANSFER", "ADJUSTMENT"];

  const pieData = pieOperationTypes.flatMap((operationType) => {
    const incomingValue = activityData?.data?.reduce(
      (acc, branchData) => acc + (branchData?.incoming_transaction_lines_by_operation?.[operationType] || 0),
      0
    ) || 0;

    const outgoingValue = activityData?.data?.reduce(
      (acc, branchData) => acc + (branchData?.outgoing_transaction_lines_by_operation?.[operationType] || 0),
      0
    ) || 0;

    return [
      {
        key: `incoming-${operationType}`,
        name: `Entrantes ${operationType}`,
        value: incomingValue,
        color: DASHBOARD_COLORS.transactions.incoming[operationType],
      },
      {
        key: `outgoing-${operationType}`,
        name: `Salientes ${operationType}`,
        value: outgoingValue,
        color: DASHBOARD_COLORS.transactions.outgoing[operationType],
      },
    ];
  }).filter((entry) => entry.value > 0);

  const stockByBranchChartData = (stockRiskData?.data || []).map((branchData) => ({
    branchName: branchData?.branch?.branch_name || "Sin sede",
    zero: branchData?.stock_buckets?.zero_stock_items || 0,
    low: branchData?.stock_buckets?.low_stock_items || 0,
    healthy: branchData?.stock_buckets?.healthy_stock_items || 0,
  }));

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
              <p className="display-6 fw-bold text-primary mb-0">
                {aggregatedData.totalOperations}
              </p>
            </div>

            {/* Pending operations */}
            <div className="text-center flex-grow-1">
              <p className="text-muted small mb-2">Operaciones Pendientes</p>
              <p className="display-6 fw-bold text-warning mb-0">
                {pendingOperations}
              </p>
            </div>
          </div>

          {/* Charts section */}
          <div className="mt-4 pt-4 border-top">
            <div className="row g-3">
              <div className="col-12 col-xl-6">
                <p className="small text-muted mb-2">Líneas entrantes y salientes por operación</p>
                <div style={{ height: 260 }}>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={80}
                          paddingAngle={2}
                          startAngle={180}
                          endAngle={-180}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.key} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}`, "Líneas"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-100 d-flex align-items-center justify-content-center text-muted small">
                      Sin datos para mostrar
                    </div>
                  )}
                </div>
              </div>

              <div className="col-12 col-xl-6">
                <p className="small text-muted mb-2">Estado de stock por sede</p>
                <div style={{ height: 260 }}>
                  {stockByBranchChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stockByBranchChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="branchName" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="healthy" name="Stock saludable" stackId="stock" fill={DASHBOARD_COLORS.stock.healthy} />
                        <Bar dataKey="low" name="Stock bajo" stackId="stock" fill={DASHBOARD_COLORS.stock.low} />
                        <Bar dataKey="zero" name="Stock cero" stackId="stock" fill={DASHBOARD_COLORS.stock.zero} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-100 d-flex align-items-center justify-content-center text-muted small">
                      Sin datos para mostrar
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

const DashboardAlertsSection = ({
  loading,
  alerts,
  dismissedCount,
  onDismissAlert,
  onShowAllAlerts,
  onNavigateToAlert,
}) => {
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
    <Card className="shadow-sm border-0 h-100">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="text-dark fw-bold mb-0">Alertas</h5>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onShowAllAlerts}
            disabled={dismissedCount === 0}
          >
            Mostrar todas
          </Button>
        </div>

        {alerts.length === 0 ? (
          <p className="text-muted mb-0">No hay alertas activas</p>
        ) : (
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            <div className="d-flex flex-column gap-2">
              {alerts.map((alertItem) => (
                <button
                  key={alertItem.id}
                  type="button"
                  className="btn btn-light text-start"
                  onClick={() => onNavigateToAlert(alertItem.path)}
                  style={{
                    borderLeft: `5px solid ${alertItem.color}`,
                    backgroundColor: `${alertItem.color}20`,
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <p className="fw-semibold mb-1">{alertItem.title}</p>
                      <p className="small text-muted mb-0">{alertItem.description}</p>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-muted text-decoration-none p-0"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDismissAlert(alertItem.id);
                      }}
                    >
                      Descartar
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

const DashboardRecentOperationsSection = ({
  loading,
  error,
  transactions,
  branchesById,
  onOpenDetails,
}) => {
  if (loading) {
    return (
      <Card className="shadow-sm border-0 h-100">
        <Card.Body className="p-4 text-center">
          <Spinner animation="border" size="sm" />
        </Card.Body>
      </Card>
    );
  }

  const formatDateTime = (value) => {
    if (!value) return "-";
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return "-";

    const day = String(parsedDate.getDate()).padStart(2, "0");
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const hours = String(parsedDate.getHours()).padStart(2, "0");
    const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
    return `${day}/${month}, ${hours}:${minutes}`;
  };

  const cropDescription = (value) => {
    if (!value) return "-";
    const maxLength = 70;
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
  };

  const getTypeIcon = (operationType) => {
    switch (operationType) {
      case "IN":
        return <BsDownload title="Entrada" />;
      case "OUT":
        return <BsUpload title="Salida" />;
      case "TRANSFER":
        return <BsArrowLeftRight title="Traspaso" />;
      case "ADJUSTMENT":
        return <BsGear title="Ajuste" />;
      default:
        return <BsInfoCircle title={operationType || "Operación"} />;
    }
  };

  const getStatusRowClass = (status) => {
    const normalizedStatus = status === "COMPLETED" ? "COMPLETE" : status;

    if (normalizedStatus === "PENDING") return "transaction-status-pending-row";
    if (normalizedStatus === "TRANSIT") return "transaction-status-transit-row";
    if (normalizedStatus === "CANCELLED") return "transaction-status-cancelled-row";
    return "";
  };

  const getBranchDisplay = (transaction) => {
    const branchId = Number(transaction?.branch_id);
    const destinationBranchId = Number(transaction?.destination_branch_id);
    const originBranchName = branchesById.get(branchId) || (branchId ? `Sede #${branchId}` : "-");

    if (transaction?.operation_type !== "TRANSFER") return originBranchName;

    const destinationBranchName = branchesById.get(destinationBranchId)
      || (destinationBranchId ? `Sede #${destinationBranchId}` : "-");
    return `${originBranchName} → ${destinationBranchName}`;
  };

  return (
    <Card className="shadow-sm border-0 h-100">
      <Card.Body className="p-4">
        <h5 className="text-dark fw-bold mb-3">Últimas Operaciones</h5>

        {error && <p className="text-danger small">{error}</p>}

        <div style={{ height: 520, overflowY: "auto" }}>
          <table className="table table-sm table-hover align-middle mb-0 dashboard-recent-operations-table">
            <thead style={{ position: "sticky", top: 0, background: "white", zIndex: 1 }}>
              <tr>
                <th>Tipo</th>
                <th>Sede</th>
                <th>Fecha y hora</th>
                <th>Descripción</th>
                <th className="text-center">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No hay operaciones recientes
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className={getStatusRowClass(transaction.status)}>
                    <td className="fs-5">{getTypeIcon(transaction.operation_type)}</td>
                    <td>{getBranchDisplay(transaction)}</td>
                    <td>{formatDateTime(transaction.last_event_at || transaction.created_at)}</td>
                    <td>
                      <span title={transaction.description || ""}>
                        {cropDescription(transaction.description)}
                      </span>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="primary"
                        size="sm"
                        className="list-action-btn"
                        onClick={() => onOpenDetails(transaction.id)}
                        title="Ver detalles"
                      >
                        <BsInfoCircle />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const parsedStoredBranchId = Number(localStorage.getItem("selectedBranchId"));
  const workBranchId = Number.isInteger(parsedStoredBranchId) && parsedStoredBranchId > 0
    ? parsedStoredBranchId
    : null;

  const [activeBranches, setActiveBranches] = useState([]);

  // Dashboard state
  const [selectedPeriod, setSelectedPeriod] = useState("day");
  const [selectedBranch, setSelectedBranch] = useState(() => workBranchId);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentTransactionsLoading, setRecentTransactionsLoading] = useState(true);
  const [recentTransactionsError, setRecentTransactionsError] = useState(null);
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try {
      const rawValue = localStorage.getItem(DISMISSED_ALERTS_STORAGE_KEY);
      const parsedValue = rawValue ? JSON.parse(rawValue) : [];
      return Array.isArray(parsedValue) ? parsedValue : [];
    } catch {
      return [];
    }
  });

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

  useEffect(() => {
    if (!isCentralUser) return;

    const loadActiveBranches = async () => {
      try {
        const response = await branchService.getBranches({ is_active: true });
        const branches = Array.isArray(response) ? response : response?.data || [];
        setActiveBranches(branches);
      } catch (loadError) {
        setActiveBranches([]);
      }
    };

    loadActiveBranches();
  }, [isCentralUser]);

  const branchOptions = useMemo(
    () => activeBranches.map((branch) => ({
      id: Number(branch.id),
      name: branch.name,
    })),
    [activeBranches]
  );

  const selectedBranchName = useMemo(() => {
    if (selectedBranch == null) return null;
    return branchOptions.find((branch) => branch.id === Number(selectedBranch))?.name || null;
  }, [branchOptions, selectedBranch]);

  const branchesById = useMemo(() => {
    const map = new Map();

    activeBranches.forEach((branch) => {
      const branchId = Number(branch?.id);
      if (branchId) map.set(branchId, branch?.name || `Sede #${branchId}`);
    });

    (stockRiskData?.data || []).forEach((branchData) => {
      const branchId = Number(branchData?.branch?.branch_id);
      if (branchId) map.set(branchId, branchData?.branch?.branch_name || `Sede #${branchId}`);
    });

    return map;
  }, [activeBranches, stockRiskData]);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        setRecentTransactionsLoading(true);
        setRecentTransactionsError(null);

        const params = {
          page: 1,
          page_size: 20,
          order_by: "last_event_at",
          order_desc: true,
        };

        if (resolvedBranchId) {
          params.branch_id = Number(resolvedBranchId);
        }

        const response = await transactionService.listTransactions(params);
        const transactions = Array.isArray(response) ? response : response?.data || [];
        setRecentTransactions(transactions);
      } catch (fetchError) {
        setRecentTransactions([]);
        setRecentTransactionsError("No se pudieron cargar las últimas operaciones");
      } finally {
        setRecentTransactionsLoading(false);
      }
    };

    fetchRecentTransactions();
  }, [resolvedBranchId]);

  const handleOpenTransactionDetails = (transactionId) => {
    navigate(`/transactions/${transactionId}`);
  };

  const allAlerts = useMemo(() => {
    const stockAlerts = (stockRiskData?.data || []).flatMap((branchData) => {
      const branchId = branchData?.branch?.branch_id;
      const branchName = branchData?.branch?.branch_name || "Sin sede";
      const items = branchData?.stock_alert_items || [];

      return items.map((item) => {
        const isZeroStock = item?.stock_status === "ZERO";
        return {
          id: `stock-${branchId}-${item.item_id}-${item.stock_status}`,
          title: isZeroStock
            ? `Stock cero: ${item.item_name}`
            : `Stock bajo: ${item.item_name}`,
          description: `Sede: ${branchName} · SKU: ${item.item_sku} · Stock: ${item.stock}`,
          color: isZeroStock
            ? DASHBOARD_COLORS.alerts.zeroStock
            : DASHBOARD_COLORS.alerts.lowStock,
          path: `/inventory/items/${item.item_id}`,
          severityOrder: isZeroStock ? 1 : 2,
        };
      });
    });

    const staleTransactionAlerts = (stockRiskData?.data || []).flatMap((branchData) => {
      const staleTransactions = branchData?.stale_transactions || [];

      return staleTransactions
        .filter((transaction) => ["PENDING", "TRANSIT"].includes(transaction?.status))
        .filter((transaction) => Number(transaction?.days_since_last_event) >= 1)
        .map((transaction) => {
          const isPending = transaction.status === "PENDING";
          return {
            id: `transaction-${transaction.transaction_id}-${transaction.status}`,
            title: isPending
              ? `PENDING +24h: #${transaction.transaction_id}`
              : `TRANSIT +24h: #${transaction.transaction_id}`,
            description: `${transaction.operation_type} · ${transaction.days_since_last_event} día(s) sin cambios`,
            color: isPending
              ? DASHBOARD_COLORS.alerts.pendingStale
              : DASHBOARD_COLORS.alerts.transitStale,
            path: `/transactions/${transaction.transaction_id}`,
            severityOrder: isPending ? 3 : 4,
          };
        });
    });

    return [...stockAlerts, ...staleTransactionAlerts].sort(
      (firstAlert, secondAlert) => firstAlert.severityOrder - secondAlert.severityOrder
    );
  }, [stockRiskData]);

  const visibleAlerts = useMemo(
    () => allAlerts.filter((alertItem) => !dismissedAlerts.includes(alertItem.id)),
    [allAlerts, dismissedAlerts]
  );

  const handleDismissAlert = (alertId) => {
    setDismissedAlerts((previousAlerts) => {
      const nextAlerts = previousAlerts.includes(alertId)
        ? previousAlerts
        : [...previousAlerts, alertId];
      localStorage.setItem(DISMISSED_ALERTS_STORAGE_KEY, JSON.stringify(nextAlerts));
      return nextAlerts;
    });
  };

  const handleShowAllAlerts = () => {
    setDismissedAlerts([]);
    localStorage.removeItem(DISMISSED_ALERTS_STORAGE_KEY);
  };

  const handleNavigateToAlert = (path) => {
    navigate(path);
  };

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
            branchOptions={branchOptions}
            selectedBranchName={selectedBranchName}
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
                alerts={visibleAlerts}
                dismissedCount={dismissedAlerts.length}
                onDismissAlert={handleDismissAlert}
                onShowAllAlerts={handleShowAllAlerts}
                onNavigateToAlert={handleNavigateToAlert}
              />
            </div>
          </div>

          {/* Right Column: Recent Operations (full height) */}
          <div style={{ flex: "1 1 100%", minHeight: 0 }}>
            <DashboardRecentOperationsSection
              loading={recentTransactionsLoading}
              error={recentTransactionsError}
              transactions={recentTransactions}
              branchesById={branchesById}
              onOpenDetails={handleOpenTransactionDetails}
            />
          </div>
        </div>
      </Container>
    </>
  );
}