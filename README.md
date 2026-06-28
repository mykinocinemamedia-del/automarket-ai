# Kino Social

> Personal 1-Man Marketing Command Center — AI-powered marketing automation web app for solo marketers and small teams.

Built with **Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui + Prisma + PostgreSQL (Supabase)**. AI powered by **Google Gemini** (free tier: 1,500 requests/day).

---

## Features

- **Dashboard** — KPI cards, quick actions, recent content feed, upcoming queue, per-platform performance
- **AI Content Studio** — Generate captions (multi-variant), hashtags, repurpose content across platforms, content ideas
- **Brand Memory** — Teach the AI your brand voice, audience, tone, hashtag sets
- **Content Calendar** — List + month grid view, full post CRUD, status tracking
- **Asset Library** — Image/video/audio/document gallery with search & filter
- **Analytics** — 14-day reach trends, engagement breakdown, per-platform metric cards
- **Auto-Pilot Rules** — Automation rule builder with templates (Morning Quote, Weekly Recap, etc.)

---

## Quick Start (Local Dev)

### Prerequisites
- [Node.js 18+](https://nodejs.org/) or [Bun](https://bun.sh/)
- A [Supabase](https://supabase.com/) account (free tier works)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free)

### 1. Clone & install

```bash
git clone https://github.com/mykinocinemamedia-del/kino-social.git
cd kino-social
bun install   # or: npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials (see **Supabase Setup** below) and Gemini API key.

### 3. Setup database

```bash
bun run db:push      # Create tables in Supabase
bun run db:seed      # (Optional) Load demo data — Kopi Senja coffee brand
```

### 4. Run

```bash
bun run dev          # Start dev server at http://localhost:3000
```

---

## Supabase Setup (Database)

1. **Create account**: Go to https://supabase.com/ → Sign up (free)
2. **Create project**: Click "New Project" → choose name, password, region (Singapore recommended for Asia)
3. **Get connection strings**:
   - Go to **Project Settings → Database → Connection string**
   - Copy the **Connection pooling** URL (port `6543`, ends with `?pgbouncer=true`)
   - Copy the **Direct connection** URL (port `5432`)
4. **Replace passwords**: The URLs in Supabase show `[YOUR-PASSWORD]` — replace with the password you set in step 2
5. **Add to `.env`**:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-[region].supabase.com:5432/postgres"
   ```

📖 Docs: https://supabase.com/docs/guides/database/connecting-to-postgres

---

## Google Gemini Setup (AI API)

The app uses Google Gemini for all AI features (caption generation, hashtag suggestions, content repurposing, idea generation).

### Free Tier Limits
- ✅ **1,500 requests per day** (plenty for solo marketer)
- ✅ **1 million tokens per minute**
- ✅ **No credit card required** (during free tier beta)
- ✅ **Multimodal** — text + image + video understanding

### Get API Key

1. **Open Google AI Studio**: https://aistudio.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click "Create API Key"**
4. **Select a Google Cloud project** (or create a new one — default works fine)
5. **Copy the key** — format starts with `AIza...` (~40 characters)
6. **Add to `.env`**:
   ```env
   GEMINI_API_KEY="AIza...your-key-here"
   ```

### Troubleshooting

**"You exceeded your current quota"** (RESOURCE_EXHAUSTED):
- Wait 24 hours for daily quota to reset
- Or check https://ai.google.dev/gemini-api/docs/rate-limits
- Make sure you're using the free tier (no billing required during beta)

**"User location is not supported"**:
- Gemini API is geo-restricted in some regions
- Use a VPN/Proxy if needed
- Or try a different model: set `GEMINI_MODEL=gemini-2.0-flash` in `.env`

### Optional: Use a different Gemini model

```env
# Default (recommended — fast, free-tier friendly)
GEMINI_MODEL="gemini-2.0-flash"

# More powerful but slower
# GEMINI_MODEL="gemini-2.5-flash"
# GEMINI_MODEL="gemini-2.5-pro"
```

📖 Docs: https://ai.google.dev/gemini-api/docs

---

## Deploy to Vercel

### Option A: One-click deploy via Vercel Dashboard (recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repo (`kino-social`)
3. **Configure Environment Variables**:
   - `DATABASE_URL` — your Supabase pooler URL
   - `DIRECT_URL` — your Supabase direct URL
   - `GEMINI_API_KEY` — your Google Gemini API key
4. Click **Deploy** — Vercel will run `bun run build` (which auto-runs `prisma generate`)
5. After deploy: run the database migration once:
   ```bash
   # From your local machine (with .env set to production values)
   bun run db:push
   bun run db:seed    # optional, to load demo data
   ```

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from project root
vercel

# Add env vars
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add GEMINI_API_KEY

# Deploy to production
vercel --prod
```

---

## Project Structure

```
kino-social/
├── prisma/
│   └── schema.prisma              # Database schema (PostgreSQL)
├── public/                        # Static assets
├── scripts/
│   └── seed.ts                    # Database seeder (demo data)
├── src/
│   ├── app/
│   │   ├── api/                   # API routes (10 endpoints)
│   │   │   ├── ai/                # AI endpoints (caption, hashtags, repurpose, ideas)
│   │   │   ├── analytics/         # Analytics endpoints
│   │   │   ├── assets/            # Asset CRUD
│   │   │   ├── brand/             # Brand CRUD
│   │   │   ├── posts/             # Post CRUD
│   │   │   └── rules/             # Automation rule CRUD
│   │   ├── globals.css            # Tailwind + custom theme
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Main shell (single-page app)
│   ├── components/
│   │   ├── sections/              # 7 section components
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── app-sidebar.tsx        # Responsive sidebar
│   │   └── section-header.tsx     # Shared header
│   ├── hooks/
│   │   ├── use-brand.ts           # Shared brand fetcher
│   │   ├── use-toast.ts           # Toast notifications
│   │   └── use-mobile.ts          # Mobile detection
│   └── lib/
│       ├── ai.ts                  # Google Gemini wrapper
│       ├── db.ts                  # Prisma client
│       ├── platforms.ts           # Platform metadata + helpers
│       ├── store.ts               # Zustand navigation store
│       └── utils.ts               # cn() helper
├── .env.example                   # Env var template
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── vercel.json                    # Vercel deployment config
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start dev server at http://localhost:3000 |
| `bun run build` | Production build (runs `prisma generate` first) |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push schema to database (create/update tables) |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run db:migrate` | Create a new migration |
| `bun run db:deploy` | Apply migrations (for production) |
| `bun run db:studio` | Open Prisma Studio (DB browser GUI) |
| `bun run db:seed` | Load demo data |

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma 6
- **AI**: Google Gemini (`gemini-2.0-flash`)
- **Charts**: Recharts
- **State**: Zustand
- **Icons**: Lucide React
- **Animations**: Framer Motion

---

## Customization

### Change the brand color
Edit `src/app/globals.css` → `:root` → `--primary` (OKLCH format).

### Add a new platform
Edit `src/lib/platforms.ts` → add to `PLATFORMS` array.

### Modify AI prompts
Edit `src/lib/ai.ts` — all prompts are inline in the functions (`generateCaption`, `generateHashtags`, `repurposeContent`, `generateContentIdeas`).

### Switch AI provider
The `src/lib/ai.ts` file is the only file that talks to the AI. Replace the `callGemini()` function with any other provider (OpenAI, Anthropic, Groq, etc.) — the rest of the app doesn't need changes.

---

## Roadmap / Future Improvements

- [ ] Real social media API integration (Instagram Graph, LinkedIn, Facebook, X)
- [ ] Auto-publish at scheduled time (Vercel Cron + Queue)
- [ ] Multi-user support with NextAuth
- [ ] Image generation for post visuals (using Gemini's image capabilities)
- [ ] Auto-reply comment drafting
- [ ] Hashtag trend research via API
- [ ] Bulk CSV upload for posts
- [ ] Team collaboration

---

## License

MIT — feel free to use, modify, and distribute.

---

## Support

- 🐛 Issues: https://github.com/mykinocinemamedia-del/kino-social/issues
- 📖 Gemini API docs: https://ai.google.dev/gemini-api/docs
- 📖 Supabase docs: https://supabase.com/docs
- 📖 Vercel docs: https://vercel.com/docs
- 📖 Next.js docs: https://nextjs.org/docs
