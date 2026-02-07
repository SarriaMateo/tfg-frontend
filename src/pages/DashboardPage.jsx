import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const company = JSON.parse(localStorage.getItem('company') || '{}');

    return (
        <Container className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h1 className="display-5 fw-bold text-primary mb-2">Dashboard</h1>
                    <p className="text-muted">Bienvenido a tu panel de control</p>
                </div>
                <Button 
                    variant="outline-primary"
                    onClick={() => navigate("/")}
                    className="align-self-start"
                >
                    Volver al inicio
                </Button>
            </div>

            <Row className="g-4">
                <Col md={6}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body className="p-4">
                            <h5 className="text-dark fw-bold mb-3">Información de la Empresa</h5>
                            <div className="dashboard-info">
                                <p className="mb-2">
                                    <span className="text-muted small">Nombre:</span>
                                    <br />
                                    <span className="fw-bold">{company.name || 'N/A'}</span>
                                </p>
                                <p className="mb-2">
                                    <span className="text-muted small">Email:</span>
                                    <br />
                                    <span className="fw-bold">{company.email || 'N/A'}</span>
                                </p>
                                <p className="mb-0">
                                    <span className="text-muted small">NIF:</span>
                                    <br />
                                    <span className="fw-bold">{company.nif || 'No especificado'}</span>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

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
                                <p className="mb-2">
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
            </Row>

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