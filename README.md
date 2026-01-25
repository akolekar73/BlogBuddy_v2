# BlogBuddy v2

AI-powered research assistant for creating technology thought leadership articles. Research emerging tech topics, organize findings with AI assistance, and generate article structures.

## Features

- **AI-Powered Research**: Use Tavily for web research and Gemini for content analysis
- **Smart Source Classification**: Automatically categorize sources (VC reports, academic papers, blogs, etc.)
- **Research Chat**: Ask questions about your findings with context-aware AI assistance
- **Article Structure Generation**: AI-generated article outlines based on your research
- **Cost Monitoring**: Track API usage with a collapsible cost dashboard
- **Autonomy Levels**: Control how extensively the AI researches (1-5 scale)

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: Supabase (PostgreSQL + pgvector for embeddings)
- **AI**: Vercel AI SDK with Google Gemini (Flash & Pro)
- **Research**: Tavily API
- **UI**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, enable the pgvector extension and run the schema:

```sql
-- Run the contents of supabase/schema.sql
```

3. Get your project credentials from Settings > API:
   - Project URL
   - Anon public key
   - Service role key

### 2. Get API Keys

**Tavily API** (for web research):
1. Sign up at [tavily.com](https://tavily.com)
2. Get your API key from the dashboard
3. Basic plan includes 1,000 free requests/month

**Google AI** (for Gemini):
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Free tier includes 2M tokens/day

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
TAVILY_API_KEY=your-tavily-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Project Structure

```
/app
  /page.tsx                    # Main dashboard
  /api
    /research
      /start/route.ts          # Create new research session
      /search/route.ts         # Search for sources
      /chat/route.ts           # Chat about research
    /structure
      /generate/route.ts       # Generate article structure
    /articles
      /list/route.ts           # List all articles
    /sources/route.ts          # Manage sources
    /usage
      /stats/route.ts          # Get usage statistics

/components
  /cost-monitor.tsx            # Collapsible cost dashboard
  /research-panel.tsx          # Main research interface
  /source-card.tsx             # Source display card
  /chat-sidebar.tsx            # Research chat interface
  /article-list.tsx            # Past articles grid

/lib
  /supabase.ts                 # Supabase client setup
  /ai.ts                       # AI SDK helpers
  /types.ts                    # TypeScript interfaces
  /utils.ts                    # Utility functions

/supabase
  /schema.sql                  # Database schema
```

## Cost Breakdown

| Service | Free Tier | Paid Pricing |
|---------|-----------|--------------|
| Tavily | 1,000 requests/month | $0.01/request |
| Gemini Flash | 2M tokens/day | $0.075/M input, $0.30/M output |
| Gemini Pro | 2M tokens/day | $1.25/M input, $5/M output |
| Supabase | 500MB database | $25/month Pro |

The cost monitor in the header tracks your usage in real-time.

## Autonomy Levels

| Level | Name | Behavior |
|-------|------|----------|
| 1 | Guided | Minimal research, you guide each step |
| 2 | Conservative | Limited exploration with your oversight |
| 3 | Balanced | Moderate research, good middle ground |
| 4 | Exploratory | Broader research, more sources |
| 5 | Autonomous | Extensive research, multiple queries |

## Troubleshooting

### "Missing Supabase environment variables"
Ensure all three Supabase variables are set in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### "Search failed" errors
1. Verify your Tavily API key is correct
2. Check you haven't exceeded the rate limit
3. Check the browser console for detailed errors

### "Failed to generate structure"
1. Make sure you've saved at least one source
2. Check that your Google AI key is valid
3. Try with fewer sources if you're hitting token limits

### Embeddings not working
The schema uses 768-dimensional vectors for Gemini's text-embedding-004 model. If you're seeing errors, ensure the pgvector extension is enabled:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project to [Vercel](https://vercel.com)
3. Add all environment variables in Project Settings > Environment Variables
4. Deploy

## License

MIT
