# Frontend — Incident Dashboard UI

Real-time incident management UI built with Next.js 15 (App Router).

---

## Setup

```bash
npm install
npm run dev
```

App: http://localhost:3000

---

## Environment Variables

`.env.local` (optional — defaults point to localhost):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — incident list, filters, pagination |
| `/incidents/:id` | Detail — all fields + audit log timeline |

---

## Components

| Component | Description |
|-----------|-------------|
| `IncidentTable` | Table view; icon buttons on row hover (pencil/trash) |
| `CreateIncidentModal` | New incident form + ✨ AI Suggest |
| `UpdateStatusModal` | Update status, severity, and description |
| `FilterBar` | Status/severity dropdowns + debounced service search |
| `SeverityBadge` | Color-coded severity label (low→green … critical→red) |
| `StatusBadge` | Dot status label (open/investigating/resolved) |

---

## Hooks & Lib

### `useIncidents(filters)`

Data fetching + Socket.IO listening combined in a single hook.

- Fires an HTTP request whenever `filters` change
- Incoming socket events update state directly (no `refetch()` — avoids unnecessary requests)
- Returns: `{ data, loading, error, refetch }`

### `getSocket()`

Socket.IO singleton. All components share the same connection.

```typescript
// Config
reconnectionAttempts: 10
reconnectionDelay: 2000   // ms
```

### `api`

Type-safe HTTP client. Returns `undefined` for `status: 204`.

---

## Real-time Architecture

```
Backend (Socket.IO)
    │
    ├── incident:created  ──→  [inc, ...prev.data]  (prepend)
    ├── incident:updated  ──→  prev.map(i => i.id === inc.id ? inc : i)
    └── incident:deleted  ──→  prev.filter(i => i.id !== id)
```

Connection status is shown in the header:
- 🟢 Connected
- 🟡 Connecting (pulse animation)
- 🔴 Disconnected + "Reconnect" button

---

## Optimistic UI

**Delete:**
1. Row is removed from the list immediately
2. `DELETE /incidents/:id` API request is sent
3. Error → list is restored via `refetch()`

**Update:**
1. Optimistic state is applied, modal closes
2. `PATCH /incidents/:id` API request is sent
3. Success → state is updated with the server response
4. Error → state is restored to the original incident

---

## Animations

| Animation | Trigger | CSS |
|-----------|---------|-----|
| Highlight pulse | New/updated row | `animate-highlight` (1.8s) |
| Slide-in | Modal open | `animate-slide-in` (0.25s) |
| Spin | AI loading, delete pending | `animate-spin` |
| Row hover | Mouse over row | `group-hover:opacity-100` |
| Color transition | All interactions | `transition-colors duration-150` |

---

## Technologies

| Package | Version | Usage |
|---------|---------|-------|
| Next.js | 15 | App Router, SSR/CSR |
| React | 19 | UI |
| TailwindCSS | v4 | Styling |
| shadcn/ui | — | Dialog, Select, Input, Button, Textarea |
| lucide-react | — | Pencil, Trash2, Loader2 icons |
| socket.io-client | v4 | WebSocket |
| Inter | Google Fonts | Typography |

---

## Development Commands

```bash
npm run dev      # Development server with Turbopack
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```
