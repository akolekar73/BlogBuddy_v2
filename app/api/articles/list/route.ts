import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: articles, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        topic,
        status,
        autonomy_level,
        research_data,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('List articles error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      );
    }

    // Get source counts for each article
    const articleIds = articles?.map((a) => a.id) || [];

    let sourceCounts: Record<string, number> = {};
    if (articleIds.length > 0) {
      const { data: counts } = await supabase
        .from('sources')
        .select('article_id')
        .in('article_id', articleIds)
        .eq('saved', true);

      if (counts) {
        sourceCounts = counts.reduce((acc, curr) => {
          acc[curr.article_id] = (acc[curr.article_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }
    }

    // Add source count to each article
    const articlesWithCounts = (articles || []).map((article) => ({
      ...article,
      source_count: sourceCounts[article.id] || 0,
    }));

    return NextResponse.json({ articles: articlesWithCounts });
  } catch (error) {
    console.error('List articles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
