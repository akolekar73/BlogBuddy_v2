import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { streamChatResponse } from '@/lib/ai';
import { ChatRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { articleId, message } = body;

    if (!articleId || !message) {
      return new Response(JSON.stringify({ error: 'articleId and message are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createServerClient();

    // Get sources for this article
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('id, title, summary, url, source_type')
      .eq('article_id', articleId)
      .eq('saved', true);

    if (sourcesError) {
      console.error('Sources fetch error:', sourcesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch sources' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get chat history
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Save user message
    await supabase.from('chat_messages').insert({
      article_id: articleId,
      role: 'user',
      content: message,
    });

    // Prepare sources for context
    const sourceContext = (sources || []).map((s) => ({
      title: s.title || 'Untitled',
      summary: s.summary || '',
      url: s.url,
    }));

    // Prepare chat history
    const history = (chatHistory || []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Stream the response
    const result = await streamChatResponse(message, sourceContext, history);

    // Track usage (approximate)
    await supabase.from('api_usage').insert({
      article_id: articleId,
      service: 'gemini_pro',
      requests: 1,
      tokens_input: message.length,
      tokens_output: 500, // Approximate
      cost_usd: 0,
    });

    // Return the streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Chat failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
