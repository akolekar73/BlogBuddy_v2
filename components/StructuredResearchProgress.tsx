'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CheckCircle2, Circle, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResearchSection } from '@/lib/types';

interface StructuredResearchProgressProps {
  sections: ResearchSection[];
  currentSection: number;
  overallProgress: number;
}

export function StructuredResearchProgress({
  sections,
  currentSection,
  overallProgress,
}: StructuredResearchProgressProps) {
  const totalSources = sections.reduce((sum, s) => sum + s.sources.length, 0);
  const isComplete = currentSection >= sections.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Overall Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Research Progress</h2>
          <Badge variant={isComplete ? 'default' : 'secondary'}>
            Section {Math.min(currentSection + 1, sections.length)} of{' '}
            {sections.length}
          </Badge>
        </div>
        <Progress value={overallProgress} className="h-2" />
        <p className="text-sm text-muted-foreground">
          {isComplete
            ? `Found ${totalSources} sources across all sections`
            : 'Researching your article structure...'}
        </p>
      </div>

      {/* Section Breakdown */}
      <div className="space-y-3">
        {sections.map((section, idx) => (
          <Card
            key={idx}
            className={cn(
              'transition-all',
              section.status === 'researching' && 'border-primary shadow-md',
              section.status === 'complete' && 'border-green-200'
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {section.status === 'complete' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {section.status === 'researching' && (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    )}
                    {section.status === 'pending' && (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold">
                      {idx + 1}. {section.title}
                    </CardTitle>
                    <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                      {section.key_points.map((point, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-muted-foreground mr-2">·</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Badge
                  variant={
                    section.status === 'complete'
                      ? 'default'
                      : section.status === 'researching'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="shrink-0"
                >
                  {section.status === 'complete' &&
                    `${section.sources.length} sources`}
                  {section.status === 'researching' && 'In Progress'}
                  {section.status === 'pending' && 'Pending'}
                </Badge>
              </div>
            </CardHeader>

            {section.status === 'researching' && (
              <CardContent className="pt-0 space-y-2">
                <Progress value={section.progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  Found {section.sources.length} sources so far...
                </p>
              </CardContent>
            )}

            {section.status === 'complete' && section.sources.length > 0 && (
              <CardContent className="pt-0">
                <Collapsible>
                  <CollapsibleTrigger className="text-sm text-primary hover:underline flex items-center gap-1">
                    View {section.sources.length} sources
                    <ExternalLink className="h-3 w-3" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="space-y-2">
                      {section.sources.map((source) => (
                        <div
                          key={source.id}
                          className="p-3 bg-muted/50 rounded-md border hover:border-primary/50 transition-colors"
                        >
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            {source.title}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <p className="text-xs text-muted-foreground mt-1">
                            {source.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Status Alert */}
      {!isComplete && sections[currentSection] && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Currently researching:{' '}
            <strong>{sections[currentSection].title}</strong>
          </AlertDescription>
        </Alert>
      )}

      {isComplete && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Research complete!</strong> Found {totalSources} sources
            across {sections.length} sections. You&apos;re ready to start writing.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
