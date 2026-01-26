import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client (for API routes)
export function createServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Client-side Supabase client (for browser)
let browserClient: SupabaseClient | null = null;

export function createBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

// Database helper types for Supabase queries
export type Tables = {
  articles: {
    Row: {
      id: string;
      title: string;
      topic: string;
      status: string;
      autonomy_level: number;
      research_data: Record<string, unknown>;
      content: string | null;
      embedding: number[] | null;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['articles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Tables['articles']['Insert']>;
  };
  sources: {
    Row: {
      id: string;
      article_id: string;
      url: string;
      title: string | null;
      summary: string | null;
      content: string | null;
      source_type: string | null;
      relevance_score: number;
      saved: boolean;
      embedding: number[] | null;
      created_at: string;
    };
    Insert: Omit<Tables['sources']['Row'], 'id' | 'created_at'> & {
      id?: string;
      created_at?: string;
    };
    Update: Partial<Tables['sources']['Insert']>;
  };
  api_usage: {
    Row: {
      id: string;
      article_id: string | null;
      session_id: string | null;
      service: string;
      tokens_input: number;
      tokens_output: number;
      requests: number;
      cost_usd: number;
      created_at: string;
    };
    Insert: Omit<Tables['api_usage']['Row'], 'id' | 'created_at'> & {
      id?: string;
      created_at?: string;
    };
    Update: Partial<Tables['api_usage']['Insert']>;
  };
  chat_messages: {
    Row: {
      id: string;
      article_id: string;
      role: string;
      content: string;
      created_at: string;
    };
    Insert: Omit<Tables['chat_messages']['Row'], 'id' | 'created_at'> & {
      id?: string;
      created_at?: string;
    };
    Update: Partial<Tables['chat_messages']['Insert']>;
  };
};
