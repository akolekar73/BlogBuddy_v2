import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { summarizeContent, generateEmbedding, generateResearchQuestions } from '@/lib/ai';
import { SearchRequest, SearchResponse, Source } from '@/lib/types';
import { tavily } from '@tavily/core';

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { articleId, query, autonomyLevel } = body;

    if (!articleId || !query) {
      return NextResponse.json(
        { error: 'articleId and query are required' },
        { status: 400 }
      );
    }

    // Initialize Tavily client inside the handler
    const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY || '' });

    const supabase = createServerClient();
    const level = Math.min(5, Math.max(1, autonomyLevel || 3));

    // Number of searches based on autonomy level
    const maxResults = level * 3; // 3-15 results based on level

    let totalTavilyRequests = 0;
    let totalGeminiTokens = 0;
    const allSources: Source[] = [];

    // Generate additional research questions for higher autonomy levels
    let queries = [query];
    if (level >= 3) {
      const { questions, tokensUsed } = await generateResearchQuestions(query, level);
      queries = [query, ...questions.slice(0, level - 1)];
      totalGeminiTokens += tokensUsed;
    }

    // Perform searches
    for (const searchQuery of queries) {
      try {
        const searchResult = await tavilyClient.search(searchQuery, {
          maxResults: Math.ceil(maxResults / queries.length),
          includeRawContent: 'text',
          searchDepth: level >= 4 ? 'advanced' : 'basic',
        });

        totalTavilyRequests++;

        // Process each result
        for (const result of searchResult.results) {
          // Skip if we already have this URL
          if (allSources.some((s) => s.url === result.url)) continue;

          // Summarize and classify the content
          const content = result.rawContent || result.content || '';
          const { summary, sourceType, tokensUsed } = await summarizeContent(
            content,
            result.url
          );
          totalGeminiTokens += tokensUsed;

          // Generate embedding for the content
          const textForEmbedding = `${result.title} ${summary}`;
          const embedding = await generateEmbedding(textForEmbedding);

          // Insert source into database
          const { data: source, error } = await supabase
            .from('sources')
            .insert({
              article_id: articleId,
              url: result.url,
              title: result.title,
              summary,
              content: content.slice(0, 10000), // Limit content size
              source_type: sourceType,
              relevance_score: result.score || 0.5,
              saved: false,
              embedding: JSON.stringify(embedding),
            })
            .select()
            .single();

          if (!error && source) {
            allSources.push({
              id: source.id,
              article_id: source.article_id,
              url: source.url,
              title: source.title,
              summary: source.summary,
              content: source.content,
              source_type: source.source_type,
              relevance_score: source.relevance_score,
              saved: source.saved,
              created_at: source.created_at,
            });
          }
        }
      } catch (searchError) {
        console.error('Search error for query:', searchQuery, searchError);
        // Continue with other queries
      }
    }

    // Track API usage
    await supabase.from('api_usage').insert([
      {
        article_id: articleId,
        service: 'tavily',
        requests: totalTavilyRequests,
        tokens_input: 0,
        tokens_output: 0,
        cost_usd: 0,
      },
      {
        article_id: articleId,
        service: 'gemini_flash',
        requests: allSources.length,
        tokens_input: Math.floor(totalGeminiTokens * 0.3),
        tokens_output: Math.floor(totalGeminiTokens * 0.7),
        cost_usd: 0,
      },
    ]);

    // Update article with queries used
    const { data: currentArticle } = await supabase
      .from('articles')
      .select('research_data')
      .eq('id', articleId)
      .single();

    if (currentArticle) {
      const researchData = currentArticle.research_data || {};
      researchData.queries = Array.from(new Set([...(researchData.queries || []), ...queries]));

      await supabase
        .from('articles')
        .update({ research_data: researchData })
        .eq('id', articleId);
    }

    const response: SearchResponse = {
      sources: allSources,
      usage: {
        tavily_requests: totalTavilyRequests,
        gemini_tokens: totalGeminiTokens,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
