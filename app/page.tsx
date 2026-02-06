'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TopNavBar } from '@/components/TopNavBar';
import { ArticleList } from '@/components/article-list';
import { ResearchPanel } from '@/components/research-panel';
import { RefinementModal } from '@/components/refinement/RefinementModal';
import { StructuredResearchProgress } from '@/components/StructuredResearchProgress';
import {
  Article,
  RefinementData,
  AppPhase,
  RefinementStep,
  StructuredResearchProgress as ResearchProgressType,
} from '@/lib/types';
import { getAutonomyLabel } from '@/lib/utils';

interface ArticleWithCount extends Article {
  source_count?: number;
}

// Generate unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const [autonomyLevel, setAutonomyLevel] = useState(3);
  const [isStarting, setIsStarting] = useState(false);
  const [articles, setArticles] = useState<ArticleWithCount[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);

  // Session ID for tracking
  const sessionId = useMemo(() => generateSessionId(), []);

  // Phase navigation state
  const [currentPhase, setCurrentPhase] = useState<AppPhase>('idle');
  const [currentRefinementStep, setCurrentRefinementStep] = useState<RefinementStep>('socratic');

  // Refinement state
  const [showRefinement, setShowRefinement] = useState(false);
  const [pendingTopic, setPendingTopic] = useState('');

  // Research progress state
  const [researchProgress, setResearchProgress] = useState<ResearchProgressType | null>(null);
  const [articleId, setArticleId] = useState<string | null>(null);

  // Active research session (for existing research panel flow)
  const [activeSession, setActiveSession] = useState<{
    articleId: string;
    title: string;
    topic: string;
    autonomyLevel: number;
    refinementData?: RefinementData;
    savedResearchData?: Article['research_data'];
  } | null>(null);

  // Load articles on mount
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setIsLoadingArticles(true);
    try {
      const res = await fetch('/api/articles/list');
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  const handleNavigateToPhase = (target: string) => {
    const [phase, step] = target.split(':');

    if (phase === 'idle') {
      setCurrentPhase('idle');
      setShowRefinement(false);
      setResearchProgress(null);
      setArticleId(null);
      setActiveSession(null);
      return;
    }

    if (phase === 'refinement') {
      setCurrentPhase('refinement');
      setCurrentRefinementStep(step as RefinementStep);
      // Re-open refinement modal if needed
      if (!showRefinement && pendingTopic) {
        setShowRefinement(true);
      }
    }
  };

  const handleOpenRefinement = () => {
    if (!topic.trim()) return;
    setPendingTopic(topic.trim());
    setShowRefinement(true);
    setCurrentPhase('refinement');
    setCurrentRefinementStep('socratic');
  };

  const handleRefinementComplete = async (refinementData: RefinementData) => {
    setShowRefinement(false);
    setIsStarting(true);

    try {
      const res = await fetch('/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: refinementData.thesis || pendingTopic,
          autonomyLevel: refinementData.recommended_autonomy || autonomyLevel,
          refinementData,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to start research');
      }

      const data = await res.json();
      setArticleId(data.articleId);

      // Start structured research automatically if we have sections
      if (refinementData.structure?.sections?.length > 0) {
        setCurrentPhase('structured_research');
        await startStructuredResearch(
          data.articleId,
          refinementData.structure.sections,
          refinementData.recommended_autonomy || autonomyLevel
        );
      } else {
        // Fall back to traditional research panel
        setActiveSession({
          articleId: data.articleId,
          title: data.title,
          topic: refinementData.thesis || pendingTopic,
          autonomyLevel: refinementData.recommended_autonomy || autonomyLevel,
          refinementData,
        });
      }

      setTopic('');
      setPendingTopic('');
    } catch (err) {
      console.error('Failed to start research:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const startStructuredResearch = async (
    artId: string,
    sections: Array<{ title: string; key_points: string[]; suggested_sources: string[] }>,
    autonomy: number
  ) => {
    // Initialize research progress
    const initialProgress: ResearchProgressType = {
      currentSection: 0,
      sections: sections.map((s) => ({
        title: s.title,
        key_points: s.key_points,
        status: 'pending' as const,
        sources: [],
        progress: 0,
      })),
      overallProgress: 0,
    };
    setResearchProgress(initialProgress);

    // Research each section sequentially
    for (let i = 0; i < sections.length; i++) {
      // Mark as researching
      setResearchProgress((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentSection: i,
          sections: prev.sections.map((s, idx) =>
            idx === i ? { ...s, status: 'researching' as const, progress: 0 } : s
          ),
        };
      });

      try {
        // Call API
        const response = await fetch('/api/research/structured-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleId: artId,
            section: sections[i],
            sectionIndex: i,
            autonomyLevel: autonomy,
            sessionId,
          }),
        });

        const sectionResults = await response.json();

        // Mark as complete
        setResearchProgress((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.map((s, idx) =>
              idx === i
                ? {
                    ...s,
                    status: 'complete' as const,
                    sources: sectionResults.sources || [],
                    progress: 100,
                  }
                : s
            ),
            overallProgress: ((i + 1) / sections.length) * 100,
          };
        });
      } catch (error) {
        console.error(`Error researching section ${i}:`, error);
        // Mark as complete even on error to continue
        setResearchProgress((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.map((s, idx) =>
              idx === i
                ? {
                    ...s,
                    status: 'complete' as const,
                    progress: 100,
                  }
                : s
            ),
            overallProgress: ((i + 1) / sections.length) * 100,
          };
        });
      }

      // Small delay between sections
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // All complete
    setCurrentPhase('complete');
  };

  const handleRefinementSkip = async () => {
    setShowRefinement(false);
    setCurrentPhase('idle');
    setIsStarting(true);

    try {
      const res = await fetch('/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: pendingTopic, autonomyLevel }),
      });

      if (!res.ok) {
        throw new Error('Failed to start research');
      }

      const data = await res.json();

      setActiveSession({
        articleId: data.articleId,
        title: data.title,
        topic: pendingTopic,
        autonomyLevel,
      });

      setTopic('');
      setPendingTopic('');
    } catch (err) {
      console.error('Failed to start research:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleContinueArticle = (articleIdParam: string) => {
    const article = articles.find((a) => a.id === articleIdParam);
    if (article) {
      // Cast to include refinement_data which is fetched from API
      const articleWithRefinement = article as ArticleWithCount & { refinement_data?: RefinementData };
      setActiveSession({
        articleId: article.id,
        title: article.title,
        topic: article.topic,
        autonomyLevel: article.autonomy_level,
        refinementData: articleWithRefinement.refinement_data,
        savedResearchData: article.research_data,
      });
    }
  };

  const handleCloseSession = () => {
    setActiveSession(null);
    setCurrentPhase('idle');
    setResearchProgress(null);
    loadArticles();
  };

  const handleResearchComplete = () => {
    // When research is complete, user can continue to writing
    if (articleId) {
      setActiveSession({
        articleId: articleId,
        title: pendingTopic || 'Research Session',
        topic: pendingTopic || 'Research Session',
        autonomyLevel,
      });
    }
    setCurrentPhase('idle');
    setResearchProgress(null);
  };

  // If there's an active research session, show the research panel
  if (activeSession) {
    return (
      <ResearchPanel
        articleId={activeSession.articleId}
        title={activeSession.title}
        topic={activeSession.topic}
        autonomyLevel={activeSession.autonomyLevel}
        refinementData={activeSession.refinementData}
        savedResearchData={activeSession.savedResearchData}
        onClose={handleCloseSession}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <TopNavBar
        currentPhase={currentPhase}
        currentRefinementStep={currentRefinementStep}
        onNavigateToPhase={handleNavigateToPhase}
        sessionId={sessionId}
      />

      {/* Main Content */}
      {currentPhase === 'structured_research' && researchProgress ? (
        <div className="py-8">
          <StructuredResearchProgress
            sections={researchProgress.sections}
            currentSection={researchProgress.currentSection}
            overallProgress={researchProgress.overallProgress}
          />
          {researchProgress.overallProgress >= 100 && (
            <div className="flex justify-center mt-6">
              <Button onClick={handleResearchComplete} size="lg">
                Continue to Writing
              </Button>
            </div>
          )}
        </div>
      ) : currentPhase === 'complete' && researchProgress ? (
        <div className="py-8">
          <StructuredResearchProgress
            sections={researchProgress.sections}
            currentSection={researchProgress.sections.length}
            overallProgress={100}
          />
          <div className="flex justify-center mt-6">
            <Button onClick={handleResearchComplete} size="lg">
              Continue to Writing
            </Button>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              AI-powered research assistant for technology thought leadership
            </p>
          </div>

          {/* New Research Section */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Start New Research
              </CardTitle>
              <CardDescription>
                Enter a topic to research for your next thought leadership article
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., AI Agents in enterprise workflows, Web3 gaming trends, Stablecoin regulations..."
                  className="h-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isStarting && topic.trim()) {
                      handleOpenRefinement();
                    }
                  }}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Autonomy Level: {autonomyLevel}
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {getAutonomyLabel(autonomyLevel)}
                  </span>
                </div>
                <Slider
                  value={[autonomyLevel]}
                  onValueChange={([value]) => setAutonomyLevel(value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Guided</span>
                  <span>Autonomous</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {autonomyLevel === 1 &&
                    'You select which questions to explore. Minimal API usage.'}
                  {autonomyLevel === 2 && 'Conservative research with your guidance.'}
                  {autonomyLevel === 3 && 'Balanced approach with moderate exploration.'}
                  {autonomyLevel === 4 && 'Exploratory research covering more angles.'}
                  {autonomyLevel === 5 && 'Extensive autonomous research. Higher API usage.'}
                </p>
              </div>

              <Button
                onClick={handleOpenRefinement}
                disabled={!topic.trim() || isStarting}
                className="w-full h-11"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Research...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Start Research
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Past Articles Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Research Sessions</h2>
            <ArticleList
              articles={articles}
              onContinue={handleContinueArticle}
              isLoading={isLoadingArticles}
            />
          </div>
        </div>
      )}

      {/* Refinement Modal */}
      <RefinementModal
        initialTopic={pendingTopic}
        isOpen={showRefinement}
        onClose={() => {
          setShowRefinement(false);
          setCurrentPhase('idle');
        }}
        onComplete={handleRefinementComplete}
        onSkip={handleRefinementSkip}
      />
    </div>
  );
}
