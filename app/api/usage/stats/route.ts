import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { UsageStats } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('articleId');

    const supabase = createServerClient();

    // Get start of current month for Tavily (monthly limit)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get start of today for Gemini (daily limit)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Build query for monthly Tavily usage
    let tavilyQuery = supabase
      .from('api_usage')
      .select('requests')
      .eq('service', 'tavily')
      .gte('created_at', startOfMonth.toISOString());

    if (articleId) {
      tavilyQuery = tavilyQuery.eq('article_id', articleId);
    }

    const { data: tavilyUsage } = await tavilyQuery;

    // Build query for daily Gemini usage
    let geminiQuery = supabase
      .from('api_usage')
      .select('tokens_input, tokens_output')
      .in('service', ['gemini_flash', 'gemini_pro', 'gemini_embedding'])
      .gte('created_at', startOfDay.toISOString());

    if (articleId) {
      geminiQuery = geminiQuery.eq('article_id', articleId);
    }

    const { data: geminiUsage } = await geminiQuery;

    // Build query for Claude usage (total, since it's paid)
    let claudeQuery = supabase
      .from('api_usage')
      .select('tokens_input, tokens_output, cost_usd')
      .eq('service', 'claude');

    if (articleId) {
      claudeQuery = claudeQuery.eq('article_id', articleId);
    }

    const { data: claudeUsage } = await claudeQuery;

    // Calculate totals
    const tavilyRequests = tavilyUsage?.reduce((sum, u) => sum + (u.requests || 0), 0) || 0;

    const geminiTokens = geminiUsage?.reduce(
      (sum, u) => sum + (u.tokens_input || 0) + (u.tokens_output || 0),
      0
    ) || 0;

    const claudeCost = claudeUsage?.reduce((sum, u) => sum + Number(u.cost_usd || 0), 0) || 0;

    // Total cost (Gemini and Tavily are free tier)
    const totalCost = claudeCost;

    const stats: UsageStats = {
      tavily_requests: tavilyRequests,
      tavily_limit: 1000, // Basic plan monthly limit
      gemini_tokens: geminiTokens,
      gemini_limit: 2_000_000, // Free tier daily limit
      claude_cost: claudeCost,
      total_cost: totalCost,
      period: articleId ? 'month' : 'today',
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Usage stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    );
  }
}
