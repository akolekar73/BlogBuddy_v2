'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SessionTokenUsage } from '@/lib/types';

interface TokenMonitorPanelProps {
  usage: SessionTokenUsage | null;
}

export function TokenMonitorPanel({ usage }: TokenMonitorPanelProps) {
  if (!usage) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tavilyPercent =
    (usage.this_month.tavily_requests / usage.limits.tavily_monthly) * 100;
  const geminiPercent =
    (usage.today.gemini_tokens / usage.limits.gemini_daily) * 100;
  const budgetPercent =
    (usage.this_month.total_cost / usage.limits.budget_monthly) * 100;

  return (
    <div className="space-y-4">
      {/* Current Session */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Current Session</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tavily:</span>
            <span className="font-medium">
              {usage.current_session.tavily_requests} requests
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gemini:</span>
            <span className="font-medium">
              {(usage.current_session.gemini_tokens / 1000).toFixed(1)}K tokens
            </span>
          </div>
          {usage.current_session.claude_tokens > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Claude:</span>
              <span className="font-medium">
                {(usage.current_session.claude_tokens / 1000).toFixed(1)}K tokens
              </span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between font-medium">
            <span>Est. Cost:</span>
            <span className="text-green-600">
              ${usage.current_session.estimated_cost.toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Usage Limits */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Monthly Limits</h4>

        {/* Tavily */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Tavily</span>
            <span
              className={cn(
                'font-medium',
                tavilyPercent > 80 && 'text-yellow-600',
                tavilyPercent > 95 && 'text-red-600'
              )}
            >
              {usage.this_month.tavily_requests} / {usage.limits.tavily_monthly}
            </span>
          </div>
          <Progress
            value={Math.min(tavilyPercent, 100)}
            className={cn(
              'h-2',
              tavilyPercent > 80 && '[&>div]:bg-yellow-500',
              tavilyPercent > 95 && '[&>div]:bg-red-500'
            )}
          />
          <p className="text-xs text-muted-foreground">Resets monthly</p>
        </div>

        {/* Gemini */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Gemini (Today)</span>
            <span
              className={cn(
                'font-medium',
                geminiPercent > 80 && 'text-yellow-600',
                geminiPercent > 95 && 'text-red-600'
              )}
            >
              {(usage.today.gemini_tokens / 1000).toFixed(0)}K / 2M
            </span>
          </div>
          <Progress
            value={Math.min(geminiPercent, 100)}
            className={cn(
              'h-2',
              geminiPercent > 80 && '[&>div]:bg-yellow-500',
              geminiPercent > 95 && '[&>div]:bg-red-500'
            )}
          />
          <p className="text-xs text-muted-foreground">Free tier - Resets daily</p>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Budget</span>
            <span
              className={cn(
                'font-medium',
                budgetPercent > 80 && 'text-yellow-600',
                budgetPercent > 95 && 'text-red-600'
              )}
            >
              ${usage.this_month.total_cost.toFixed(2)} / $
              {usage.limits.budget_monthly}
            </span>
          </div>
          <Progress
            value={Math.min(budgetPercent, 100)}
            className={cn(
              'h-2',
              budgetPercent > 80 && '[&>div]:bg-yellow-500',
              budgetPercent > 95 && '[&>div]:bg-red-500'
            )}
          />
          <p className="text-xs text-muted-foreground">Resets monthly</p>
        </div>
      </div>

      {usage.warning && (
        <>
          <Separator />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{usage.warning}</AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
