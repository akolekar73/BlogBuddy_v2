import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { StartResearchResponse, RefinementData } from '@/lib/types';

interface StartResearchWithRefinementRequest {
  topic: string;
  autonomyLevel: number;
  refinementData?: RefinementData;
}

export async function POST(request: NextRequest) {
  try {
    const body: StartResearchWithRefinementRequest = await request.json();
    const { topic, autonomyLevel, refinementData } = body;

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const validAutonomy = Math.min(5, Math.max(1, autonomyLevel || 3));

    // Use thesis as title if available, otherwise use topic
    const title = refinementData?.thesis?.slice(0, 100) || topic.trim();

    const supabase = createServerClient();

    // Build research_data with queries from refinement if available
    const researchData: Record<string, unknown> = {
      queries: refinementData?.research_questions || [topic],
    };

    // Create the article with refinement_data if provided
    const insertData: Record<string, unknown> = {
      title,
      topic,
      status: 'research',
      autonomy_level: validAutonomy,
      research_data: researchData,
    };

    // Add refinement_data if provided
    if (refinementData) {
      insertData.refinement_data = refinementData;
    }

    const { data: article, error } = await supabase
      .from('articles')
      .insert(insertData)
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
