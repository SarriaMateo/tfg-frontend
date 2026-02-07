import { Component } from "react";
import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo,
        });
        console.error("Error capturado por Error Boundary:", error, errorInfo);
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <Container className="py-5">
                    <Row>
                        <Col md={8} lg={6} className="mx-auto">
                            <div className="text-center mb-5">
                                <h1 className="display-5 fw-bold text-danger mb-2">
                                    ¡Algo salió mal!
                                </h1>
                                <p className="text-muted">
                                    Ha ocurrido un error inesperado
                                </p>
                            </div>

                            <Card className="shadow-sm border-0">
                                <Card.Body className="p-4">
                                    <Alert variant="danger">
                                        <strong>Error:</strong> {this.state.error?.toString()}
                                    </Alert>

                                    <details className="mb-3 p-3 bg-light rounded">
                                        <summary className="fw-bold cursor-pointer">
                                            Detalles técnicos
                                        </summary>
                                        <pre className="mt-2 small text-break">
                                            {this.state.errorInfo?.componentStack}
                                        </pre>
                                    </details>

                                    <div className="d-flex gap-2">
                                        <Button
                                            onClick={this.resetError}
                                            className="flex-grow-1 btn-primary"
                                        >
                                            Reintentar
                                        </Button>
                                        <Button
                                            onClick={() => window.location.href = "/"}
                                            variant="outline-primary"
                                            className="flex-grow-1"
                                        >
                                            Volver al inicio
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
