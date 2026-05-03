# Backend — Incident Management API

NestJS-based REST API + Socket.IO real-time server.

---

## Setup

```bash
npm install
```

### Environment Variables

A `.env.example` file is included with all values pre-filled. Copy it and add your Groq API key:

```bash
cp .env.example .env
```

Then open `.env` and set `GROQ_API_KEY`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=adl_user
DATABASE_PASSWORD=adl_pass
DATABASE_NAME=adl_db
PORT=3001
GROQ_API_KEY=gsk_your_key_here   # optional — https://console.groq.com — free
```

### Start PostgreSQL

```bash
# from the project root
docker compose up -d postgres
```

---

## Running

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

**Services:**

| URL | Description |
|-----|-------------|
| http://localhost:3001 | REST API |
| http://localhost:3001/api/docs | Swagger / OpenAPI UI |

---

## Tests

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

**16 tests — 3 suites:**

| Suite | Type | Tests |
|-------|------|-------|
| `incidents.service.spec.ts` | Unit | 6 |
| `incidents.controller.spec.ts` | Integration (Supertest) | 10 |
| `app.controller.spec.ts` | Unit | 0 (scaffold) |

---

## Seed Data

```bash
npm run seed
```

Creates 5 sample incidents (Payment API, Auth Service, Notification Worker).

---

## API Reference

### POST /incidents

```json
{
  "title": "Database timeout on payment service",
  "description": "Users receiving timeout errors during checkout.",
  "service": "Payment API",
  "severity": "high"
}
```

**Validation rules:**
- `title` — required, cannot be empty
- `severity` — `low | medium | high | critical`
- `status` (PATCH) — `open | investigating | resolved`
- Unknown fields are rejected (`forbidNonWhitelisted: true`)

### GET /incidents

```
GET /incidents?page=1&limit=10&status=open&severity=high&service=Payment
```

**Response:**
```json
{
  "data": [...],
  "total": 42,
  "page": 1,
  "totalPages": 5
}
```

- `service` filter uses prefix match (`ILIKE 'n%'`) — "n" returns only "Notification Worker"
- Sorted by `createdAt DESC`

### PATCH /incidents/:id

```json
{ "status": "resolved", "severity": "low", "description": "Fixed." }
```

All fields are optional; only provided fields are updated.

### DELETE /incidents/:id

Soft delete — the `deletedAt` field is set; the record is not physically removed.  
Response: `204 No Content`

### GET /incidents/:id/audit

```json
[
  {
    "id": "uuid",
    "action": "updated",
    "changes": { "status": { "from": "open", "to": "resolved" } },
    "createdAt": "2026-05-02T..."
  }
]
```

### POST /ai/analyze

```json
// Request
{ "title": "Payment 500 errors", "description": "DB pool exhausted" }

// Response
{ "severity": "critical", "service": "Payment API", "summary": "..." }
```

Returns `503 Service Unavailable` if `GROQ_API_KEY` is not set.

**Getting a free Groq API key:**
1. Go to **https://console.groq.com** and create a free account
2. Navigate to **API Keys** → **Create API Key** — copy the key (starts with `gsk_`)
3. Copy `.env.example` to `.env` and paste your Groq key into the `GROQ_API_KEY` field
4. Restart the backend — the endpoint will become active immediately

**Using AI Suggest in the UI:** open **+ New Incident**, enter a title (and optionally a description), then click **✨ AI Suggest**. The form will auto-fill severity, service, and summary.

---

## Architecture

```
src/
├── incidents/
│   ├── dto/
│   │   ├── create-incident.dto.ts
│   │   ├── update-incident.dto.ts
│   │   └── query-incident.dto.ts
│   ├── entities/
│   │   └── incident.entity.ts       # @DeleteDateColumn (soft delete)
│   ├── repositories/
│   │   └── incident.repository.ts   # TypeORM Repository wrapper
│   ├── incidents.controller.ts      # HTTP endpoints + request logging
│   ├── incidents.service.ts         # Business logic + error logging
│   ├── incidents.gateway.ts         # Socket.IO WebSocket gateway
│   └── incidents.module.ts
├── audit/
│   ├── audit-log.entity.ts          # JSONB diff table
│   └── audit.service.ts
├── ai/
│   ├── ai.service.ts                # Groq API (OpenAI-compatible)
│   ├── ai.controller.ts
│   └── ai.module.ts
├── common/
│   └── all-exceptions.filter.ts     # Global 4xx/5xx exception handler
├── app.module.ts
├── main.ts                          # Bootstrap, CORS, ValidationPipe, Swagger
└── seed.ts
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| Controller | HTTP request/response, request logging, socket emit |
| Service | Business logic, audit diff calculation, error logging |
| Repository | DB queries, soft delete, pagination |
| Gateway | Socket.IO event broadcast |
| Filter | Catch all errors, log them, return a standard format |

---

## Real-time Events (Socket.IO)

| Event | Trigger | Payload |
|-------|---------|---------|
| `incident:created` | `POST /incidents` | Incident object |
| `incident:updated` | `PATCH /incidents/:id` | Incident object |
| `incident:deleted` | `DELETE /incidents/:id` | `{ id: string }` |

Namespace: `/` (default)  
CORS: `origin: '*'`
