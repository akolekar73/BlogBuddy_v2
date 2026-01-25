import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { models } from '@/lib/ai';
import { createServerClient } from '@/lib/supabase';
import { RefineRecommendFrameworkRequest, FrameworkRecommendation } from '@/lib/types';
import { FRAMEWORK_RECOMMENDATION_PROMPT } from '@/lib/refinement-prompts';

export async function POST(request: NextRequest) {
  try {
    const body: RefineRecommendFrameworkRequest = await request.json();
    const { conversationHistory } = body;

    if (!conversationHistory || conversationHistory.length === 0) {
      return NextResponse.json(
        { error: 'Conversation history is required' },
        { status: 400 }
      );
    }

    // Build the conversation summary
    const conversationSummary = conversationHistory
      .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');

    const prompt = `${FRAMEWORK_RECOMMENDATION_PROMPT}

## Conversation to analyze:
${conversationSummary}

Respond with only valid JSON.`;

    const { text, usage } = await generateText({
      model: models.pro,
      prompt,
    });

    // Track usage
    const supabase = createServerClient();
    await supabase.from('api_usage').insert({
      service: 'gemini_pro',
      requests: 1,
      tokens_input: prompt.length,
      tokens_output: usage?.totalTokens || 0,
      cost_usd: 0,
    });

    // Parse the JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const recommendation: FrameworkRecommendation = JSON.parse(jsonMatch[0]);

      // Validate the response
      if (!recommendation.recommended || !Array.isArray(recommendation.recommended)) {
        throw new Error('Invalid recommendation format');
      }

      return NextResponse.json(recommendation);
    } catch (parseError) {
      console.error('Failed to parse recommendation:', parseError);
      // Return a default recommendation
      return NextResponse.json({
        recommended: ['why_now'],
        reasoning: 'Based on your topic, exploring "why now" timing could provide valuable insights.',
        confidence: 'low',
      } as FrameworkRecommendation);
    }
  } catch (error) {
    console.error('Recommend framework error:', error);
    return NextResponse.json(
      { error: 'Failed to recommend framework' },
      { status: 500 }
    );
  }
}
