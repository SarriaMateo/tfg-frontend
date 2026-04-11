# TFG Frontend - Itematic

Language: English | [Español](README-es.md)

Frontend for a final degree project focused on inventory management and inter-branch operations.

The application is built with React + Vite and consumes a REST API (FastAPI backend).

## Main features

- Authentication with login and session persistence.
- Company, branch, and user management.
- Inventory management for items and categories.
- Operations management (IN, OUT, TRANSFER, ADJUSTMENT) with state-based workflow.
- Operations export in CSV/PDF.
- Item image and transaction document management (upload, download, replace, delete).
- Access control by role and branch.
- Dashboard with branch-aware KPIs, summary charts, dismissible alerts, and latest operations.

## Tech stack

- React 19
- Vite 7
- React Router DOM 7
- Axios
- React Bootstrap + Bootstrap 5
- React Icons
- Vitest + Testing Library + jsdom
- ESLint 9 (flat config)

## Code architecture

- `src/pages`: route-level screens.
- `src/components`: reusable UI and management components (`*Management`, forms, tables, modals).
- `src/services`: HTTP access layer by domain.
- `src/api/api.js`: central Axios client with interceptors.
- `src/context`: global state for authentication and selected branch.
- `src/hooks`: reusable logic (authorization, items/transactions listing, transaction permissions).
- `src/utils`: authorization, error translation, formatters, and navigation helpers.
- `src/constants`: error messages and UI constants.

## Roles and authorization

Supported roles:

- `ADMIN`
- `MANAGER`
- `EMPLOYEE`

Access control is enforced at two levels:

- Private routes via `PrivateRoute`.
- Action and branch-level permissions (including TRANSFER-specific rules by status and origin/destination branch).

## Session and persistence

- `localStorage`: token, authenticated user, selected branch.
- `sessionStorage`: paginated list/filter state per user (`itemsListState:*`, `transactionsListState:*`).
- On session expiration (401 + `INVALID_CREDENTIALS`):
  - auth and session-scoped UI state are cleared,
  - a temporary notice is stored,
  - user is redirected to `/` for re-login.

## Main routes

- Public:
  - `/` login
  - `/register` company registration
- Private:
  - `/dashboard`
  - `/inventory`
  - `/inventory/items/:itemId`
  - `/transactions`
  - `/transactions/:transactionId`
  - `/settings`

## Requirements

- Node.js `>= 20.0.0`
- Yarn `>= 1.22.0`
- Declared package manager: `yarn@1.22.22`

## Environment configuration

Create a `.env` file in the project root with:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

All frontend API calls, including company registration, use `VITE_API_BASE_URL`.

## Local setup

1. Install dependencies:

```bash
yarn install
```

2. Start the development server:

```bash
yarn dev
```

3. Open in browser:

- http://localhost:5173

## Available scripts

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

## Dependency management

- This project uses Yarn as the primary package manager.
- `yarn.lock` is the reference lockfile.
- `package-lock.json` is ignored to avoid npm/Yarn lockfile drift.

## Author

Mateo Sarria Franco de Sarabia

Final degree project - Telecommunications Technologies and Services Engineering

