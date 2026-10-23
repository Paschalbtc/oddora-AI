# Oddora AI ⚡⚽
### Autonomous Sports Intelligence & 20,000x Multiplier Accumulator Engine

Oddora AI is an autonomous, self-learning quantitative sports intelligence platform. It ingests daily football fixtures, evaluates fair market probability distributions, searches real-time internet injury updates, and queries a 768-dimensional vector memory of historical betting mistakes to generate high-conviction predictions and 20,000x accumulator slips.

Every midnight, the engine conducts root-cause failure autopsies on lost outcomes, extracting lessons that it permanently embeds into long-term memory to prevent repeating errors.

---

## 🌟 Key Architecture & Capabilities

1. **Daily Morning Ingest & Predict (06:00 AM UTC)**:
   - Respects the 100 requests/day API limit (1 call for fixtures, max 25 for odds).
   - Scrapes real-time web articles, injury updates, and manager press conferences via DuckDuckGo News and RSS feeds at $0 cost.
   - Vector similarity search (`match_ai_lessons`) against 768-dimensional Supabase `pgvector` memory bank.
   - Groq `llama-3.3-70b-versatile` quantitative reasoning with fair market odds estimation and risk categorization (`SAFE`, `VALUE`, `HIGH_ODDS`).
   - Automatically marks the top 3 safest picks free for all users.

2. **Midnight Autopsy & Self-Learning Engine (12:00 AM UTC)**:
   - Ingests final match scores in 1 API call and grades pending market selections (`WON` or `LOST`).
   - Runs deep failure autopsies on lost picks by analyzing in-game statistics (red cards, VAR decisions, possession) and post-match journalist reports.
   - Prompts Groq to extract a strict heuristic rule (e.g. *"Avoid backing Team X Over 2.5 goals away against low-block defenses when their primary playmaker is out"*).
   - Vectorizes lessons with 768-dim embeddings (`gemini-embedding-001`) and saves them to `ai_lessons_memory`.

3. **20,000-Odds Combinatorial Slip Generator**:
   - Mathematical multiplier loop over high-confidence predictions that builds accumulator slips from 2.0x up to 20,000+ odds.
   - Issues official booking codes (e.g. `ODD-20K-8X2A`) with 1-click copy and instant WhatsApp and Telegram sharing.

4. **Real-Time Sports Intelligence Copilot**:
   - Interactive chat assistant powered by Groq and real-time DuckDuckGo web scraping.
   - Users can ask for odds multipliers (*"Give me 20,000 odds"*) or recent football storylines (*"What is trending in football injury news today?"*).

5. **Commercial Monetization & Affiliate System**:
   - **Pricing Tiers**: Scout ($0 / ₦0 Free), Tactician Pro ($9.99/mo or $79/yr | ₦10,000/mo or ₦80,000/yr), and Syndicate VIP ($24.99/mo or $199/yr | ₦25,000/mo or ₦200,000/yr).
   - **Interactive Checkout Modal**: Paystack, Flutterwave, and Card gateway options, plus an instant `$0 Beta Tester Access` button.
   - **Affiliate Partner Hub**: 20% to 40% recurring lifetime commissions, unique referral links, interactive earnings calculator slider, referral table, and payout request modal.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11, FastAPI, Uvicorn, Groq SDK, Google Generative AI (`gemini-embedding-001`), Supabase Python Client, DuckDuckGo Search, Feedparser.
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Supabase Browser Client.
- **Database & Vector Search**: Supabase PostgreSQL with `pgvector` extension (768 dimensions).
- **Automation**: GitHub Actions ($0.00 cloud cron pipeline).

---

## 🚀 Running Locally

