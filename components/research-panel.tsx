'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Sparkles, X, BookOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SourceCard } from './source-card';
import { ChatSidebar } from './chat-sidebar';
import { Source, ArticleStructure } from '@/lib/types';

interface ResearchPanelProps {
  articleId: string;
  title: string;
  topic: string;
  autonomyLevel: number;
  onClose: () => void;
}

export function ResearchPanel({
  articleId,
  title,
  topic,
  autonomyLevel,
  onClose,
}: ResearchPanelProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [error, setError] = useState('');
  const [structure, setStructure] = useState<ArticleStructure | null>(null);
  const [activeTab, setActiveTab] = useState('sources');

  const savedSources = sources.filter((s) => s.saved);
  const initialSearchDone = useRef(false);

  const loadSources = async () => {
    try {
      const res = await fetch(`/api/sources?articleId=${articleId}`);
      const data = await res.json();
      if (data.sources) {
        setSources(data.sources);
      }
    } catch (err) {
      console.error('Failed to load sources:', err);
    }
  };

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery || topic;
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError('');
    setSearchStatus('Starting search...');

    try {
      const res = await fetch('/api/research/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          query: searchTerm,
          autonomyLevel,
        }),
      });

      if (!res.ok) {
        throw new Error('Search failed');
      }

      const data = await res.json();
      setSearchStatus(`Found ${data.sources.length} sources`);

      // Merge new sources with existing ones
      setSources((prev) => {
        const existingUrls = new Set(prev.map((s) => s.url));
        const newSources = data.sources.filter((s: Source) => !existingUrls.has(s.url));
        return [...prev, ...newSources];
      });

      setSearchQuery('');
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error(err);
    } finally {
      setIsSearching(false);
      setTimeout(() => setSearchStatus(''), 3000);
    }
  };

  const handleSaveSource = async (sourceId: string, saved: boolean) => {
    try {
      await fetch('/api/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, saved }),
      });

      setSources((prev) =>
        prev.map((s) => (s.id === sourceId ? { ...s, saved } : s))
      );
    } catch (err) {
      console.error('Failed to update source:', err);
    }
  };

  const handleRemoveSource = async (sourceId: string) => {
    try {
      await fetch(`/api/sources?sourceId=${sourceId}`, { method: 'DELETE' });
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
    } catch (err) {
      console.error('Failed to remove source:', err);
    }
  };

  const handleGenerateStructure = async () => {
    if (savedSources.length === 0) {
      setError('Save at least one source before generating structure.');
      return;
    }

    setIsGeneratingStructure(true);
    setError('');

    try {
      const res = await fetch('/api/structure/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate structure');
      }

      const data = await res.json();
      setStructure(data.structure);
      setActiveTab('structure');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate structure');
    } finally {
      setIsGeneratingStructure(false);
    }
  };

  // Load sources and run initial search on mount
  useEffect(() => {
    loadSources();

    // Run initial search only once
    if (!initialSearchDone.current) {
      initialSearchDone.current = true;
      handleSearch(topic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg truncate">{title}</h2>
          <p className="text-sm text-muted-foreground truncate">{topic}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Badge variant="secondary">{savedSources.length} saved</Badge>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Sidebar */}
        <div className="w-80 shrink-0 hidden lg:block">
          <ChatSidebar articleId={articleId} savedSourceCount={savedSources.length} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-2"
            >
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for more sources..."
                disabled={isSearching}
                className="flex-1"
              />
              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </form>
            {(searchStatus || isSearching) && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                {isSearching && <Loader2 className="h-3 w-3 animate-spin" />}
                {searchStatus || 'Searching...'}
              </p>
            )}
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 border-b">
              <TabsList>
                <TabsTrigger value="sources" className="gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  Sources ({sources.length})
                </TabsTrigger>
                <TabsTrigger value="saved" className="gap-1.5">
                  <FileText className="h-4 w-4" />
                  Saved ({savedSources.length})
                </TabsTrigger>
                {structure && (
                  <TabsTrigger value="structure" className="gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Structure
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <TabsContent value="sources" className="p-4 m-0">
                {sources.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-4">
                      {isSearching ? 'Searching for sources...' : 'No sources yet'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {sources.map((source) => (
                      <SourceCard
                        key={source.id}
                        source={source}
                        onSave={handleSaveSource}
                        onRemove={handleRemoveSource}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved" className="p-4 m-0">
                {savedSources.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-4">
                      Save sources to use in your article
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {savedSources.map((source) => (
                        <SourceCard
                          key={source.id}
                          source={source}
                          onSave={handleSaveSource}
                        />
                      ))}
                    </div>
                    <div className="flex justify-center pt-4">
                      <Button
                        size="lg"
                        onClick={handleGenerateStructure}
                        disabled={isGeneratingStructure || savedSources.length === 0}
                        className="gap-2"
                      >
                        {isGeneratingStructure ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generate Article Structure
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="structure" className="p-4 m-0">
                {structure && (
                  <div className="max-w-3xl mx-auto space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Suggested Angle
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{structure.suggested_angle}</p>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Article Structure</h3>
                      {structure.sections.map((section, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                              {index + 1}. {section.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-sm font-medium mb-1">Key Points:</p>
                              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {section.key_points.map((point, i) => (
                                  <li key={i}>{point}</li>
                                ))}
                              </ul>
                            </div>
                            {section.suggested_sources.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-1">Suggested Sources:</p>
                                <div className="flex flex-wrap gap-2">
                                  {section.suggested_sources.map((sourceId) => {
                                    const source = savedSources.find((s) => s.id === sourceId);
                                    if (!source) return null;
                                    return (
                                      <Badge key={sourceId} variant="secondary" className="text-xs">
                                        {source.title?.slice(0, 30) || 'Source'}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {structure.key_takeaways && structure.key_takeaways.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Key Takeaways</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {structure.key_takeaways.map((takeaway, i) => (
                              <li key={i}>{takeaway}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
