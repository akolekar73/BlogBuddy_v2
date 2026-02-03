'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, Zap, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { UsageStats } from '@/lib/types';
import { formatNumber, formatCurrency } from '@/lib/utils';

interface CostMonitorProps {
  stats: UsageStats | null;
  isLoading: boolean;
}

export function CostMonitor({ stats, isLoading }: CostMonitorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading || !stats) {
    return (
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Loading usage stats...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tavilyPercent = (stats.tavily_requests / stats.tavily_limit) * 100;
  const geminiPercent = (stats.gemini_tokens / stats.gemini_limit) * 100;

  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between py-2 h-auto"
            >
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    Est. Cost: {formatCurrency(stats.total_cost)}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                  <span>
                    Tavily: {stats.tavily_requests}/{formatNumber(stats.tavily_limit)}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="h-3.5 w-3.5" />
                  <span>
                    Gemini: {formatNumber(stats.gemini_tokens)}/{formatNumber(stats.gemini_limit)}
                  </span>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pb-4">
            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <Search className="h-4 w-4" />
                    Tavily Search
                  </span>
                  <span className="text-muted-foreground">
                    {stats.tavily_requests} / {formatNumber(stats.tavily_limit)} requests
                  </span>
                </div>
                <Progress value={tavilyPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Basic plan: 1,000 requests/month (free)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4" />
                    Gemini AI
                  </span>
                  <span className="text-muted-foreground">
                    {formatNumber(stats.gemini_tokens)} / {formatNumber(stats.gemini_limit)} tokens
                  </span>
                </div>
                <Progress value={geminiPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Free tier: 2M tokens/day
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    Claude (Future)
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(stats.claude_cost)}
                  </span>
                </div>
                <Progress value={0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  $3/M input, $15/M output tokens
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
