import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap";
import { useAuth } from "../hooks/useAuth";
import { translateError } from "../utils/errorTranslator";

export default function LandingPage() {
    const navigate = useNavigate();
    const { login, loading, error, isAuthenticated } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState(null);

    // Redirigir al dashboard si ya está autenticado
    useEffect(() => {
        if (isAuthenticated && !loading) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError(null);
        try {
            await login(username, password);
            navigate("/dashboard");
        } catch (err) {
            const status = err?.response?.status;
            if (status === 400 || status === 401) {
                setLoginError(translateError(err));
            } else {
                setLoginError(err.message || "Error en el login");
            }
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center min-vh-100">
            <Row className="w-100">
                <Col md={8} lg={6} className="mx-auto">
                    <div className="text-center mb-5">
                        <h1 className="display-4 fw-bold text-primary mb-2 app-brand" style={{ fontSize: '3.8rem' }}>Itematic</h1>
                        <p className="text-muted fs-5">Gestiona tu inventario de manera eficiente</p>
                    </div>

                    <Card className="shadow-sm border-0 mb-3 landing-card">
                        <Card.Body className="p-4">
                            <h2 className="h4 mb-4 text-dark">Iniciar sesión</h2>
                            
                            {loginError && (
                                <Alert variant="danger" dismissible onClose={() => setLoginError(null)}>
                                    {loginError}
                                </Alert>
                            )}

                            <form onSubmit={handleLogin}>
                                <input 
                                    type="text" 
                                    placeholder="Username" 
                                    className="form-control mb-3"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                                <input 
                                    type="password" 
                                    placeholder="Password" 
                                    className="form-control mb-3"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                                <Button 
                                    className="w-100 btn-primary"
                                    type="submit"
                                    disabled={loading || !username || !password}
                                >
                                    {loading ? "Cargando..." : "Login"}
                                </Button>
                            </form>
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