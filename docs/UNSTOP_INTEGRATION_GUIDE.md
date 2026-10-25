# Production-Grade Unstop Hackathon & Opportunity Integration Guide
## AIT Pune Campus Connect / AIT ONE Portal

---

## 1. Executive Summary

This document describes the complete architecture, configuration, database schemas, and synchronization workflows for the **Unstop Hackathon Integration** in the **AIT Pune Campus Achievement & Participation Portal**.

The system aggregates public hackathons, coding contests, and tech innovation challenges from **Unstop** via an **Apify** automated actor, normalizes and validates the data using **Zod**, categorizes each opportunity specifically for **Army Institute of Technology (AIT) Pune engineering students**, and persists the records in **Supabase PostgreSQL** with local cached fallback and scheduled sync capabilities.

---

## 2. Architecture & Data Flow

```
+-------------------------------------------------------------+
|                 Unstop Public Directory                     |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|           Apify Actor: hipersoft/unstop-scraper             |
|   - Cost: ~$0.0025 / opportunity                            |
|   - Inputs: { opportunityTypes: ['hackathons',              |
|               'competitions'], onlyOpen: true }             |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|           AIT Campus Connect Ingestion Pipeline             |
|  1. Apify HTTPS Client (Retry + Exponential Backoff)        |
|  2. Zod Schema Validation (Rejects invalid URLs / junk)     |
|  3. Deduplicator (Deterministic UNSTOP_<id> / SHA-256)      |
|  4. Normalizer (Standardized timezone, prizes, team sizes)  |
|  5. AIT Eligibility Engine (Branch & year compatibility)    |
|  6. Dual-Persistence Repository Layer                       |
+-------------------------------------------------------------+
               /                              \
              v                                v
+-----------------------------+  +----------------------------+
|   Supabase PostgreSQL Cloud  |  |  Local SQLite Cache Table  |
|  - Table: public.opportunities|  |  - Instant resilience      |
|  - Row Level Security (RLS)  |  |  - Zero cold-start latency |
|  - Real-time Sync Runs Log  |  |  - Synchronized bookmarks  |
+-----------------------------+  +----------------------------+
                               |
                               v
+-------------------------------------------------------------+
|           REST API Layer (Express + Node.js)                |
|  - GET  /api/opportunities (Search, sort, filter, paginate)  |
|  - GET  /api/opportunities/:id (Deep detail view)           |
|  - POST /api/opportunities/:id/save (Student bookmarking)   |
|  - GET  /api/opportunities/sync-status (Health telemetry)   |
|  - POST /api/opportunities/sync (Admin / Cron trigger)      |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|          Frontend Experience (React + Vite + Tailwind)      |
|  - Opportunities Discovery (/opportunities)                 |
|  - Opportunity Detail Page (/opportunity/:id)               |
|  - Hackathons Hub (/hackathons)                             |
|  - Admin Dashboard Sync Console (/admin)                    |
+-------------------------------------------------------------+
```

---

## 3. Apify Integration & Cost Optimization

- **Actor ID**: `hipersoft/unstop-scraper`
- **Cost Guardrail**: Scraped at ~$0.0025 per item.
- **Smart Dataset Reuse**: By default, during background testing or local development, the sync engine checks for recent runs from the past 24 hours (`reuseRecentDataset: true`) to eliminate redundant compute charges and prevent rate limiting.
- **Fail-Safe Transport**: Node.js `https` client with retry logic handles TLS handshakes and transient connection blips gracefully.

---

## 4. Supabase Database Configuration & Setup

### Environment Credentials
The platform uses the following pre-configured credentials in `.env`:
- **Supabase URL**: `https://igekrdkefsrpzxwncwce.supabase.co`
- **Supabase Service Role Key**: Stored securely on server-side `.env` for data ingestion.
- **Supabase Anon Key**: Browser-safe key provided in `client/.env`.

