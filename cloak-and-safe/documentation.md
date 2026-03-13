# PII Data Masking & Anonymization Platform

## Comprehensive Technical Documentation

**Version:** 7.0.0  
**Last Updated:** March 2026  
**Backend Phase:** Phase 7 Completed (Audit Logs & Execution Console)  
**Project Type:** Final Year Student Project - Data Masking & Anonymization Tool

---

## Table of Contents

1. [Overview](#overview)
2. [Development Roadmap](#development-roadmap)
3. [Technology Stack](#technology-stack)
4. [Application Architecture](#application-architecture)
5. [Project Structure](#project-structure)
6. [Features](#features)
7. [Components Reference](#components-reference)
8. [Pages Reference](#pages-reference)
9. [Workflows](#workflows)
10. [State Management](#state-management)
11. [Database Schema](#database-schema)
12. [Security & Compliance](#security--compliance)
13. [API Reference](#api-reference)
14. [Development Guide](#development-guide)

---

## Overview

This application is an enterprise-grade **PII (Personally Identifiable Information) Detection, Masking, and Anonymization Platform**. Built as a final year student project, it demonstrates professional-grade data protection capabilities.

### Core Capabilities

| Capability | Description |
|------------|-------------|
| **User Authentication** | JWT-based authentication with Django backend |
| **Project Management** | Multi-project support with backend-driven storage |
| **Database Connection** | Connect to PostgreSQL, MySQL, SQL Server, Oracle, MongoDB |
| **PII Detection** | Automatic scanning with pattern-based classification |
| **Data Masking** | Reversible transformation techniques |
| **Anonymization** | Irreversible data protection methods |
| **Audit Logging** | Enterprise-grade execution logs |
| **Export** | CSV, JSON, Excel file generation |

### Design Principles

1. **No Data Exposure** - Original, masked, or anonymized values are NEVER displayed
2. **Metadata-Only Processing** - UI shows process status and field names only
3. **Audit-Safe** - All operations logged with timestamps
4. **Enterprise Simulation** - Professional security workflow visualization

---

## Development Roadmap

### Phase Overview

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Completed | Django Backend Foundation |
| Phase 2 | ✅ Completed | Authentication & User Management |
| Phase 3 | ✅ Completed | Project Management |
| Phase 4 | ✅ Completed | Database Connection Simulation (Safe Mode) |
| Phase 5 | ✅ Completed | PII Detection API (Rule-Based) |
| Phase 6 | ✅ Completed | Data Masking & Anonymization Engine |
| Phase 7 | ✅ Completed | Audit Logs & Execution Console |

### Phase 1: Django Backend Foundation (Completed)

**Objective:** Establish the Django backend infrastructure with health check connectivity to the React frontend.

**Deliverables:**
- ✅ Django project setup with modular settings (base/dev/prod)
- ✅ Django REST Framework integration
- ✅ CORS configuration for frontend integration
- ✅ Health check endpoint (`GET /api/health`)
- ✅ API root endpoint (`GET /api/`)
- ✅ Frontend API client (`src/api/client.ts`)
- ✅ Backend status hook (`src/hooks/use-backend-status.ts`)
- ✅ Backend status context (`src/contexts/BackendStatusContext.tsx`)
- ✅ Environment-based configuration

**API Endpoints (Phase 1):**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/` | GET | API root with endpoint listing |
| `/api/health` | GET | Health check for frontend connectivity |
| `/admin/` | GET | Django admin interface (dev only) |

### Phase 2: Authentication & User Management (Completed)

**Objective:** Implement JWT-based authentication with Django, replacing Supabase authentication.

**Deliverables:**
- ✅ Django authentication app (`BACKEND/authentication/`)
- ✅ JWT authentication with djangorestframework-simplejwt
- ✅ User registration endpoint (`POST /api/auth/register/`)
- ✅ User login endpoint (`POST /api/auth/login/`)
- ✅ User logout endpoint (`POST /api/auth/logout/`)
- ✅ Current user endpoint (`GET /api/auth/me/`)
- ✅ Token refresh endpoint (`POST /api/auth/token/refresh/`)
- ✅ Frontend AuthContext (`src/contexts/AuthContext.tsx`)
- ✅ Frontend auth API module (`src/api/auth.ts`)
- ✅ Protected routes implementation
- ✅ Supabase authentication completely removed

**API Endpoints (Phase 2):**
| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/register/` | POST | No | User registration |
| `/api/auth/login/` | POST | No | User login (returns JWT tokens) |
| `/api/auth/logout/` | POST | Yes | User logout (blacklists refresh token) |
| `/api/auth/me/` | GET | Yes | Get current user details |
| `/api/auth/token/refresh/` | POST | No | Refresh access token |

### Phase 3: Project Management (Completed)

**Objective:** Implement real multi-project support with backend-driven storage, replacing mock project data.

**Deliverables:**
- ✅ Django projects app (`BACKEND/projects/`)
- ✅ Project model with UUID primary key
- ✅ UserProjectPreference model for active project tracking
- ✅ Create project endpoint (`POST /api/projects/`)
- ✅ List projects endpoint (`GET /api/projects/`)
- ✅ Get project details endpoint (`GET /api/projects/{id}/`)
- ✅ Select active project endpoint (`POST /api/projects/{id}/select/`)
- ✅ Delete project endpoint (`DELETE /api/projects/{id}/delete/`)
- ✅ Get active project endpoint (`GET /api/projects/active/`)
- ✅ Frontend projects API module (`src/api/projects.ts`)
- ✅ Updated ProjectContext with real API integration
- ✅ Updated project components (ProjectList, NewProjectDialog)
- ✅ Removed all mock project data

**API Endpoints (Phase 3):**
| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/projects/` | GET | Yes | List user's projects |
| `/api/projects/` | POST | Yes | Create new project |
| `/api/projects/{id}/` | GET | Yes | Get project details |
| `/api/projects/{id}/select/` | POST | Yes | Set as active project |
| `/api/projects/{id}/delete/` | DELETE | Yes | Delete project |
| `/api/projects/active/` | GET | Yes | Get active project |
| `/api/projects/active/` | DELETE | Yes | Clear active project |

### Phase 4: Database Connection Simulation (Completed)

**Objective:** Implement safe-mode database connection simulation for academic/demo use. No real database connections are made.

**Deliverables:**
- ✅ DatabaseConnection model (`BACKEND/projects/models.py`)
- ✅ Save connection endpoint (`POST /api/projects/{id}/db-connections/`)
- ✅ Test connection endpoint (`POST /api/projects/{id}/db-connections/{conn_id}/test/`)
- ✅ Fetch tables endpoint (`GET /api/projects/{id}/db-connections/{conn_id}/tables/`)
- ✅ Frontend database API module (`src/api/database.ts`)
- ✅ Updated DatabaseConnection component with real API integration
- ✅ Removed all mock/simulated frontend logic
- ✅ Project ownership validation on all endpoints
- ✅ JWT authentication required on all endpoints

**API Endpoints (Phase 4):**
| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/projects/{id}/db-connections/` | POST | Yes | Save database connection |
| `/api/projects/{id}/db-connections/{conn_id}/test/` | POST | Yes | Test connection (simulated) |
| `/api/projects/{id}/db-connections/{conn_id}/tables/` | GET | Yes | Fetch tables (simulated) |

**Safe Mode Notes:**
- Backend does NOT connect to any real databases
- Test connection simulates success if host is non-empty
- Table metadata is hardcoded sample data
- TODO comments mark where real DB logic will be added later

### Phase 5: PII Detection API (Completed)

**Objective:** Server-side PII detection and classification using rule-based pattern matching.

**Deliverables:**
- ✅ DetectedPIIField model for storing scan results (`BACKEND/projects/models.py`)
- ✅ Start scan endpoint (`POST /api/projects/{id}/scan/start/`)
- ✅ Get scan results endpoint (`GET /api/projects/{id}/scan/results/`)
- ✅ Rule-based PII detector module (`BACKEND/projects/pii_detector.py`)
- ✅ Pattern-based detection with confidence scoring
- ✅ Support for 9 PII types (email, phone, card, ssn, name, address, aadhaar, pan, other)
- ✅ Frontend PII Scan API module (`src/api/piiScan.ts`)
- ✅ Updated Detection page with real API integration
- ✅ PII distribution chart for visualizing results

**API Endpoints (Phase 5):**
| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/projects/{id}/scan/start/` | POST | Yes | Start PII detection scan |
| `/api/projects/{id}/scan/results/` | GET | Yes | Get scan results |

**PII Types Supported:**

| Type | Key | Pattern Examples |
|------|-----|------------------|
| Email | `email` | email, user_email, contact |
| Phone | `phone` | phone, mobile, contact_number |
| Credit Card | `card` | credit_card, card_number |
| SSN | `ssn` | ssn, social_security |
| Name | `name` | full_name, first_name, customer_name |
| Address | `address` | street, city, zip_code |
| Aadhaar | `aadhaar` | aadhaar, uid, aadhaar_number |
| PAN | `pan` | pan, pan_number, pan_card |
| Other | `other` | Generic sensitive data |

**Confidence Scoring:**
- High confidence (95%): Direct field name matches
- Medium confidence (85%): Pattern-based detection
- Lower confidence (75%): Data value analysis

### Phase 6: Data Masking & Anonymization Engine (Completed)

**Objective:** Server-side data masking and anonymization with real-time progress streaming via SSE.

**Deliverables:**
- ✅ MaskingJob model for job tracking (`BACKEND/projects/models.py`)
- ✅ MaskingField model for per-field processing status
- ✅ MaskingLog model for detailed logging
- ✅ List masking jobs endpoint (`GET /api/projects/{id}/masking/`)
- ✅ Start masking job endpoint (`POST /api/projects/{id}/masking/start/`)
- ✅ Get job details endpoint (`GET /api/projects/{id}/masking/{job_id}/`)
- ✅ Stream job progress endpoint (`GET /api/projects/{id}/masking/{job_id}/stream/`) - SSE
- ✅ Get job results endpoint (`GET /api/projects/{id}/masking/{job_id}/results/`)
- ✅ Preview masking endpoint (`POST /api/projects/{id}/masking/preview/`)
- ✅ Real-time SSE streaming with Django `StreamingHttpResponse`
- ✅ JWT authentication via query parameter for EventSource compatibility
- ✅ Frontend Masking API module (`src/api/masking.ts`)
- ✅ MaskingProgress component with real-time visualization
- ✅ Updated MaskingPage with job management

**API Endpoints (Phase 6):**
| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/projects/{id}/masking/` | GET | Yes | List masking jobs |
| `/api/projects/{id}/masking/start/` | POST | Yes | Start new masking job |
| `/api/projects/{id}/masking/preview/` | POST | Yes | Preview masking on sample |
| `/api/projects/{id}/masking/{job_id}/` | GET | Yes | Get job details |
| `/api/projects/{id}/masking/{job_id}/stream/` | GET | Yes | Stream progress (SSE) |
| `/api/projects/{id}/masking/{job_id}/results/` | GET | Yes | Get masking results |

**Masking Strategies Applied:**

| PII Type | Strategy | Example |
|----------|----------|---------|
| Email | `email_mask` | `j***@email.com` |
| Phone | `phone_mask` | `XXX-XXX-1234` |
| Credit Card | `card_mask` | `****-****-****-1234` |
| SSN | `ssn_mask` | `***-**-6789` |
| Name | `name_mask` | `J*** D***` |
| Address | `address_mask` | `*** Main St, City` |
| Aadhaar | `aadhaar_mask` | `XXXX-XXXX-1234` |
| PAN | `pan_mask` | `XXXXX1234X` |

**SSE Event Types:**
- `analysis`: Initial PII field analysis
- `strategy_selection`: Strategy assignment for each field
- `masking`: Per-field masking progress with samples
- `validation`: Result validation
- `completed`: Job finished with results
- `error`: Error occurred

**Real-Time Progress Flow:**
```
Job Created → Analysis (10%) → Strategy Selection (30%) → 
Field 1 Masking (40%) → Field 2 Masking (55%) → ... →
Validation (90%) → Completed (100%)
```

### Phase 7: Audit Logs & Execution Console (Completed)

**Objective:** Enterprise-grade audit logging with real-time execution console for visibility.

**Deliverables:**
- ✅ Enhanced MaskingLog model with action/status tracking
- ✅ Get audit logs endpoint (`GET /api/projects/{id}/masking/{job_id}/logs/`)
- ✅ Stream audit logs endpoint (`GET /api/projects/{id}/masking/{job_id}/logs/stream/`) - SSE
- ✅ AuditLogSerializer with console-friendly timestamp format
- ✅ Frontend audit logs API functions (`fetchAuditLogs`, `streamAuditLogs`)
- ✅ ExecutionConsole component with terminal-style UI
- ✅ Real-time log streaming via SSE
- ✅ Color-coded status indicators
- ✅ Auto-scroll, pause/resume, export, and clear functionality
- ✅ Integration with MaskingPage as dedicated tab

**API Endpoints (Phase 7):**
| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/projects/{id}/masking/{job_id}/logs/` | GET | Yes | Fetch all audit logs |
| `/api/projects/{id}/masking/{job_id}/logs/stream/` | GET | Yes | Stream logs (SSE) |

**MaskingLog Actions:**

| Action Code | Display Name | Description |
|-------------|--------------|-------------|
| `job_started` | Job Started | Masking job initialized |
| `analysis_started` | Analysis Started | PII analysis begins |
| `analysis_completed` | Analysis Completed | PII analysis done |
| `strategy_selected` | Strategy Selected | Masking strategy chosen |
| `masking_started` | Masking Started | Field masking begins |
| `masking_completed` | Masking Completed | Field masking done |
| `validation_started` | Validation Started | Result validation begins |
| `validation_completed` | Validation Completed | Validation passed |
| `job_completed` | Job Completed | Job finished successfully |
| `job_failed` | Job Failed | Job encountered error |

**MaskingLog Status:**

| Status | Color | Description |
|--------|-------|-------------|
| `started` | Blue | Action initiated |
| `processing` | Yellow | Action in progress |
| `completed` | Green | Action completed successfully |
| `error` | Red | Action failed |

**ExecutionConsole Features:**
- Terminal-style dark UI with monospace font
- Real-time log streaming via SSE
- Timestamped entries (HH:MM:SS format)
- Color-coded status indicators
- Auto-scroll to latest logs
- Pause/Resume streaming
- Export logs to text file
- Clear console functionality
- Maximum 500 lines (configurable)

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | Latest | Type-safe development |
| Vite | Latest | Build tool and dev server |
| Tailwind CSS | Latest | Utility-first styling |
| shadcn/ui | Latest | Component library (Radix UI) |
| React Router DOM | 6.30.1 | Client-side routing |
| TanStack React Query | 5.83.0 | Server state management |
| Recharts | 2.15.4 | Data visualization |
| Lucide React | 0.462.0 | Icon library |
| Framer Motion | Via Tailwind | Animations |

### Backend Technologies (Django)

#### Django Backend (All Phases - Completed)

| Technology | Version | Purpose |
|------------|---------|---------|
| Django | 4.2.x | Python web framework |
| Django REST Framework | 3.14.x | RESTful API development |
| djangorestframework-simplejwt | 5.5.x | JWT authentication |
| django-cors-headers | 4.3.x | CORS support for frontend integration |
| SQLite | Default | Development database |
| python-dotenv | 1.0.x | Environment variables management |

#### Server-Sent Events (SSE) for Real-Time

| Feature | Implementation | Purpose |
|---------|----------------|---------|
| Masking Progress | `StreamingHttpResponse` | Real-time job progress |
| Audit Log Stream | `StreamingHttpResponse` | Live execution logs |
| JWT via Query Param | `?token=` | EventSource auth (no headers) |

#### JWT Authentication Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| ACCESS_TOKEN_LIFETIME | 60 minutes | Short-lived access tokens |
| REFRESH_TOKEN_LIFETIME | 7 days | Long-lived refresh tokens |
| ROTATE_REFRESH_TOKENS | True | New refresh token on each refresh |
| BLACKLIST_AFTER_ROTATION | True | Invalidate old refresh tokens |
| AUTH_HEADER_TYPES | Bearer | Standard Bearer token authentication |

### Utility Libraries

| Library | Purpose |
|---------|---------|
| XLSX | Excel file generation |
| Zod | Schema validation |
| React Hook Form | Form management |
| Sonner | Toast notifications |
| date-fns | Date utilities |

---

## Application Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Pages     │  │ Components  │  │  Contexts   │              │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤              │
│  │ Index       │  │ Layout      │  │ Project     │              │
│  │ Auth        │  │ Masking     │  │ Search      │              │
│  │ Database    │  │ Dashboard   │  │ Backend     │              │
│  │ Detection   │  │ Database    │  │ Status      │              │
│  │ Masking     │  │ Upload      │  │ Auth        │              │
│  │ Upload      │  │ Wizard      │  │             │              │
│  │ Settings    │  │ Project     │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                       API Layer                               ││
│  ├──────────────────────────────────────────────────────────────┤│
│  │  client.ts      │  auth.ts           │  projects.ts          ││
│  │  - Health Check │  - login/logout    │  - fetchProjects      ││
│  │  - Backend Hook │  - register        │  - createProject      ││
│  │                 │  - Token mgmt      │  - selectProject      ││
│  │─────────────────┼────────────────────┼───────────────────────││
│  │  piiScan.ts     │  masking.ts        │  database.ts          ││
│  │  - startScan    │  - startMaskingJob │  - createConnection   ││
│  │  - fetchResults │  - streamProgress  │  - testConnection     ││
│  │                 │  - streamAuditLogs │  - fetchTables        ││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                    │                              
                    ▼                              
┌────────────────────────────────────────────────────────────────┐
│              DJANGO BACKEND (All Phases Completed)              │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │   REST API (DRF)         │  │   Authentication App     │    │
│  │   - /api/health          │  │   - /api/auth/register/  │    │
│  │   - /api/ (root)         │  │   - /api/auth/login/     │    │
│  │   - /admin/ (dev)        │  │   - /api/auth/logout/    │    │
│  └──────────────────────────┘  │   - /api/auth/me/        │    │
│  ┌──────────────────────────┐  │   - JWT token handling   │    │
│  │   Core App               │  └──────────────────────────┘    │
│  │   - Health Check View    │  ┌──────────────────────────┐    │
│  └──────────────────────────┘  │   Projects App           │    │
│  ┌──────────────────────────┐  │   - /api/projects/       │    │
│  │   SQLite (Development)   │  │   - PII Detection (P5)   │    │
│  │   - User model           │  │   - Masking Engine (P6)  │    │
│  │   - Project model        │  │   - Audit Logs (P7)      │    │
│  │   - MaskingJob model     │  │   - SSE Streaming        │    │
│  │   - MaskingLog model     │  └──────────────────────────┘    │
│  │   - Token blacklist      │                                   │
│  └──────────────────────────┘                                   │
└────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

### Backend Structure (Django - All Phases)

```
BACKEND/
├── manage.py                      # Django management script
├── requirements.txt               # Python dependencies
├── db.sqlite3                     # SQLite database (development)
│
├── backend/                       # Main Django project configuration
│   ├── __init__.py
│   ├── asgi.py                   # ASGI configuration
│   ├── wsgi.py                   # WSGI configuration
│   ├── urls.py                   # Root URL configuration
│   │                              # - /api/ (API root)
│   │                              # - /api/health (health check)
│   │                              # - /api/auth/ (authentication)
│   │                              # - /api/projects/ (project management)
│   │                              # - /admin/ (Django admin)
│   │
│   └── settings/                  # Settings package
│       ├── __init__.py           # Loads environment settings
│       ├── base.py               # Base settings (all environments)
│       │                          # - Installed apps (DRF, CORS, JWT)
│       │                          # - REST framework config
│       │                          # - JWT authentication config
│       │                          # - Middleware stack
│       └── dev.py                # Development settings
│                                  # - DEBUG=True
│                                  # - SQLite database
│                                  # - CORS configuration
│                                  # - Logging setup
│
├── core/                          # Core application
│   ├── __init__.py
│   ├── apps.py                   # App configuration
│   ├── urls.py                   # Core URL patterns
│   │                              # - /api/health (HealthCheckView)
│   └── views.py                  # API views
│                                  # - HealthCheckView (GET /api/health)
│
├── authentication/                # Authentication application (Phase 2)
│   ├── __init__.py
│   ├── apps.py                   # App configuration
│   ├── serializers.py            # DRF serializers
│   │                              # - RegisterSerializer
│   │                              # - LoginSerializer
│   │                              # - UserSerializer
│   ├── urls.py                   # Authentication URL patterns
│   │                              # - /register/ (RegisterView)
│   │                              # - /login/ (LoginView)
│   │                              # - /logout/ (LogoutView)
│   │                              # - /me/ (MeView)
│   │                              # - /token/refresh/ (TokenRefreshView)
│   └── views.py                  # Authentication views
│                                  # - RegisterView (POST /api/auth/register/)
│                                  # - LoginView (POST /api/auth/login/)
│                                  # - LogoutView (POST /api/auth/logout/)
│                                  # - MeView (GET /api/auth/me/)
│
└── projects/                      # Project Management application (Phase 3 & 4)
    ├── __init__.py
    ├── apps.py                   # App configuration
    ├── models.py                 # Django models
    │                              # - Project (UUID pk, name, owner, description)
    │                              # - UserProjectPreference (active project)
    │                              # - DatabaseConnection (Phase 4 - simulated)
    ├── serializers.py            # DRF serializers
    │                              # - ProjectSerializer
    │                              # - ProjectCreateSerializer
    │                              # - ActiveProjectSerializer
    │                              # - DatabaseConnectionSerializer (Phase 4)
    │                              # - DatabaseConnectionCreateSerializer (Phase 4)
    │                              # - DetectedPIIFieldSerializer (Phase 5)
    │                              # - MaskingJobSerializer (Phase 6)
    │                              # - MaskingFieldSerializer (Phase 6)
    │                              # - MaskingLogSerializer (Phase 6)
    │                              # - AuditLogSerializer (Phase 7)
    ├── urls.py                   # Project URL patterns
    │                              # - / (list, create)
    │                              # - /{id}/ (detail)
    │                              # - /{id}/select/ (select active)
    │                              # - /{id}/delete/ (delete)
    │                              # - /active/ (get active)
    │                              # - /{id}/db-connections/ (Phase 4)
    │                              # - /{id}/db-connections/{conn_id}/test/ (Phase 4)
    │                              # - /{id}/db-connections/{conn_id}/tables/ (Phase 4)
    │                              # - /{id}/scan/start/ (Phase 5)
    │                              # - /{id}/scan/results/ (Phase 5)
    │                              # - /{id}/masking/ (Phase 6)
    │                              # - /{id}/masking/start/ (Phase 6)
    │                              # - /{id}/masking/{job_id}/ (Phase 6)
    │                              # - /{id}/masking/{job_id}/stream/ (Phase 6 - SSE)
    │                              # - /{id}/masking/{job_id}/results/ (Phase 6)
    │                              # - /{id}/masking/preview/ (Phase 6)
    │                              # - /{id}/masking/{job_id}/logs/ (Phase 7)
    │                              # - /{id}/masking/{job_id}/logs/stream/ (Phase 7 - SSE)
    ├── pii_detector.py           # Rule-based PII detection (Phase 5)
    │                              # - detect_pii_from_sample_data()
    │                              # - detect_pii_in_value()
    │                              # - get_simulated_table_metadata()
    ├── db_connectors.py          # Database connector utilities
    │                              # - test_connection()
    │                              # - fetch_tables_metadata()
    │                              # - fetch_table_data()
    └── views.py                  # Project API views
                                   # - ProjectListCreateView
                                   # - ProjectDetailView
                                   # - ProjectSelectView
                                   # - ProjectDeleteView
                                   # - ActiveProjectView
                                   # - DatabaseConnectionCreateView (Phase 4)
                                   # - DatabaseConnectionTestView (Phase 4)
                                   # - DatabaseConnectionTablesView (Phase 4)
                                   # - StartScanView (Phase 5)
                                   # - ScanResultsView (Phase 5)
                                   # - MaskingJobListView (Phase 6)
                                   # - MaskingJobDetailView (Phase 6)
                                   # - StartMaskingJobView (Phase 6)
                                   # - MaskingJobStreamView (Phase 6 - SSE)
                                   # - MaskingJobResultsView (Phase 6)
                                   # - PreviewMaskingView (Phase 6)
                                   # - AuditLogsView (Phase 7)
                                   # - AuditLogsStreamView (Phase 7 - SSE)
```

### Frontend Structure (React + Vite)

```
src/
├── components/                    # UI Components
│   ├── dashboard/                 # Dashboard widgets
│   │   ├── StatCard.tsx          # Metric display card
│   │   ├── PIIDistributionChart.tsx  # PII type breakdown chart
│   │   └── MaskingMethodsChart.tsx   # Technique distribution chart
│   │
│   ├── database/                  # Database connection UI
│   │   └── DatabaseConnection.tsx # Connection form component
│   │
│   ├── layout/                    # App layout components
│   │   ├── Layout.tsx            # Main wrapper with sidebar
│   │   ├── Header.tsx            # Top navigation bar
│   │   └── Sidebar.tsx           # Navigation sidebar
│   │
│   ├── masking/                   # Masking & anonymization
│   │   ├── MaskingWizard.tsx     # 3-step protection wizard
│   │   ├── MaskingProgress.tsx   # Real-time job progress (Phase 6)
│   │   ├── ExecutionConsole.tsx  # Audit log console (Phase 7)
│   │   ├── FieldSimulation.tsx   # Per-field simulation card
│   │   ├── ExecutionLog.tsx      # Audit-style execution log
│   │   ├── ProcessingVisualization.tsx  # Parallel processing view
│   │   └── DataPreview.tsx       # Data preview component
│   │
│   ├── project/                   # Project management
│   │   ├── ProjectList.tsx       # Project listing
│   │   └── NewProjectDialog.tsx  # Create project modal
│   │
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx, card.tsx, dialog.tsx, etc.
│   │   └── (40+ UI primitive components)
│   │
│   ├── upload/                    # File upload components
│   │   └── FileUpload.tsx        # File upload handler
│   │
│   ├── wizard/                    # Onboarding wizard
│   │   └── StartupWizard.tsx     # First-time user wizard
│   │
│   ├── NavLink.tsx               # Navigation link component
│   └── ProtectedRoute.tsx        # Route protection wrapper (Phase 2)
│
├── api/                           # Backend API integration
│   ├── client.ts                 # API client utilities
│   │                              # - getApiUrl(), apiGet(), apiPost()
│   │                              # - checkBackendHealth()
│   │                              # - BackendStatus interface
│   ├── auth.ts                   # Authentication API (Phase 2)
│   │                              # - login(), logout(), register()
│   │                              # - getCurrentUser()
│   │                              # - Token management
│   ├── projects.ts               # Projects API (Phase 3)
│   │                              # - fetchProjects(), createProject()
│   │                              # - selectProject(), deleteProject()
│   │                              # - getActiveProject()
│   ├── database.ts               # Database Connection API (Phase 4)
│   │                              # - createDbConnection()
│   │                              # - testDbConnection()
│   │                              # - fetchDbTables()
│   │                              # - parseDatabaseError()
│   ├── piiScan.ts                # PII Detection API (Phase 5)
│   │                              # - startPiiScan()
│   │                              # - fetchScanResults()
│   │                              # - aggregatePIIDistribution()
│   │                              # - parseScanError()
│   ├── masking.ts                # Masking & Audit Logs API (Phase 6 & 7)
│   │                              # - startMaskingJob()
│   │                              # - streamMaskingProgress()
│   │                              # - getMaskingJobResults()
│   │                              # - previewMasking()
│   │                              # - fetchAuditLogs()
│   │                              # - streamAuditLogs()
│   └── index.ts                  # API exports
│
├── contexts/                      # React Context providers
│   ├── AuthContext.tsx           # Authentication state (Phase 2)
│   │                              # - user, loading, isAuthenticated
│   │                              # - login(), logout(), register()
│   ├── ProjectContext.tsx        # Project state (Phase 3)
│   │                              # - currentProject, projects, isLoading
│   │                              # - createProject(), selectProject()
│   │                              # - deleteProject(), loadProjects()
│   ├── SearchContext.tsx         # Global search state
│   └── BackendStatusContext.tsx  # Backend connection status (Phase 1)
│
├── hooks/                         # Custom React hooks
│   ├── use-mobile.tsx            # Mobile detection hook
│   ├── use-toast.ts              # Toast notification hook
│   └── use-backend-status.ts     # Backend health check hook (Phase 1)
│
├── integrations/                  # External service integrations
│   └── supabase/                 # (Legacy - not used for auth)
│       ├── client.ts             # Supabase client
│       └── types.ts              # Database types
│
├── lib/                           # Utility functions
│   └── utils.ts                  # cn() and helper functions
│
├── pages/                         # Route pages
│   ├── Index.tsx                 # Dashboard & project selection
│   ├── AuthPage.tsx              # Login/signup (Django auth - Phase 2)
│   ├── DatabasePage.tsx          # Database connection
│   ├── DetectionPage.tsx         # PII scanning
│   ├── MaskingPage.tsx           # Masking wizard
│   ├── UploadPage.tsx            # File upload
│   ├── SettingsPage.tsx          # User settings
│   └── NotFound.tsx              # 404 page
│
├── test/                          # Test configuration
│   ├── setup.ts                  # Test setup
│   └── example.test.ts           # Example test
│
├── App.tsx                        # Root component with routing
├── App.css                        # Global styles
├── index.css                      # Tailwind imports & CSS variables
├── main.tsx                       # Application entry point
└── vite-env.d.ts                 # Vite environment types
```

---

## Features

### 1. Authentication System

**Location:** `src/pages/AuthPage.tsx`

| Feature | Description |
|---------|-------------|
| Email/Password Auth | Standard authentication via Supabase Auth |
| Session Management | Automatic session persistence |
| Protected Routes | Auth guards on all routes |
| Onboarding Wizard | First-time user guidance |

**Flow:**
```
Sign Up → Email Verification → First Login → Startup Wizard → Dashboard
```

### 2. Project Management

**Location:** `src/pages/Index.tsx`, `src/components/project/`

| Feature | Description |
|---------|-------------|
| Multi-Project Support | Create and manage multiple projects |
| Data Isolation | Per-project data separation |
| Project Context | Global state for current project |

### 3. Database Connection

**Location:** `src/pages/DatabasePage.tsx`, `src/components/database/`

**Supported Databases:**
- PostgreSQL
- MySQL
- Microsoft SQL Server
- Oracle
- MongoDB

**Connection Flow:**
```
Select DB Type → Enter Credentials → Test Connection → Save & Continue
```

### 4. PII Detection

**Location:** `src/pages/DetectionPage.tsx`

**Detectable PII Types:**

| Type | Example Field Names |
|------|---------------------|
| Email | email, user_email, contact_email |
| Phone | phone, phone_number, mobile, contact_number |
| SSN | ssn, social_security_number, tax_id |
| Credit Card | credit_card, card_number, payment_card |
| Address | address, street_address, home_address |
| Name | name, full_name, first_name, last_name |
| Aadhaar | aadhaar, aadhaar_number, uid |
| PAN | pan, pan_number, pan_card |

**Detection Logic:**
```typescript
// Pattern-based detection with confidence scoring
detected.push({
  id: `field-${idCounter++}`,
  field_name: fields[i],
  field_type: type,
  confidence: Math.floor(Math.random() * 15) + 85, // 85-100%
  table_name: tableName
});
```

### 5. Data Masking & Anonymization

**Location:** `src/pages/MaskingPage.tsx`, `src/components/masking/`

#### Protection Methods

| Method | Type | Description |
|--------|------|-------------|
| Data Masking | Reversible | Can be unmasked with proper authorization |
| Anonymization | Irreversible | Permanent transformation |

#### Masking Techniques

| Technique | Code | Description |
|-----------|------|-------------|
| Partial Masking | PARTIAL-MASK-256 | e.g., `john***@email.com` |
| Tokenization | TOKEN-VAULT-AES256 | UUID replacement |
| Hashing | SHA256-HASH-512 | SHA-256 hash |
| Full Redaction | FULL-REDACT-512 | Complete removal |

#### Anonymization Techniques

| Technique | Code | Description |
|-----------|------|-------------|
| Generalization | K-ANON-GENERAL-512 | date → year |
| Suppression | SUPPRESS-REDACT-128 | Replace with NULL/[REDACTED] |
| Noise Addition | DIFFERENTIAL-PRIVACY-256 | Differential privacy |
| Pseudonymization | PSEUDO-HASH-SHA256 | Consistent replacement |

#### Configurable Parameters

| Parameter | Options |
|-----------|---------|
| Masking Characters | *, #, X, • |
| Token Formats | UUID, Alphanumeric, Numeric, Prefixed |
| Generalization Levels | Low, Medium, High |
| Suppression Behaviors | NULL, Empty, [REDACTED] |

### 6. Enterprise Simulation Engine

**Location:** `src/components/masking/FieldSimulation.tsx`, `ExecutionLog.tsx`

#### 5-Phase Execution Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     SIMULATION LIFECYCLE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 1: ANALYSIS                      Progress: ████████░░ 80% │
│  ├── Field registration initiated                                │
│  ├── PII sensitivity classification                              │
│  └── Sensitivity level: [Low/Medium/High]                        │
│                                                                  │
│  PHASE 2: STRATEGY                      Progress: ████████░░ 80% │
│  ├── Protection policy lookup                                    │
│  ├── Policy matched: MASK-POLICY-ENT-2024                        │
│  └── Technique selected: [Technique Name]                        │
│                                                                  │
│  PHASE 3: EXECUTION                     Progress: ██████░░░░ 60% │
│  ├── Algorithm parameters initialized                            │
│  ├── Secure execution environment verified                       │
│  └── Algorithm execution in progress                             │
│                                                                  │
│  PHASE 4: CONFIRMATION                  Progress: ████░░░░░░ 40% │
│  ├── Transformation applied                                      │
│  ├── Data integrity verified                                     │
│  └── Field locked with protection layer                          │
│                                                                  │
│  PHASE 5: VALIDATION                    Progress: ██░░░░░░░░ 20% │
│  ├── Re-identification risk: Reduced                             │
│  ├── Compliance verification: GDPR, CCPA, HIPAA                  │
│  └── Field protection finalized                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Per-Field Independent Processing

- Each field runs its own simulation instance
- Parallel execution with independent progress tracking
- Individual completion callbacks
- No shared state between field simulations

#### Line-by-Line Execution Log

Each field has a collapsible audit log with 28 timestamped entries:

```
14:32:15.234 ● [ANALYS] Field registration initiated: email
14:32:15.456 ◐ [ANALYS] PII sensitivity classification started
14:32:15.678 ◐ [ANALYS] Scanning field metadata and data patterns
14:32:15.901 ● [ANALYS] Sensitivity level resolved: Classified
14:32:16.123 ○ [STRATE] Protection policy lookup initiated
...
14:32:22.567 ● [VALIDA] Field protection finalized: email
```

### 7. Data Export

**Location:** `src/components/masking/MaskingWizard.tsx` (handleExport function)

| Format | MIME Type | Library |
|--------|-----------|---------|
| CSV | text/csv | Native |
| JSON | application/json | Native |
| Excel | application/xlsx | xlsx |

### 8. Dashboard Analytics

**Location:** `src/pages/Index.tsx`, `src/components/dashboard/`

| Widget | Component | Data |
|--------|-----------|------|
| Total Scans | StatCard | Count from scanStats |
| PII Fields Found | StatCard | Count from detectedFields |
| Data Masked | StatCard | Count of protected fields |
| Tables Scanned | StatCard | Count from scanStats |
| PII Distribution | PIIDistributionChart | Bar chart by type |
| Masking Methods | MaskingMethodsChart | Pie chart by technique |

---

## Components Reference

### Layout Components

#### Layout (`src/components/layout/Layout.tsx`)

Main application wrapper that includes Header and Sidebar.

```tsx
<Layout>
  {children} // Page content
</Layout>
```

#### Header (`src/components/layout/Header.tsx`)

Top navigation bar with:
- Logo
- Search functionality
- User menu
- Theme toggle

#### Sidebar (`src/components/layout/Sidebar.tsx`)

Navigation sidebar with links to:
- Dashboard (/)
- Database (/database)
- Upload (/upload)
- Detection (/detection)
- Masking (/masking)
- Settings (/settings)

### Masking Components

#### MaskingWizard (`src/components/masking/MaskingWizard.tsx`)

**Props:** None (uses ProjectContext)

**State:**
```typescript
currentStep: WizardStep (1 | 2 | 3)
selectedFields: SelectedField[]
currentFieldIndex: number
isProcessing: boolean
isComplete: boolean
processingFields: ProcessingField[]
```

**Steps:**
1. Select Fields - Choose PII fields to protect
2. Configure Protection - Per-field method/technique selection
3. Protect Data - Execute simulation and export

#### FieldSimulation (`src/components/masking/FieldSimulation.tsx`)

**Props:**
```typescript
interface FieldSimulationProps {
  fieldName: string;
  method: "masking" | "anonymization" | "";
  technique: string;
  isActive: boolean;
  onComplete: () => void;
}
```

**Phases:** analysis → strategy → execution → confirmation → validation

#### ExecutionLog (`src/components/masking/ExecutionLog.tsx`)

**Props:**
```typescript
interface ExecutionLogProps {
  fieldName: string;
  method: "masking" | "anonymization" | "";
  technique: string;
  currentPhase: string;
  phaseProgress: Record<string, number>;
  isActive: boolean;
  isCompleted: boolean;
}
```

**Features:**
- Collapsible log panel
- Auto-scroll to bottom
- Timestamped entries
- Status indicators (○ ◐ ●)
- Phase categorization

#### ProcessingVisualization (`src/components/masking/ProcessingVisualization.tsx`)

**Props:**
```typescript
interface ProcessingVisualizationProps {
  currentFieldIndex: number;
  totalFields: number;
  isProcessing: boolean;
  currentFieldName?: string;
  currentMethod?: "masking" | "anonymization" | "";
  currentTechnique?: string;
  allFields?: FieldConfig[];
  onAllFieldsComplete?: () => void;
  onFieldComplete?: (fieldId: string) => void;
}
```

**Responsibilities:**
- Render multiple FieldSimulation components
- Track completion state per field
- Calculate overall progress
- Notify parent when all complete

### Dashboard Components

#### StatCard (`src/components/dashboard/StatCard.tsx`)

**Props:**
```typescript
interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
}
```

#### PIIDistributionChart (`src/components/dashboard/PIIDistributionChart.tsx`)

Bar chart showing PII types distribution using Recharts.

#### MaskingMethodsChart (`src/components/dashboard/MaskingMethodsChart.tsx`)

Pie chart showing masking technique distribution using Recharts.

---

## Pages Reference

| Route | Page Component | Description |
|-------|----------------|-------------|
| `/` | Index | Dashboard & project selection |
| `/auth` | AuthPage | Login/signup forms |
| `/database` | DatabasePage | Database connection UI |
| `/upload` | UploadPage | File upload interface |
| `/detection` | DetectionPage | PII scanning |
| `/masking` | MaskingPage | Protection wizard |
| `/settings` | SettingsPage | User preferences |
| `*` | NotFound | 404 page |

---

## Workflows

### 1. Complete Data Protection Workflow

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│  Login /   │ -> │  Create    │ -> │  Connect   │ -> │   Detect   │ -> │  Configure │
│  Signup    │    │  Project   │    │  Database  │    │    PII     │    │ Protection │
└────────────┘    └────────────┘    └────────────┘    └────────────┘    └────────────┘
     /auth             /                /database        /detection        /masking
                                                                              │
                                                                              ▼
                                                                       ┌────────────┐
                                                                       │  Execute   │
                                                                       │ Protection │
                                                                       └────────────┘
                                                                              │
                                                                              ▼
                                                                       ┌────────────┐
                                                                       │   Export   │
                                                                       │   Results  │
                                                                       └────────────┘
```

### 2. Masking Wizard Flow (Step-by-Step)

**Step 1: Select Fields**
```
┌─────────────────────────────────────────────────────────────────┐
│  SELECT PII FIELDS TO PROTECT                                    │
├─────────────────────────────────────────────────────────────────┤
│  ☑ email         [Email]      customers     95% confidence      │
│  ☑ phone         [Phone]      customers     92% confidence      │
│  ☐ address       [Address]    customers     88% confidence      │
│  ☑ credit_card   [Credit]     payments      97% confidence      │
│                                                                  │
│  [Select All] [Deselect All]              3 selected            │
│                                                                  │
│                                            [Next →]              │
└─────────────────────────────────────────────────────────────────┘
```

**Step 2: Configure Protection (Per Field)**
```
┌─────────────────────────────────────────────────────────────────┐
│  CONFIGURE PROTECTION - Field 1 of 3                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Field: email                                                    │
│  Table: customers                                                │
│                                                                  │
│  1. Select Protection Method                                     │
│     [● Data Masking] [○ Anonymization]                          │
│                                                                  │
│  2. Select Technique                                             │
│     [Partial Masking ▼]                                         │
│                                                                  │
│  3. Configure Parameters                                         │
│     Masking Character: [* ▼]                                    │
│                                                                  │
│  [← Previous Field]                    [Next Field →]            │
└─────────────────────────────────────────────────────────────────┘
```

**Step 3: Execute Protection**
```
┌─────────────────────────────────────────────────────────────────┐
│  PROTECT YOUR DATA                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Processing 3 fields in parallel                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ email - Partial Masking                    ████████░░ 80%   ││
│  │ Analysis ● Strategy ● Execution ◐ Confirm ○ Validate ○      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ phone - Tokenization                       ██████░░░░ 60%   ││
│  │ Analysis ● Strategy ● Execution ○ Confirm ○ Validate ○      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ credit_card - Suppression                  ████░░░░░░ 40%   ││
│  │ Analysis ● Strategy ○ Execution ○ Confirm ○ Validate ○      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Overall Progress: ████████░░░░░░░░░░░░ 60%                     │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Simulation Timing & Lifecycle Control

The simulation uses a callback-based completion system:

```typescript
// In ProcessingVisualization.tsx
const handleFieldComplete = useCallback((fieldId: string) => {
  setCompletedFields(prev => new Set([...prev, fieldId]));
  if (onFieldComplete) {
    onFieldComplete(fieldId);
  }
}, [onFieldComplete]);

// Check if all fields are complete
useEffect(() => {
  if (allFields.length > 0 && completedFields.size === allFields.length) {
    setIsAllComplete(true);
    if (onAllFieldsComplete) {
      onAllFieldsComplete();
    }
  }
}, [completedFields, allFields.length, onAllFieldsComplete]);
```

**Critical Timing Rules:**
1. Simulation view remains visible until ALL fields complete ALL phases
2. Completion screen appears ONLY after every field reaches "Complete"
3. Each field progresses independently with its own timing
4. Global progress = (completedFields.size / totalFields) * 100

---

## State Management

### ProjectContext (`src/contexts/ProjectContext.tsx`)

Global state for project and detection data.

```typescript
interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projects: Project[];
  loadProjects: () => Promise<void>;
  isLoading: boolean;
  detectedFields: DetectedField[];
  setDetectedFields: (fields: DetectedField[]) => void;
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  scanStats: ScanStats;
  setScanStats: (stats: ScanStats) => void;
}
```

**Usage:**
```typescript
import { useProject } from "@/contexts/ProjectContext";

const { currentProject, detectedFields, isConnected } = useProject();
```

### SearchContext (`src/contexts/SearchContext.tsx`)

Global search functionality.

```typescript
interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}
```

**Usage:**
```typescript
import { useSearch } from "@/contexts/SearchContext";

const { searchQuery, setSearchQuery } = useSearch();
```

### BackendStatusContext (`src/contexts/BackendStatusContext.tsx`) - Phase 1

Manages Django backend connection status across the application.

```typescript
interface BackendStatusContextType {
  /** Whether the backend is currently connected */
  isConnected: boolean;
  /** Whether a health check is in progress */
  isChecking: boolean;
  /** Full backend status object */
  status: BackendStatus | null;
  /** Function to manually recheck the connection */
  recheckConnection: () => Promise<void>;
}

interface BackendStatus {
  connected: boolean;
  message: string;
  environment?: string;
  timestamp: Date;
}
```

**Usage:**
```typescript
import { useBackendStatusContext } from "@/contexts/BackendStatusContext";

const { isConnected, isChecking, status, recheckConnection } = useBackendStatusContext();

// Check if backend is available
if (!isConnected) {
  console.log('Backend is offline');
}

// Manually recheck connection
await recheckConnection();
```

**Provider Setup (in App.tsx):**
```tsx
import { BackendStatusProvider } from "@/contexts/BackendStatusContext";

function App() {
  return (
    <BackendStatusProvider>
      {/* App components */}
    </BackendStatusProvider>
  );
}
```

---

## Database Schema

### Entity Relationship Diagram (Django Models)

```
┌─────────────────┐       ┌─────────────────────┐
│     Project     │       │  DatabaseConnection │
├─────────────────┤       ├─────────────────────┤
│ id (PK, UUID)   │◄──────│ project_id (FK)     │
│ owner_id (FK)   │       │ id (PK)             │
│ name            │       │ db_type             │
│ description     │       │ host                │
│ created_at      │       │ port                │
│ updated_at      │       │ database_name       │
└─────────────────┘       │ username            │
        │                 │ password            │
        │                 │ status              │
        │                 │ created_at          │
        │                 └─────────────────────┘
        │
        │         ┌─────────────────────┐
        ├────────►│  DetectedPIIField   │
        │         ├─────────────────────┤
        │         │ id (PK)             │
        │         │ project_id (FK)     │
        │         │ table_name          │
        │         │ field_name          │
        │         │ pii_type            │
        │         │ confidence          │
        │         │ created_at          │
        │         └─────────────────────┘
        │
        │         ┌─────────────────┐       ┌─────────────────┐
        ├────────►│   MaskingJob    │◄──────│  MaskingField   │
        │         ├─────────────────┤       ├─────────────────┤
        │         │ id (PK, UUID)   │       │ id (PK)         │
        │         │ project_id (FK) │       │ job_id (FK)     │
        │         │ database_name   │       │ detected_field  │
        │         │ table_name      │       │ table_name      │
        │         │ status          │       │ column_name     │
        │         │ total_fields    │       │ pii_type        │
        │         │ processed_fields│       │ masking_strategy│
        │         │ created_at      │       │ original_sample │
        │         │ started_at      │       │ masked_sample   │
        │         │ completed_at    │       │ status          │
        │         └─────────────────┘       │ processed_at    │
        │                 │                 └─────────────────┘
        │                 │
        │                 │         ┌─────────────────┐
        │                 └────────►│   MaskingLog    │
        │                           ├─────────────────┤
        │                           │ id (PK)         │
        │                           │ job_id (FK)     │
        │                           │ action          │
        │                           │ step            │
        │                           │ message         │
        │                           │ level           │
        │                           │ status          │
        │                           │ field_name      │
        │                           │ created_at      │
        │                           └─────────────────┘
        │
        │         ┌───────────────────────┐
        └────────►│ UserProjectPreference │
                  ├───────────────────────┤
                  │ id (PK)               │
                  │ user_id (FK, unique)  │
                  │ active_project (FK)   │
                  │ updated_at            │
                  └───────────────────────┘
```

### Table Details

#### `projects`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | No | gen_random_uuid() |
| user_id | UUID | No | - |
| name | TEXT | No | - |
| created_at | TIMESTAMPTZ | No | now() |
| updated_at | TIMESTAMPTZ | No | now() |

**RLS Policies:**
- Users can view their own projects (SELECT)
- Users can create their own projects (INSERT)
- Users can update their own projects (UPDATE)
- Users can delete their own projects (DELETE)

#### `database_connections` (Phase 4 - Django)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | INTEGER | No | Auto-increment |
| project_id | UUID (FK) | No | - |
| db_type | VARCHAR(20) | No | - |
| host | VARCHAR(255) | No | - |
| status | VARCHAR(20) | No | 'failed' |
| created_at | DATETIME | No | auto_now_add |

**Choices:**
- `db_type`: 'postgres', 'mysql', 'mongodb', 'sqlite'
- `status`: 'connected', 'failed'

**Note:** This is the actual Django model implemented in Phase 4. The table is for simulated connections only - no real database connections are made.

#### `detected_pii_fields` (Phase 5 - Django)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | INTEGER | No | Auto-increment |
| project_id | UUID (FK) | No | - |
| table_name | VARCHAR(255) | No | - |
| field_name | VARCHAR(255) | No | - |
| pii_type | VARCHAR(50) | No | - |
| confidence | FLOAT | No | - |
| created_at | DATETIME | No | auto_now_add |

**Choices:**
- `pii_type`: 'email', 'phone', 'card', 'ssn', 'name', 'address', 'aadhaar', 'pan', 'other'

#### `masking_jobs` (Phase 6 - Django)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | No | uuid4() |
| project_id | UUID (FK) | No | - |
| database_name | VARCHAR(255) | Yes | '' |
| table_name | VARCHAR(255) | Yes | null |
| status | VARCHAR(20) | No | 'pending' |
| total_fields | INTEGER | No | 0 |
| processed_fields | INTEGER | No | 0 |
| created_at | DATETIME | No | auto_now_add |
| started_at | DATETIME | Yes | null |
| completed_at | DATETIME | Yes | null |

**Choices:**
- `status`: 'pending', 'running', 'completed', 'failed'

#### `masking_fields` (Phase 6 - Django)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | INTEGER | No | Auto-increment |
| job_id | UUID (FK) | No | - |
| detected_field_id | INTEGER (FK) | Yes | null |
| table_name | VARCHAR(255) | No | - |
| column_name | VARCHAR(255) | No | - |
| pii_type | VARCHAR(50) | No | - |
| masking_strategy | VARCHAR(50) | No | 'generic_mask' |
| original_sample | TEXT | Yes | '' |
| masked_sample | TEXT | Yes | '' |
| status | VARCHAR(20) | No | 'pending' |
| processed_at | DATETIME | Yes | null |

**Choices:**
- `masking_strategy`: 'email_mask', 'phone_mask', 'name_mask', 'address_mask', 'account_mask', 'card_mask', 'ssn_mask', 'aadhaar_mask', 'pan_mask', 'generic_mask'
- `status`: 'pending', 'processing', 'completed', 'failed'

#### `masking_logs` (Phase 6 & 7 - Django)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | INTEGER | No | Auto-increment |
| job_id | UUID (FK) | No | - |
| action | VARCHAR(50) | No | 'job_started' |
| step | VARCHAR(50) | No | - |
| message | TEXT | No | - |
| level | VARCHAR(20) | No | 'info' |
| status | VARCHAR(20) | No | 'processing' |
| field_name | VARCHAR(255) | Yes | null |
| created_at | DATETIME | No | auto_now_add |

**Choices:**
- `action`: 'job_started', 'analysis_started', 'analysis_completed', 'strategy_selected', 'masking_started', 'masking_completed', 'validation_started', 'validation_completed', 'job_completed', 'job_failed'
- `step`: 'analysis', 'strategy_selection', 'masking', 'validation', 'completed'
- `level`: 'info', 'warning', 'error', 'success'
- `status`: 'started', 'processing', 'completed', 'error'

#### `pii_scans`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | No | gen_random_uuid() |
| project_id | UUID | No | - |
| user_id | UUID | No | - |
| table_id | UUID | Yes | - |
| scan_status | TEXT | No | 'pending' |
| started_at | TIMESTAMPTZ | Yes | - |
| completed_at | TIMESTAMPTZ | Yes | - |
| total_fields_scanned | INTEGER | Yes | 0 |
| pii_fields_found | INTEGER | Yes | 0 |

#### `detected_pii_fields`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | No | gen_random_uuid() |
| scan_id | UUID | No | - |
| project_id | UUID | No | - |
| user_id | UUID | No | - |
| field_name | TEXT | No | - |
| field_type | TEXT | No | - |
| table_name | TEXT | Yes | - |
| confidence | INTEGER | Yes | 0 |

#### `masking_history`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | No | gen_random_uuid() |
| project_id | UUID | No | - |
| user_id | UUID | No | - |
| protection_method | TEXT | No | - |
| technique | TEXT | No | - |
| fields_masked | JSONB | No | '[]' |
| records_processed | INTEGER | Yes | 0 |
| status | TEXT | No | 'completed' |
| created_at | TIMESTAMPTZ | No | now() |

---

## Security & Compliance

### Data Protection Principles

1. **No Data Exposure** - Original, masked, or anonymized values are never displayed in UI
2. **Metadata-Only Processing** - UI shows only field names and status
3. **Audit Trail** - All operations logged with timestamps
4. **RLS Enforcement** - Row-level security on all database tables
5. **User Isolation** - Data scoped to authenticated user only

### Supported Compliance Standards

| Standard | Description |
|----------|-------------|
| GDPR | General Data Protection Regulation (EU) |
| CCPA | California Consumer Privacy Act |
| HIPAA | Health Insurance Portability and Accountability Act |
| SOC 2 | Service Organization Control |
| ISO 27001 | Information Security Management |

### Algorithm Reference

| Algorithm Code | Type | Description |
|----------------|------|-------------|
| PARTIAL-MASK-256 | Masking | Partial character masking |
| FULL-REDACT-512 | Masking | Complete redaction |
| CHAR-SUBSTITUTE-128 | Masking | Character substitution |
| PATTERN-PRESERVE-384 | Masking | Pattern-preserving mask |
| TOKEN-VAULT-AES256 | Both | AES-256 tokenization |
| SHA256-HASH-512 | Masking | SHA-256 hashing |
| K-ANON-GENERAL-512 | Anonymization | K-anonymity generalization |
| PSEUDO-HASH-SHA256 | Anonymization | Pseudonymization |
| SUPPRESS-REDACT-128 | Anonymization | Value suppression |
| DIFFERENTIAL-PRIVACY-256 | Anonymization | Noise addition |

---

## API Reference

### Django Backend API (Phase 1, 2, 3 & 4)

#### Base URL Configuration

```typescript
// Frontend: src/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Environment variable (.env)
VITE_API_BASE_URL=http://127.0.0.1:8000
```

#### Core Endpoints (Phase 1)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/` | API root - returns available endpoints | No |
| GET | `/api/health` | Health check - verify backend status | No |
| GET | `/admin/` | Django admin interface (dev only) | Yes (superuser) |

#### Authentication Endpoints (Phase 2)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register/` | User registration | No |
| POST | `/api/auth/login/` | User login (returns JWT tokens) | No |
| POST | `/api/auth/logout/` | User logout (blacklists token) | Yes |
| GET | `/api/auth/me/` | Get current user details | Yes |
| POST | `/api/auth/token/refresh/` | Refresh access token | No |

#### Project Management Endpoints (Phase 3)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/projects/` | List user's projects | Yes |
| POST | `/api/projects/` | Create a new project | Yes |
| GET | `/api/projects/{id}/` | Get project details | Yes |
| POST | `/api/projects/{id}/select/` | Set project as active | Yes |
| DELETE | `/api/projects/{id}/delete/` | Delete a project | Yes |
| GET | `/api/projects/active/` | Get active project | Yes |

#### Database Connection Endpoints (Phase 4 - Safe Mode)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/projects/{id}/db-connections/` | Save database connection | Yes |
| POST | `/api/projects/{id}/db-connections/{conn_id}/test/` | Test connection (simulated) | Yes |
| GET | `/api/projects/{id}/db-connections/{conn_id}/tables/` | Fetch tables (simulated) | Yes |

**Note:** Phase 4 endpoints do NOT connect to real databases. All responses are simulated for academic/demo purposes.

---

### Authentication API Details (Phase 2)

#### Register User

**Request:**
```http
POST /api/auth/register/ HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "newuser",
    "email": "user@example.com"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "username": ["A user with that username already exists."],
  "email": ["This email is already registered."]
}
```

#### User Login

**Request:**
```http
POST /api/auth/login/ HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "username_or_email": "newuser",  // Can be username OR email
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "newuser",
    "email": "user@example.com",
    "first_name": "",
    "last_name": "",
    "date_joined": "2026-02-01T10:30:00Z"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

#### User Logout

**Request:**
```http
POST /api/auth/logout/ HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

#### Get Current User

**Request:**
```http
GET /api/auth/me/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "username": "newuser",
    "email": "user@example.com",
    "first_name": "",
    "last_name": "",
    "date_joined": "2026-02-01T10:30:00Z"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

#### Refresh Token

**Request:**
```http
POST /api/auth/token/refresh/ HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

### Frontend Authentication API (Phase 2)

```typescript
import { login, logout, register, getCurrentUser } from '@/api/auth';

// Login
const { user, tokens } = await login('username', 'password');

// Register
const { user } = await register('username', 'email@example.com', 'password');

// Logout
await logout();

// Get current user
const user = await getCurrentUser();
```

---

### Project Management API Details (Phase 3)

#### List Projects

**Request:**
```http
GET /api/projects/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response (200 OK):**
```json
{
  "projects": [
    {
      "id": "2c953fa4-1234-5678-90ab-cdef12345678",
      "name": "My Project",
      "description": "Project description",
      "created_at": "2026-02-01T10:30:00Z",
      "updated_at": "2026-02-01T10:30:00Z",
      "is_active": true
    }
  ],
  "count": 1
}
```

#### Create Project

**Request:**
```http
POST /api/projects/ HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

{
  "name": "New Project",
  "description": "Optional project description"
}
```

**Response (201 Created):**
```json
{
  "message": "Project created successfully",
  "project": {
    "id": "2c953fa4-1234-5678-90ab-cdef12345678",
    "name": "New Project",
    "description": "Optional project description",
    "created_at": "2026-02-01T10:30:00Z",
    "updated_at": "2026-02-01T10:30:00Z",
    "is_active": true
  }
}
```

**Note:** The first project created is automatically set as the active project.

**Error Response (400 Bad Request):**
```json
{
  "name": ["You already have a project with this name."]
}
```

#### Get Project Details

**Request:**
```http
GET /api/projects/{project_id}/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response (200 OK):**
```json
{
  "id": "2c953fa4-1234-5678-90ab-cdef12345678",
  "name": "My Project",
  "description": "Project description",
  "created_at": "2026-02-01T10:30:00Z",
  "updated_at": "2026-02-01T10:30:00Z",
  "is_active": true
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Project not found"
}
```

#### Select Active Project

**Request:**
```http
POST /api/projects/{project_id}/select/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response (200 OK):**
```json
{
  "message": "Project \"My Project\" is now active",
  "project": {
    "id": "2c953fa4-1234-5678-90ab-cdef12345678",
    "name": "My Project",
    "description": "Project description",
    "created_at": "2026-02-01T10:30:00Z",
    "updated_at": "2026-02-01T10:30:00Z",
    "is_active": true
  }
}
```

#### Delete Project

**Request:**
```http
DELETE /api/projects/{project_id}/delete/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response (200 OK):**
```json
{
  "message": "Project \"My Project\" deleted successfully"
}
```

**Note:** If the deleted project was active, another project is automatically selected as active.

#### Get Active Project

**Request:**
```http
GET /api/projects/active/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response (200 OK):**
```json
{
  "project": {
    "id": "2c953fa4-1234-5678-90ab-cdef12345678",
    "name": "My Project",
    "description": "Project description",
    "created_at": "2026-02-01T10:30:00Z",
    "updated_at": "2026-02-01T10:30:00Z",
    "is_active": true
  }
}
```

**Response (200 OK - No Active Project):**
```json
{
  "project": null
}
```

---

### Database Connection API Details (Phase 4 - Safe Mode)

**Important:** All database connections in Phase 4 are SIMULATED. The backend does NOT connect to any real databases. This is designed for academic/demo purposes.

#### Save Database Connection

**Request:**
```http
POST /api/projects/{project_id}/db-connections/ HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

{
  "db_type": "postgres",
  "host": "localhost"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "db_type": "postgres",
  "host": "localhost",
  "status": "failed",
  "created_at": "2026-02-13T10:30:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "db_type": ["Invalid database type. Must be one of: postgres, mysql, mongodb, sqlite"],
  "host": ["Host cannot be empty."]
}
```

**Error Response (403 Forbidden):**
```json
{
  "detail": "You do not have permission to access this project."
}
```

#### Test Database Connection (Simulated)

**Request:**
```http
POST /api/projects/{project_id}/db-connections/{connection_id}/test/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response (200 OK):**
```json
{
  "status": "connected",
  "message": "Connection successful (simulated)"
}
```

**Error Response (400 Bad Request - Empty Host):**
```json
{
  "status": "failed",
  "message": "Connection failed: Host is empty"
}
```

**Note:** Test connection always simulates success if the host field is non-empty. No real database connection is attempted.

#### Fetch Database Tables (Simulated)

**Request:**
```http
GET /api/projects/{project_id}/db-connections/{connection_id}/tables/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response (200 OK):**
```json
{
  "tables": [
    {"name": "users", "columns": 8},
    {"name": "orders", "columns": 5},
    {"name": "payments", "columns": 6}
  ]
}
```

**Error Response (400 Bad Request - Not Connected):**
```json
{
  "message": "Connection not established"
}
```

**Note:** Tables are only returned if the connection status is "connected". Table metadata is hardcoded sample data for demo purposes.

---

### PII Detection API Details (Phase 5)

#### Start PII Scan

**Request:**
```http
POST /api/projects/{project_id}/scan/start/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response (200 OK):**
```json
{
  "message": "PII scan completed",
  "detected_fields": 5
}
```

**Error Response (400 Bad Request - No Connection):**
```json
{
  "detail": "No database connection found. Please connect a database first."
}
```

#### Get Scan Results

**Request:**
```http
GET /api/projects/{project_id}/scan/results/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": 1,
      "project": "uuid-here",
      "table_name": "users",
      "field_name": "email",
      "pii_type": "email",
      "confidence": 0.95,
      "created_at": "2026-03-06T10:30:00Z"
    },
    {
      "id": 2,
      "project": "uuid-here",
      "table_name": "users",
      "field_name": "phone_number",
      "pii_type": "phone",
      "confidence": 0.92,
      "created_at": "2026-03-06T10:30:00Z"
    }
  ],
  "count": 2
}
```

---

### Masking & Anonymization API Details (Phase 6)

#### Start Masking Job

**Request:**
```http
POST /api/projects/{project_id}/masking/start/ HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

{
  "table_name": "users"  // Optional, null = all tables
}
```

**Response (201 Created):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Masking job started",
  "total_fields": 5,
  "stream_url": "/api/projects/{id}/masking/{job_id}/stream/"
}
```

**Error Response (400 Bad Request - No PII Fields):**
```json
{
  "detail": "No detected PII fields found. Please run a PII scan first."
}
```

#### Stream Masking Progress (SSE)

**Request:**
```http
GET /api/projects/{project_id}/masking/{job_id}/stream/?token=JWT_TOKEN HTTP/1.1
Host: localhost:8000
Accept: text/event-stream
```

**SSE Events:**
```
data: {"job_id":"uuid","step":"analysis","message":"Analyzing PII fields...","progress":10}

data: {"job_id":"uuid","step":"strategy_selection","message":"Selecting strategies...","progress":30,"strategies":[{"field":"email","pii_type":"email","strategy":"email_mask"}]}

data: {"job_id":"uuid","step":"masking","message":"Masking field: email","progress":50,"field":"email","status":"processing","original_sample":"john@email.com","masked_sample":"j***@email.com"}

data: {"job_id":"uuid","step":"masking","message":"Completed: email","progress":60,"field":"email","status":"completed"}

data: {"job_id":"uuid","step":"validation","message":"Validating results...","progress":90,"validation_passed":true}

data: {"job_id":"uuid","step":"completed","message":"Masking complete","progress":100,"results":[...]}
```

**Note:** Uses JWT token as query parameter (`?token=`) since EventSource API doesn't support custom headers.

#### Get Masking Job Results

**Request:**
```http
GET /api/projects/{project_id}/masking/{job_id}/results/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response (200 OK):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "total_fields": 3,
  "processed_fields": 3,
  "progress_percentage": 100,
  "results": [
    {
      "field": "email",
      "table": "users",
      "pii_type": "email",
      "strategy": "email_mask",
      "original_sample": "john@email.com",
      "masked_sample": "j***@email.com"
    }
  ],
  "completed_at": "2026-03-06T10:35:00Z"
}
```

#### Preview Masking

**Request:**
```http
POST /api/projects/{project_id}/masking/preview/ HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

{
  "value": "john.doe@email.com",
  "pii_type": "email"
}
```

**Response (200 OK):**
```json
{
  "original": "john.doe@email.com",
  "masked": "j***@email.com",
  "strategy": "email_mask",
  "pii_type": "email"
}
```

---

### Audit Logs API Details (Phase 7)

#### Fetch Audit Logs

**Request:**
```http
GET /api/projects/{project_id}/masking/{job_id}/logs/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response (200 OK):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "logs": [
    {
      "timestamp": "10:30:15",
      "action": "job_started",
      "field": null,
      "status": "started",
      "message": "Masking job initialized"
    },
    {
      "timestamp": "10:30:16",
      "action": "analysis_started",
      "field": null,
      "status": "processing",
      "message": "Analyzing detected PII fields"
    },
    {
      "timestamp": "10:30:18",
      "action": "masking_started",
      "field": "email",
      "status": "processing",
      "message": "Applying email_mask to email field"
    },
    {
      "timestamp": "10:30:20",
      "action": "masking_completed",
      "field": "email",
      "status": "completed",
      "message": "email field masked successfully"
    }
  ],
  "total_logs": 4
}
```

#### Stream Audit Logs (SSE)

**Request:**
```http
GET /api/projects/{project_id}/masking/{job_id}/logs/stream/?token=JWT_TOKEN HTTP/1.1
Host: localhost:8000
Accept: text/event-stream
```

**SSE Events:**
```
data: {"timestamp":"10:30:15","action":"job_started","field":null,"status":"started","message":"Masking job initialized"}

data: {"timestamp":"10:30:16","action":"analysis_started","field":null,"status":"processing","message":"Analyzing detected PII fields"}

data: {"timestamp":"10:30:20","action":"masking_completed","field":"email","status":"completed","message":"email field masked successfully"}

data: {"type":"job_status","status":"completed"}
```

**Note:** Final event has `type: "job_status"` to indicate job completion.

---

### Frontend PII Scan API (Phase 5)

```typescript
import { startPiiScan, fetchScanResults, aggregatePIIDistribution } from '@/api/piiScan';

// Start a PII scan
const { message, detected_fields } = await startPiiScan('project-uuid');

// Fetch scan results
const { results, count } = await fetchScanResults('project-uuid');

// Aggregate for charts
const distribution = aggregatePIIDistribution(results);
// Returns: [{ name: 'Email', value: 5, color: '#3b82f6' }, ...]
```

---

### Frontend Masking API (Phase 6)

```typescript
import { 
  startMaskingJob, 
  streamMaskingProgress, 
  getMaskingJobResults,
  previewMasking 
} from '@/api/masking';

// Start a masking job
const { job_id, total_fields, stream_url } = await startMaskingJob('project-uuid');

// Stream real-time progress
const cleanup = streamMaskingProgress(
  'project-uuid',
  'job-uuid',
  (event) => console.log('Progress:', event.progress, event.message),
  (event) => console.log('Completed:', event.results),
  (error) => console.error('Error:', error)
);

// Get final results
const results = await getMaskingJobResults('project-uuid', 'job-uuid');

// Preview masking
const preview = await previewMasking('project-uuid', 'john@email.com', 'email');
// Returns: { original: 'john@email.com', masked: 'j***@email.com', strategy: 'email_mask' }

// Cleanup SSE connection when done
cleanup();
```

---

### Frontend Audit Logs API (Phase 7)

```typescript
import { fetchAuditLogs, streamAuditLogs } from '@/api/masking';

// Fetch all logs for a job
const { job_id, status, logs, total_logs } = await fetchAuditLogs('project-uuid', 'job-uuid');

// Stream logs in real-time
const cleanup = streamAuditLogs(
  'project-uuid',
  'job-uuid',
  (log) => console.log(`[${log.timestamp}] ${log.action}: ${log.message}`),
  (status) => console.log('Job status:', status),
  (error) => console.error('Stream error:', error)
);

// Cleanup when done
cleanup();
```

**TypeScript Interfaces (Phase 7):**

```typescript
interface AuditLogEntry {
  timestamp: string;           // HH:MM:SS format
  action: string;              // job_started, masking_completed, etc.
  field: string | null;        // Field name if applicable
  status: 'started' | 'processing' | 'completed' | 'error';
  message: string;             // Human-readable message
}
```

---

### Frontend Projects API (Phase 3)

```typescript
import { fetchProjects, createProject, selectProject, deleteProject, getActiveProject } from '@/api/projects';

// Fetch all projects
const { projects, count } = await fetchProjects();

// Create a new project
const newProject = await createProject('Project Name', 'Description');

// Select project as active
const project = await selectProject('project-uuid');

// Delete a project
await deleteProject('project-uuid');

// Get active project
const activeProject = await getActiveProject();
```

### Frontend Database Connection API (Phase 4)

```typescript
import { createDbConnection, testDbConnection, fetchDbTables, parseDatabaseError } from '@/api/database';

// Create a database connection (saved with status='failed')
const connection = await createDbConnection('project-uuid', {
  db_type: 'postgres',  // 'postgres' | 'mysql' | 'mongodb' | 'sqlite'
  host: 'localhost'
});
// Returns: { id: 1, db_type: 'postgres', host: 'localhost', status: 'failed' }

// Test the connection (simulated success)
const testResult = await testDbConnection('project-uuid', connection.id);
// Returns: { status: 'connected', message: 'Connection successful (simulated)' }

// Fetch tables from connected database (simulated metadata)
const tablesResponse = await fetchDbTables('project-uuid', connection.id);
// Returns: { tables: [{ name: 'users', columns: 8 }, ...] }

// Error handling
try {
  await createDbConnection('project-uuid', { db_type: 'invalid', host: '' });
} catch (error) {
  const message = parseDatabaseError(error);
  console.error(message); // User-friendly error message
}
```

**TypeScript Interfaces (Phase 4):**

```typescript
type DatabaseType = 'postgres' | 'mysql' | 'mongodb' | 'sqlite';
type ConnectionStatus = 'connected' | 'failed';

interface DatabaseConnectionData {
  id: number;
  db_type: DatabaseType;
  host: string;
  status: ConnectionStatus;
  created_at?: string;
}

interface CreateDbConnectionRequest {
  db_type: DatabaseType;
  host: string;
}

interface TestConnectionResponse {
  status: ConnectionStatus;
  message: string;
}

interface TableMetadata {
  name: string;
  columns: number;
}

interface FetchTablesResponse {
  tables: TableMetadata[];
}
```

### Project Context Usage (Phase 3)

```typescript
import { useProject } from '@/contexts/ProjectContext';

function MyComponent() {
  const { 
    currentProject, 
    projects, 
    isLoading, 
    error,
    createProject,
    selectProject,
    deleteProject,
    loadProjects 
  } = useProject();
  
  // Check for active project
  if (isLoading) return <Spinner />;
  if (!currentProject) return <SelectProjectPrompt />;
  
  // Access project data
  console.log(currentProject.name, currentProject.id);
  
  // Create/select/delete projects
  await createProject('New Project', 'Description');
  await selectProject('project-uuid');
  await deleteProject('project-uuid');
}
```

### Auth Context Usage (Phase 2)

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, isAuthenticated, login, logout, register } = useAuth();
  
  // Check authentication
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/auth" />;
  
  // Access user data
  console.log(user?.username, user?.email);
  
  // Login/logout
  await login(username, password);
  await logout();
}
```

### Protected Routes (Phase 2)

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

// In App.tsx routes
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

---

### Core API Details (Phase 1)

#### Health Check Endpoint

**Request:**
```http
GET /api/health HTTP/1.1
Host: localhost:8000
Accept: application/json
```

**Response:**
```json
{
  "status": "ok",
  "service": "Data Masking Backend",
  "environment": "development"
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Backend is healthy and responding |
| 500 | Internal server error |

#### API Root Endpoint

**Request:**
```http
GET /api/ HTTP/1.1
Host: localhost:8000
Accept: application/json
```

**Response:**
```json
{
  "message": "Data Masking and Anonymization Tool API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "admin": "/admin/"
  }
}
```

#### Frontend API Client

```typescript
import { checkBackendHealth, apiGet, apiPost } from '@/api/client';

// Check backend health
const status = await checkBackendHealth();
// Returns: { connected: boolean, message: string, environment?: string, timestamp: Date }

// Generic GET request
const data = await apiGet<ResponseType>('/api/endpoint');

// Generic POST request
const result = await apiPost<ResponseType>('/api/endpoint', { key: 'value' });
```

#### Backend Status Hook

```typescript
import { useBackendStatus } from '@/hooks/use-backend-status';

const { isConnected, isChecking, status, recheckConnection } = useBackendStatus();

// isConnected: boolean - Whether backend is connected
// isChecking: boolean - Whether health check is in progress
// status: BackendStatus | null - Full status object
// recheckConnection: () => Promise<void> - Manual recheck function
```

#### Backend Status Context

```typescript
import { useBackendStatusContext } from '@/contexts/BackendStatusContext';

// Available throughout the app when wrapped with BackendStatusProvider
const { isConnected, isChecking, status, recheckConnection } = useBackendStatusContext();
```

### Supabase Client

```typescript
import { supabase } from "@/integrations/supabase/client";

// Query projects
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .order('created_at', { ascending: false });

// Insert project
const { data, error } = await supabase
  .from('projects')
  .insert({ name: 'New Project', user_id: userId });

// Authentication
const { data: { user } } = await supabase.auth.getUser();
const { data, error } = await supabase.auth.signUp({ email, password });
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
```

### Context Hooks

```typescript
// Project context
import { useProject } from "@/contexts/ProjectContext";
const { 
  currentProject, 
  setCurrentProject, 
  projects,
  loadProjects,
  detectedFields, 
  setDetectedFields,
  isConnected,
  setIsConnected,
  scanStats,
  setScanStats
} = useProject();

// Search context
import { useSearch } from "@/contexts/SearchContext";
const { searchQuery, setSearchQuery } = useSearch();
```

### Key TypeScript Interfaces

```typescript
// Project
interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Detected PII Field
interface DetectedField {
  id: string;
  field_name: string;
  field_type: string;
  confidence: number;
  table_name: string | null;
}

// Scan Statistics
interface ScanStats {
  totalScans: number;
  piiFieldsFound: number;
  tablesScanned: number;
}

// Field Configuration
interface FieldConfig {
  method: "masking" | "anonymization" | "";
  technique: string;
  parameters: {
    maskingChar?: string;
    tokenFormat?: string;
    generalizationLevel?: string;
    suppressionBehavior?: string;
  };
}

// Selected Field (extends DetectedField)
interface SelectedField extends DetectedField {
  selected: boolean;
  config: FieldConfig;
}

// Processing Field State
interface ProcessingField {
  field: SelectedField;
  status: "pending" | "processing" | "complete";
  progress: number;
}

// Execution Log Entry
interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  status: "initializing" | "running" | "completed";
  phase: string;
}
```

---

## Development Guide

### Prerequisites

**Frontend:**
- Node.js 18+
- npm or bun package manager
- Git

**Backend (Django):**
- Python 3.10+
- pip (Python package manager)
- Virtual environment (recommended)

### Installation

#### Frontend Setup

```bash
# Clone repository
git clone <repository-url>
cd pii-masking-tool

# Install dependencies
npm install
# or
bun install
```

#### Backend Setup (Django)

```bash
# Navigate to backend directory
cd BACKEND

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create superuser (optional, for admin access)
python manage.py createsuperuser
```

### Development Commands

#### Frontend Commands

```bash
# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

#### Backend Commands

```bash
# Navigate to backend directory
cd BACKEND

# Activate virtual environment (if not already activated)
# Windows:
venv\Scripts\activate

# Start Django development server (runs on http://localhost:8000)
python manage.py runserver

# Run with specific port
python manage.py runserver 8000

# Run migrations
python manage.py migrate

# Create new migrations (after model changes)
python manage.py makemigrations

# Access Django shell
python manage.py shell

# Check for issues
python manage.py check
```

### Running the Full Stack

**Terminal 1 - Backend:**
```bash
cd BACKEND
venv\Scripts\activate  # Windows
python manage.py runserver
# Backend runs at: http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Frontend runs at: http://localhost:5173
```

The frontend automatically connects to the backend at `http://127.0.0.1:8000` (configurable via `VITE_API_BASE_URL`).

### Environment Variables

#### Frontend (.env)

```env
# Supabase Configuration
VITE_SUPABASE_URL=<supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=<project-id>

# Django Backend API (Phase 1)
VITE_API_BASE_URL=http://127.0.0.1:8000
```

#### Backend (BACKEND/backend/settings/)

Settings are managed through Python files:
- `base.py` - Common settings for all environments
- `dev.py` - Development-specific settings (DEBUG=True, SQLite, CORS)
- `prod.py` - Production settings (future)

### Backend CORS Configuration

The Django backend is configured to accept requests from the Vite frontend:

```python
# BACKEND/backend/settings/dev.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',      # Vite dev server
    'http://127.0.0.1:5173',
    'http://localhost:3000',      # Fallback
    'http://127.0.0.1:3000',
]
```

### Adding New Components

1. Create component in appropriate directory under `src/components/`
2. Use TypeScript interfaces for props
3. Import shadcn/ui primitives from `@/components/ui/`
4. Use Tailwind CSS for styling
5. Export component for use in pages

### Adding New Routes

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`:

```tsx
<Route path="/new-page" element={<NewPage />} />
```

3. Add navigation link in Sidebar component

### Adding New Backend Endpoints (Django)

1. Create view in `BACKEND/core/views.py`:

```python
from rest_framework.views import APIView
from rest_framework.response import Response

class NewEndpointView(APIView):
    def get(self, request):
        return Response({'message': 'Hello'})
```

2. Add URL pattern in `BACKEND/core/urls.py`:

```python
from .views import NewEndpointView

urlpatterns = [
    path('new-endpoint', NewEndpointView.as_view(), name='new-endpoint'),
]
```

3. Add frontend API call in `src/api/client.ts` or create a new API module.

---

## Glossary

| Term | Definition |
|------|------------|
| PII | Personally Identifiable Information |
| RLS | Row Level Security |
| Masking | Reversible data transformation |
| Anonymization | Irreversible data transformation |
| Tokenization | Replacing data with unique tokens |
| K-Anonymity | Privacy technique ensuring indistinguishability |
| Differential Privacy | Adding noise to protect individual records |

---

## License

Proprietary - All Rights Reserved

---

*Documentation generated for PII Data Masking Platform v1.1.0*  
*Last Updated: February 2026*
