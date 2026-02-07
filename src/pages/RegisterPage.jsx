import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Form, Alert } from "react-bootstrap";
import { registerCompany } from "../api/api";
import { translateError } from "../utils/errorTranslator";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        companyName: "",
        companyEmail: "",
        companyNif: "",
        adminName: "",
        adminUsername: "",
        adminPassword: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await registerCompany(form);
            
            // Guardar la información del usuario y empresa en localStorage
            if (response.user && response.company) {
                localStorage.setItem('user', JSON.stringify(response.user));
                localStorage.setItem('company', JSON.stringify(response.company));
            }
            
            alert("Empresa registrada correctamente");
            navigate("/dashboard");
        } catch (err) {
            console.error("Error al registrar la empresa:", err);
            const errorMessage = translateError(err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <Row>
                <Col md={8} lg={6} className="mx-auto">
                    <div className="text-center mb-5">
                        <h1 className="display-5 fw-bold text-primary mb-2">Registro de Empresa</h1>
                        <p className="text-muted">Crea tu cuenta y comienza a gestionar tu inventario</p>
                    </div>

                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <Card className="shadow-sm border-0 register-card">
                        <Card.Body className="p-5">
                            <Form onSubmit={handleSubmit}>
                                <h5 className="mb-4 text-dark fw-bold">Datos de la empresa</h5>
                                
                                <Form.Group className="mb-3">
                                    <Form.Control
                                        type="text"
                                        name="companyName"
                                        placeholder="Nombre de la empresa"
                                        value={form.companyName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Control
                                        type="email"
                                        name="companyEmail"
                                        placeholder="Email de la empresa"
                                        value={form.companyEmail}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Control
                                        type="text"
                                        name="companyNif"
                                        placeholder="NIF (opcional)"
                                        value={form.companyNif}
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                <h5 className="mb-4 text-dark fw-bold">Usuario administrador</h5>

                                <Form.Group className="mb-3">
                                    <Form.Control
                                        type="text"
                                        name="adminName"
                                        placeholder="Nombre completo"
                                        value={form.adminName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Control
                                        type="text"
                                        name="adminUsername"
                                        placeholder="Username"
                                        value={form.adminUsername}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Control
                                        type="password"
                                        name="adminPassword"
                                        placeholder="Contraseña"
                                        value={form.adminPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Button 
                                    type="submit" 
                                    className="w-100 btn-primary fw-bold"
                                    disabled={loading}
                                >
                                    {loading ? "Registrando..." : "Registrar"}
                                </Button>
                            </Form>

                            <hr className="my-4" />

                            <div className="text-center">
                                <p className="text-muted mb-0 small">
                                    ¿Ya tienes cuenta?{" "}
                                    <Button 
                                        variant="link" 
                                        className="p-0 text-primary"
                                        onClick={() => navigate("/")}
                                    >
                                        Vuelve al inicio
                                    </Button>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}