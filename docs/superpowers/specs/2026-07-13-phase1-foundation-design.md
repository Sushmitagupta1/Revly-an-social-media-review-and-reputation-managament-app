# Revly — Phase 1: Foundation Design Spec

> **Goal:** Build the complete project scaffolding — frontend shell, backend API, database, authentication, and the full UI layout matching the Olly design system — so all subsequent phases can build features on top.

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 19 |
| Language | TypeScript | 5.x |
| Build Tool | Vite | 6.x |
| CSS | Tailwind CSS | 4.x |
| Component Library | shadcn/ui | latest |
| Animation | Framer Motion | 12.x |
| Data Fetching | TanStack Query | 5.x |
| Routing | React Router | 7.x |
| Charts | Recharts | 2.x |
| State | Zustand | 5.x |
| Backend Framework | FastAPI | 0.115+ |
| ORM | SQLAlchemy | 2.x |
| Migrations | Alembic | 1.14+ |
| Database | PostgreSQL | 16 |
| Auth | JWT (PyJWT) + bcrypt | — |
| Scheduling | APScheduler | 3.x |
| AI | Gemini API + LangChain | — |
| Containerization | Docker + Docker Compose | — |
| Reverse Proxy | Nginx | — |
| Server | Oracle Cloud Always Free (Ubuntu) | — |

---

## 2. Project Structure

