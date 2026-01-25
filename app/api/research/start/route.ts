import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { StartResearchRequest, StartResearchResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: StartResearchRequest = await request.json();
    const { topic, autonomyLevel } = body;

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const validAutonomy = Math.min(5, Math.max(1, autonomyLevel || 3));

    // Use topic as title directly (skip AI generation for now)
    const title = topic.trim();

    const supabase = createServerClient();

    // Create the article
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title,
        topic,
        status: 'research',
        autonomy_level: validAutonomy,
        research_data: { queries: [topic] },
      })
      .select('id, title')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create article' },
        { status: 500 }
      );
    }

    const response: StartResearchResponse = {
      articleId: article.id,
      title: article.title,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Start research error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
