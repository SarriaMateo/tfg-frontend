import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function AccessDeniedPage() {
    const navigate = useNavigate();

    return (
        <Container className="d-flex align-items-center justify-content-center min-vh-100">
            <Row className="w-100">
                <Col md={8} lg={6} className="mx-auto">
                    <Card className="shadow-sm border-0 border-danger">
                        <Card.Body className="p-5 text-center">
                            <div className="mb-4">
                                <h1 className="display-1 fw-bold text-danger">403</h1>
                            </div>
                            <h2 className="h3 mb-3 text-dark">Acceso Denegado</h2>
                            <p className="text-muted mb-4 fs-5">
                                No tienes permisos suficientes para acceder a esta página.
                                Por favor, contacta con el administrador si crees que esto es un error.
                            </p>
                            <div className="d-flex gap-2 justify-content-center">
                                <Button 
                                    variant="primary"
                                    onClick={() => navigate("/test")}
                                >
                                    Volver al  Test Dashboard
                                </Button>
                                <Button 
                                    variant="outline-secondary"
                                    onClick={() => navigate("/dashboard")}
                                >
                                    Ir al Inicio
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
