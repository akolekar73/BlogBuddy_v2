import { generateText, streamText, embed } from 'ai';
import { google } from '@ai-sdk/google';
import { SourceType } from './types';

// Model configurations
export const models = {
  flash: google('gemini-1.5-flash'),
  pro: google('gemini-1.5-pro'),
  embedding: google.textEmbeddingModel('text-embedding-004'),
};

// Generate embedding for text
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: models.embedding,
    value: text,
  });
  return embedding;
}

// Summarize content using Gemini Flash
export async function summarizeContent(
  content: string,
  url: string
): Promise<{ summary: string; sourceType: SourceType; tokensUsed: number }> {
  const prompt = `Analyze this web content and provide:
1. A concise 2-3 sentence summary of the key insights
2. The source type classification

Content from ${url}:
${content.slice(0, 8000)}

Respond in JSON format:
{
  "summary": "Your summary here",
  "sourceType": "one of: vc_report, academic, blog, podcast, news, documentation, social, other"
}`;

  const { text, usage } = await generateText({
    model: models.flash,
    prompt,
  });

  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        summary: text.slice(0, 500),
        sourceType: 'other',
        tokensUsed: (usage?.totalTokens || 0),
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: parsed.summary || text.slice(0, 500),
      sourceType: validateSourceType(parsed.sourceType),
      tokensUsed: (usage?.totalTokens || 0),
    };
  } catch {
    return {
      summary: text.slice(0, 500),
      sourceType: 'other',
      tokensUsed: (usage?.totalTokens || 0),
    };
  }
}

// Validate source type
function validateSourceType(type: string): SourceType {
  const validTypes: SourceType[] = [
    'vc_report',
    'academic',
    'blog',
    'podcast',
    'news',
    'documentation',
    'social',
    'other',
  ];
  return validTypes.includes(type as SourceType) ? (type as SourceType) : 'other';
}

// Generate research questions based on topic
export async function generateResearchQuestions(
  topic: string,
  autonomyLevel: number
): Promise<{ questions: string[]; tokensUsed: number }> {
  const numQuestions = autonomyLevel * 2; // 2-10 questions based on autonomy

  const prompt = `You are a technology research assistant helping create thought leadership content.

Topic: ${topic}

Generate ${numQuestions} specific research questions that would help create an insightful article about this topic. Focus on:
- Recent developments and trends
- Key players and their strategies
- Technical innovations
- Market implications
- Future predictions

Respond with a JSON array of questions:
["question 1", "question 2", ...]`;

  const { text, usage } = await generateText({
    model: models.flash,
    prompt,
  });

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { questions: [topic], tokensUsed: usage?.totalTokens || 0 };
    }
    const questions = JSON.parse(jsonMatch[0]);
    return { questions, tokensUsed: usage?.totalTokens || 0 };
  } catch {
    return { questions: [topic], tokensUsed: usage?.totalTokens || 0 };
  }
}

// Stream chat response with context from sources
export async function streamChatResponse(
  message: string,
  sources: Array<{ title: string; summary: string; url: string }>,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  const sourceContext = sources
    .map((s, i) => `[${i + 1}] ${s.title}\nURL: ${s.url}\nSummary: ${s.summary}`)
    .join('\n\n');

  const systemPrompt = `You are a research assistant helping create technology thought leadership articles.

You have access to the following research sources:
${sourceContext}

Help the user understand the research, identify patterns, and develop insights for their article.
When referencing information, cite the source number in brackets like [1].
Be concise but insightful.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...chatHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ];

  return streamText({
    model: models.pro,
    messages,
  });
}

// Generate article structure from sources
export async function generateArticleStructure(
  topic: string,
  sources: Array<{ id: string; title: string; summary: string; source_type: string }>
): Promise<{
  structure: {
    sections: Array<{
      title: string;
      key_points: string[];
      suggested_sources: string[];
    }>;
    suggested_angle: string;
    key_takeaways: string[];
  };
  tokensUsed: number;
}> {
  const sourceList = sources
    .map((s) => `ID: ${s.id}\nTitle: ${s.title}\nType: ${s.source_type}\nSummary: ${s.summary}`)
    .join('\n\n---\n\n');

  const prompt = `You are a content strategist helping create a technology thought leadership article.

Topic: ${topic}

Research Sources:
${sourceList}

Based on these sources, propose an article structure that:
1. Tells a compelling narrative (not just facts)
2. Has a unique angle or thesis
3. Flows naturally between sections
4. Uses the sources effectively

Respond in JSON format:
{
  "suggested_angle": "The main thesis or unique perspective for this article",
  "sections": [
    {
      "title": "Section title",
      "key_points": ["Point 1", "Point 2"],
      "suggested_sources": ["source_id_1", "source_id_2"]
    }
  ],
  "key_takeaways": ["Main insight 1", "Main insight 2", "Main insight 3"]
}`;

  const { text, usage } = await generateText({
    model: models.pro,
    prompt,
  });

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    const structure = JSON.parse(jsonMatch[0]);
    return { structure, tokensUsed: usage?.totalTokens || 0 };
  } catch {
    // Return a default structure if parsing fails
    return {
      structure: {
        suggested_angle: `Exploring ${topic}`,
        sections: [
          {
            title: 'Introduction',
            key_points: ['Set the context', 'Present the thesis'],
            suggested_sources: [],
          },
          {
            title: 'Key Developments',
            key_points: ['Main trends', 'Notable players'],
            suggested_sources: sources.slice(0, 3).map((s) => s.id),
          },
          {
            title: 'Analysis',
            key_points: ['Implications', 'Future outlook'],
            suggested_sources: sources.slice(3, 6).map((s) => s.id),
          },
          {
            title: 'Conclusion',
            key_points: ['Summarize insights', 'Call to action'],
            suggested_sources: [],
          },
        ],
        key_takeaways: ['Key insight from research'],
      },
      tokensUsed: usage?.totalTokens || 0,
    };
  }
}

// Generate a title from topic
export async function generateTitle(topic: string): Promise<string> {
  const { text } = await generateText({
    model: models.flash,
    prompt: `Generate a concise, engaging article title for a thought leadership piece about: ${topic}

Just respond with the title, nothing else. No quotes.`,
  });

  return text.trim().replace(/^["']|["']$/g, '');
}