```
revly/
├── frontend/                    # React + Vite app
│   ├── public/
│   │   ├── icons/               # PWA icons (192x192, 512x512)
│   │   ├── manifest.json        # PWA manifest
│   │   └── sw.js                # Service worker (Phase 6)
│   ├── src/
│   │   ├── app/                 # Route tree (React Router)
│   │   │   ├── routes.tsx       # Route definitions
│   │   │   ├── (auth)/          # Auth pages (login, register)
│   │   │   │   ├── login.tsx
│   │   │   │   ├── register.tsx
│   │   │   │   └── layout.tsx   # Auth layout (centered card)
│   │   │   └── (dashboard)/     # Protected pages
│   │   │       ├── layout.tsx   # Dashboard layout (sidebar + header)
│   │   │       ├── overview.tsx
│   │   │       ├── reviews/
│   │   │       │   ├── index.tsx
│   │   │       │   └── [id].tsx
│   │   │       ├── inbox.tsx
│   │   │       ├── complaints.tsx
│   │   │       ├── praises.tsx
│   │   │       ├── location-leaderboard.tsx
│   │   │       ├── competitors.tsx
│   │   │       ├── reports.tsx
│   │   │       ├── ask-revly.tsx
│   │   │       ├── automation.tsx
│   │   │       ├── notifications.tsx
│   │   │       ├── integrations.tsx
│   │   │       ├── audit-logs.tsx
│   │   │       └── account/
│   │   │           ├── layout.tsx  # Account sub-layout (left nav)
│   │   │           ├── profile.tsx
│   │   │           ├── locations.tsx
│   │   │           ├── team.tsx
│   │   │           ├── auto-response.tsx
│   │   │           ├── platform-integration.tsx
│   │   │           └── resolve.tsx
│   │   ├── components/
│   │   │   ├── ui/              # shadcn primitives
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── checkbox.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   └── skeleton.tsx
│   │   │   ├── layout/
│   │   │   │   ├── sidebar.tsx         # Persistent left sidebar
│   │   │   │   ├── header.tsx          # Top header bar
│   │   │   │   ├── page-wrapper.tsx    # Page container
│   │   │   │   ├── brand-selector.tsx  # Brand dropdown
│   │   │   │   ├── location-filter.tsx # Location filter modal trigger
│   │   │   │   ├── date-filter.tsx     # Date filter modal trigger
│   │   │   │   └── platform-filter.tsx # Platform filter modal trigger
│   │   │   ├── modals/
│   │   │   │   ├── location-filter-modal.tsx
│   │   │   │   ├── date-filter-modal.tsx
│   │   │   │   └── platform-filter-modal.tsx
│   │   │   └── shared/
│   │   │       ├── kpi-card.tsx
│   │   │       ├── rating-badge.tsx
│   │   │       ├── trend-indicator.tsx
│   │   │       ├── review-card.tsx
│   │   │       ├── empty-state.tsx
│   │   │       └── loading-spinner.tsx
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   ├── use-api.ts
│   │   │   └── use-debounce.ts
│   │   ├── lib/
│   │   │   ├── api-client.ts         # Axios/fetch wrapper
│   │   │   ├── utils.ts             # cn(), formatNumber(), etc.
│   │   │   └── constants.ts         # API URLs, defaults
│   │   ├── stores/
│   │   │   ├── auth-store.ts        # Zustand auth state
│   │   │   └── filter-store.ts      # Global filter state
│   │   └── types/
│   │       ├── auth.ts
│   │       ├── user.ts
│   │       ├── review.ts
│   │       └── api.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── components.json           # shadcn config
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app entry
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py       # POST /login, /register, /refresh
│   │   │   │   └── users.py      # GET /me, PATCH /me
│   │   │   └── deps.py           # get_db, get_current_user dependencies
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── base.py           # Base declarative model
│   │   │   ├── user.py           # User model
│   │   │   └── role.py           # Role model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py           # LoginRequest, TokenResponse
│   │   │   └── user.py           # UserCreate, UserResponse
│   │   └── core/
│   │       ├── __init__.py
│   │       ├── config.py         # Settings via pydantic-settings
│   │       ├── security.py       # JWT encode/decode, hash/verify
│   │       └── database.py       # Engine, SessionLocal, Base
│   ├── alembic/
│   │   ├── versions/             # Migration files
│   │   └── env.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 3. Design System

### 3.1 Color Palette

Derived from the Olly screenshots. All colors as CSS custom properties in `:root`.

```css
:root {
  /* ── Primary Navy ── */
  --primary:           #0F172A;
  --sidebar:           #16213E;
  --sidebar-hover:     #2E4C9A;
  --dashboard-bg:      #0F163D;
  --page-bg:           #182A63;

  /* ── Surfaces ── */
  --card:              #F8F8F6;
  --card-secondary:    #F3F5F8;
  --card-blue:         #DCEAFB;
  --card-pink:         #F8D7D9;
  --card-yellow:       #FFF1CF;
  --card-green:        #EDF7EF;
  --surface:           #FFFFFF;
  --background:        #F9FAFB;

  /* ── Semantic ── */
  --success:           #12B76A;
  --success-soft:      #6FE5A6;
  --success-bg:        #D1FAE5;
  --warning:           #F59E0B;
  --warning-soft:      #F8E38A;
  --warning-bg:        #FEF3C7;
  --danger:            #E53935;
  --danger-soft:       #F7C9C9;
  --danger-bg:         #FEE2E2;
  --info:              #4361EE;
  --info-soft:         #BFD8FF;
  --info-bg:           #DBEAFE;

  /* ── Accent ── */
  --accent:            #FF5A1F;
  --accent-teal:       #0D8A74;
  --accent-purple:     #8B5CF6;
  --accent-cyan:       #06B6D4;
  --accent-pink:       #EC4899;

  /* ── Category Tags ── */
  --tag-purple:        #D8D3FF;
  --tag-lavender:      #C9C4F7;
  --tag-pink:          #F6D0D5;
  --tag-mint:          #D4F3E8;
  --tag-peach:         #FFE0C2;

  /* ── Text ── */
  --text:              #111827;
  --text-secondary:    #6B7280;
  --text-muted:        #9CA3AF;

  /* ── Border ── */
  --border:            #E5E7EB;
  --input-border:      #D1D5DB;

  /* ── Rating Stars ── */
  --star-5:            #12B76A;
  --star-4:            #5AC8FA;
  --star-3:            #F4C542;
  --star-2:            #FF8A3D;
  --star-1:            #E53935;

  /* ── Chart Palette ── */
  --chart-blue:        #4361EE;
  --chart-green:       #12B76A;
  --chart-orange:      #FF8A3D;
  --chart-red:         #E53935;
  --chart-purple:      #8B5CF6;
  --chart-pink:        #EC4899;
  --chart-cyan:        #06B6D4;
  --chart-yellow:      #F4C542;
}
```

### 3.2 Typography

- **Headings:** StageGrotesk (Bold, Medium, Regular) — loaded as web fonts
- **Body:** System font stack (Inter fallback)
- **Mono:** Geist Mono (for data/numbers)
- **KPI Numbers:** Extra bold, 32-48px
- **Section Titles:** Medium, 20px
- **Body Text:** Regular, 14-16px
- **Badges/Labels:** Medium, 12-13px

### 3.3 Spacing & Layout

- **Border radius:** Cards `16px`, Buttons `8-12px`, Modals `16px`, Pills `9999px`
- **Card padding:** `24px`
- **Grid gaps:** `24px` (main grid), `18px` (inner grids)
- **Sidebar width:** `280px` fixed
- **Page max-width:** Fluid, constrained by sidebar

### 3.4 Component Patterns

**KPI Card:**
```
┌─────────────────────┐
│  Label              │
│  4.5                │  ← Large bold number
│  ↓ Down by 0.2      │  ← Trend indicator
└─────────────────────┘
```

**Modal Dialog:**
```
┌──────────────────────────┐
│  Title            Close  │
│  ┌────────────────────┐  │
│  │ Search...          │  │
│  └────────────────────┘  │
│  ☑ Option 1              │
│  ☐ Option 2              │
│  ☐ Option 3              │
│              [Apply]     │
└──────────────────────────┘
```

**Review Card:**
```
┌──────────────────────────────────────┐
│  ⭐⭐⭐⭐⭐  Google  John Smith  2h ago │
│  Review text here...                 │
│  📍 Upper Crust Vastrapur            │
│  [Generate a Reply]  Read review →   │
└──────────────────────────────────────┘
```

---

## 4. Database Schema (Phase 1)

### 4.1 Tables

```sql
-- Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default roles
INSERT INTO roles (name, permissions) VALUES
    ('owner',  '["all"]'),
    ('admin',  '["manage_locations", "manage_team", "manage_reviews", "view_analytics"]'),
    ('member', '["manage_reviews", "view_analytics"]'),
    ('viewer', '["view_analytics"]');

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    avatar_url VARCHAR(512),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
```

### 4.2 Future Tables (stubs for reference, created in later phases)

- `brands` — Brand/company registry
- `locations` — Physical store locations
- `platforms` — Review platform connections
- `reviews` — Customer reviews
- `replies` — AI-generated and manual replies
- `complaints` — Categorized complaints
- `praises` — Categorized praises
- `competitors` — Competitor tracking
- `analytics` — Pre-computed analytics
- `reports` — Generated reports
- `notifications` — User notifications
- `ai_logs` — AI interaction audit trail
- `automation_rules` — Automation configurations
- `settings` — Per-brand settings
- `audit_logs` — System audit trail

---

## 5. API Design (Phase 1)

### 5.1 Auth Endpoints

```
POST /api/v1/auth/register
  Body: { email, password, full_name }
  Response: { user: UserResponse, access_token, refresh_token }

