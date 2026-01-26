import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { SessionTokenUsage } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    const supabase = createServerClient();

    // Get start of current month for Tavily (monthly limit)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get start of today for Gemini (daily limit)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Helper to calculate totals from usage data
    const calculateTotals = (
      data: Array<{
        service: string;
        tokens_input?: number;
        tokens_output?: number;
        requests?: number;
        cost_usd?: number;
      }> | null
    ) => {
      if (!data)
        return {
          tavily_requests: 0,
          gemini_tokens: 0,
          claude_tokens: 0,
          total_cost: 0,
        };

      return {
        tavily_requests: data
          .filter((d) => d.service === 'tavily')
          .reduce((sum, d) => sum + (d.requests || 0), 0),
        gemini_tokens: data
          .filter((d) =>
            ['gemini_flash', 'gemini_pro', 'gemini_embedding'].includes(d.service)
          )
          .reduce(
            (sum, d) => sum + (d.tokens_input || 0) + (d.tokens_output || 0),
            0
          ),
        claude_tokens: data
          .filter((d) => d.service === 'claude')
          .reduce(
            (sum, d) => sum + (d.tokens_input || 0) + (d.tokens_output || 0),
            0
          ),
        total_cost: data.reduce((sum, d) => sum + Number(d.cost_usd || 0), 0),
      };
    };

    // Query for current session usage
    let sessionUsage = null;
    if (sessionId) {
      const { data } = await supabase
        .from('api_usage')
        .select('service, tokens_input, tokens_output, requests, cost_usd')
        .eq('session_id', sessionId);
      sessionUsage = data;
    }

    // Query for today's usage
    const { data: todayData } = await supabase
      .from('api_usage')
      .select('service, tokens_input, tokens_output, requests, cost_usd')
      .gte('created_at', startOfDay.toISOString());

    // Query for this month's usage
    const { data: monthData } = await supabase
      .from('api_usage')
      .select('service, tokens_input, tokens_output, requests, cost_usd')
      .gte('created_at', startOfMonth.toISOString());

    // Calculate totals
    const sessionTotals = calculateTotals(sessionUsage);
    const todayTotals = calculateTotals(todayData);
    const monthTotals = calculateTotals(monthData);

    // Estimate cost for session (Claude is paid, others are free tier)
    const estimateSessionCost = (claudeTokens: number) => {
      // Approximate: 70% input tokens, 30% output tokens
      const inputTokens = claudeTokens * 0.7;
      const outputTokens = claudeTokens * 0.3;
      return (inputTokens * 3) / 1_000_000 + (outputTokens * 15) / 1_000_000;
    };

    // Check for warnings
    let warning: string | undefined;
    if (monthTotals.tavily_requests > 900) {
      warning = `Approaching Tavily limit (${monthTotals.tavily_requests}/1000 requests)`;
    } else if (todayTotals.gemini_tokens > 1_600_000) {
      warning = `Approaching Gemini daily limit (${(
        todayTotals.gemini_tokens / 1_000_000
      ).toFixed(1)}M/2M tokens)`;
    } else if (monthTotals.total_cost > 18) {
      warning = `Approaching monthly budget ($${monthTotals.total_cost.toFixed(
        2
      )}/$20)`;
    }

    const stats: SessionTokenUsage = {
      current_session: {
        tavily_requests: sessionTotals.tavily_requests,
        gemini_tokens: sessionTotals.gemini_tokens,
        claude_tokens: sessionTotals.claude_tokens,
        estimated_cost: estimateSessionCost(sessionTotals.claude_tokens),
      },
      today: {
        tavily_requests: todayTotals.tavily_requests,
        gemini_tokens: todayTotals.gemini_tokens,
        claude_tokens: todayTotals.claude_tokens,
        total_cost: todayTotals.total_cost,
      },
      this_month: {
        tavily_requests: monthTotals.tavily_requests,
        gemini_tokens: monthTotals.gemini_tokens,
        claude_tokens: monthTotals.claude_tokens,
        total_cost: monthTotals.total_cost,
      },
      limits: {
        tavily_monthly: 1000,
        gemini_daily: 2_000_000,
        budget_monthly: 20,
      },
      warning,
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
