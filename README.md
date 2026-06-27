# AutoMarket AI

> Personal 1-Man Marketing Command Center — AI-powered marketing automation web app for solo marketers and small teams.

Built with **Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui + Prisma + PostgreSQL (Supabase)**. AI powered by **Z.AI SDK**.

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
- A [Z.AI API key](https://z.ai/)

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/automarket-ai.git
cd automarket-ai
bun install   # or: npm install
```

### 2. Configure environment

Copy the example files and fill in your values:

```bash
cp .env.example .env
cp .z-ai-config.example .z-ai-config
```

Edit `.env` with your Supabase credentials (see **Supabase Setup** below).
Edit `.z-ai-config` with your Z.AI API key.

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

## Z.AI Setup (AI API)

The app uses Z.AI for all AI features (caption generation, hashtag suggestions, content repurposing, idea generation).

1. **Get API key**: Sign up at https://z.ai/ → API Keys → Create new key
2. **Configure** (either method works):
   - **Method A** (recommended for production): Set env vars in Vercel:
     ```
     ZAI_API_KEY=your-key-here
     ZAI_BASE_URL=https://api.z.ai/api/paas/v4
     ```
   - **Method B** (local dev): Edit `.z-ai-config`:
     ```json
     {
       "baseUrl": "https://api.z.ai/api/paas/v4",
       "apiKey": "your-key-here"
     }
     ```

---

## Deploy to Vercel

### Option A: One-click deploy via Vercel Dashboard (recommended)

1. Push your repo to GitHub (see **GitHub Setup** below)
2. Go to https://vercel.com/new
3. Import your GitHub repo
4. **Configure Environment Variables** (Vercel will detect them from `.env.example`):
   - `DATABASE_URL` — your Supabase pooler URL
   - `DIRECT_URL` — your Supabase direct URL
   - `ZAI_API_KEY` — your Z.AI API key
   - `ZAI_BASE_URL` — `https://api.z.ai/api/paas/v4`
5. Click **Deploy** — Vercel will run `bun run build` (which auto-runs `prisma generate`)
6. After deploy: run the database migration once:
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

# Follow prompts:
# - Set up and deploy: Y
# - Which scope: (your account)
# - Link to existing project: N
# - Project name: automarket-ai
# - Framework preset: Next.js (auto-detected)
# - Build command: bun run build (auto-detected)
# - Output directory: .next (auto-detected)

# Add env vars
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add ZAI_API_KEY
vercel env add ZAI_BASE_URL

# Deploy to production
vercel --prod
```

---

## GitHub Setup

### Create a new repo and push

```bash
# From /home/z/my-project (or wherever you cloned)

# If you haven't set git identity yet:
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Initialize git
git init
git add .
git commit -m "Initial commit: AutoMarket AI v1.0"

# Create empty repo on GitHub first (https://github.com/new), then:
git remote add origin https://github.com/YOUR_USERNAME/automarket-ai.git
git branch -M main
git push -u origin main
```

### Or via GitHub CLI

```bash
# Install: https://cli.github.com/
gh auth login

# Create repo + push in one go
gh repo create automarket-ai --public --source=. --remote=origin --push
```

🔗 Useful links:
- Create new repo: https://github.com/new
- GitHub CLI: https://cli.github.com/
- GitHub Desktop: https://desktop.github.com/

---

## Project Structure

```
automarket-ai/
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
│       ├── ai.ts                  # Z.AI SDK wrapper
│       ├── db.ts                  # Prisma client
│       ├── platforms.ts           # Platform metadata + helpers
│       ├── store.ts               # Zustand navigation store
│       └── utils.ts               # cn() helper
├── .env.example                   # Env var template
├── .z-ai-config.example           # Z.AI config template
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
- **AI**: Z.AI SDK (`z-ai-web-dev-sdk`)
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

---

## Roadmap / Future Improvements

- [ ] Real social media API integration (Instagram Graph, LinkedIn, Facebook, X)
- [ ] Auto-publish at scheduled time (Vercel Cron + Queue)
- [ ] Multi-user support with NextAuth
- [ ] Image generation for post visuals
- [ ] Auto-reply comment drafting
- [ ] Hashtag trend research via API
- [ ] Bulk CSV upload for posts
- [ ] Team collaboration

---

## License

MIT — feel free to use, modify, and distribute.

---

## Support

- 🐛 Issues: https://github.com/YOUR_USERNAME/automarket-ai/issues
- 📖 Z.AI docs: https://z.ai/
- 📖 Supabase docs: https://supabase.com/docs
- 📖 Vercel docs: https://vercel.com/docs
- 📖 Next.js docs: https://nextjs.org/docs
