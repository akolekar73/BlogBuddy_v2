'use client';

import { useState, useEffect } from 'react';
import { Clock, Map, Lightbulb, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Framework, FrameworkRecommendation, RefinementMessage } from '@/lib/types';

interface FrameworkSelectorProps {
  conversationHistory: RefinementMessage[];
  selectedFrameworks: Framework[];
  onFrameworksChange: (frameworks: Framework[]) => void;
  onContinue: () => void;
}

const frameworks: {
  id: Framework;
  title: string;
  description: string;
  icon: React.ReactNode;
  bestFor: string[];
}[] = [
  {
    id: 'why_now',
    title: 'Why Now',
    description: 'Explore timing and catalysts. Why is this happening now? What changed?',
    icon: <Clock className="h-6 w-6" />,
    bestFor: ['Timing questions', 'Technology breakthroughs', 'Market inflection points'],
  },
  {
    id: 'landscape_analysis',
    title: 'Landscape Analysis',
    description: 'Map the market and players. Who is doing what? How is the space structured?',
    icon: <Map className="h-6 w-6" />,
    bestFor: ['Market mapping', 'Competitive analysis', 'Player comparison'],
  },
  {
    id: 'problem_solution',
    title: 'Problem-Solution',
    description: 'Analyze a problem and potential solutions. What gap exists? How to solve it?',
    icon: <Lightbulb className="h-6 w-6" />,
    bestFor: ['Pain point analysis', 'Solution exploration', 'Gap identification'],
  },
];

export function FrameworkSelector({
  conversationHistory,
  selectedFrameworks,
  onFrameworksChange,
  onContinue,
}: FrameworkSelectorProps) {
  const [recommendation, setRecommendation] = useState<FrameworkRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch recommendation on mount
  useEffect(() => {
    const fetchRecommendation = async () => {
      if (conversationHistory.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/refine/recommend-framework', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationHistory }),
        });

        if (response.ok) {
          const data: FrameworkRecommendation = await response.json();
          setRecommendation(data);

          // Auto-select recommended frameworks if none selected
          if (selectedFrameworks.length === 0 && data.recommended.length > 0) {
            onFrameworksChange(data.recommended);
          }
        }
      } catch (error) {
        console.error('Failed to get recommendation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationHistory]);

  const toggleFramework = (frameworkId: Framework) => {
    if (selectedFrameworks.includes(frameworkId)) {
      onFrameworksChange(selectedFrameworks.filter((f) => f !== frameworkId));
    } else {
      onFrameworksChange([...selectedFrameworks, frameworkId]);
    }
  };

  const isRecommended = (frameworkId: Framework) => {
    return recommendation?.recommended.includes(frameworkId) ?? false;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Choose Your Framework(s)</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select one or more frameworks to structure your thinking. You can use multiple for a hybrid approach.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Analyzing your conversation...</span>
          </div>
        ) : (
          <>
            {recommendation && (
              <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  AI Recommendation
                </div>
                <p className="text-sm text-muted-foreground mt-1">{recommendation.reasoning}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    Confidence: {recommendation.confidence}
                  </Badge>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {frameworks.map((framework) => {
                const isSelected = selectedFrameworks.includes(framework.id);
                const recommended = isRecommended(framework.id);

                return (
                  <Card
                    key={framework.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : recommended
                        ? 'border-primary/50'
                        : 'hover:border-primary/30'
                    }`}
                    onClick={() => toggleFramework(framework.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}
                          >
                            {framework.icon}
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {framework.title}
                              {recommended && (
                                <Badge className="text-xs">Recommended</Badge>
                              )}
                            </CardTitle>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/30'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-primary-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {framework.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {framework.bestFor.map((item) => (
                          <Badge key={item} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t">
        <Button
          onClick={onContinue}
          className="w-full"
          disabled={selectedFrameworks.length === 0}
        >
          Continue with {selectedFrameworks.length} Framework{selectedFrameworks.length !== 1 ? 's' : ''}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
