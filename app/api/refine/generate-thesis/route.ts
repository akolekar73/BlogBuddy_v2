import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { models } from '@/lib/ai';
import { createServerClient } from '@/lib/supabase';
import { RefineGenerateThesisRequest, ThesisResult } from '@/lib/types';
import { buildThesisGenerationPrompt } from '@/lib/refinement-prompts';

export async function POST(request: NextRequest) {
  try {
    const body: RefineGenerateThesisRequest = await request.json();
    const {
      initialIdea,
      socraticData,
      frameworksUsed,
      whyNowData,
      landscapeData,
      problemSolutionData,
    } = body;

    if (!initialIdea || !frameworksUsed || frameworksUsed.length === 0) {
      return NextResponse.json(
        { error: 'Initial idea and frameworks are required' },
        { status: 400 }
      );
    }

    // Build the prompt
    const prompt = buildThesisGenerationPrompt(
      initialIdea,
      socraticData || [],
      frameworksUsed,
      whyNowData,
      landscapeData,
      problemSolutionData
    );

    const { text, usage } = await generateText({
      model: models.pro,
      prompt,
    });

    // Track usage
    const supabase = createServerClient();
    await supabase.from('api_usage').insert({
      service: 'gemini_pro',
      requests: 1,
      tokens_input: prompt.length,
      tokens_output: usage?.totalTokens || 0,
      cost_usd: 0,
    });

    // Parse the JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const thesis: ThesisResult = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!thesis.thesis || !thesis.structure || !thesis.research_questions) {
        throw new Error('Invalid thesis format');
      }

      return NextResponse.json(thesis);
    } catch (parseError) {
      console.error('Failed to parse thesis:', parseError);

      // Return a default thesis structure
      const defaultThesis: ThesisResult = {
        thesis: `Exploring ${initialIdea}: A comprehensive analysis of the key trends, players, and opportunities.`,
        structure: {
          sections: [
            {
              title: 'Introduction',
              key_points: ['Set the context', 'Present the thesis'],
              suggested_sources: ['Industry reports'],
            },
            {
              title: 'Current Landscape',
              key_points: ['Key players', 'Market dynamics'],
              suggested_sources: ['Company websites', 'News articles'],
            },
            {
              title: 'Key Developments',
              key_points: ['Recent trends', 'Notable innovations'],
              suggested_sources: ['VC reports', 'Tech blogs'],
            },
            {
              title: 'Analysis',
              key_points: ['Implications', 'Future outlook'],
              suggested_sources: ['Academic papers', 'Expert opinions'],
            },
            {
              title: 'Conclusion',
              key_points: ['Key takeaways', 'Call to action'],
              suggested_sources: [],
            },
          ],
        },
        research_questions: [
          `What are the main trends in ${initialIdea}?`,
          `Who are the key players in this space?`,
          `What challenges exist in ${initialIdea}?`,
          `What opportunities are emerging?`,
          `How is the landscape expected to evolve?`,
        ],
        target_sources: ['VC reports', 'news articles', 'company blogs', 'academic papers'],
        estimated_scope: 8,
        recommended_autonomy: 3,
      };

      return NextResponse.json(defaultThesis);
    }
  } catch (error) {
    console.error('Generate thesis error:', error);
    return NextResponse.json(
      { error: 'Failed to generate thesis' },
      { status: 500 }
    );
  }
}