### Step-by-Step Supabase Setup Instructions:
1. Navigate to the **Supabase Dashboard**: [https://supabase.com/dashboard/project/igekrdkefsrpzxwncwce/sql](https://supabase.com/dashboard/project/igekrdkefsrpzxwncwce/sql)
2. Open the **SQL Editor** tab.
3. Paste the contents of `supabase/migrations/20261024_create_unstop_opportunities.sql` (or copy directly from the **Unstop Sync Engine** tab in the `/admin` portal).
4. Click **Run**.

### Core SQL Schema Preview:
```sql
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unstop_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    organizer TEXT,
    opportunity_type TEXT DEFAULT 'hackathons',
    url TEXT NOT NULL,
    banner_url TEXT,
    deadline TIMESTAMPTZ,
    deadline_text TEXT,
    eligibility TEXT,
    registration_fee TEXT,
    location TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_unstop_id ON public.opportunities(unstop_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON public.opportunities(deadline);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
ON public.opportunities
FOR SELECT
TO anon, authenticated
USING (true);
```

---

## 5. AIT Pune Student Eligibility Engine

Every scraped Unstop opportunity is evaluated by `server/services/opportunities/opportunityEligibility.js` against AIT Pune student criteria:

| Eligibility Status | Description | Action for Student |
|---|---|---|
| `ELIGIBLE` | Open to all undergraduate engineering disciplines (Computer Engineering, Information Technology, Electronics & Telecommunication, Mechanical Engineering). | Highlighted with Green Badge & Verified Tag. |
| `POTENTIALLY_ELIGIBLE` | Open to college students, generic undergraduates, or multi-disciplinary domains. | Amber Badge with guidance to verify specifics. |
| `NOT_ELIGIBLE` | Restricted to non-engineering degrees (e.g. MBA exclusive, School-only, Medical). | Filterable; marked clearly to prevent wasted effort. |
| `INSUFFICIENT_INFORMATION` | Unstop listing did not provide granular eligibility details. | Neutral badge directing student to official rules. |

---

## 6. API Reference

### 1. `GET /api/opportunities`
Query Parameters:
- `source`: `ALL` (default), `UNSTOP`, `CAMPUS`, `OPEN_SOURCE`
- `search`: Full-text search across titles, organizers, skills, domains
- `eligibility`: `ELIGIBLE`, `POTENTIALLY_ELIGIBLE`, `NOT_ELIGIBLE`
- `mode`: `Online`, `In-Person`, `Hybrid`
- `fee`: `Free`, `Paid`
- `sort`: `deadline` (earliest upcoming first), `recent`, `title`
- `page`: Page index (default: `1`)
- `limit`: Items per page (default: `24`)

### 2. `GET /api/opportunities/:id`
Retrieves full details for an opportunity, including rich problem statements, eligibility criteria, prize distributions, and genuine Unstop application link.

### 3. `POST /api/opportunities/:id/save`
Authenticated student bookmarking endpoint. Adds the opportunity to both the student's personal tracker and the unified AIT ONE library.

### 4. `POST /api/opportunities/sync`
Protected synchronization trigger.
- **Authentication**: Requires admin JWT bearer token or header `x-cron-secret: <YOUR_CRON_SECRET>`.
- **Payload**:
  ```json
  {
    "maxItems": 50,
    "forceFresh": false
  }
  ```

---

## 7. Automated Synchronization Schedule

### Daily GitHub Actions Cron (`.github/workflows/sync-unstop.yml`)
- Runs every night at **03:00 IST** (21:30 UTC).
- Automatically triggers `POST /api/opportunities/sync` via secure webhook or CLI runner `node scripts/sync-unstop.js`.

### Manual CLI Execution:
```bash
# Sync recent / updated opportunities
npm run sync:unstop

# Force a fresh Apify crawler run
node scripts/sync-unstop.js --fresh --limit 50
```

---

## 8. Verification & QA Status

The integration was verified through automated test suites:
- **`node test_unstop_integration.js`**: **30 / 30 tests passed (100%)**.
  - Authentication & role security
  - Unstop opportunity aggregation
  - Deadline ascending ordering
  - Multi-source filtering (`UNSTOP`, `CAMPUS`, `OPEN_SOURCE`)
  - AIT eligibility categorization
  - Student bookmarking & bidirectional library sync
  - Cron secret enforcement & idempotent re-runs
- **`node test_academic_year_restriction.js`**: **100% passed** (AY 2026–27 strict isolation maintained).
- **`node test_research_integration.js`**: **100% passed** (23 canonical clubs, Anubhav OSS classification, historical archive segregation preserved).
- **`node test_e2e.js`**: **11 / 11 user journeys passed (100%)**.
- **Frontend Build**: `cd client && npm run build` -> **Built in 728ms with 0 errors**.
