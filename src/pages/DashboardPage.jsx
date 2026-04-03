import { useEffect, useMemo, useRef, useState } from "react";
import { Container, Row, Col, Card, Spinner, Alert, ButtonGroup, Button, DropdownButton, Dropdown } from "react-bootstrap";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
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
    BsEyeFill,
} from "react-icons/bs";

const DISMISSED_ALERTS_STORAGE_KEY = "dashboard:dismissedAlerts";
const DASHBOARD_CONTROLS_STORAGE_PREFIX = "dashboardControlsState:";
const PERIOD_OPTIONS = ["day", "week", "month", "total"];
const DASHBOARD_SUMMARY_MIN_HEIGHT = 300;
const DASHBOARD_ALERTS_MIN_HEIGHT = 200;

const getDashboardControlsStorageKey = (userId) => `${DASHBOARD_CONTROLS_STORAGE_PREFIX}${userId}`;

const readStoredDashboardControls = (userId) => {
    if (!userId) return null;

    try {
        const rawValue = sessionStorage.getItem(getDashboardControlsStorageKey(userId));
        if (!rawValue) return null;

        const parsed = JSON.parse(rawValue);
        const period = PERIOD_OPTIONS.includes(parsed?.period) ? parsed.period : "day";
        const parsedBranchId = Number(parsed?.branchId);
        const branchId = Number.isInteger(parsedBranchId) && parsedBranchId > 0
            ? parsedBranchId
            : null;
        const parsedLastBranchId = Number(parsed?.lastBranchId);
        const lastBranchId = Number.isInteger(parsedLastBranchId) && parsedLastBranchId > 0
            ? parsedLastBranchId
            : null;

        return { period, branchId, lastBranchId };
    } catch {
        return null;
    }
};

const saveDashboardControls = (userId, controls) => {
    if (!userId) return;

    try {
        sessionStorage.setItem(getDashboardControlsStorageKey(userId), JSON.stringify(controls));
    } catch {
        // Ignore storage errors in private mode or blocked storage
    }
};

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
        <div className="dashboard-controls d-flex align-items-start justify-content-between flex-wrap gap-2">
            {/* Period selector */}
            <div className="dashboard-controls-period">
                <ButtonGroup className="dashboard-period-group">
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
                <div className="dashboard-controls-branch ms-auto">
                    <ButtonGroup className="dashboard-branch-group">
                        <Button
                            variant={selectedBranch === null ? "secondary" : "outline-secondary"}
                            size="sm"
                            onClick={() => onBranchChange(null)}
                        >
                            Total
                        </Button>
                        <DropdownButton
                            className="dashboard-branch-dropdown"
                            title={selectedBranchName}
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

const operationTypeLabels = {
    "IN": "Entrada",
    "OUT": "Salida",
    "TRANSFER": "Traspaso",
    "ADJUSTMENT": "Ajuste",
};

const getOperationTypeIcon = (operationType, title) => {
    switch (operationType) {
        case "IN":
            return <BsDownload title={title || "Entrada"} />;
        case "OUT":
            return <BsUpload title={title || "Salida"} />;
        case "TRANSFER":
            return <BsArrowLeftRight title={title || "Traspaso"} />;
        case "ADJUSTMENT":
            return <BsGear title={title || "Ajuste"} />;
        default:
            return <BsInfoCircle title={title || operationType || "Operación"} />;
    }
};

