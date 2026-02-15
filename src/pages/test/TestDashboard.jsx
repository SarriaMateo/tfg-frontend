import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthorization } from "../../hooks/useAuthorization";
import { companyService } from "../../services/companyService";

export default function TestDashboard() {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { hasRole, canAccessBranch } = useAuthorization();
    const [companyInfo, setCompanyInfo] = useState(null);
    const [branchInfo, setBranchInfo] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(true);

    useEffect(() => {
        const fetchCompanyAndBranchInfo = async () => {
            try {
                setLoadingInfo(true);

                // Obtener información de la empresa
                if (user?.company_id) {
                    const company = await companyService.getCompanyInfo();
                    setCompanyInfo(company);
                }

                // Obtener información de la rama si existe
                if (user?.branch_id) {
                    const branch = await companyService.getBranchInfo(user.branch_id);
                    setBranchInfo(branch);
                }
            } catch (err) {
                console.error("Error fetching company/branch info:", err);
            } finally {
                setLoadingInfo(false);
            }
        };

        if (user) {
            fetchCompanyAndBranchInfo();
        }
    }, [user]);

    const testPages = [
        { path: "/test/admin", label: "🔐 Admin Only", requiredRole: "ADMIN" },
        { path: "/test/manager", label: "👔 Manager Only", requiredRole: "MANAGER" },
        { path: "/test/employee", label: "👤 Employee Only", requiredRole: "EMPLOYEE" },
        { path: "/test/branch", label: "🏢 Branch Access Test", requiredRole: null },
    ];

    return (
        <Container className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h1 className="display-5 fw-bold text-primary mb-2">Test Dashboard</h1>
                    <p className="text-muted">Página de prueba para verificar accesos y autorización</p>
                </div>
                <Button 
                    variant="outline-secondary"
                    onClick={() => navigate("/dashboard")}
                >
                    Volver al Dashboard
                </Button>
            </div>

            <Row className="g-4 mb-5">
                <Col md={6}>
                    <Card className="shadow-sm border-0 bg-light">
                        <Card.Body className="p-4">
                            <h5 className="text-dark fw-bold mb-3">Información del Usuario</h5>
                            <div className="dashboard-info">
                                <p className="mb-2">
                                    <span className="text-muted small">Nombre:</span>
                                    <br />
                                    <span className="fw-bold">{user?.name || 'N/A'}</span>
                                </p>
                                <p className="mb-2">
                                    <span className="text-muted small">Usuario:</span>
                                    <br />
                                    <span className="fw-bold">{user?.username || 'N/A'}</span>
                                </p>
                                <p className="mb-2">
                                    <span className="text-muted small">Rol:</span>
                                    <br />
                                    <span className="badge bg-primary">{user?.role || 'N/A'}</span>
                                </p>
                                <p className="mb-0">
                                    <span className="text-muted small">Empresa:</span>
                                    <br />
                                    {loadingInfo ? (
                                        <Spinner animation="border" size="sm" />
                                    ) : (
                                        <span className="fw-bold">{companyInfo?.name || 'N/A'}</span>
                                    )}
                                </p>
                                <p className="mb-0">
                                    <span className="text-muted small">Sede:</span>
                                    <br />
                                    {loadingInfo ? (
                                        <Spinner animation="border" size="sm" />
                                    ) : (
                                        <span className="fw-bold">{branchInfo?.name || (user?.branch_id ? 'N/A' : 'Todas las sedes')}</span>
                                    )}
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="shadow-sm border-0 bg-light">
                        <Card.Body className="p-4">
                            <h5 className="text-dark fw-bold mb-3">Token de Autenticación</h5>
                            <div className="dashboard-info">
                                <p className="mb-0">
                                    <span className="text-muted small">Token (primeros 50 caracteres):</span>
                                    <br />
                                    <code className="text-break" style={{ fontSize: '0.85rem' }}>
                                        {token ? token.substring(0, 50) + '...' : 'No disponible'}
                                    </code>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                    <Card className="shadow-sm border-0 border-info mt-4">
                        <Card.Body className="p-4">
                            <h5 className="text-info fw-bold mb-3">ℹ️ Información de Autorización</h5>
                            <div className="mb-3">
                                <p className="mb-2">
                                    <strong>Rol guardado:</strong> <code className="bg-light p-1 rounded">"{user?.role}"</code> (tipo: {typeof user?.role})
                                </p>
                            </div>
                            <div>
                                <p className="mb-2">
                                    <strong>¿Es Admin?</strong> <span className={hasRole('ADMIN') ? 'badge bg-success' : 'badge bg-danger'}>
                                        {hasRole('ADMIN') ? 'Sí' : 'No'}
                                    </span>
                                </p>
                                <p className="mb-2">
                                    <strong>¿Es Manager?</strong> <span className={hasRole('MANAGER') ? 'badge bg-success' : 'badge bg-danger'}>
                                        {hasRole('MANAGER') ? 'Sí' : 'No'}
                                    </span>
                                </p>
                                <p className="mb-0">
                                    <strong>¿Es Employee?</strong> <span className={hasRole('EMPLOYEE') ? 'badge bg-success' : 'badge bg-danger'}>
                                        {hasRole('EMPLOYEE') ? 'Sí' : 'No'}
                                    </span>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4 mb-5">
                <Col md={12}>
                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-4">
                            <h5 className="text-dark fw-bold mb-3">Pruebas de Acceso por Rol</h5>
                            <p className="text-muted mb-4">
                                Haz clic en los botones para probar si tienes acceso a cada página protegida:
                            </p>
                            <Row className="g-2">
                                {testPages.map((page) => {
                                    const canAccess = !page.requiredRole || hasRole(page.requiredRole);
                                    return (
                                        <Col key={page.path} md={6} lg={3}>
                                            <Button
                                                className="w-100"
                                                variant={canAccess ? "success" : "outline-danger"}
                                                onClick={() => navigate(page.path)}
                                                disabled={!canAccess}
                                            >
                                                {page.label}
                                            </Button>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
