import { Framework, RefinementMessage, WhyNowData, LandscapeData, ProblemSolutionData } from './types';

export const SOCRATIC_SYSTEM_PROMPT = `You are a thoughtful research assistant helping a user refine their article idea for technology thought leadership content.

Your goal: Ask 3-4 targeted questions to understand:
1. What sparked their interest in this topic
2. Who their target audience is
3. What type of insight they're seeking (timing, landscape, solution, etc.)

Guidelines:
- Keep responses to 2-3 sentences max
- Ask ONE question at a time
- Be conversational and friendly
- After 3-4 exchanges, you should have enough context to recommend a framework
- Detect signals for framework recommendation:
  - "why now", "what changed", "timing", "catalyst", "breakthrough" → Why Now framework
  - "landscape", "players", "who's doing what", "market map", "competitors" → Landscape Analysis
  - "problem", "solution", "gap", "pain point", "unmet need" → Problem-Solution

When you have gathered enough information (after 3-4 exchanges), end your response with:
[READY_FOR_FRAMEWORK]

This signals that we can move to framework selection.`;

export const FRAMEWORK_RECOMMENDATION_PROMPT = `You are analyzing a conversation to recommend the best thinking framework(s) for a technology thought leadership article.

Available frameworks:
1. **why_now** - Best for timing/catalyst questions. Use when the user is interested in:
   - Why something is happening now vs before
   - What changed to enable something
   - Technology breakthroughs or inflection points
   - Market timing opportunities

2. **landscape_analysis** - Best for market mapping. Use when the user is interested in:
   - Who the key players are
   - How the market is structured
   - Comparing different approaches
   - Understanding the competitive dynamics

3. **problem_solution** - Best for solution exploration. Use when the user is interested in:
   - A specific problem and potential solutions
   - Why existing solutions don't work
   - What gaps exist in current approaches
   - How to solve a particular challenge

Analyze the conversation and respond in JSON format:
{
  "recommended": ["framework1", "framework2"],
  "reasoning": "Brief explanation of why these frameworks fit",
  "confidence": "high" | "medium" | "low"
}

Notes:
- You can recommend 1-2 frameworks
- If the topic naturally spans multiple angles, recommend both
- "high" confidence = clear signals in the conversation
- "medium" confidence = some signals, but could go multiple ways
- "low" confidence = unclear, user should choose`;

export function buildSidebarAssistantPrompt(
  framework: Framework,
  field: string,
  userInput: string,
  context: Record<string, unknown>
): string {
  const frameworkNames: Record<Framework, string> = {
    why_now: 'Why Now',
    landscape_analysis: 'Landscape Analysis',
    problem_solution: 'Problem-Solution',
  };

  const fieldGuidance: Record<string, string> = {
    // Why Now fields
    technology: 'Help them be specific about the technology or trend being analyzed',
    catalysts: 'Help identify what specific events or changes are driving this',
    catalyst_details: 'Help them elaborate with concrete examples and data points',
    evidence_needed: 'Suggest what evidence would make their argument compelling',
    past_failures: 'Help them articulate why previous attempts didn\'t succeed',
    current_enablers: 'Help them identify what\'s different now that enables success',

    // Landscape fields
    market: 'Help them define the market boundaries clearly',
    segmentation_approach: 'Help them choose the most insightful way to segment',
    known_players: 'Help them think of players they might have missed',
    contested_aspects: 'Help identify the most debated or unclear areas',
    value_proposition: 'Help articulate what unique insight readers will gain',

    // Problem-Solution fields
    problem: 'Help them articulate the problem precisely and specifically',
    who_affected: 'Help them define the affected audience clearly',
    why_unsolved: 'Help them understand the barriers to solving this',
    recent_changes: 'Help identify what has changed that makes a solution possible now',
  };

  return `You are a helpful assistant guiding a user through a ${frameworkNames[framework]} framework form.

The user is filling in the field: "${field}"
Their current input: "${userInput}"
Context from other fields: ${JSON.stringify(context)}

Your job:
${fieldGuidance[field] || 'Help them make their input more specific and researchable'}

Guidelines:
- If input is vague, suggest more specific phrasing
- If input is good, affirm it briefly
- Provide 1-2 sentence suggestions
- Focus on making input researchable and concrete
- Don't be verbose - keep it actionable

Example interaction:
User writes: "AI got better"
You suggest: "Try: 'GPT-4 achieved >85% accuracy on multi-step reasoning, crossing enterprise threshold' - this gives you something concrete to verify in research."`;
}

export function buildThesisGenerationPrompt(
  initialIdea: string,
  socraticData: RefinementMessage[],
  frameworksUsed: Framework[],
  whyNowData?: WhyNowData,
  landscapeData?: LandscapeData,
  problemSolutionData?: ProblemSolutionData
): string {
  const frameworkNames: Record<Framework, string> = {
    why_now: 'Why Now',
    landscape_analysis: 'Landscape Analysis',
    problem_solution: 'Problem-Solution',
  };

  const conversationSummary = socraticData
    .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    .join('\n');

  let frameworkDataSection = '';

  if (whyNowData) {
    frameworkDataSection += `\n\n### Why Now Framework Data:\n${JSON.stringify(whyNowData, null, 2)}`;
  }
  if (landscapeData) {
    frameworkDataSection += `\n\n### Landscape Analysis Framework Data:\n${JSON.stringify(landscapeData, null, 2)}`;
  }
  if (problemSolutionData) {
    frameworkDataSection += `\n\n### Problem-Solution Framework Data:\n${JSON.stringify(problemSolutionData, null, 2)}`;
  }

  return `You are synthesizing a user's topic refinement into a clear thesis and research plan for a technology thought leadership article.

## Initial Idea
${initialIdea}

## Discovery Conversation
${conversationSummary}

## Frameworks Used
${frameworksUsed.map((f) => frameworkNames[f]).join(', ')}
${frameworkDataSection}

## Your Task
Generate a comprehensive thesis and research plan. Return as JSON:

{
  "thesis": "A compelling 1-2 sentence thesis statement that captures their refined angle. Make it specific, provocative, and researchable.",
  "structure": {
    "sections": [
      {
        "title": "Section title",
        "key_points": ["Point 1 to cover", "Point 2 to cover"],
        "suggested_sources": ["type of source needed, e.g., 'VC funding data', 'company blog posts'"]
      }
    ]
  },
  "research_questions": [
    "Specific, researchable question 1",
    "Specific, researchable question 2"
  ],
  "target_sources": ["VC reports", "academic papers", "company blogs", "news articles", "podcasts"],
  "estimated_scope": 8,
  "recommended_autonomy": 3
}

Guidelines:
- Thesis should be insight-driven, not just descriptive
- Include 5-7 sections that tell a compelling narrative
- Generate 7-10 specific, researchable questions
- Target sources should match the frameworks used
- Estimated scope is number of sources (5-15)
- Recommended autonomy 1-5 based on complexity (3 is default)`;
}
