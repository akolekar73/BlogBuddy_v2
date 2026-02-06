'use client';

import { useState } from 'react';
import { FrameworkSelector } from '@/components/refinement/FrameworkSelector';
import { Framework, RefinementMessage } from '@/lib/types';

// Dummy socratic chat data
const dummyMessages: RefinementMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'I\'m looking to write about:\n\n"The rise of AI agents in software development"',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    role: 'assistant',
    content: 'That\'s a fascinating topic! AI agents are definitely transforming how we build software. To help focus your research, could you tell me what aspect interests you most?\n\n1. The technical capabilities and limitations of current AI coding assistants\n2. How development workflows are changing\n3. The business/market dynamics around these tools\n4. The future implications for software engineers',
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    role: 'user',
    content: 'I\'m most interested in why this is happening now - what changed to make AI agents viable for real coding work?',
    timestamp: new Date().toISOString(),
  },
  {
    id: '4',
    role: 'assistant',
    content: 'Great question! You\'re touching on the "why now" angle - exploring what technological and market shifts enabled this moment. This could include things like:\n\n- Advances in large language models (GPT-4, Claude, etc.)\n- Better context windows allowing for more code understanding\n- Improved training on code-specific datasets\n- Developer tooling maturity for integration\n\nWould you like to explore all of these factors, or focus on a specific catalyst?',
    timestamp: new Date().toISOString(),
  },
];

export default function TestFrameworkPage() {
  const [selectedFrameworks, setSelectedFrameworks] = useState<Framework[]>([]);

  return (
    <div className="h-screen bg-background">
      <FrameworkSelector
        conversationHistory={dummyMessages}
        selectedFrameworks={selectedFrameworks}
        onFrameworksChange={setSelectedFrameworks}
        onContinue={() => alert('Continue clicked! Selected: ' + selectedFrameworks.join(', '))}
      />
    </div>
  );
}
