import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { models } from '@/lib/ai';
import { createServerClient } from '@/lib/supabase';
import { RefineChatRequest } from '@/lib/types';
import { SOCRATIC_SYSTEM_PROMPT } from '@/lib/refinement-prompts';

export async function POST(request: NextRequest) {
  try {
    const body: RefineChatRequest = await request.json();
    const { message, conversationHistory } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build messages for the AI
    const messages = [
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Stream the response using Gemini Pro for better reasoning
    const result = streamText({
      model: models.pro,
      system: SOCRATIC_SYSTEM_PROMPT,
      messages,
    });

    // Track usage
    const supabase = createServerClient();
    await supabase.from('api_usage').insert({
      service: 'gemini_pro',
      requests: 1,
      tokens_input: message.length + conversationHistory.reduce((acc, m) => acc + m.content.length, 0),
      tokens_output: 500, // Approximate
      cost_usd: 0,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Refine chat error:', error);
    return new Response(JSON.stringify({ error: 'Chat failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
