# TFG Frontend - Itematic

Idioma: Español | [English](README.md)

Frontend del Trabajo de Fin de Grado para una aplicación web de gestión de inventario y operaciones entre sedes.

La aplicación está construida con React + Vite y consume una API REST (backend FastAPI).

## Funcionalidades principales

- Autenticación con login y persistencia de sesión.
- Detección de sesión expirada en respuestas 401 y redirección automática al login.
- Gestión de empresa, sedes y usuarios.
- Gestión de inventario de artículos y categorías.
- Gestión de operaciones (IN, OUT, TRANSFER) con estados y flujo operativo.
- Exportación de operaciones en CSV/PDF.
- Gestión de documentos asociados a operaciones (subir, descargar, reemplazar, eliminar).
- Control de acceso por rol y por sede.

## Stack técnico

- React 19
- Vite 7
- React Router DOM 7
- Axios
- React Bootstrap + Bootstrap 5
- React Icons
- Vitest + Testing Library + jsdom
- ESLint 9 (flat config)

## Arquitectura del código

- `src/pages`: pantallas por ruta.
- `src/components`: UI reutilizable y componentes de gestión (`*Management`, formularios, tablas, modales).
- `src/services`: capa de acceso HTTP por dominio funcional.
- `src/api/api.js`: cliente Axios central con interceptores.
- `src/context`: estado global de autenticación y sede seleccionada.
- `src/hooks`: lógica reutilizable (autorización, listas de ítems y operaciones, permisos de operaciones).
- `src/utils`: autorización, traducción de errores, formateadores y utilidades de navegación.
- `src/constants`: mensajes de error y constantes de UI.

## Roles y autorización

Roles soportados:

- `ADMIN`
- `MANAGER`
- `EMPLOYEE`

El acceso se controla a dos niveles:

- Rutas privadas mediante `PrivateRoute`.
- Permisos por acción y por sede (incluyendo reglas específicas para operaciones TRANSFER según estado y sede de origen/destino).

## Sesión y persistencia

- `localStorage`: token, usuario autenticado, sede seleccionada.
- `sessionStorage`: estado de listas paginadas/filtros por usuario (`itemsListState:*`, `transactionsListState:*`).
- En expiración de sesión (401 + `INVALID_CREDENTIALS`):
  - se limpia el estado de autenticación y el estado de UI de sesión,
  - se guarda un aviso temporal,
  - se redirige a `/` para volver a iniciar sesión.

## Rutas principales

- Públicas:
  - `/` login
  - `/register` registro de empresa
- Privadas:
  - `/dashboard`
  - `/inventory`
  - `/inventory/items/:itemId`
  - `/transactions`
  - `/transactions/:transactionId`
  - `/settings`

## Requisitos

- Node.js `>= 20.0.0`
- Yarn `>= 1.22.0`
- Gestor de paquetes declarado: `yarn@1.22.22`

## Configuración de entorno

Crear el archivo `.env` en la raíz con:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Nota importante: el flujo de registro de empresa usa actualmente una URL hardcodeada: `http://localhost:8000/api/v1/company/register`.

## Puesta en marcha local

1. Instalar dependencias:

```bash
yarn install
```

2. Iniciar servidor de desarrollo:

```bash
yarn dev
```

3. Abrir en navegador:

- http://localhost:5173

## Scripts disponibles

```bash
yarn dev
yarn build
yarn preview
yarn lint
yarn test
yarn test:run
yarn test:components
yarn test:services
yarn test:integration
```

## Gestión de dependencias

- Este proyecto usa Yarn como gestor principal.
- `yarn.lock` es el lockfile de referencia.
- `package-lock.json` está ignorado para evitar desalineación entre npm y Yarn.

## Autor

Mateo Sarria Franco de Sarabia

Trabajo de Fin de Grado - Grado en Ingeniería de Tecnologías y Servicios de Telecomunicación
