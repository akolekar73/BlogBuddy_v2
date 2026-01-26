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

// ============================================
// Topic Refinement Types
// ============================================

export type Framework = 'why_now' | 'landscape_analysis' | 'problem_solution';

export interface RefinementMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface WhyNowData {
  technology: string;
  catalysts: string[];
  catalyst_details: string;
  evidence_needed: string;
  past_failures?: string;
  current_enablers: string;
}

export interface LandscapeData {
  market: string;
  segmentation_approach: 'technology' | 'customer' | 'vertical' | 'business_model' | 'custom';
  known_players: string[];
  contested_aspects: string;
  value_proposition: string;
}

export interface ProblemSolutionData {
  problem: string;
  who_affected: string;
  why_unsolved: string;
  recent_changes: string;
}

export interface ThesisResult {
  thesis: string;
  structure: {
    sections: Array<{
      title: string;
      key_points: string[];
      suggested_sources: string[];
    }>;
  };
  research_questions: string[];
  target_sources: string[];
  estimated_scope: number;
  recommended_autonomy: number;
}

export interface FrameworkRecommendation {
  recommended: Framework[];
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface RefinementData {
  refinement_method: 'hybrid' | 'single_framework' | 'skipped';
  initial_idea: string;
  socratic_conversation: RefinementMessage[];
  frameworks_used: Framework[];
  why_now_data?: WhyNowData;
  landscape_data?: LandscapeData;
  problem_solution_data?: ProblemSolutionData;
  thesis: string;
  structure: ThesisResult['structure'];
  research_questions: string[];
  target_sources: string[];
  estimated_scope: number;
  recommended_autonomy: number;
}

// Refinement API types
export interface RefineChatRequest {
  message: string;
  conversationHistory: RefinementMessage[];
}

export interface RefineRecommendFrameworkRequest {
  conversationHistory: RefinementMessage[];
}

export interface RefineAssistFormRequest {
  framework: Framework;
  field: string;
  userInput: string;
  context: Record<string, unknown>;
}

export interface RefineGenerateThesisRequest {
  initialIdea: string;
  socraticData: RefinementMessage[];
  frameworksUsed: Framework[];
  whyNowData?: WhyNowData;
  landscapeData?: LandscapeData;
  problemSolutionData?: ProblemSolutionData;
}

// Extended Article type with refinement_data
export interface ArticleWithRefinement extends Article {
  refinement_data?: RefinementData;
}

// Update StartResearchRequest to optionally include refinement_data
export interface StartResearchWithRefinementRequest extends StartResearchRequest {
  refinementData?: RefinementData;
}

// ============================================
// Session and Token Tracking Types
// ============================================

export interface SessionTokenUsage {
  current_session: {
    tavily_requests: number;
    gemini_tokens: number;
    claude_tokens: number;
    estimated_cost: number;
  };
  today: {
    tavily_requests: number;
    gemini_tokens: number;
    claude_tokens: number;
    total_cost: number;
  };
  this_month: {
    tavily_requests: number;
    gemini_tokens: number;
    claude_tokens: number;
    total_cost: number;
  };
  limits: {
    tavily_monthly: number;
    gemini_daily: number;
    budget_monthly: number;
  };
  warning?: string;
}

// ============================================
// Structured Research Types
// ============================================

export type ResearchSectionStatus = 'pending' | 'researching' | 'complete';

export interface ResearchSection {
  title: string;
  key_points: string[];
  status: ResearchSectionStatus;
  sources: ResearchSource[];
  progress: number;
}

export interface ResearchSource {
  id: string;
  url: string;
  title: string;
  summary: string;
}

export interface StructuredResearchProgress {
  currentSection: number;
  sections: ResearchSection[];
  overallProgress: number;
}

// ============================================
// Phase Navigation Types
// ============================================

export type AppPhase = 'idle' | 'refinement' | 'structured_research' | 'complete';
export type RefinementStep = 'socratic' | 'framework' | 'thesis_review';

export interface SavedRefinementStates {
  socraticData: RefinementMessage[] | null;
  frameworkData: Framework[] | null;
  thesisData: ThesisResult | null;
}

// ============================================
// Form Feedback Types
// ============================================

export interface FieldFeedback {
  suggestion: string;
  canApply: boolean;
  replacement?: string;
}
