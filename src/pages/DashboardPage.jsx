import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthorization } from "../hooks/useAuthorization";
import { companyService } from "../services/companyService";

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { hasRole } = useAuthorization();
    const [companyInfo, setCompanyInfo] = useState(null);
    const [branchInfo, setBranchInfo] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCompanyAndBranchInfo = async () => {
            try {
                setLoadingInfo(true);
                setError(null);

                // Obtener información de la empresa
                if (user?.company_id) {
                    const company = await companyService.getCompanyInfo(user.company_id);
                    setCompanyInfo(company);
                }

                // Obtener información de la rama si existe
                if (user?.branch_id) {
                    const branch = await companyService.getBranchInfo(user.branch_id);
                    setBranchInfo(branch);
                }
            } catch (err) {
                setError(err.message || "Error al cargar información");
                console.error("Error fetching company/branch info:", err);
            } finally {
                setLoadingInfo(false);
            }
        };

        if (user) {
            fetchCompanyAndBranchInfo();
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    if (!user) {
        return (
            <Container className="py-5">
                <p className="text-muted">Cargando información del usuario...</p>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h1 className="display-5 fw-bold text-primary mb-2">Dashboard</h1>
                    <p className="text-muted">Bienvenido a tu panel de control</p>
                </div>
                <div className="d-flex gap-2">
                    <Button 
                        variant="outline-info"
                        onClick={() => navigate("/test")}
                        className="align-self-start"
                    >
                        🧪 Test Dashboard
                    </Button>
                    <Button 
                        variant="outline-danger"
                        onClick={handleLogout}
                        className="align-self-start"
                    >
                        Cerrar sesión
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="warning" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Row className="g-4">
                <Col md={6}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body className="p-4">
                            <h5 className="text-dark fw-bold mb-3">Tu Perfil</h5>
                            <div className="dashboard-info">
                                <p className="mb-2">
                                    <span className="text-muted small">Nombre:</span>
                                    <br />
                                    <span className="fw-bold">{user.name || 'N/A'}</span>
                                </p>
                                <p className="mb-0">
                                    <span className="text-muted small">Usuario:</span>
                                    <br />
                                    <span className="fw-bold">{user.username || 'N/A'}</span>
                                </p>
                                <p className="mb-0">
                                    <span className="text-muted small">Rol:</span>
                                    <br />
                                    <span className="badge bg-primary">{user.role || 'N/A'}</span>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body className="p-4">
                            <h5 className="text-dark fw-bold mb-3">Información de la Empresa</h5>
                            {loadingInfo ? (
                                <div className="text-center">
                                    <Spinner animation="border" size="sm" />
                                </div>
                            ) : (
                                <div className="dashboard-info">
                                    <p className="mb-2">
                                        <span className="text-muted small">Empresa:</span>
                                        <br />
                                        <span className="fw-bold">{companyInfo?.name || 'N/A'}</span>
                                    </p>
                                    {branchInfo ? (
                                        <>
                                            <p className="mb-2">
                                                <span className="text-muted small">Sede:</span>
                                                <br />
                                                <span className="fw-bold">{branchInfo.name || 'N/A'}</span>
                                            </p>
                                            <p className="mb-0">
                                                <span className="text-muted small">Dirección:</span>
                                                <br />
                                                <span className="fw-bold">{branchInfo?.address || branchInfo?.location || 'N/A'}</span>
                                            </p>
                                        </>
                                    ) : (
                                        <p className="mb-0">
                                            <span className="text-muted small">Sede:</span>
                                            <br />
                                            <span className="fw-bold">Acceso a todas las sedes</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {hasRole('ADMIN') && (
                <Row className="g-4 mt-2">
                    <Col>
                        <Card className="shadow-sm border-0 bg-light">
                            <Card.Body className="p-4">
                                <h5 className="text-dark fw-bold">Herramientas de Administrador</h5>
                                <p className="text-muted mb-3">
                                    Como administrador, tienes acceso a funcionalidades adicionales
                                </p>
                                <div className="d-flex gap-2">
                                    <Button variant="outline-primary" disabled>
                                        Gestionar Usuarios
                                    </Button>
                                    <Button variant="outline-primary" disabled>
                                        Gestionar Sedes
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            <Row className="g-4 mt-2">
                <Col>
                    <Card className="shadow-sm border-0 bg-light">
                        <Card.Body className="p-4 text-center">
                            <h5 className="text-muted fw-bold">Contenido Pendiente</h5>
                            <p className="text-muted mb-0">
                                El resto de funcionalidades están en desarrollo
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}