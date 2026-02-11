import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function EmployeeTestPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <Container className="py-5">
            <div className="mb-4">
                <Button variant="outline-secondary" onClick={() => navigate("/test")}>
                    ← Volver a Test Dashboard
                </Button>
            </div>

            <Row>
                <Col md={8} className="mx-auto">
                    <Card className="shadow-sm border-0 border-info">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <h1 className="display-5 fw-bold text-info mb-2">👤 Employee Panel</h1>
                                <p className="text-muted">Página protegida para Empleados</p>
                            </div>

                            <div className="alert alert-info" role="alert">
                                <strong>✅ Acceso Permitido</strong>
                                <br />
                                Tienes acceso a esta página porque tu rol es <Badge bg="info">{user?.role}</Badge>
                            </div>

                            <Card className="mb-4 border-light bg-light">
                                <Card.Body>
                                    <h5 className="mb-3">Acciones de Empleado</h5>
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item bg-light">✅ Ver inventario de su sede</li>
                                        <li className="list-group-item bg-light">✅ Solicitar movimientos</li>
                                        <li className="list-group-item bg-light">✅ Consultar su perfil</li>
                                        <li className="list-group-item bg-light">❌ Gestionar usuarios</li>
                                        <li className="list-group-item bg-light">❌ Generar reportes</li>
                                    </ul>
                                </Card.Body>
                            </Card>

                            <div className="p-3 bg-info-subtle rounded">
                                <p className="mb-0">
                                    <strong>Usuario:</strong> {user?.username}<br />
                                    <strong>Empresa:</strong> {user?.company_id}<br />
                                    <strong>Sede:</strong> {user?.branch_id ? `#${user.branch_id}` : 'Todas'}
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
