'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ChevronDown,
  Activity,
  AlertCircle,
  MessageSquare,
  LayoutGrid,
  FileText,
  Home,
  Pencil,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TokenMonitorPanel } from './TokenMonitorPanel';
import { AppPhase, RefinementStep, SessionTokenUsage } from '@/lib/types';

interface TopNavBarProps {
  currentPhase: AppPhase;
  currentRefinementStep?: RefinementStep;
  onNavigateToPhase: (phase: string) => void;
  sessionId: string;
}

export function TopNavBar({
  currentPhase,
  currentRefinementStep,
  onNavigateToPhase,
  sessionId,
}: TopNavBarProps) {
  const [showTokenMonitor, setShowTokenMonitor] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<SessionTokenUsage | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch(`/api/usage/stats?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setTokenUsage(data);
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      }
    };

    fetchUsage();
    const interval = setInterval(fetchUsage, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [sessionId]);

  const canNavigateBack = currentPhase !== 'idle';

  return (
    <div className="border-b bg-background sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: App name & navigation */}
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-primary">BlogBuddy</h1>

            {canNavigateBack && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Navigate
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Jump To:</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {(currentPhase === 'structured_research' ||
                    currentPhase === 'complete') && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onNavigateToPhase('refinement:socratic')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Socratic Conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onNavigateToPhase('refinement:framework')}
                      >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Framework Selection
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onNavigateToPhase('refinement:thesis')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Thesis & Structure
                      </DropdownMenuItem>
                    </>
                  )}

                  {currentPhase === 'refinement' &&
                    currentRefinementStep !== 'socratic' && (
                      <DropdownMenuItem
                        onClick={() => onNavigateToPhase('refinement:socratic')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Back to Conversation
                      </DropdownMenuItem>
                    )}

                  {currentPhase === 'refinement' &&
                    currentRefinementStep === 'thesis_review' && (
                      <DropdownMenuItem
                        onClick={() => onNavigateToPhase('refinement:framework')}
                      >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Back to Framework
                      </DropdownMenuItem>
                    )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (confirm('Start over? Current progress will be lost.')) {
                        onNavigateToPhase('idle');
                      }
                    }}
                    className="text-destructive"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Start Over
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Center: Current phase indicator */}
          <div className="flex items-center gap-2">
            {currentPhase === 'refinement' && (
              <Badge variant="secondary" className="gap-1">
                <Pencil className="h-3 w-3" />
                Refining
                {currentRefinementStep && (
                  <span className="ml-1 text-xs">
                    ·{' '}
                    {currentRefinementStep === 'socratic'
                      ? 'Chat'
                      : currentRefinementStep === 'framework'
                      ? 'Framework'
                      : 'Thesis'}
                  </span>
                )}
              </Badge>
            )}
            {currentPhase === 'structured_research' && (
              <Badge variant="secondary" className="gap-1">
                <Search className="h-3 w-3" />
                Researching
              </Badge>
            )}
            {currentPhase === 'complete' && (
              <Badge className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </Badge>
            )}
          </div>

          {/* Right: Token monitor */}
          <Popover open={showTokenMonitor} onOpenChange={setShowTokenMonitor}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'gap-2',
                  tokenUsage?.warning && 'border-yellow-500 text-yellow-700'
                )}
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Usage</span>
                {tokenUsage?.warning && (
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <TokenMonitorPanel usage={tokenUsage} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
