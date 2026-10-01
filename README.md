# Fiagmazation

A collaborative, Figma-style design tool for the web — real-time multi-user canvas editing, rooms and sharing, threaded comments, presence and live cursors, templates, and a full auth system. UI follows the provided reference design (`Reffrience.png`): a light, minimal surface with blue, orange, purple and red accents.

## Features

- **Auth** — register, login (email *or* username), JWT access tokens (memory + session storage), rotating refresh tokens, logout / logout everywhere, change password, forgot & reset password (Development returns a clickable reset link since no real e-mail is sent), profile settings (name, job title, avatar, password, active sessions).
- **Dashboard** — rooms list with search, scope filters and pagination, room stats, recent activity, shared-with-me view.
- **Rooms & collaboration** — create / rename / duplicate / delete rooms, share by e-mail with Owner / Editor / Viewer roles, member management, unread notifications (`room_shared`, comment mentions, system).
- **Real-time editor (Konva + SignalR)** — select / move / resize / rotate, rectangle, ellipse, line, pencil, text, image and frame tools, frame/zoom/pan with fit-to-screen, grid toggle, layer panel with drag-reorder, rename, hide and lock, design properties panel (position, size, fill, stroke, typography, opacity, corner radius, …), undo/redo, clipboard copy/paste, duplicate, keyboard shortcuts, context menu, marquee selection.
- **Live collaboration** — presence stack with per-user colors, live cursors, live selection outlines, per-element patch sync (350 ms), debounced full-design autosave (1.2 s) with Saving/Saved status, reconnect resync that never clobbers remote work.
- **Comments** — click-to-place threads with replies, resolve/unresolve, live refresh across clients, comments panel with presence section.
- **Templates** — blank, landing page, mobile app, dashboard, wireframe, presentation and brand-board starters that spin up a ready-to-edit room.
- **Responsive shell** — collapsible layer/right panels on small screens, tooltips, toasts, error states.

## Stack

| Layer     | Technology |
|-----------|------------|
| Backend   | ASP.NET Core (.NET 10), EF Core 10 + SQL Server Express, ASP.NET Core Identity, JWT, SignalR, Serilog-style console logging, Swagger |
| Frontend  | Next.js 15 (App Router), TypeScript, Tailwind CSS 4, Konva / react-konva, `@microsoft/signalr`, Zustand, lucide-react icons |
| Database  | SQL Server Express `.\SQLEXPRESS`, database `Fiagmazation` (created + migrated + seeded automatically on first run) |

## Repository layout

```
Fiagmazation/
├── Reffrience.png            # UI/UX reference
├── README.md
├── backend/
│   ├── Fiagmazation.slnx
│   └── src/
│       ├── Fiagmazation.Domain/          # entities, enums
│       ├── Fiagmazation.Application/     # DTOs, services, interfaces
│       ├── Fiagmazation.Infrastructure/  # EF Core, Identity, migrations, seeding, e-mail
│       └── Fiagmazation.Api/             # controllers, SignalR hub, middleware, swagger
└── frontend/
    ├── .env.local.example
    └── src/
        ├── app/                # routes (auth, dashboard, editor, templates, settings)
        ├── components/         # ui/, auth/, dashboard/, editor/
        ├── hooks/              # keyboard shortcuts, hub event wiring
        ├── lib/                # api client, hub client, viewport, templates, types
        └── store/              # zustand stores (auth, editor, toasts)
```

## Prerequisites

