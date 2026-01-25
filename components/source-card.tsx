'use client';

import { ExternalLink, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Source } from '@/lib/types';
import { getSourceTypeColor, truncate } from '@/lib/utils';

interface SourceCardProps {
  source: Source;
  onSave: (sourceId: string, saved: boolean) => void;
  onRemove?: (sourceId: string) => void;
  compact?: boolean;
}

export function SourceCard({ source, onSave, onRemove, compact = false }: SourceCardProps) {
  const sourceTypeLabel = source.source_type
    ?.replace('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Other';

  if (compact) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="flex-1 min-w-0">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm hover:underline line-clamp-1"
          >
            {source.title || 'Untitled'}
          </a>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {source.summary || 'No summary available'}
          </p>
        </div>
        <Badge variant="secondary" className={`text-xs shrink-0 ${getSourceTypeColor(source.source_type || 'other')}`}>
          {sourceTypeLabel}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="group relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline flex items-center gap-1.5 text-sm"
            >
              {truncate(source.title || 'Untitled', 60)}
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50" />
            </a>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {new URL(source.url).hostname}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={`shrink-0 text-xs ${getSourceTypeColor(source.source_type || 'other')}`}
          >
            {sourceTypeLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {source.summary || 'No summary available'}
        </p>
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant={source.saved ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSave(source.id, !source.saved)}
            className="gap-1.5"
          >
            {source.saved ? (
              <>
                <BookmarkCheck className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(source.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