const PieChartTooltip = ({ payload }) => {
    if (!payload || payload.length === 0) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    // Extract operation type from name like "Entrantes IN" or "Salientes OUT"
    const nameParts = data.name.split(" ");
    const transactionType = nameParts[0]; // "Entrantes" or "Salientes"
    const operationType = nameParts[nameParts.length - 1];
    const operationLabel = operationTypeLabels[operationType] || operationType;

    // Determine background color based on transaction type
    const backgroundColor = transactionType === "Entrantes" ? "#C5E0F2" : "#FDEBD0";

    return (
        <div style={{ backgroundColor, border: "1px solid #999", padding: "12px 14px", borderRadius: "4px" }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", color: "#000" }}>
                <strong>{operationLabel}:</strong> {data.value} SKU(s)
            </p>
        </div>
    );
};

const BranchAxisTick = ({ x, y, payload, index }) => {
    const tickOffset = index % 2 === 0 ? 12 : 26;

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={tickOffset}
                textAnchor="middle"
                fill="#6c757d"
                fontSize={11}
            >
                {payload.value}
            </text>
        </g>
    );
};

const stockSeriesLabels = {
    zero: "Cero",
    low: "Bajo",
    healthy: "Saludable",
};

const stockSeriesOrder = ["zero", "low", "healthy"];

const getCenterMetricFontSize = (value) => {
    const digitCount = String(Math.abs(Number(value) || 0)).length;
    const extraDigits = Math.max(0, digitCount - 4);
    return `${24 - (extraDigits * 2)}px`;
};

const StockChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const branchName = label || payload[0]?.payload?.branchName || "Sin sede";
    const sortedPayload = stockSeriesOrder
        .map((dataKey) => payload.find((entry) => entry.dataKey === dataKey))
        .filter(Boolean);

    return (
        <div style={{ backgroundColor: "#fff", border: "1px solid #999", padding: "6px 8px", borderRadius: "4px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)", width: "fit-content", maxWidth: "220px" }}>
            <div style={{ marginBottom: "3px", fontSize: "12px", lineHeight: 1, fontWeight: 700, color: "#000" }}>
                {branchName}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                {sortedPayload.map((entry) => (
                    <div key={entry.dataKey} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", lineHeight: 1, color: "#343a40", whiteSpace: "nowrap" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: entry.color, flexShrink: 0 }} />
                        <span>{stockSeriesLabels[entry.dataKey] || entry.name}: {entry.value}</span>
                    </div>
                ))}
            </div>
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

    // Build pieData with all incoming operations first, then all outgoing operations
    const incomingData = pieOperationTypes.map((operationType) => {
        const incomingValue = activityData?.data?.reduce(
            (acc, branchData) => acc + (branchData?.incoming_transaction_lines_by_operation?.[operationType] || 0),
            0
        ) || 0;

        return {
            key: `incoming-${operationType}`,
            name: `Entrantes ${operationType}`,
            value: incomingValue,
            color: DASHBOARD_COLORS.transactions.incoming[operationType],
        };
    }).filter((entry) => entry.value > 0);

    const outgoingData = pieOperationTypes.map((operationType) => {
        const outgoingValue = activityData?.data?.reduce(
            (acc, branchData) => acc + (branchData?.outgoing_transaction_lines_by_operation?.[operationType] || 0),
            0
        ) || 0;

        return {
            key: `outgoing-${operationType}`,
            name: `Salientes ${operationType}`,
            value: outgoingValue,
            color: DASHBOARD_COLORS.transactions.outgoing[operationType],
        };
    }).filter((entry) => entry.value > 0);

    const pieData = [...incomingData, ...outgoingData];


    const stockByBranchChartData = (stockRiskData?.data || []).map((branchData) => ({
        branchName: branchData?.branch?.branch_name || "Sin sede",
        zero: branchData?.stock_buckets?.zero_stock_items || 0,
        low: branchData?.stock_buckets?.low_stock_items || 0,
        healthy: branchData?.stock_buckets?.healthy_stock_items || 0,
        totalStock:
            (branchData?.stock_buckets?.zero_stock_items || 0) +
            (branchData?.stock_buckets?.low_stock_items || 0) +
            (branchData?.stock_buckets?.healthy_stock_items || 0),
    }));
    const stockChartContentWidth =
        stockByBranchChartData.length > 4
            ? `${stockByBranchChartData.length * 78}px`
            : "100%";
    const stockBarSize = stockByBranchChartData.length > 4 ? 39 : undefined;

    return (
        <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-4">
                <div className="d-flex flex-column h-100">
                    <h5 className="text-dark fw-bold mb-2">Resumen</h5>

                    <div className="row g-3 flex-grow-1 align-items-stretch">
                        <div className="col-12 col-xl-4 h-100">
                            <div className="d-flex flex-column gap-1 h-100">
                                <div className="text-center d-flex flex-column justify-content-center rounded-3 px-1 pt-2 pb-3">
                                    <p className="text-muted small mb-3">Operaciones Completadas</p>
                                    <p className="fs-2 fw-bold text-primary mb-0 lh-1">
                                        {aggregatedData.totalOperations}
                                    </p>
                                </div>

                                <div className="text-center d-flex flex-column justify-content-center rounded-3 px-1 py-4">
                                    <p className="text-muted small mb-3">Operaciones Pendientes</p>
                                    <p className="fs-2 fw-bold text-warning mb-0 lh-1">
                                        {pendingOperations}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-xl-4 h-100">
                            <div className="d-flex flex-column h-100 rounded-3 px-1 pt-2">
                                <p className="small text-muted mb-2 text-center">Líneas entrantes y salientes</p>
                                <div className="flex-grow-1 position-relative" style={{ minHeight: 180 }}>
                                    {pieData.length > 0 ? (
                                        <>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                                    <Pie
                                                        data={pieData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        innerRadius={45}
                                                        outerRadius={80}
                                                        paddingAngle={2}
                                                        startAngle={270}
                                                        endAngle={-90}
                                                    >
                                                        {pieData.map((entry) => (
                                                            <Cell key={entry.key} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<PieChartTooltip />} position={{ x: 12, y: 12 }} wrapperStyle={{ zIndex: 20 }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div
                                                className="position-absolute top-50 start-50 translate-middle text-center d-flex flex-column align-items-center justify-content-center"
                                                style={{ pointerEvents: "none", lineHeight: 1, zIndex: 1 }}
                                            >
                                                <div style={{ color: DASHBOARD_COLORS.transactions.incoming.IN, fontWeight: 700, fontSize: getCenterMetricFontSize(aggregatedData.totalIncoming), textAlign: "center" }}>
                                                    {aggregatedData.totalIncoming}
                                                </div>
                                                <div style={{ color: DASHBOARD_COLORS.transactions.outgoing.OUT, fontWeight: 700, fontSize: getCenterMetricFontSize(aggregatedData.totalOutgoing), textAlign: "center", marginTop: "2px" }}>
                                                    {aggregatedData.totalOutgoing}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-100 d-flex align-items-center justify-content-center text-muted small">
                                            Sin datos para mostrar
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-xl-4 h-100">
                            <div className="d-flex flex-column h-100 rounded-3 px-1 pt-2">
                                <p className="small text-muted mb-2 text-center">Estado de stock por sede</p>
                                <div className="flex-grow-1" style={{ minHeight: 180, overflowX: "auto", overflowY: "hidden" }}>
                                    {stockByBranchChartData.length > 0 ? (
                                        <div style={{ width: stockChartContentWidth, minWidth: "100%", height: "100%" }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stockByBranchChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="branchName" tick={<BranchAxisTick />} interval={0} minTickGap={0} height={44} />
                                                <Tooltip content={<StockChartTooltip />} />
                                                <Bar dataKey="healthy" name="Stock saludable" stackId="stock" fill={DASHBOARD_COLORS.stock.healthy} barSize={stockBarSize} />
                                                <Bar dataKey="low" name="Stock bajo" stackId="stock" fill={DASHBOARD_COLORS.stock.low} barSize={stockBarSize} />
                                                <Bar dataKey="zero" name="Stock cero" stackId="stock" fill={DASHBOARD_COLORS.stock.zero} barSize={stockBarSize} />
                                            </BarChart>
                                            </ResponsiveContainer>
                                        </div>
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
            <Card.Body className="p-4 d-flex flex-column h-100" style={{ minHeight: 0 }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="text-dark fw-bold mb-0">Alertas</h5>
                    <Button
                        variant="secondary"
                        size="md"
                        className="px-2 py-1 d-inline-flex align-items-center justify-content-center"
                        onClick={onShowAllAlerts}
                        disabled={dismissedCount === 0}
                        aria-label="Mostrar todas"
                        title="Mostrar todas"
                    >
                        <BsEyeFill />
                    </Button>
                </div>

                {alerts.length === 0 ? (
                    <p className="text-muted mb-0">No hay alertas activas</p>
                ) : (
                    <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0, overflowY: "hidden" }}>
                        <div className="d-flex gap-3 h-100 align-items-stretch pb-1" style={{ minWidth: "max-content" }}>
                            {alerts.map((alertItem) => (
                                <div
                                    key={alertItem.id}
                                    role="button"
                                    tabIndex={0}
                                    className="rounded-3 p-3 h-100"
                                    onClick={() => onNavigateToAlert(alertItem.path)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            onNavigateToAlert(alertItem.path);
                                        }
                                    }}
                                    style={{
                                        width: 160,
                                        borderLeft: `5px solid ${alertItem.color}`,
                                        backgroundColor: `${alertItem.color}20`,
                                        cursor: "pointer",
                                    }}
                                >
                                    <div className="d-flex flex-column h-100" style={{ minWidth: 0 }}>
                                        <div className="d-flex justify-content-end mb-2">
                                            <button
                                                type="button"
                                                className="btn-close"
                                                aria-label="Descartar"
                                                title="Descartar"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onDismissAlert(alertItem.id);
                                                }}
                                            />
                                        </div>

                                        <div className="d-flex flex-column justify-content-end flex-grow-1">
                                            {alertItem.kind === "stock" ? (
                                                <>
                                                    <p className="small fw-semibold text-uppercase text-muted mb-2">
                                                        {alertItem.stockStatusLabel}
                                                    </p>
                                                    <p className="fw-semibold mb-1 text-break">
                                                        {alertItem.itemName} (<code>{alertItem.itemSku || "-"}</code>)
                                                    </p>
                                                    <p className="small text-muted mb-1 text-break">{alertItem.branchName}</p>
                                                    <p className="small mb-0">
                                                        Stock: {alertItem.stock}/{alertItem.lowStockThreshold}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="small fw-semibold text-uppercase text-muted mb-2">
                                                        {alertItem.staleStatusLabel}: #{alertItem.transactionId}
                                                    </p>
                                                    <p className="small mb-1 text-break d-flex align-items-center gap-2">
                                                        <span className="fs-6 lh-1">{getOperationTypeIcon(alertItem.operationType, alertItem.operationTypeLabel)}</span>
                                                        <span>
                                                            {alertItem.originBranchName}
                                                            {alertItem.destinationBranchName
                                                                ? ` → ${alertItem.destinationBranchName}`
                                                                : ""}
                                                        </span>
                                                    </p>
                                                    <p className="small text-muted mb-0">
                                                        {alertItem.daysSinceLastEvent} día(s) sin cambios
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
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

    const getTypeIcon = (operationType) => getOperationTypeIcon(operationType);

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
            <Card.Body className="p-4 d-flex flex-column h-100" style={{ minHeight: 0 }}>
                <h5 className="text-dark fw-bold mb-3">Últimas Operaciones</h5>

                {error && <p className="text-danger small">{error}</p>}

                <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
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
    const dashboardLayoutRef = useRef(null);

    const parsedStoredBranchId = Number(localStorage.getItem("selectedBranchId"));
    const workBranchId = Number.isInteger(parsedStoredBranchId) && parsedStoredBranchId > 0
        ? parsedStoredBranchId
        : null;

    const [activeBranches, setActiveBranches] = useState([]);

    // Dashboard state
    const [selectedPeriod, setSelectedPeriod] = useState("day");
    const [selectedBranch, setSelectedBranch] = useState(() => workBranchId);
    const [lastSelectedBranchId, setLastSelectedBranchId] = useState(() => workBranchId);
    const [isDashboardControlsHydrated, setIsDashboardControlsHydrated] = useState(false);
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

    const [dashboardLayoutHeight, setDashboardLayoutHeight] = useState(null);

    useEffect(() => {
        if (!user?.id) {
            setIsDashboardControlsHydrated(false);
            return;
        }

        const storedControls = readStoredDashboardControls(user?.id);
        if (storedControls) {
            setSelectedPeriod(storedControls.period);
            setSelectedBranch(storedControls.branchId);
            setLastSelectedBranchId(storedControls.lastBranchId || storedControls.branchId || workBranchId);
        }

        setIsDashboardControlsHydrated(true);
    }, [user?.id]);

    useEffect(() => {
        if (!isDashboardControlsHydrated) return;

        saveDashboardControls(user?.id, {
            period: selectedPeriod,
            branchId: selectedBranch,
            lastBranchId: lastSelectedBranchId,
        });
    }, [isDashboardControlsHydrated, user?.id, selectedPeriod, selectedBranch, lastSelectedBranchId]);

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

    useEffect(() => {
        if (!isCentralUser) return;
        if (selectedBranch != null) {
            setLastSelectedBranchId(Number(selectedBranch));
            return;
        }

        if (lastSelectedBranchId != null) return;

        const firstBranchId = branchOptions[0]?.id;
        if (Number.isInteger(firstBranchId) && firstBranchId > 0) {
            setLastSelectedBranchId(firstBranchId);
        }
    }, [isCentralUser, selectedBranch, lastSelectedBranchId, branchOptions]);

    const handleBranchChange = (branchId) => {
        setSelectedBranch(branchId);
        if (branchId != null) {
            setLastSelectedBranchId(Number(branchId));
        }
    };

    const selectedBranchName = useMemo(() => {
        if (selectedBranch != null) {
            return branchOptions.find((branch) => branch.id === Number(selectedBranch))?.name || null;
        }

        if (lastSelectedBranchId != null) {
            return branchOptions.find((branch) => branch.id === Number(lastSelectedBranchId))?.name || null;
        }

        return branchOptions[0]?.name || null;
    }, [branchOptions, selectedBranch, lastSelectedBranchId]);

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

    useEffect(() => {
        const updateDashboardLayoutHeight = () => {
            const element = dashboardLayoutRef.current;
            if (!element) return;

            const topOffset = element.getBoundingClientRect().top;
            const availableHeight = window.innerHeight - topOffset - 24;
            setDashboardLayoutHeight(Math.max(availableHeight, 420));
        };

        updateDashboardLayoutHeight();

        const resizeObserver = typeof ResizeObserver !== "undefined" && dashboardLayoutRef.current
            ? new ResizeObserver(updateDashboardLayoutHeight)
            : null;

        if (resizeObserver && dashboardLayoutRef.current) {
            resizeObserver.observe(dashboardLayoutRef.current);
        }

        window.addEventListener("resize", updateDashboardLayoutHeight);

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener("resize", updateDashboardLayoutHeight);
        };
    }, [error, isCentralUser, selectedBranchName]);

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
                    kind: "stock",
                    stockStatusLabel: isZeroStock ? "Stock 0" : "Stock bajo",
                    itemName: item.item_name || "Sin nombre",
                    itemSku: item.item_sku || "-",
                    branchName,
                    stock: Number(item.stock) || 0,
                    lowStockThreshold: Number(item.low_stock_threshold) || 0,
                    color: isZeroStock
                        ? DASHBOARD_COLORS.alerts.zeroStock
                        : DASHBOARD_COLORS.alerts.lowStock,
                    path: `/inventory/items/${item.item_id}`,
                    severityOrder: isZeroStock ? 1 : 2,
                };
            });
        });

        const staleAlertsById = new Map();

        (stockRiskData?.data || []).forEach((branchData) => {
            const staleTransactions = branchData?.stale_transactions || [];

            staleTransactions
                .filter((transaction) => ["PENDING", "TRANSIT"].includes(transaction?.status))
                .filter((transaction) => Number(transaction?.days_since_last_event) >= 1)
                .forEach((transaction) => {
                    const alertId = `transaction-${transaction.transaction_id}-${transaction.status}`;
                    if (staleAlertsById.has(alertId)) return;

                    const isPending = transaction.status === "PENDING";
                    const hasDestination = Boolean(transaction?.destination_branch_name);
                    const operationTypeLabel = operationTypeLabels[transaction?.operation_type] || transaction?.operation_type || "Operación";

                    staleAlertsById.set(alertId, {
                        id: alertId,
                        kind: "stale-transaction",
                        staleStatusLabel: isPending ? "Pendiente +24h" : "En transito +24h",
                        transactionId: transaction.transaction_id,
                        operationType: transaction?.operation_type,
                        operationTypeLabel,
                        originBranchName: transaction?.origin_branch_name || branchData?.branch?.branch_name || "Sin sede",
                        destinationBranchName: hasDestination ? transaction.destination_branch_name : null,
                        daysSinceLastEvent: Number(transaction?.days_since_last_event) || 0,
                        color: isPending
                            ? DASHBOARD_COLORS.alerts.pendingStale
                            : DASHBOARD_COLORS.alerts.transitStale,
                        path: `/transactions/${transaction.transaction_id}`,
                        severityOrder: isPending ? 3 : 4,
                    });
                });
        });

        const staleTransactionAlerts = Array.from(staleAlertsById.values());

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
        navigate(path, { state: { fromDashboard: true } });
    };

    if (!user) {
        return (
            <Container className="py-4">
                <p className="text-muted">Cargando información del usuario...</p>
            </Container>
        );
    }

    return (
        <>
            <Navbar />
            <Container fluid className="py-4">
                {/* Error alert */}
                {error && (
                    <Alert variant="danger" dismissible onClose={() => { }}>
                        {error}
                    </Alert>
                )}

                {/* Controls (Period and Branch selectors) */}
                <div className="dashboard-controls-shell container px-0 mb-4">
                    <DashboardControls
                        selectedPeriod={selectedPeriod}
                        onPeriodChange={setSelectedPeriod}
                        selectedBranch={selectedBranch}
                        onBranchChange={handleBranchChange}
                        isCentralUser={isCentralUser}
                        branchOptions={branchOptions}
                        selectedBranchName={selectedBranchName}
                    />
                </div>

                {/* Main Layout: 2 columns (left: summary + alerts, right: recent operations) */}
                <div
                    ref={dashboardLayoutRef}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                        gap: "1.5rem",
                        height: dashboardLayoutHeight ? `${dashboardLayoutHeight}px` : "calc(100dvh - 240px)",
                        minHeight: 0,
                        alignItems: "stretch",
                    }}
                >
                    {/* Left Column: Summary (top) and Alerts (bottom) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", minHeight: 0, height: "100%" }}>
                        {/* Section 1: Summary */}
                        <div style={{ flex: "0 0 auto", minHeight: DASHBOARD_SUMMARY_MIN_HEIGHT }}>
                            <DashboardSummarySection
                                loading={loading}
                                error={error}
                                activityData={activityData}
                                stockRiskData={stockRiskData}
                            />
                        </div>

                        {/* Section 2: Alerts */}
                        <div style={{ flex: "1 1 auto", minHeight: DASHBOARD_ALERTS_MIN_HEIGHT }}>
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
                    <div style={{ minHeight: 0, height: "100%" }}>
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