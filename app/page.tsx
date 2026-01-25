'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CostMonitor } from '@/components/cost-monitor';
import { ArticleList } from '@/components/article-list';
import { ResearchPanel } from '@/components/research-panel';
import { Article, UsageStats } from '@/lib/types';
import { getAutonomyLabel } from '@/lib/utils';

interface ArticleWithCount extends Article {
  source_count?: number;
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const [autonomyLevel, setAutonomyLevel] = useState(3);
  const [isStarting, setIsStarting] = useState(false);
  const [articles, setArticles] = useState<ArticleWithCount[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Active research session
  const [activeSession, setActiveSession] = useState<{
    articleId: string;
    title: string;
    topic: string;
    autonomyLevel: number;
  } | null>(null);

  // Load articles and usage stats on mount
  useEffect(() => {
    loadArticles();
    loadUsageStats();
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

  const loadUsageStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/usage/stats');
      const data = await res.json();
      setUsageStats(data);
    } catch (err) {
      console.error('Failed to load usage stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleStartResearch = async () => {
    if (!topic.trim()) return;

    setIsStarting(true);
    try {
      const res = await fetch('/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, autonomyLevel }),
      });

      if (!res.ok) {
        throw new Error('Failed to start research');
      }

      const data = await res.json();

      setActiveSession({
        articleId: data.articleId,
        title: data.title,
        topic,
        autonomyLevel,
      });

      setTopic('');
    } catch (err) {
      console.error('Failed to start research:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleContinueArticle = (articleId: string) => {
    const article = articles.find((a) => a.id === articleId);
    if (article) {
      setActiveSession({
        articleId: article.id,
        title: article.title,
        topic: article.topic,
        autonomyLevel: article.autonomy_level,
      });
    }
  };

  const handleCloseSession = () => {
    setActiveSession(null);
    loadArticles();
    loadUsageStats();
  };

  // If there's an active research session, show the research panel
  if (activeSession) {
    return (
      <ResearchPanel
        articleId={activeSession.articleId}
        title={activeSession.title}
        topic={activeSession.topic}
        autonomyLevel={activeSession.autonomyLevel}
        onClose={handleCloseSession}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cost Monitor Header */}
      <CostMonitor stats={usageStats} isLoading={isLoadingStats} />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">BlogBuddy</h1>
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
                    handleStartResearch();
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
                {autonomyLevel === 1 && 'You select which questions to explore. Minimal API usage.'}
                {autonomyLevel === 2 && 'Conservative research with your guidance.'}
                {autonomyLevel === 3 && 'Balanced approach with moderate exploration.'}
                {autonomyLevel === 4 && 'Exploratory research covering more angles.'}
                {autonomyLevel === 5 && 'Extensive autonomous research. Higher API usage.'}
              </p>
            </div>

            <Button
              onClick={handleStartResearch}
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
    </div>
  );
}