### 1. Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **Node.js 18+** & **npm**
- Active API keys for:
  - [API-Football](https://dashboard.api-football.com/) (Free 100 req/day key)
  - [Groq Cloud](https://console.groq.com/) (Free fast LLaMA 3.3 70B inference)
  - [Google AI Studio](https://aistudio.google.com/) (Free Gemini 768-dim embeddings)
  - [Supabase](https://supabase.com/) (Free Postgres + Auth + pgvector)

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install backend dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Open `backend/.env` and fill in your keys:
```ini
API_FOOTBALL_KEY=your_api_football_key
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
APP_MODE=TEST_FREE_BETA
```

Start the FastAPI server:
```bash
uvicorn app:app --reload --port 8000
```
- API will be live at: `http://localhost:8000`
- Interactive Swagger docs at: `http://localhost:8000/docs`

---

### 3. Frontend Setup

In a separate terminal window:
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
```

Ensure `frontend/.env.local` contains:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the Next.js development server:
```bash
npm run dev
```
- Open `http://localhost:3000` in your browser.
- Mobile view can be tested directly in browser dev tools (anti-autozoom `text-base` inputs, fixed 5-tab thumb navigation).

---

## 🧪 Testing the AI Pipelines Manually

You can trigger both AI pipelines manually from the command line:

```bash
# Test the Morning Ingest, Predict & Scraper Pipeline:
cd backend
python morning_ingest_and_predict.py

# Test the Midnight Autopsy, Scoring & Memory Vectorization Pipeline:
cd backend
python midnight_autopsy.py
```

Alternatively, test them directly within the web app:
1. Open `http://localhost:3000`
2. In the top telemetry bar, click **"Open Controls"** on the **Admin Controls** card.
3. Click **"Run Morning AI Now"** or **"Run 12:00 AM Autopsy Now"** to test live execution and real-time feed updates.

---

## ⚙️ $0.00 Automated GitHub Actions Cron

The workflow file [`.github/workflows/oddora_daily_engine.yml`](file:///.github/workflows/oddora_daily_engine.yml) runs the engine automatically on GitHub's free runners:

- **06:00 UTC Daily**: Runs `morning_ingest_and_predict.py`
- **00:00 UTC Daily**: Runs `midnight_autopsy.py`
- **Manual Trigger (`workflow_dispatch`)**: Lets you execute either or both scripts directly from the GitHub Actions tab.

### Configuring GitHub Secrets:
In your GitHub repository, navigate to **Settings > Secrets and variables > Actions** and add:
- `API_FOOTBALL_KEY`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_ANON_KEY`

---

## ☁️ 100% Free Cloud Deployment on Vercel + Supabase

Oddora AI is architected so that **BOTH the frontend and backend run entirely on Vercel and Supabase for $0.00** with zero requirement for an external Python host:

- **Frontend & Full Backend API Routes**: Run directly on **Vercel** serverless functions (`frontend/src/app/api/...`).
- **Database, Auth & Vector Memory**: Run directly on **Supabase** (`https://fdlbnftfylcsjuzqbeuo.supabase.co`).
- **AI Intelligence**: Calls Groq Cloud API directly (`llama-3.3-70b-versatile`) with sub-second latency.
- **Automated Daily Crons**: Managed by `vercel.json` (at 06:00 and 00:00 UTC) with secondary backup on GitHub Actions.

### Quick Deploy to Vercel:
1. Import your repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add these Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://fdlbnftfylcsjuzqbeuo.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your_supabase_anon_key`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your_supabase_service_role_key`
   - `GROQ_API_KEY` = `your_groq_api_key`
   - `API_FOOTBALL_KEY` = `your_api_football_key`
   - `GEMINI_API_KEY` = `your_gemini_api_key`
   - `NEXT_PUBLIC_API_URL` = *(leave empty)*
4. Click **Deploy**. Vercel will build and launch your full-stack application on a free `.vercel.app` domain.

*(Optional)* If you also wish to deploy the Python FastAPI backend separately to Render, you can configure `NEXT_PUBLIC_API_URL=https://oddora-api.onrender.com`.

---

## 🗄️ Supabase Production Database & Vector Schema

Oddora AI is fully configured to run on Supabase PostgreSQL with `pgvector`. A complete, production-grade idempotent schema script is maintained at [`supabase/schema.sql`](file:///Users/mac/Desktop/Oddora%20AI/supabase/schema.sql).

For detailed setup instructions and auth configuration, see the dedicated [**SUPABASE_SETUP.md**](file:///Users/mac/Desktop/Oddora%20AI/SUPABASE_SETUP.md).

### Quick Setup:
1. Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/fdlbnftfylcsjuzqbeuo).
2. Paste and run [`supabase/schema.sql`](file:///Users/mac/Desktop/Oddora%20AI/supabase/schema.sql).
3. Disable "Confirm email" under **Authentication > Providers > Email** to enable the instant zero-verification onboarding flow.
4. Verify the database by running:
```bash
cd frontend && node scripts/verify_supabase.mjs
```
    league_logo TEXT,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_logo TEXT,
    away_logo TEXT,
    kickoff_time TIMESTAMPTZ,
    status TEXT DEFAULT 'NS',
    home_goals INT DEFAULT NULL,
    away_goals INT DEFAULT NULL,
    odds_1x2 JSONB DEFAULT '{}'::jsonb,
    odds_over_under JSONB DEFAULT '{}'::jsonb,
    odds_btts JSONB DEFAULT '{}'::jsonb,
    odds_double_chance JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI Predictions
CREATE TABLE IF NOT EXISTS public.ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id BIGINT REFERENCES public.daily_matches(fixture_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    selected_market TEXT NOT NULL,
    odd_value NUMERIC(6, 2) NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL,
    risk_category TEXT NOT NULL CHECK (risk_category IN ('SAFE', 'VALUE', 'HIGH_ODDS')),
    is_vip_only BOOLEAN DEFAULT FALSE,
    ai_reasoning TEXT NOT NULL,
    news_summary TEXT,
    outcome_status TEXT DEFAULT 'PENDING' CHECK (outcome_status IN ('PENDING', 'WON', 'LOST', 'VOID')),
    failure_autopsy TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI Lessons Memory (Vector Bank)
CREATE TABLE IF NOT EXISTS public.ai_lessons_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_query TEXT NOT NULL,
    lesson_text TEXT NOT NULL,
    fixture_id BIGINT,
    embedding VECTOR(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity index
CREATE INDEX IF NOT EXISTS ai_lessons_embedding_idx 
ON public.ai_lessons_memory 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Vector search RPC function
CREATE OR REPLACE FUNCTION match_ai_lessons(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.70,
    match_count INT DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    lesson_text TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.lesson_text,
        1 - (l.embedding <=> query_embedding) AS similarity
    FROM public.ai_lessons_memory l
    WHERE 1 - (l.embedding <=> query_embedding) > match_threshold
    ORDER BY l.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 5. User Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    plan_tier TEXT DEFAULT 'FREE' CHECK (plan_tier IN ('FREE', 'PRO', 'VIP')),
    subscription_cycle TEXT DEFAULT 'NONE' CHECK (subscription_cycle IN ('NONE', 'MONTHLY', 'YEARLY', 'BETA_TESTER')),
    daily_chat_used INT DEFAULT 0,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by_code TEXT,
    affiliate_balance NUMERIC(10, 2) DEFAULT 0.00,
    total_referrals INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Generated Slips
CREATE TABLE IF NOT EXISTS public.generated_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    booking_code TEXT UNIQUE NOT NULL,
    target_odds NUMERIC(10, 2) NOT NULL,
    combined_odds NUMERIC(10, 2) NOT NULL,
    risk_level TEXT NOT NULL,
    legs JSONB NOT NULL,
    legs_count INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Affiliate Referrals
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'CANCELLED')),
    commission_earned NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📄 License
MIT License. Created for quantitative sports analysts and value betting enthusiasts.

