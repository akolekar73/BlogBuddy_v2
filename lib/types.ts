// Database types
export interface Article {
  id: string;
  title: string;
  topic: string;
  status: 'research' | 'drafting' | 'published';
  autonomy_level: number;
  research_data: ResearchData;
  content: string | null;
  embedding?: number[];
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  article_id: string;
  url: string;
  title: string | null;
  summary: string | null;
  content: string | null;
  source_type: SourceType;
  relevance_score: number;
  saved: boolean;
  embedding?: number[];
  created_at: string;
}

export interface ApiUsage {
  id: string;
  article_id: string | null;
  service: ServiceType;
  tokens_input: number;
  tokens_output: number;
  requests: number;
  cost_usd: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  article_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Enums
export type SourceType =
  | 'vc_report'
  | 'academic'
  | 'blog'
  | 'podcast'
  | 'news'
  | 'documentation'
  | 'social'
  | 'other';

export type ServiceType =
  | 'tavily'
  | 'gemini_flash'
  | 'gemini_pro'
  | 'gemini_embedding'
  | 'claude';

export type ArticleStatus = 'research' | 'drafting' | 'published';

// Research data structure
export interface ResearchData {
  queries?: string[];
  structure?: ArticleStructure;
  insights?: string[];
}

export interface ArticleStructure {
  sections: ArticleSection[];
  suggested_angle?: string;
  key_takeaways?: string[];
}

export interface ArticleSection {
  title: string;
  key_points: string[];
  suggested_sources: string[]; // source IDs
}

// API Request/Response types
export interface StartResearchRequest {
  topic: string;
  autonomyLevel: number;
}

export interface StartResearchResponse {
  articleId: string;
  title: string;
}

export interface SearchRequest {
  articleId: string;
  query: string;
  autonomyLevel: number;
}

export interface SearchResponse {
  sources: Source[];
  usage: {
    tavily_requests: number;
    gemini_tokens: number;
  };
}

export interface ChatRequest {
  articleId: string;
  message: string;
}

export interface GenerateStructureRequest {
  articleId: string;
}

export interface GenerateStructureResponse {
  structure: ArticleStructure;
}

export interface UsageStats {
  tavily_requests: number;
  tavily_limit: number;
  gemini_tokens: number;
  gemini_limit: number;
  claude_cost: number;
  total_cost: number;
  period: 'today' | 'month';
}

// Component props
export interface SourceCardProps {
  source: Source;
  onSave: (sourceId: string) => void;
  onRemove: (sourceId: string) => void;
}

export interface CostMonitorProps {
  stats: UsageStats | null;
  isLoading: boolean;
}

export interface ResearchPanelProps {
  articleId: string;
  topic: string;
  autonomyLevel: number;
  onComplete: () => void;
}

export interface ChatSidebarProps {
  articleId: string;
  sources: Source[];
}

export interface ArticleCardProps {
  article: Article;
  onContinue: (articleId: string) => void;
}
