'use client';

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Edit2, Check, X, Rocket, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ThesisResult,
  Framework,
  RefinementMessage,
  WhyNowData,
  LandscapeData,
  ProblemSolutionData,
} from '@/lib/types';

interface ThesisReviewProps {
  initialIdea: string;
  socraticData: RefinementMessage[];
  frameworksUsed: Framework[];
  whyNowData?: WhyNowData;
  landscapeData?: LandscapeData;
  problemSolutionData?: ProblemSolutionData;
  thesis: ThesisResult | null;
  onThesisChange: (thesis: ThesisResult) => void;
  onRegenerate: () => void;
  onBack: () => void;
  onStartResearch: () => void;
}

export function ThesisReview({
  initialIdea,
  socraticData,
  frameworksUsed,
  whyNowData,
  landscapeData,
  problemSolutionData,
  thesis,
  onThesisChange,
  onRegenerate,
  onBack,
  onStartResearch,
}: ThesisReviewProps) {
  const [isLoading, setIsLoading] = useState(!thesis);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Generate thesis if not provided
  useEffect(() => {
    if (!thesis) {
      generateThesis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateThesis = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/refine/generate-thesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialIdea,
          socraticData,
          frameworksUsed,
          whyNowData,
          landscapeData,
          problemSolutionData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate thesis');
      }

      const data: ThesisResult = await response.json();
      onThesisChange(data);
    } catch (error) {
      console.error('Thesis generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!thesis || !editingField) return;

    const updated = { ...thesis };
    if (editingField === 'thesis') {
      updated.thesis = editValue;
    }
    onThesisChange(updated);
    setEditingField(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const updateResearchQuestion = (index: number, value: string) => {
    if (!thesis) return;
    const updated = { ...thesis };
    updated.research_questions[index] = value;
    onThesisChange(updated);
  };

  const removeResearchQuestion = (index: number) => {
    if (!thesis) return;
    const updated = { ...thesis };
    updated.research_questions = updated.research_questions.filter((_, i) => i !== index);
    onThesisChange(updated);
  };

  const updateSectionTitle = (sectionIndex: number, newTitle: string) => {
    if (!thesis) return;
    const updated = { ...thesis };
    updated.structure = {
      ...updated.structure,
      sections: updated.structure.sections.map((section, i) =>
        i === sectionIndex ? { ...section, title: newTitle } : section
      ),
    };
    onThesisChange(updated);
  };

  const updateSectionKeyPoint = (sectionIndex: number, pointIndex: number, newValue: string) => {
    if (!thesis) return;
    const updated = { ...thesis };
    updated.structure = {
      ...updated.structure,
      sections: updated.structure.sections.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              key_points: section.key_points.map((point, j) =>
                j === pointIndex ? newValue : point
              ),
            }
          : section
      ),
    };
    onThesisChange(updated);
  };

  const removeSectionKeyPoint = (sectionIndex: number, pointIndex: number) => {
    if (!thesis) return;
    const updated = { ...thesis };
    updated.structure = {
      ...updated.structure,
      sections: updated.structure.sections.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              key_points: section.key_points.filter((_, j) => j !== pointIndex),
            }
          : section
      ),
    };
    onThesisChange(updated);
  };

  const addSectionKeyPoint = (sectionIndex: number) => {
    if (!thesis) return;
    const updated = { ...thesis };
    updated.structure = {
      ...updated.structure,
      sections: updated.structure.sections.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              key_points: [...section.key_points, 'New key point'],
            }
          : section
      ),
    };
    onThesisChange(updated);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-lg font-medium">Generating Your Thesis...</p>
        <p className="text-sm text-muted-foreground mt-1">
          Synthesizing your inputs into a research plan
        </p>
      </div>
    );
  }

  if (!thesis) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="text-lg font-medium text-destructive">Failed to generate thesis</p>
        <Button onClick={generateThesis} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Review Your Research Plan</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Review and edit the generated thesis and research questions before starting.
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Thesis Statement */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Thesis Statement</CardTitle>
                {editingField !== 'thesis' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing('thesis', thesis.thesis)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingField === 'thesis' ? (
                <div className="space-y-2">
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveEdit}>
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-lg">{thesis.thesis}</p>
              )}
            </CardContent>
          </Card>

          {/* Article Structure */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Proposed Article Structure</CardTitle>
              <p className="text-xs text-muted-foreground">Click on section titles or key points to edit them</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {thesis.structure.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="border-l-2 border-primary/30 pl-4">
                    <Input
                      value={section.title}
                      onChange={(e) => updateSectionTitle(sectionIndex, e.target.value)}
                      className="font-medium text-base h-8 px-2 border-transparent hover:border-input focus:border-input"
                    />
                    <div className="text-sm text-muted-foreground mt-1 space-y-1">
                      {section.key_points.map((point, pointIndex) => (
                        <div key={pointIndex} className="flex items-center gap-1 group">
                          <span>•</span>
                          <Input
                            value={point}
                            onChange={(e) => updateSectionKeyPoint(sectionIndex, pointIndex, e.target.value)}
                            className="flex-1 h-7 text-sm px-2 border-transparent hover:border-input focus:border-input"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={() => removeSectionKeyPoint(sectionIndex, pointIndex)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => addSectionKeyPoint(sectionIndex)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add point
                      </Button>
                    </div>
                    {section.suggested_sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {section.suggested_sources.map((source, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Research Questions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Research Questions ({thesis.research_questions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {thesis.research_questions.map((question, index) => (
                  <div key={index} className="flex items-start gap-2 group">
                    <span className="text-sm text-muted-foreground mt-1">{index + 1}.</span>
                    <Input
                      value={question}
                      onChange={(e) => updateResearchQuestion(index, e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => removeResearchQuestion(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Research Parameters */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Research Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Target Sources</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {thesis.target_sources.map((source, i) => (
                      <Badge key={i} variant="secondary">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Estimated Scope</p>
                  <p className="font-medium">{thesis.estimated_scope} sources</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recommended Autonomy</p>
                  <p className="font-medium">Level {thesis.recommended_autonomy}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button variant="outline" onClick={onRegenerate}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </Button>
        <Button className="flex-1" onClick={onStartResearch}>
          <Rocket className="mr-2 h-4 w-4" />
          Start Research
        </Button>
      </div>
    </div>
  );
}
