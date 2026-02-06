import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateText, embed } from 'ai';
import { google } from '@ai-sdk/google';
import { tavily } from '@tavily/core';
import { SourceType } from '@/lib/types';

const models = {
  flash: google('gemini-2.0-flash'),
  embedding: google.textEmbeddingModel('text-embedding-004'),
};

interface StructuredSearchRequest {
  articleId: string;
  section: {
    title: string;
    key_points: string[];
  };
  sectionIndex: number;
  autonomyLevel: number;
  sessionId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: StructuredSearchRequest = await request.json();
    const { articleId, section, sectionIndex, autonomyLevel, sessionId } = body;

    if (!articleId || !section || !sessionId) {
      return NextResponse.json(
        { error: 'articleId, section, and sessionId are required' },
        { status: 400 }
      );
    }

    // Check for Tavily API key
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      console.error('TAVILY_API_KEY is not set');
      return NextResponse.json(
        { error: 'Tavily API key not configured', sources: [] },
        { status: 500 }
      );
    }

    const supabase = createServerClient();
    const tavilyClient = tavily({ apiKey: tavilyApiKey });
    const results: Array<{
      id: string;
      url: string;
      title: string;
      summary: string;
    }> = [];

    // Generate search queries for this section
    const queries = await generateSectionQueries(section, autonomyLevel);

    // Domains to exclude for better source quality
    const excludeDomains = [
      'facebook.com',
      'twitter.com',
      'x.com',
      'linkedin.com',
      'instagram.com',
      'tiktok.com',
      'reddit.com',
      'pinterest.com',
      'quora.com',
    ];

    // Search with Tavily
    for (const query of queries) {
      try {
        const tavilyResults = await tavilyClient.search(query, {
          maxResults: 3,
          searchDepth: autonomyLevel >= 3 ? 'advanced' : 'basic',
          includeRawContent: 'text',
          excludeDomains,
        });

        // Track Tavily usage
        await trackUsage(supabase, 'tavily', 0, 0, 1, articleId, sessionId);

        // Process each result
        for (const result of tavilyResults.results || []) {
          // Skip if we already have this URL
          if (results.some((r) => r.url === result.url)) continue;

          // Skip low-quality sources that might have slipped through
          const urlLower = result.url.toLowerCase();
          if (
            urlLower.includes('facebook.com') ||
            urlLower.includes('twitter.com') ||
            urlLower.includes('x.com/') ||
            urlLower.includes('linkedin.com') ||
            urlLower.includes('instagram.com') ||
            urlLower.includes('tiktok.com') ||
            urlLower.includes('reddit.com') ||
            urlLower.includes('pinterest.com')
          ) {
            continue;
          }

          const content = result.rawContent || result.content || '';

          // Summarize with Gemini
          const { text: summary, usage } = await generateText({
            model: models.flash,
            prompt: `
              Summarize this article in 2-3 sentences, focusing on how it relates to: "${section.title}"

              Key points to address:
              ${section.key_points.join('\n')}

              Article content:
              ${content.substring(0, 3000)}
            `,
          });

          // Track Gemini usage
          const totalTokens = usage?.totalTokens || 0;
          await trackUsage(
            supabase,
            'gemini_flash',
            Math.floor(totalTokens * 0.3),  // Approximate input tokens
            Math.floor(totalTokens * 0.7),  // Approximate output tokens
            1,
            articleId,
            sessionId
          );

          // Generate embedding
          const { embedding } = await embed({
            model: models.embedding,
            value: summary,
          });

          // Detect source type
          const sourceType = detectSourceType(result.url);

          // Save source
          console.log('Attempting to save source to Supabase:', result.url);
          const { data: source, error } = await supabase
            .from('sources')
            .insert({
              article_id: articleId,
              url: result.url,
              title: result.title || 'Untitled',
              summary,
              content: content.slice(0, 10000),
              source_type: sourceType,
              relevance_score: result.score || 0.5,
              saved: false,
              embedding: JSON.stringify(embedding),
            })
            .select()
            .single();

          if (error) {
            console.error('Supabase insert error:', error.message, error.details, error.hint);
          } else if (source) {
            console.log('Successfully saved source:', source.id);
            results.push({
              id: source.id,
              url: source.url,
              title: source.title || 'Untitled',
              summary: source.summary || '',
            });
          }
        }
      } catch (searchError) {
        console.error(`Error searching for "${query}":`, searchError);
        // Log more details about the error
        if (searchError instanceof Error) {
          console.error('Error message:', searchError.message);
          console.error('Error stack:', searchError.stack);
        }
        // Continue with other queries
      }
    }

    console.log('Returning', results.length, 'sources from structured search');
    return NextResponse.json({ sources: results });
  } catch (error) {
    console.error('Structured search error:', error);
    return NextResponse.json(
      { error: 'Structured search failed' },
      { status: 500 }
    );
  }
}

async function generateSectionQueries(
  section: { title: string; key_points: string[] },
  autonomyLevel: number
): Promise<string[]> {
  const numQueries = Math.min(2 + Math.floor(autonomyLevel / 2), 5);

  try {
    const { text } = await generateText({
      model: models.flash,
      prompt: `
        Generate ${numQueries} specific search queries to research this article section.

        Section title: ${section.title}
        Key points to cover:
        ${section.key_points.join('\n')}

        Return ONLY a JSON array of strings: ["query 1", "query 2", ...]
        Make queries specific and targeted for finding high-quality sources.
        Focus on finding concrete data, case studies, and expert perspectives.
      `,
    });

    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [section.title]; // Fallback
  } catch {
    return [section.title]; // Fallback
  }
}

function detectSourceType(url: string): SourceType {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('arxiv.org')) return 'academic';
  if (
    urlLower.includes('a16z.com') ||
    urlLower.includes('sequoia') ||
    urlLower.includes('ycombinator') ||
    urlLower.includes('techcrunch.com/venture')
  )
    return 'vc_report';
  if (urlLower.includes('blog') || urlLower.includes('medium.com'))
    return 'blog';
  if (urlLower.includes('podcast') || urlLower.includes('spotify.com'))
    return 'podcast';
  if (
    urlLower.includes('news') ||
    urlLower.includes('reuters') ||
    urlLower.includes('bbc')
  )
    return 'news';
  if (urlLower.includes('docs.') || urlLower.includes('documentation'))
    return 'documentation';
  if (
    urlLower.includes('twitter.com') ||
    urlLower.includes('x.com') ||
    urlLower.includes('linkedin.com')
  )
    return 'social';
  if (urlLower.endsWith('.pdf')) return 'academic';
  return 'other';
}

async function trackUsage(
  supabase: ReturnType<typeof createServerClient>,
  service: string,
  tokensIn: number,
  tokensOut: number,
  requests: number,
  articleId: string,
  sessionId: string
) {
  await supabase.from('api_usage').insert({
    service,
    session_id: sessionId,
    article_id: articleId,
    tokens_input: tokensIn,
    tokens_output: tokensOut,
    requests: requests,
    cost_usd: 0, // Free tier for MVP
  });
}
