import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateArticleStructure } from '@/lib/ai';
import { GenerateStructureRequest, GenerateStructureResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateStructureRequest = await request.json();
    const { articleId } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: 'articleId is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get article info
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('topic, research_data')
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Get saved sources for this article
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('id, title, summary, source_type')
      .eq('article_id', articleId)
      .eq('saved', true);

    if (sourcesError) {
      console.error('Sources fetch error:', sourcesError);
      return NextResponse.json(
        { error: 'Failed to fetch sources' },
        { status: 500 }
      );
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json(
        { error: 'No saved sources found. Save some sources before generating structure.' },
        { status: 400 }
      );
    }

    // Generate article structure
    const { structure, tokensUsed } = await generateArticleStructure(
      article.topic,
      sources.map((s) => ({
        id: s.id,
        title: s.title || 'Untitled',
        summary: s.summary || '',
        source_type: s.source_type || 'other',
      }))
    );

    // Update article with structure
    const researchData = article.research_data || {};
    researchData.structure = structure;

    const { error: updateError } = await supabase
      .from('articles')
      .update({
        research_data: researchData,
        status: 'drafting',
      })
      .eq('id', articleId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save structure' },
        { status: 500 }
      );
    }

    // Track usage
    await supabase.from('api_usage').insert({
      article_id: articleId,
      service: 'gemini_pro',
      requests: 1,
      tokens_input: Math.floor(tokensUsed * 0.7),
      tokens_output: Math.floor(tokensUsed * 0.3),
      cost_usd: 0,
    });

    const response: GenerateStructureResponse = { structure };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Generate structure error:', error);
    return NextResponse.json(
      { error: 'Failed to generate structure' },
      { status: 500 }
    );
  }
}
