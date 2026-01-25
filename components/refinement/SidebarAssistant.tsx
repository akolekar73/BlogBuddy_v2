'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, ChevronRight, ChevronLeft, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Framework } from '@/lib/types';

interface SidebarAssistantProps {
  framework: Framework;
  currentField: string;
  currentValue: string;
  formContext: object;
  onSuggestionApply?: (suggestion: string) => void;
}

export function SidebarAssistant({
  framework,
  currentField,
  currentValue,
  formContext,
  onSuggestionApply,
}: SidebarAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestion = useCallback(async () => {
    if (!currentField || !currentValue || currentValue.length < 10) {
      setSuggestion('');
      return;
    }

    setIsLoading(true);
    setSuggestion('');

    try {
      const response = await fetch('/api/refine/assist-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framework,
          field: currentField,
          userInput: currentValue,
          context: formContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestion');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          content += chunk;
          setSuggestion(content);
        }
      }
    } catch (error) {
      console.error('Assistant error:', error);
      setSuggestion('');
    } finally {
      setIsLoading(false);
    }
  }, [framework, currentField, currentValue, formContext]);

  // Debounced fetch when input changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestion();
    }, 1000); // Wait 1 second after user stops typing

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchSuggestion]);

  // Auto-scroll when suggestion updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [suggestion]);

  if (!isExpanded) {
    return (
      <div className="border-l bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          className="h-full w-8 rounded-none"
          onClick={() => setIsExpanded(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-72 border-l bg-muted/30 flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setIsExpanded(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {!currentField ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start filling out the form.</p>
            <p className="text-xs mt-1">I&apos;ll provide suggestions as you type.</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : suggestion ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm whitespace-pre-wrap">{suggestion}</p>
            </div>
            {onSuggestionApply && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  // Extract any quoted suggestion from the response
                  const match = suggestion.match(/["']([^"']+)["']/);
                  if (match) {
                    onSuggestionApply(match[1]);
                  }
                }}
              >
                Apply Suggestion
              </Button>
            )}
          </div>
        ) : currentValue && currentValue.length >= 10 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Your input looks good!</p>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Keep typing...</p>
            <p className="text-xs mt-1">I&apos;ll suggest improvements when you write more.</p>
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t">
        <p className="text-xs text-muted-foreground">
          Currently editing: <span className="font-medium">{currentField || 'None'}</span>
        </p>
      </div>
    </div>
  );
}