POST /api/v1/auth/login
  Body: { email, password }
  Response: { user: UserResponse, access_token, refresh_token }

POST /api/v1/auth/refresh
  Body: { refresh_token }
  Response: { access_token, refresh_token }

POST /api/v1/auth/logout
  Headers: Authorization: Bearer <token>
  Response: { message: "Logged out" }
```

### 5.2 User Endpoints

```
GET /api/v1/users/me
  Headers: Authorization: Bearer <token>
  Response: { id, email, full_name, role, avatar_url, created_at }

PATCH /api/v1/users/me
  Headers: Authorization: Bearer <token>
  Body: { full_name?, avatar_url? }
  Response: { id, email, full_name, role, avatar_url }
```

### 5.3 JWT Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "owner",
  "exp": 1721000000,
  "iat": 1720999100
}
```

- Access token: 15 minutes
- Refresh token: 7 days
- Stored in httpOnly secure cookie

---

## 6. Auth Flow

```
┌─────────┐     POST /auth/login      ┌─────────┐
│  Login  │ ──────────────────────────→│  API    │
│  Form   │                            │         │
└─────────┘                            └────┬────┘
                                            │
                                   Validate credentials
                                   Generate JWT pair
                                            │
                                            ▼
┌─────────┐     Set-Cookie: tokens   ┌─────────┐
│  Front  │ ←────────────────────────│  API    │
│  end    │                          │         │
└────┬────┘                          └─────────┘
     │
     │ Store user in Zustand
     │ Redirect to /overview
     ▼
┌─────────┐
│Dashboard│
│  Shell  │
└─────────┘
```

Every subsequent request:
```
Browser → Authorization: Bearer <access_token> → API validates → attaches user
On 401 → Frontend attempts refresh → if refresh fails → redirect to /login
```

---

## 7. UI Shell (Phase 1 Deliverable)

### 7.1 Auth Pages

