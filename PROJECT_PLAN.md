# Swiss Re — Senior UI Case Study: Project Plan

Claims risk-assessment web app: large data grid (20k+ rows), RBAC, and a document workspace for 100 MB–1 GB files with edit/split/merge/comment/annotation operations.

**Design inputs:** Figma screens + company UX/UI standards (CRM Dashboard Customers List pattern).

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | React 19 + TypeScript + Vite | Modern stack per brief; fast dev/build |
| **Routing** | React Router v7 | Grid ↔ workspace navigation, role-aware routes |
| **Data grid** | TanStack Table + TanStack Virtual | 20k+ rows with virtualization; sorting/filtering without DOM blow-up |
| **Server state** | TanStack Query | Pagination, caching, cancel/retry, optimistic updates |
| **Client UI state** | Zustand | Workspace selection, viewer mode, transient UI |
| **Styling** | CSS Modules + design tokens | Match Figma/UX standards; scoped, predictable |
| **Forms / dialogs** | React Hook Form + Radix UI | Edit/Assign modals, accessible primitives |
| **Document viewer** | PDF.js (pdfjs-dist) | Industry standard; supports range requests / partial load |
| **Document ops (client)** | pdf-lib | Split/merge/page delete for smaller chunks; offload heavy work to API |
| **Annotations** | Custom canvas layer over PDF.js | Page-level comments + draw/highlight annotations |
| **API (dev)** | MSW + mock JSON | Realistic latency, pagination, RBAC headers; swappable for real backend |
| **API (prod assumption)** | REST + streaming endpoints | `Range` headers for PDF bytes; async jobs for split/merge |
| **Testing** | Vitest + React Testing Library + Playwright | Unit for RBAC/utils; E2E for grid → workspace flow |
| **Lint / format** | ESLint + Prettier | Consistent quality |

### Backend API Assumptions (document in README)

```
GET  /api/claims?page=&size=&sort=&filter=     # paginated, server-side sort/filter
GET  /api/claims/:id                            # row detail + document metadata
GET  /api/documents/:id/metadata                # page count, size, permissions
GET  /api/documents/:id/content                 # Range-requestable PDF stream
POST /api/documents/:id/split                   # async job → jobId
POST /api/documents/merge                       # async job
PATCH /api/documents/:id/pages/:page            # edit/delete page
POST /api/documents/:id/comments                # page-level comments
POST /api/documents/:id/annotations             # annotation payloads
GET  /api/jobs/:jobId                           # poll long-running ops
```

Authorization enforced on **every** endpoint; frontend mirrors permissions for UX only.

---

## Folder Structure

```
swissre-casestudy/
├── docs/
│   ├── ARCHITECTURE.md          # component boundaries, data flow, trade-offs
│   ├── PERFORMANCE.md           # grid + document strategies
│   └── RBAC.md                  # roles, permission matrix, enforcement points
├── public/
│   └── mock-seed/               # sample PDFs, fixture metadata
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx           # routes + ProtectedRoute
│   │   └── providers.tsx        # QueryClient, Auth, Theme
│   ├── assets/
│   │   └── tokens/              # CSS variables from Figma/UX standards
│   ├── components/
│   │   ├── ui/                  # Button, Modal, Spinner, Toast, DataTable shell
│   │   └── layout/              # AppShell, Header, Sidebar, Breadcrumb
│   ├── features/
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── usePermissions.ts
│   │   │   └── RoleSwitcher.tsx # dev-only role toggle for demo
│   │   ├── claims-grid/
│   │   │   ├── ClaimsGridPage.tsx
│   │   │   ├── ClaimsGrid.tsx
│   │   │   ├── columns.tsx
│   │   │   ├── filters/
│   │   │   ├── row-actions/     # Edit, Delete, Assign
│   │   │   └── hooks/           # useClaimsQuery, useClaimMutations
│   │   └── document-workspace/
│   │       ├── DocumentWorkspacePage.tsx
│   │       ├── DocumentViewer.tsx
│   │       ├── PdfCanvas.tsx
│   │       ├── ThumbnailStrip.tsx
│   │       ├── toolbar/         # edit, split, merge, delete
│   │       ├── comments/
│   │       ├── annotations/
│   │       └── hooks/           # useDocumentStream, useDocumentJobs
│   ├── lib/
│   │   ├── api/                 # typed fetch client, error types
│   │   ├── pdf/                 # stream loader, worker setup, chunk utils
│   │   └── rbac/                # can(user, action, resource)
│   ├── mocks/
│   │   ├── handlers/            # MSW route handlers
│   │   ├── data/                # 20k claim generator, roles
│   │   └── browser.ts
│   ├── types/
│   │   ├── claim.ts
│   │   ├── document.ts
│   │   └── rbac.ts
│   └── main.tsx
├── e2e/
│   └── claims-to-workspace.spec.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
├── PROJECT_PLAN.md              # this file
└── README.md                    # setup, run, demo roles, architecture summary
```

