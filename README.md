## Overview

Stem Scavangers is built around a single question: *how accurately can a producer recreate an underground beat?* Users upload audio recreations of existing underground tracks, attach individual stems with production notes explaining their process, and receive fidelity ratings from the community on a 1–5 scale. A Bayesian weighted ranking system surfaces the most accurately recreated beats over time.

The platform also includes a community request system — if nobody has recreated a track yet, users can submit and vote for the artists they want covered most.

---

## Features

- **Audio upload and playback** — upload beat recreations and individual stems as audio files; each plays back with a WaveSurfer.js waveform visualiser
- **Stem breakdowns** — attach individual stems (drums, melody, bass, etc.) with optional production notes explaining how each was made
- **Fidelity ratings** — community members rate recreations 1–5 on accuracy; owners cannot rate their own work
- **Bayesian ranking** — a Top Rated feed ranks recreations using a Bayesian weighted score that accounts for both rating value and volume, preventing low-sample outliers
- **Artist pages** — filter all recreations by original artist
- **Search** — search recreations by artist, track name, or title
- **Artist request system** — submit artists you want recreated; vote for existing requests; ranked leaderboard by vote count with auto-merge for duplicate submissions
- **Split-screen landing page** — unauthenticated users see a live preview of recent recreations and top requests alongside the auth form
- **User profiles** — view any producer's recreation history
- **JWT authentication** — register, log in, persistent sessions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (`pg` Pool) |
| File Storage | Supabase Storage |
| Audio Playback | WaveSurfer.js v7 |
| Auth | JWT, bcrypt |

---

## Architecture

```
client/               # React + TypeScript (Vite)
  src/
    components/
      WavePlayer.tsx        # WaveSurfer.js waveform player
      RecreationCard.tsx    # Feed card with player, rating, stems
      StemsPanel.tsx        # Collapsible stem list with inline upload
      FidelityRating.tsx    # Interactive 1–5 rating widget (▮ characters)
      UploadForm.tsx        # Multipart form — audio + metadata
      SearchPanel.tsx       # Search input + results + "request" CTA
      RequestsSidebar.tsx   # Ranked artist request list with voting
      AuthForm.tsx          # Split-screen login/register
      Nav.tsx               # Sticky nav — feed / top / search
    context/
      AuthContext.tsx       # JWT state, login/register/logout
    api.ts                  # Axios instance with Bearer token interceptor
    types.ts                # Shared TypeScript interfaces

server/               # Express + TypeScript
  src/
    routes/
      auth.ts               # POST /register, POST /login, GET /me
      recreations.ts        # Feed, top (Bayesian), artist, user, CRUD
      stems.ts              # Upload, update, delete stems
      ratings.ts            # Upsert ratings (ON CONFLICT DO UPDATE)
      search.ts             # ILIKE search across artist/track/title
      requests.ts           # Artist requests — submit, vote, unvote, ranked list
    middleware/
      auth.ts               # JWT verification, AuthRequest interface
    services/
      supabase.ts           # uploadAudio(), deleteAudio() — Supabase Storage
    db/
      index.ts              # PostgreSQL Pool
      schema.sql            # Full schema
```

Audio files are uploaded via `multer` (memory storage) on the Express server and forwarded to a Supabase Storage public bucket. The database stores only the resulting public URL, keeping the server stateless.

---

## Database Schema

```sql
users                 -- id, username, email, password_hash, created_at

recreations           -- id, user_id → users, title, original_artist,
                      -- original_track, audio_url, producer_notes, created_at

stems                 -- id, recreation_id → recreations, name, audio_url,
                      -- description, order_index, created_at

ratings               -- id, user_id → users, recreation_id → recreations,
                      -- fidelity (1–5), created_at
                      -- UNIQUE(user_id, recreation_id)

artist_requests       -- id, artist_name, submitted_by → users, created_at

artist_request_votes  -- id, request_id → artist_requests, user_id → users,
                      -- created_at
                      -- UNIQUE(request_id, user_id)
```

---

## Bayesian Ranking

The Top Rated feed ranks recreations using a Bayesian weighted score to prevent a single 5-star rating from outranking a well-rated recreation with many votes:

```sql
(C * m + SUM(fidelity)) / (C + COUNT(ratings))
```

Where `C` is a confidence constant (minimum votes needed to be trusted) and `m` is the global mean fidelity. This is computed as a CTE on every request to `/api/recreations/top`.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- A [Supabase](https://supabase.com) project with a public storage bucket named `beatlog-audio`

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-username/Stem-Scavangers.git
cd Stem Scavangers

# 2. Install dependencies
cd server && npm install
cd ../client && npm install

# 3. Configure environment variables
cp server/.env.example server/.env

# 4. Run the schema
psql -d your_db -f server/src/db/schema.sql

# 5. Start both servers
cd server && npm run dev   
cd client && npm run dev   
```

### Supabase Storage Setup

1. Create a project at supabase.com
2. Create a public bucket named `beatlog-audio`
3. The app writes to `beats/` and `stems/` folders inside that bucket automatically

---

## Environment Variables

```env
# Database
PGHOST=localhost
PGPORT=5432
PGDATABASE=stem scavangers
PGUSER=your_user
PGPASSWORD=your_password

# Auth
JWT_SECRET=your_jwt_secret

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

PORT=5001
```

---

## API Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/recreations` | — | Community feed |
| GET | `/api/recreations/top` | — | Bayesian ranked feed |
| GET | `/api/recreations/artist/:name` | — | Recreations by artist |
| GET | `/api/recreations/user/:username` | — | A user's recreations |
| GET | `/api/recreations/:id` | — | Single recreation with stems |
| POST | `/api/recreations` | ✓ | Upload a recreation |
| DELETE | `/api/recreations/:id` | ✓ | Delete own recreation |
| POST | `/api/stems` | ✓ | Add a stem to a recreation |
| PATCH | `/api/stems/:id` | ✓ | Update stem name/description |
| DELETE | `/api/stems/:id` | ✓ | Delete a stem |
| POST | `/api/ratings` | ✓ | Rate a recreation (upsert) |
| GET | `/api/ratings/my/:recreation_id` | ✓ | Your rating for a recreation |
| GET | `/api/search?q=` | — | Search recreations |
| GET | `/api/requests` | — | Ranked artist request list |
| POST | `/api/requests` | ✓ | Submit an artist request |
| POST | `/api/requests/:id/vote` | ✓ | Vote for a request |
| DELETE | `/api/requests/:id/vote` | ✓ | Remove your vote |
| GET | `/api/requests/myvotes` | ✓ | Your voted request IDs |
