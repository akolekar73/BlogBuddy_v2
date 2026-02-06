'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, FileText, Loader2, Sparkles, Save, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { Article, Source, ArticleStructure } from '@/lib/types';

interface ArticleWithDetails extends Article {
  sources?: Source[];
}

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const [article, setArticle] = useState<ArticleWithDetails | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [structure, setStructure] = useState<ArticleStructure | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (articleId) {
      loadArticle();
      loadSources();
    }
  }, [articleId]);

  const loadArticle = async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}`);
      if (res.ok) {
        const data = await res.json();
        setArticle(data.article);
        setContent(data.article.content || '');
        if (data.article.research_data?.structure) {
          setStructure(data.article.research_data.structure);
        }
      }
    } catch (err) {
      console.error('Failed to load article:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSources = async () => {
    try {
      const res = await fetch(`/api/sources?articleId=${articleId}&savedOnly=true`);
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error('Failed to load sources:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground">Article not found</p>
        <Button variant="link" onClick={() => router.push('/')}>
          Go back home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{article.title}</h1>
                <p className="text-sm text-muted-foreground">{article.topic}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{sources.length} sources</Badge>
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Writing Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Write Your Article
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your article here. Use the structure and sources on the right for guidance..."
                  className="min-h-[500px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Structure & Sources */}
          <div className="space-y-4">
            <Tabs defaultValue="structure">
              <TabsList className="w-full">
                <TabsTrigger value="structure" className="flex-1 gap-1">
                  <Sparkles className="h-4 w-4" />
                  Structure
                </TabsTrigger>
                <TabsTrigger value="sources" className="flex-1 gap-1">
                  <BookOpen className="h-4 w-4" />
                  Sources
                </TabsTrigger>
              </TabsList>

              <TabsContent value="structure" className="mt-4">
                <ScrollArea className="h-[600px]">
                  {structure ? (
                    <div className="space-y-4 pr-4">
                      {structure.suggested_angle && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Suggested Angle</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              {structure.suggested_angle}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {structure.sections?.map((section, index) => (
                        <Collapsible key={index} defaultOpen={index === 0}>
                          <Card>
                            <CollapsibleTrigger className="w-full">
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm text-left">
                                    {index + 1}. {section.title}
                                  </CardTitle>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {section.key_points?.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-primary">•</span>
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      ))}

                      {structure.key_takeaways && structure.key_takeaways.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Key Takeaways</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {structure.key_takeaways.map((takeaway, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-primary">•</span>
                                  <span>{takeaway}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No structure generated yet</p>
                      <p className="text-sm">Generate a structure from your saved sources</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="sources" className="mt-4">
                <ScrollArea className="h-[600px]">
                  {sources.length > 0 ? (
                    <div className="space-y-3 pr-4">
                      {sources.map((source) => (
                        <Card key={source.id} className="overflow-hidden">
                          <CardContent className="p-3">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              {source.title}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                              {source.summary}
                            </p>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {source.source_type}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No saved sources</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