---

## Build Order (Phased)

### Phase 0 — Foundation (Day 1)

**Goal:** Runnable app shell aligned with Figma layout.

| Task | Output |
|------|--------|
| Scaffold Vite + React + TS | `npm run dev` works |
| Add ESLint, Prettier, path aliases | Consistent imports (`@/features/...`) |
| Implement design tokens from Figma/UX standards | Colors, typography, spacing in `assets/tokens/` |
| App shell: header, nav, layout grid | Matches CRM Dashboard pattern |
| React Router: `/claims`, `/claims/:id/workspace` | Route skeleton |
| MSW bootstrap + mock user/roles | 3 roles: `viewer`, `adjuster`, `admin` |

**Exit criteria:** Shell renders; role switcher changes mock user; routes navigate.

---

### Phase 1 — RBAC (Day 1–2)

**Goal:** Permission model before features depend on it.

| Task | Output |
|------|--------|
| Define permission matrix in `docs/RBAC.md` | e.g. `claims:read`, `claims:edit`, `claims:delete`, `claims:assign`, `documents:view`, `documents:edit`, `documents:split`, `documents:merge`, `documents:comment` |
| `usePermissions()` + `<Can action="..." />` | Show/hide/disable UI actions |
| `ProtectedRoute` + API 403 handling | Backend as source of truth |
| MSW handlers respect `Authorization` / role header | Filtered record sets per role |

**Exit criteria:** Same grid URL shows different rows/actions per role; unauthorized actions disabled with tooltip.

---

### Phase 2 — Claims Landing Grid (Day 2–4)

**Goal:** 20k+ records, responsive, Figma-aligned.

| Task | Output |
|------|--------|
| Mock data generator: 20,000 claims | Realistic fields: id, claimant, status, channel, assignee, docSize, updatedAt |
| Server-side pagination API mock | `page`, `pageSize`, total count |
| TanStack Table + Virtual row renderer | Only ~30 DOM rows; smooth scroll |
| Column sorting (server-side) | Debounced refetch |
| Column/global filters | Status, channel, assignee, date range |
| Row actions: Edit, Delete, Assign | Modals + optimistic/pessimistic mutations |
| Loading skeleton, empty state, error + retry | UX requirement |
| Pagination controls (default) | Document choice: **server pagination + virtualization** (see trade-offs) |

**Exit criteria:** Grid handles 20k dataset; sort/filter/page under 200ms perceived; actions respect RBAC.

**Trade-off note (document in ARCHITECTURE.md):** Pagination + virtualization over infinite scroll — better for jump-to-page, stable scroll height, and server-side filter totals.

---

### Phase 3 — Row → Document Transition (Day 4–5)

**Goal:** Smooth navigation from grid row to workspace.

| Task | Output |
|------|--------|
| Row click / "Open" action → prefetch document metadata | TanStack Query prefetch on hover |
| Route transition with shared layout animation | Breadcrumb: Claims > Claim #123 |
| Progress UI for large doc prep | "Preparing document…" with cancel |
| AbortController on navigation away | Cancel in-flight stream |
| Deep link `/claims/:id/workspace` | Refresh-safe |

**Exit criteria:** Click row → workspace opens with progress; back to grid preserves filter/page state (URL search params or session store).

---

### Phase 4 — Document Viewer (Day 5–7)

**Goal:** Efficient viewing of 100 MB–1 GB PDFs.

| Task | Output |
|------|--------|
| PDF.js worker setup (Vite-compatible) | Off main thread |
| Range-request streaming mock | Partial byte loading |
| Page-by-page render (not full doc in memory) | Current page + adjacent prefetch |
| Thumbnail strip (lazy) | Low-res thumbs on demand |
| Zoom, pan, page navigation | Keyboard shortcuts |
| Memory monitoring / unload distant pages | Cap cached pages (e.g. ±3) |

**Exit criteria:** Open 500 MB mock doc without tab freeze; memory stable when paging.

---

### Phase 5 — Document Operations (Day 7–9)

**Goal:** Edit, split, merge, delete with reliable state.

| Task | Output |
|------|--------|
| Delete page(s) | Confirm dialog; pessimistic update |
| Split by page range | Async job + progress poll |
| Merge selected claims' documents | Multi-select from grid or workspace |
| Edit (rotate, reorder pages — scope to case study) | Persist via API |
| Job panel: running / success / failed / retry | Long-running task UX |
| Version indicator after mutation | "Document updated — v3" |