- `/login` — Centered card on dark background. Email + password fields. "Sign in" button. "Don't have an account? Register" link.
- `/register` — Centered card. Full name + email + password fields. "Create account" button. "Already have an account? Sign in" link.

### 7.2 Dashboard Layout

```
┌──────────────┬────────────────────────────────────────┐
│              │  Header (user avatar, dropdown)         │
│   Sidebar    ├────────────────────────────────────────┤
│              │                                        │
│  Brand ▼     │  Page Content (react-router outlet)    │
│  Location ▼  │                                        │
│  Time ▼      │                                        │
│  Platform ▼  │                                        │
│              │                                        │
│  ───────     │                                        │
│  Dashboard   │                                        │
│  Leaderboard │                                        │
│  Reviews     │                                        │
│  Inbox       │                                        │
│  ...         │                                        │
│              │                                        │
│  ┌────────┐  │                                        │
│  │Upgrade │  │                                        │
│  │Pro     │  │                                        │
│  └────────┘  │                                        │
└──────────────┴────────────────────────────────────────┘
```

### 7.3 Sidebar Components

- **Brand Selector:** Dropdown showing current brand name (e.g., "Upper Crust")
- **Location Filter:** Click opens location filter modal
- **Date Filter:** Click opens date filter modal
- **Platform Filter:** Click opens platform filter modal
- **Nav Links:** Dashboard, Location Leaderboard, Reviews, Inbox, Complaints, Praises, Analytics, Competitors, Reports, Ask Revly, Automation, Notifications, Integrations, Users & Roles, Settings, Audit Logs
- **Upgrade Banner:** "Upgrade to Revly Pro" promotional card at bottom

### 7.4 Filter Modals

**Location Modal:**
- Search input at top
- "All Locations (N)" master toggle
- Scrollable checkbox list of locations
- "Apply" button (dark navy)

**Date Modal:**
- Range pills: Daily | Weekly | Monthly | Quarterly
- Duration presets: Today, Yesterday, Past 7 Days, Past 30 Days (2x2 grid)
- Custom: Start date + End date calendar inputs
- "Apply" button

**Platform Modal:**
- Checkbox list: Google My Business, Zomato, Reelo
- "Apply" button

### 7.5 Account Layout

When navigating to any `/account/*` route, the layout changes to:
- Left sub-navigation (Profile, Locations, Team, Auto Response, Platform Integration, Resolve, Log Out)
- Right content area

---

## 8. PWA Configuration (Phase 1 stubs)

```json
{
  "name": "Revly",
  "short_name": "Revly",
  "description": "AI Review & Reputation Management",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#0F172A",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Service worker and offline support deferred to Phase 6.

---

## 9. Docker Configuration (Phase 1)

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://revly:revly@db:5432/revly
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db

  db:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=revly
      - POSTGRES_PASSWORD=revly
      - POSTGRES_DB=revly
    volumes:
      - pgdata:/var/lib/postgresql/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend

volumes:
  pgdata:
```

---

## 10. Environment Variables

```bash
# .env.example
DATABASE_URL=postgresql://revly:revly@localhost:5432/revly
JWT_SECRET=change-me-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
GEMINI_API_KEY=
GOOGLE_DRIVE_CREDENTIALS=
CORS_ORIGINS=http://localhost:3000
```

---

## 11. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Frontend build time | < 30s |
| API response time (auth) | < 200ms |
| Database connections | Pool of 5-20 |
| Docker startup | < 60s all services |
| TypeScript strict mode | Enabled |
| ESLint | Enabled with React + TS rules |
| Tailwind | Purged, no unused CSS |

---

## 12. What Phase 1 Delivers

After Phase 1 is complete, the following works:

1. **`docker compose up`** starts all services (frontend, backend, postgres, nginx)
2. **User can register** at `/register` with email + password
3. **User can log in** at `/login` and receives JWT
4. **Protected dashboard shell** renders with full sidebar navigation
5. **All filter modals** open, display, and close (location, date, platform)
6. **Account pages** render with sub-navigation
7. **User can view profile** at `/account/profile`
8. **JWT refresh** works transparently
9. **PWA manifest** is served (icons are placeholder)
10. **All routes** are wired up as placeholder pages ready for Phase 2+

What does NOT work yet (deferred to later phases):
- Real review data
- Charts and analytics
- AI features
- Platform integrations
- Multi-location data
- Competitor tracking
- Automation
- Reports
