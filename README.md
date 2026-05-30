# Swiss Re — Claims Risk Assessment (Case Study)

Modern UI rebuild for ABC Insurance claims adjudication: large data grid, RBAC, and document workspace.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Use the **Role** switcher in the header to preview RBAC (`viewer`, `adjuster`, `admin`).

## Phase 0 — Foundation (current)

- Vite + React 19 + TypeScript
- App shell (header, sidebar, page layout)
- Routes: `/claims`, `/claims/:id/workspace`
- RBAC: `can()`, `usePermissions()`, `<Can />`, `ProtectedRoute`
- MSW mock API bootstrap (`GET /api/me`)
- Design tokens (SCSS variables → CSS custom properties)

## Architecture principles

- **Minimal code** — only shared primitives (`Button`, `Page`, `AppShell`); features stay in `src/features/`
- **Reusable** — single `Providers` root, declarative `<Can permission="..." />`, generic `Page` wrapper
- **Feature-based** — each domain (`auth`, `claims-grid`, `document-workspace`) owns its pages and logic

## Project plan

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for full phases, tech stack, and build order.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |

## Demo routes

| Route | Description |
|-------|-------------|
| `/claims` | Claims landing (grid in Phase 2) |
| `/claims/:id/workspace` | Document workspace (Phase 4) |

Try `/claims/demo-123/workspace` to preview the workspace shell.
