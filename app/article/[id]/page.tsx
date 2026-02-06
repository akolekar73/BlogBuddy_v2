'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, FileText, Loader2, Sparkles, Save, Copy, Check, ChevronRight, Circle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Article, Source, ArticleStructure } from '@/lib/types';

interface ArticleWithDetails extends Article {
  sources?: Source[];
}

interface SectionContent {
  [key: number]: string;
}

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const [article, setArticle] = useState<ArticleWithDetails | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [structure, setStructure] = useState<ArticleStructure | null>(null);
  const [content, setContent] = useState('');
  const [sectionContent, setSectionContent] = useState<SectionContent>({});
  const [activeSection, setActiveSection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

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
          // Parse existing content into sections if available
          if (data.article.content) {
            parseSectionContent(data.article.content, data.article.research_data.structure);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load article:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const parseSectionContent = (content: string, struct: ArticleStructure) => {
    // Try to parse content by section markers
    const sections: SectionContent = {};
    let remaining = content;

    struct.sections?.forEach((section, index) => {
      const nextSection = struct.sections?.[index + 1];
      const startMarker = `## ${section.title}`;
      const endMarker = nextSection ? `## ${nextSection.title}` : null;

      const startIdx = remaining.indexOf(startMarker);
      if (startIdx !== -1) {
        const contentStart = startIdx + startMarker.length;
        const endIdx = endMarker ? remaining.indexOf(endMarker) : remaining.length;
        sections[index] = remaining.slice(contentStart, endIdx !== -1 ? endIdx : undefined).trim();
      }
    });

    setSectionContent(sections);
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

  const handleSectionContentChange = (sectionIndex: number, text: string) => {
    setSectionContent(prev => ({
      ...prev,
      [sectionIndex]: text
    }));
    // Rebuild full content
    rebuildContent({ ...sectionContent, [sectionIndex]: text });
  };

  const rebuildContent = (sections: SectionContent) => {
    if (!structure?.sections) return;

    let fullContent = '';

    // Add suggested angle as intro if available
    if (structure.suggested_angle) {
      fullContent += `# ${article?.title || 'Article'}\n\n`;
      fullContent += `*${structure.suggested_angle}*\n\n`;
    }

    structure.sections.forEach((section, index) => {
      fullContent += `## ${section.title}\n\n`;
      fullContent += (sections[index] || '') + '\n\n';
    });

    // Add key takeaways if available
    if (structure.key_takeaways && structure.key_takeaways.length > 0) {
      fullContent += `## Key Takeaways\n\n`;
      structure.key_takeaways.forEach(takeaway => {
        fullContent += `- ${takeaway}\n`;
      });
    }

    setContent(fullContent.trim());
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

  const getSectionStatus = (index: number): 'empty' | 'in-progress' | 'complete' => {
    const text = sectionContent[index] || '';
    if (text.length === 0) return 'empty';
    if (text.length < 100) return 'in-progress';
    return 'complete';
  };

  const getRelevantSources = (sectionIndex: number): Source[] => {
    if (!structure?.sections?.[sectionIndex]) return sources;
    const section = structure.sections[sectionIndex];
    if (section.suggested_sources && section.suggested_sources.length > 0) {
      return sources.filter(s => section.suggested_sources.includes(s.id));
    }
    return sources;
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

  const currentSection = structure?.sections?.[activeSection];
  const relevantSources = getRelevantSources(activeSection);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold truncate max-w-md">{article.title}</h1>
                <p className="text-sm text-muted-foreground truncate max-w-md">{article.topic}</p>
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
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Structure Outline */}
        <div className="w-72 border-r bg-muted/30 flex flex-col shrink-0">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Article Structure
            </h2>
            {structure?.suggested_angle && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {structure.suggested_angle}
              </p>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {structure?.sections ? (
                <div className="space-y-1">
                  {structure.sections.map((section, index) => {
                    const status = getSectionStatus(index);
                    const isActive = activeSection === index;

                    return (
                      <button
                        key={index}
                        onClick={() => setActiveSection(index)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all",
                          "flex items-start gap-3 group",
                          isActive
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          {status === 'complete' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : status === 'in-progress' ? (
                            <div className="h-5 w-5 rounded-full border-2 border-primary bg-primary/20" />
                          ) : (
                            <Circle className={cn(
                              "h-5 w-5",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            isActive ? "text-primary" : "text-foreground"
                          )}>
                            {index + 1}. {section.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {section.key_points?.length || 0} key points
                          </p>
                        </div>
                        <ChevronRight className={cn(
                          "h-4 w-4 shrink-0 transition-transform",
                          isActive ? "text-primary rotate-90" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                        )} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No structure yet</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Progress indicator */}
          {structure?.sections && (
            <div className="p-4 border-t bg-background">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {Object.values(sectionContent).filter(s => s && s.length >= 100).length} / {structure.sections.length}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${(Object.values(sectionContent).filter(s => s && s.length >= 100).length / structure.sections.length) * 100}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Center - Writing Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentSection ? (
            <>
              {/* Section Header */}
              <div className="p-4 border-b bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {activeSection + 1}. {currentSection.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Write content for this section using the key points as guidance
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSources(!showSources)}
                    className="gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    {showSources ? 'Hide' : 'Show'} Sources ({relevantSources.length})
                  </Button>
                </div>

                {/* Key Points */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Key points to cover:</p>
                  <ul className="space-y-1">
                    {currentSection.key_points?.map((point, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Writing Area */}
              <div className="flex-1 p-4 overflow-hidden flex gap-4">
                <div className={cn("flex-1 flex flex-col", showSources && "w-1/2")}>
                  <Textarea
                    value={sectionContent[activeSection] || ''}
                    onChange={(e) => handleSectionContentChange(activeSection, e.target.value)}
                    placeholder={`Write about "${currentSection.title}"...\n\nConsider addressing:\n${currentSection.key_points?.map(p => `• ${p}`).join('\n')}`}
                    className="flex-1 resize-none font-mono text-sm min-h-[300px]"
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{(sectionContent[activeSection] || '').length} characters</span>
                    <div className="flex gap-2">
                      {activeSection > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveSection(activeSection - 1)}
                        >
                          ← Previous
                        </Button>
                      )}
                      {structure?.sections && activeSection < structure.sections.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveSection(activeSection + 1)}
                        >
                          Next →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sources Panel (toggleable) */}
                {showSources && (
                  <div className="w-1/2 border-l pl-4">
                    <ScrollArea className="h-full">
                      <div className="space-y-3 pr-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Reference sources for this section:
                        </p>
                        {relevantSources.map((source) => (
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
                        {relevantSources.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No sources linked to this section
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Select a section to start writing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
