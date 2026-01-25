import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { models } from '@/lib/ai';
import { createServerClient } from '@/lib/supabase';
import { RefineAssistFormRequest } from '@/lib/types';
import { buildSidebarAssistantPrompt } from '@/lib/refinement-prompts';

export async function POST(request: NextRequest) {
  try {
    const body: RefineAssistFormRequest = await request.json();
    const { framework, field, userInput, context } = body;

    if (!framework || !field) {
      return new Response(JSON.stringify({ error: 'Framework and field are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build the prompt
    const prompt = buildSidebarAssistantPrompt(framework, field, userInput || '', context || {});

    // Use Gemini Flash for faster responses
    const result = streamText({
      model: models.flash,
      prompt,
    });

    // Track usage
    const supabase = createServerClient();
    await supabase.from('api_usage').insert({
      service: 'gemini_flash',
      requests: 1,
      tokens_input: prompt.length,
      tokens_output: 200, // Approximate - sidebar responses are short
      cost_usd: 0,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Assist form error:', error);
    return new Response(JSON.stringify({ error: 'Assistance failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
