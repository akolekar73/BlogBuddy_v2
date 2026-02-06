import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { models } from '@/lib/ai';
import { RefinementMessage, Framework } from '@/lib/types';

interface SuggestFieldRequest {
  framework: Framework;
  field: string;
  fieldLabel: string;
  conversationHistory: RefinementMessage[];
}

const FIELD_PROMPTS: Record<Framework, Record<string, string>> = {
  why_now: {
    technology: 'What is the main technology or trend being discussed?',
    catalyst_details: 'What are the key catalysts or changes driving this trend?',
    evidence_needed: 'What evidence or data would strengthen the argument?',
    past_failures: 'Why might previous attempts have failed?',
    current_enablers: 'What has changed now that enables success?',
  },
  landscape_analysis: {
    market_definition: 'How would you define this market or space?',
    key_players: 'Who are the key players in this space?',
    market_segments: 'What are the main segments in this market?',
    trends: 'What are the key trends shaping this landscape?',
    gaps: 'What gaps or opportunities exist in the market?',
  },
  problem_solution: {
    problem_statement: 'What is the core problem being addressed?',
    affected_users: 'Who is most affected by this problem?',
    current_solutions: 'What current solutions exist?',
    solution_gaps: 'What gaps exist in current solutions?',
    proposed_approach: 'What new approach is being considered?',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: SuggestFieldRequest = await request.json();
    const { framework, field, fieldLabel, conversationHistory } = body;

    if (!framework || !field || !conversationHistory) {
      return NextResponse.json(
        { error: 'Framework, field, and conversationHistory are required' },
        { status: 400 }
      );
    }

    // Build conversation context
    const conversationText = conversationHistory
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    const fieldQuestion = FIELD_PROMPTS[framework]?.[field] || `What would you suggest for ${fieldLabel}?`;

    const prompt = `Based on the following conversation about a research topic, extract or suggest content for a specific form field.

CONVERSATION:
${conversationText}

TASK: ${fieldQuestion}

FIELD TO FILL: "${fieldLabel}"

Instructions:
- Extract relevant information from the conversation that answers this question
- If there's no explicit information, make a reasonable suggestion based on the context
- Be concise and specific
- Return ONLY the suggested text for this field, nothing else
- Do not include quotes or labels, just the content`;

    const { text } = await generateText({
      model: models.flash,
      prompt,
    });

    return NextResponse.json({ suggestion: text.trim() });
  } catch (error) {
    console.error('Suggest field error:', error);
    return NextResponse.json(
      { error: 'Suggestion failed' },
      { status: 500 }
    );
  }
}
