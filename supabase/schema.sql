-- BlogBuddy v2 Database Schema
-- Run this in Supabase SQL Editor

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Articles table - main research sessions
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  status TEXT DEFAULT 'research' CHECK (status IN ('research', 'drafting', 'published')),
  autonomy_level INTEGER DEFAULT 3 CHECK (autonomy_level >= 1 AND autonomy_level <= 5),
  research_data JSONB DEFAULT '{}', -- stores sources, findings, structure
  content TEXT,
  embedding vector(768), -- text-embedding-004 produces 768-dim vectors
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sources table - research sources for each article
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  content TEXT, -- full content for context
  source_type TEXT CHECK (source_type IN ('vc_report', 'academic', 'blog', 'podcast', 'news', 'documentation', 'social', 'other')),
  relevance_score DECIMAL(3,2) DEFAULT 0.5,
  saved BOOLEAN DEFAULT false,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API usage tracking for cost monitoring
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  service TEXT NOT NULL CHECK (service IN ('tavily', 'gemini_flash', 'gemini_pro', 'gemini_embedding', 'claude')),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  requests INTEGER DEFAULT 1,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages for research conversations
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_updated ON articles(updated_at DESC);
CREATE INDEX idx_sources_article ON sources(article_id);
CREATE INDEX idx_sources_saved ON sources(article_id, saved) WHERE saved = true;
CREATE INDEX idx_usage_article ON api_usage(article_id);
CREATE INDEX idx_usage_service ON api_usage(service);
CREATE INDEX idx_usage_created ON api_usage(created_at);
CREATE INDEX idx_chat_article ON chat_messages(article_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update articles.updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (optional, enable if using Supabase Auth)
-- ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
