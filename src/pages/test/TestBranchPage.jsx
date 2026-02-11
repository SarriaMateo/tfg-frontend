import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthorization } from "../../hooks/useAuthorization";
import { companyService } from "../../services/companyService";

export default function TestBranchPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { canAccessBranch } = useAuthorization();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                setLoading(true);
                if (user?.company_id) {
                    const branchesData = await companyService.getCompanyBranches(user.company_id);
                    // Asegurar que branchesData es un array
                    if (Array.isArray(branchesData)) {
                        setBranches(branchesData);
                    } else if (branchesData && typeof branchesData === 'object') {
                        // Si es un objeto con una propiedad que contiene el array
                        setBranches(Object.values(branchesData).find(Array.isArray) || []);
                    }
                }
            } catch (err) {
                console.error("Error fetching branches:", err);
                setBranches([]);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchBranches();
        }
    }, [user]);

    return (
        <Container className="py-5">
            <div className="mb-4">
                <Button variant="outline-secondary" onClick={() => navigate("/test")}>
                    ← Volver a Test Dashboard
                </Button>
            </div>

            <Row>
                <Col md={10} className="mx-auto">
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body className="p-4">
                            <h1 className="display-5 fw-bold text-primary mb-2">🏢 Test de Acceso por Rama</h1>
                            <p className="text-muted mb-0">Prueba qué sedes puedes acceder según tu asignación</p>
                        </Card.Body>
                    </Card>

                    <Row className="g-4 mb-5">
                        <Col md={6}>
                            <Card className="shadow-sm border-0 bg-light">
                                <Card.Body className="p-4">
                                    <h5 className="text-dark fw-bold mb-3">Tu Asignación</h5>
                                    <div>
                                        <p className="mb-2">
                                            <strong>Branch ID asignado:</strong><br />
                                            {user?.branch_id ? (
                                                <code className="bg-white p-2 rounded">{user.branch_id}</code>
                                            ) : (
                                                <span className="badge bg-success">Todas las sedes</span>
                                            )}
                                        </p>
                                        <p className="mb-0">
                                            <strong>Tipo de acceso:</strong><br />
                                            {user?.branch_id ? (
                                                <span className="badge bg-warning text-dark">Acceso Restringido</span>
                                            ) : (
                                                <span className="badge bg-success">Acceso Global</span>
                                            )}
                                        </p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6}>
                            <Card className="shadow-sm border-0 bg-light">
                                <Card.Body className="p-4">
                                    <h5 className="text-dark fw-bold mb-3">Información de Autorización</h5>
                                    <div>
                                        {user?.branch_id ? (
                                            <>
                                                <p className="mb-2">
                                                    <strong>Rol:</strong> {user?.role}<br />
                                                    <strong>Acceso a:</strong> Solo Sede #{user.branch_id}
                                                </p>
                                                <Alert variant="info" className="mb-0 py-2">
                                                    Solo puedes ver y gestionar tu sede asignada
                                                </Alert>
                                            </>
                                        ) : (
                                            <>
                                                <p className="mb-2">
                                                    <strong>Rol:</strong> {user?.role}<br />
                                                    <strong>Acceso a:</strong> Todas las sedes
                                                </p>
                                                <Alert variant="success" className="mb-0 py-2">
                                                    Tienes acceso a todas las sedes de la empresa
                                                </Alert>
                                            </>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-4">
                            <h5 className="text-dark fw-bold mb-4">Prueba de Acceso a Sedes</h5>
                            {loading ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" />
                                </div>
                            ) : branches.length === 0 ? (
                                <Alert variant="warning">No se encontraron sedes para tu empresa</Alert>
                            ) : (
                                <Row className="g-3">
                                    {branches.map((branch) => {
                                        const hasAccess = canAccessBranch(branch.id);
                                        return (
                                            <Col md={6} key={branch.id}>
                                                <Card 
                                                    className={`border-0 ${hasAccess ? 'bg-light border-success border-2' : 'bg-light-secondary opacity-50'}`}
                                                    style={{ borderColor: hasAccess ? '#28a745' : '#dc3545' }}
                                                >
                                                    <Card.Body className="p-3">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <h6 className="fw-bold mb-1">{branch.name || 'N/A'}</h6>
                                                                <p className="text-muted small mb-1">{branch.address || branch.location || 'N/A'}</p>
                                                                <small className="text-muted">ID: {branch.id}</small>
                                                            </div>
                                                            <div className="text-end">
                                                                {hasAccess ? (
                                                                    <span className="badge bg-success">✅ Acceso</span>
                                                                ) : (
                                                                    <span className="badge bg-danger">❌ Denegado</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            )}
                        </Card.Body>
                    </Card>

                    <Alert variant="info" className="mt-4">
                        <strong>💡 Cómo funciona:</strong>
                        <ul className="mb-0 mt-2">
                            <li>Si tienes <strong>branch_id asignado</strong>: solo ves ✅ en tu sede</li>
                            <li>Si <strong>no tienes branch_id</strong>: ves ✅ en todas las sedes</li>
                            <li>Los admins siempre tienen acceso a todas las sedes</li>
                        </ul>
                    </Alert>
                </Col>
            </Row>
        </Container>
    );
}