- [.NET SDK 10](https://dotnet.microsoft.com/download) (verified with SDK 10.0.301)
- Node.js 20+ (verified with v24)
- SQL Server Express with a default instance at `.\SQLEXPRESS` (Windows authentication)
- Docker is **not** required

## Running locally

### 1. Backend

```powershell
cd backend
dotnet run --project src/Fiagmazation.Api
```

- API: <http://localhost:5077> (Swagger UI at `/swagger`)
- On startup the app applies EF Core migrations and seeds the demo data (see below).
- Connection string lives in `backend/src/Fiagmazation.Api/appsettings.json`:

```json
"Server=.\\SQLEXPRESS;Database=Fiagmazation;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
```

### 2. Frontend

```powershell
cd frontend
cp .env.local.example .env.local   # already points at http://localhost:5077
npm install
npm run dev
```

- App: <http://localhost:3000>
- Scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`

### 3. Sign in

| Field    | Value |
|----------|-------|
| E-mail   | `mohamed@fiagmazation.dev` |
| Password | `Password123!` |

Seeding (`Seed:Enabled=true`) creates the demo user, four sample rooms (`Website Redesign`, `Mobile App UI`, `Brand Project`, `Personal Designs`) with designs, seeded elements and a welcome notification. Delete the `Fiagmazation` database to re-seed from scratch.

## API overview

Base URL `http://localhost:5077/api`, JSON with string enums, `Authorization: Bearer <accessToken>`, errors as RFC-7807 (`{ title, status, code, detail, errors }`).

| Area | Endpoints |
|------|-----------|
| Auth | `POST auth/register`, `auth/login` (`emailOrUsername` + `password`), `auth/refresh`, `auth/logout`, `auth/logout-all`, `auth/change-password`, `auth/forgot-password`, `auth/reset-password`, `GET/PUT auth/me`, `GET auth/external` |
| Rooms | `GET rooms` (`search`, `scope=all\|mine\|shared\|recent`, `page`, `pageSize`), `POST rooms`, `GET rooms/{id}`, `PUT/DELETE rooms/{id}`, `POST rooms/{id}/duplicate`, `POST rooms/{id}/designs`, `GET rooms/{id}/design`, `GET rooms/{id}/members`, `POST rooms/{id}/members`, `PUT/DELETE rooms/{id}/members/{userId}`, `GET rooms/{id}/presence` |
| Designs | `GET designs/{id}`, `PUT designs/{id}` (full save; omitted elements are deleted), `PATCH designs/{id}`, `DELETE designs/{id}` |
| Elements | `POST designs/{id}/elements`, `PATCH designs/{id}/elements/{elementId}`, `PUT designs/{id}/elements/order` `{ids}`, `POST designs/{id}/elements/bulk-delete` `{ids}`, `DELETE designs/{id}/elements/{elementId}` |
| Comments | `GET designs/{id}/comments`, `POST designs/{id}/comments` `{body,x,y,parentId?}`, `PUT comments/{id}`, `DELETE comments/{id}`, `POST comments/{id}/resolve` `{resolved}` |
| Notifications | `GET notifications`, `GET notifications/unread-count`, `POST notifications/{id}/read`, `POST notifications/read-all` |

### Real-time (`/hubs/room`)

Client → server: `JoinRoom(roomId)` (returns `{roomId, you, members}`), `LeaveRoom`, `CursorMoved`, `SelectionChanged`, `ElementCreated`, `ElementUpdated`, `ElementsDeleted`, `ElementsReordered`, `DesignSaved`, `CommentsChanged`.

Server → client (payloads wrapped in `{roomId, …}`): `PresenceJoined`, `PresenceLeft`, `CursorMoved`, `SelectionChanged`, `ElementCreated`, `ElementUpdated`, `ElementsDeleted`, `ElementsReordered`, `DesignSaved`, `CommentsChanged`, `Rejoined`.

Mutations are REST-first (authoritative persistence) and then broadcast over the hub; receivers apply remote events without re-saving, and ignore their own `DesignSaved` echoes.

## Verification performed

- `dotnet build` — 0 warnings / 0 errors; `npm run lint` — 0 problems; `npm run typecheck` — clean; `npm run build` — all routes compile.
- API smoke tests: register → login → rooms → design → element create/patch/delete → full save with stale-element removal → profile update (including clearing avatar) → comments (create, reply, list, resolve, edit) → notifications → forgot/reset round-trip (new password signs in, old password rejected).
- SignalR two-client test: join/presence, cursor broadcast, selection broadcast, element-created broadcast, comments refresh.

## Notes & known limitations

- **No real e-mail** — `LoggingEmailSender` writes outgoing mail to the API log; in Development `POST auth/forgot-password` also returns `devResetUrl`, surfaced as a clickable link on the forgot-password page.
- **OAuth (Google/GitHub/Microsoft)** — endpoints, callback page and redirect contract are implemented, but the buttons stay disabled until `OAuth:*:ClientId/ClientSecret` are configured in `appsettings.json`.
- **HTTPS** — dev uses plain HTTP on ports 5077 (API) and 3000 (web); CORS is configured for `http://localhost:3000`.
- **Concurrency** — a full-design save deletes elements missing from the payload; clients guard against this by resyncing from the server after a hub reconnect instead of flushing a stale snapshot.
- The JWT secret and seed passwords are development defaults — replace them for any real deployment.
