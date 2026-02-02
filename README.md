# TFG – Inventory Frontend

BFrontend del Trabajo de Fin de Grado (TFG) para una aplicación web de **gestión de inventarios para pequeñas empresas**.

El proyecto está desarrollado en **React** y se comunica con un backend independiente mediante una **API REST** desarrollada con **FastAPI**.

---

## Tecnologías principales

- **React** – Librería principal de UI
- **JavaScript (ES6+)**
- **Vite** – Entorno de desarrollo y bundler
- **Axios** – Cliente HTTP para consumo de la API REST
- **Bootstrap** – Framework CSS para maquetación y diseño
- **Vitest** – Framework de testing
- **React Testing Library** – Tests de componentes

---

## Estructura del proyecto

El proyecto sigue una estructura modular, separando responsabilidades de forma clara:

- `src/components/` – Componentes reutilizables de UI
- `src/services/` – Servicios de acceso a la API (Axios)
- `src/integration/` – Tests de integración frontend-backend
- `src/App.jsx` – Componente raíz de la aplicación
- `src/main.jsx` – Punto de entrada de la aplicación
- `.env` – Variables de entorno
- `public/` – Recursos estáticos

---

## Ejecución en local

1. Instalación de Yarn (si no está instalado)
2. Instalar dependencias
3. Configurar el archivo `.env`
4. Lanzar el servidor de desarrollo

```bash
yarn dev
```

La aplicación estará disponible en:

- http://localhost:5173

---

## Testing

El proyecto incluye distintos tipos de tests:
- Tests unitarios de servicios y componentes
- Tests de integración para validar la comunicación con el backend

Ejecutar todos los tests:
```bash
yarn test
```

Ejecutar únicamente los tests de integración:
```bash
yarn test:integration
```

---

## Autor

**Mateo Sarria Franco de Sarabia**

Trabajo de Fin de Grado – Grado en Ingeniería de Tecnologías y Servicios de Telecomunicación

