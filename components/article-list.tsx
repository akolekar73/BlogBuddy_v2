'use client';

import { FileText, ChevronRight, Calendar, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Article } from '@/lib/types';
import { formatRelativeTime, getStatusVariant, truncate } from '@/lib/utils';

interface ArticleWithCount extends Article {
  source_count?: number;
}

interface ArticleListProps {
  articles: ArticleWithCount[];
  onContinue: (articleId: string) => void;
  isLoading: boolean;
}

export function ArticleList({ articles, onContinue, isLoading }: ArticleListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No research sessions yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Start a new research session above to begin
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <Card
          key={article.id}
          className="group hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onContinue(article.id)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base font-semibold line-clamp-2">
                {article.title}
              </CardTitle>
              <Badge variant={getStatusVariant(article.status)} className="shrink-0">
                {article.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {truncate(article.topic, 50)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatRelativeTime(article.updated_at)}
                </span>
                {article.source_count !== undefined && article.source_count > 0 && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {article.source_count} sources
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