**Exit criteria:** Split/merge survives refresh; failed job shows retry; partial failure handled gracefully.

**Trade-off note:** Files > ~200 MB → **server-side** split/merge jobs; client pdf-lib for preview/small edits only.

---

### Phase 6 — Comments & Annotations (Day 9–10)

**Goal:** Page-level collaboration on documents.

| Task | Output |
|------|--------|
| Comment thread per page | Sidebar list filtered by page |
| Add / edit / delete comment (RBAC) | `documents:comment` |
| Annotation tools: highlight, rectangle, freehand | Canvas overlay synced to page + zoom |
| Persist annotations as JSON | Reload restores overlays |
| Optional: comment pin linked to annotation region | Better UX for reviewers |

**Exit criteria:** Comments and annotations persist across reload; permissions enforced.

---

### Phase 7 — Performance, Polish & Docs (Day 10–12)

**Goal:** Production-quality demo + evaluation material.

| Task | Output |
|------|--------|
| React.memo / stable callbacks audit on grid | Minimal re-renders |
| Error boundaries (grid, viewer) | Isolated failures |
| Toast notifications + inline errors | Consistent feedback |
| `docs/ARCHITECTURE.md` | Diagrams: data flow, component boundaries |
| `docs/PERFORMANCE.md` | Grid + PDF strategies, measurements |
| README: setup, demo script, role credentials | Reviewer-ready |
| E2E: grid filter → open doc → add comment | Playwright smoke |
| Lighthouse / React Profiler notes | Evidence for NFRs |

**Exit criteria:** README lets reviewer run demo in <5 min; architecture doc covers all evaluation focus areas.

---

## Figma Alignment Checklist

When implementing each screen, map to Figma and UX standards:

- [ ] **Claims list / landing** — table density, header filters, action column icons, pagination footer
- [ ] **Empty / loading / error states** — match CRM Dashboard patterns
- [ ] **Edit / Assign modals** — form layout, primary/secondary buttons, validation messages
- [ ] **Document workspace** — toolbar placement, thumbnail panel, comment drawer
- [ ] **Typography & color** — import tokens from UX standards doc (not ad-hoc hex values)
- [ ] **Responsive breakpoints** — minimum: desktop-first; note tablet degradation in docs

---

## Key Architecture Decisions (preview for docs)

```mermaid
flowchart LR
  subgraph UI [React App]
    Grid[ClaimsGrid]
    WS[DocumentWorkspace]
    RBAC[usePermissions]
  end
  subgraph State [State Layer]
    RQ[TanStack Query]
    ZS[Zustand]
  end
  subgraph API [Backend / MSW]
    ClaimsAPI[/claims]
    DocAPI[/documents]
    JobsAPI[/jobs]
  end
  Grid --> RQ --> ClaimsAPI
  WS --> RQ --> DocAPI
  WS --> RQ --> JobsAPI
  RBAC --> Grid
  RBAC --> WS
  WS --> ZS
```

| Decision | Choice | Alternative rejected |
|----------|--------|----------------------|
| Grid rendering | Virtualization + server pagination | Full 20k DOM; infinite scroll only |
| Large PDF load | Range requests + page cache | Load entire file into memory |
| Heavy doc ops | Server async jobs | Client-only pdf-lib for 1 GB files |
| Authz | Backend enforces; frontend mirrors | Frontend-only checks |
| Mutations | Pessimistic for doc ops; optimistic for assign | All optimistic |

---

## Suggested Timeline Summary

| Phase | Focus | Duration |
|-------|--------|----------|
| 0 | Foundation + shell | 1 day |
| 1 | RBAC | 0.5–1 day |
| 2 | Claims grid | 2 days |
| 3 | Grid → workspace flow | 1 day |
| 4 | PDF viewer | 2 days |
| 5 | Doc operations | 2 days |
| 6 | Comments & annotations | 1–2 days |
| 7 | Polish + documentation | 1–2 days |
| **Total** | | **~10–12 days** |

---

## Immediate Next Steps

1. **Confirm Figma access** — export tokens (colors, spacing, components) from CRM Dashboard Customers List.
2. **Run Phase 0 scaffold** — `npm create vite@latest . -- --template react-ts` in repo root.
3. **Define RBAC matrix** — agree 3 roles and permission mapping with mock data.
4. **Generate 20k mock claims** — script in `src/mocks/data/generateClaims.ts`.
5. **Implement grid (Phase 2)** — first visible milestone for stakeholder demo.

---

## Out of Scope (unless time permits)

- Real SFTP / email ingestion pipelines
- Full WYSIWYG PDF content editing (text flow)
- Multi-user real-time collaboration (WebSockets)
- Production auth (OIDC/SSO) — use mock roles instead
