import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <Container className="d-flex align-items-center justify-content-center min-vh-100">
            <Row className="w-100">
                <Col md={8} lg={6} className="mx-auto">
                    <div className="text-center mb-5">
                        <h1 className="display-4 fw-bold text-primary mb-2">Inventory App</h1>
                        <p className="text-muted fs-5">Gestiona tu inventario de manera eficiente</p>
                    </div>

                    <Card className="shadow-sm border-0 mb-3 landing-card">
                        <Card.Body className="p-4">
                            <h2 className="h4 mb-4 text-dark">Iniciar sesión</h2>
                            <input 
                                type="text" 
                                placeholder="Username" 
                                className="form-control mb-3"
                                disabled 
                            />
                            <input 
                                type="password" 
                                placeholder="Password" 
                                className="form-control mb-3"
                                disabled 
                            />
                            <Button className="w-100 btn-primary" disabled>
                                Login
                            </Button>
                            <p className="text-muted text-center mt-3 small">
                                Disponible próximamente
                            </p>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0 landing-card">
                        <Card.Body className="p-4 text-center">
                            <p className="text-muted mb-3">¿No tienes cuenta?</p>
                            <Button 
                                onClick={() => navigate("/register")}
                                className="w-100 btn-outline-primary"
                                variant="outline-primary"
                            >
                                Registrar empresa
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}