'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Sparkles, Lightbulb, Loader2, Wand2 } from 'lucide-react';
import { ProblemSolutionData, FieldFeedback, RefinementMessage } from '@/lib/types';

interface ProblemSolutionFormProps {
  data: ProblemSolutionData | null;
  onDataChange: (data: ProblemSolutionData) => void;
  onComplete: () => void;
  conversationHistory?: RefinementMessage[];
}

export function ProblemSolutionForm({ data, onDataChange, onComplete, conversationHistory }: ProblemSolutionFormProps) {
  const [formData, setFormData] = useState<ProblemSolutionData>(
    data || {
      problem: '',
      who_affected: '',
      why_unsolved: '',
      recent_changes: '',
    }
  );

  const [feedback, setFeedback] = useState<Record<string, FieldFeedback | null>>({});
  const [loadingFeedback, setLoadingFeedback] = useState<string | null>(null);
  const [loadingSuggest, setLoadingSuggest] = useState<string | null>(null);

  const suggestFromConversation = async (fieldName: keyof ProblemSolutionData, fieldLabel: string) => {
    if (!conversationHistory || conversationHistory.length === 0) return;

    setLoadingSuggest(fieldName);
    try {
      const response = await fetch('/api/refine/suggest-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framework: 'problem_solution',
          field: fieldName,
          fieldLabel,
          conversationHistory,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.suggestion) {
          updateField(fieldName, data.suggestion);
        }
      }
    } catch (error) {
      console.error('Failed to get suggestion:', error);
    } finally {
      setLoadingSuggest(null);
    }
  };

  const renderSuggestButton = (fieldName: keyof ProblemSolutionData, fieldLabel: string) => {
    if (!conversationHistory || conversationHistory.length === 0) return null;

    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => suggestFromConversation(fieldName, fieldLabel)}
        disabled={loadingSuggest === fieldName}
        title="Auto-fill from conversation"
        className="shrink-0"
      >
        {loadingSuggest === fieldName ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="h-4 w-4" />
        )}
      </Button>
    );
  };

  const updateField = (field: keyof ProblemSolutionData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onDataChange(updated);
  };

  const getFeedback = async (fieldName: keyof ProblemSolutionData) => {
    const fieldValue = formData[fieldName];
    if (!fieldValue || fieldValue.length < 3) {
      return;
    }

    setLoadingFeedback(fieldName);

    try {
      const response = await fetch('/api/refine/assist-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framework: 'problem_solution',
          field: fieldName,
          userInput: fieldValue,
          context: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get feedback');
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value, { stream: true });
        }
      }

      // Parse the response to extract suggestion and possible replacement
      const suggestionMatch = content.match(/["']([^"']{20,})["']/);
      const feedbackData: FieldFeedback = {
        suggestion: content,
        canApply: !!suggestionMatch,
        replacement: suggestionMatch ? suggestionMatch[1] : undefined,
      };

      setFeedback((prev) => ({ ...prev, [fieldName]: feedbackData }));
    } catch (error) {
      console.error('Failed to get feedback:', error);
    } finally {
      setLoadingFeedback(null);
    }
  };

  const applyFeedback = (fieldName: keyof ProblemSolutionData) => {
    const fieldFeedback = feedback[fieldName];
    if (fieldFeedback?.replacement) {
      updateField(fieldName, fieldFeedback.replacement);
      setFeedback((prev) => ({ ...prev, [fieldName]: null }));
    }
  };

  const clearFeedback = (fieldName: keyof ProblemSolutionData) => {
    setFeedback((prev) => ({ ...prev, [fieldName]: null }));
  };

  const isValid =
    formData.problem.trim().length > 0 &&
    formData.who_affected.trim().length > 0 &&
    formData.why_unsolved.trim().length > 0 &&
    formData.recent_changes.trim().length > 0;

  const renderFeedbackButton = (fieldName: keyof ProblemSolutionData, hasValue: boolean) => (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => getFeedback(fieldName)}
      disabled={!hasValue || loadingFeedback === fieldName}
      title="Get AI feedback"
      className="shrink-0"
    >
      {loadingFeedback === fieldName ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
    </Button>
  );

  const renderFeedback = (fieldName: keyof ProblemSolutionData) => {
    const fieldFeedback = feedback[fieldName];
    if (!fieldFeedback) return null;

    return (
      <Alert className="mt-2">
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          <p className="text-sm whitespace-pre-wrap">{fieldFeedback.suggestion}</p>
          <div className="flex gap-2 mt-2">
            {fieldFeedback.canApply && fieldFeedback.replacement && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={() => applyFeedback(fieldName)}
              >
                Apply suggestion
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => clearFeedback(fieldName)}
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Problem-Solution Framework</h3>
            <p className="text-sm text-muted-foreground">
              Analyze a specific problem and explore potential solutions. What gap exists and how might it be filled?
            </p>
          </div>

          <div className="space-y-4">
            {/* Problem Description Field */}
            <div className="space-y-2">
              <Label htmlFor="problem">
                Problem Description <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 items-start">
                <Textarea
                  id="problem"
                  placeholder="Describe the problem in detail. What isn't working? What's broken or missing?"
                  value={formData.problem}
                  onChange={(e) => updateField('problem', e.target.value)}
                  rows={4}
                  className="flex-1"
                />
                <div className="flex flex-col gap-1">
                  {renderSuggestButton('problem', 'Problem Description')}
                  {renderFeedbackButton('problem', formData.problem.length > 0)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Be specific about what the problem is and how it manifests.
              </p>
              {renderFeedback('problem')}
            </div>

            {/* Who is Affected Field */}
            <div className="space-y-2">
              <Label htmlFor="who_affected">
                Who Experiences This Problem <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="who_affected"
                  placeholder="e.g., Enterprise developers, Startup founders, Healthcare providers"
                  value={formData.who_affected}
                  onChange={(e) => updateField('who_affected', e.target.value)}
                  className="flex-1"
                />
                {renderSuggestButton('who_affected', 'Who is Affected')}
                {renderFeedbackButton('who_affected', formData.who_affected.length > 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Define your target audience - who feels this pain the most?
              </p>
              {renderFeedback('who_affected')}
            </div>

            {/* Why Unsolved Field */}
            <div className="space-y-2">
              <Label htmlFor="why_unsolved">
                Why Is This Unsolved? <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 items-start">
                <Textarea
                  id="why_unsolved"
                  placeholder="What barriers have prevented this problem from being solved? Technical challenges? Market dynamics? Incentive misalignment?"
                  value={formData.why_unsolved}
                  onChange={(e) => updateField('why_unsolved', e.target.value)}
                  rows={3}
                  className="flex-1"
                />
                <div className="flex flex-col gap-1">
                  {renderSuggestButton('why_unsolved', 'Why Unsolved')}
                  {renderFeedbackButton('why_unsolved', formData.why_unsolved.length > 0)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Understanding barriers helps identify what a solution needs to overcome.
              </p>
              {renderFeedback('why_unsolved')}
            </div>

            {/* Recent Changes Field */}
            <div className="space-y-2">
              <Label htmlFor="recent_changes">
                Recent Changes Enabling Solutions <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 items-start">
                <Textarea
                  id="recent_changes"
                  placeholder="What has changed recently that makes solving this problem more feasible? New technology? New data? Changed economics?"
                  value={formData.recent_changes}
                  onChange={(e) => updateField('recent_changes', e.target.value)}
                  rows={3}
                  className="flex-1"
                />
                <div className="flex flex-col gap-1">
                  {renderSuggestButton('recent_changes', 'Recent Changes')}
                  {renderFeedbackButton('recent_changes', formData.recent_changes.length > 0)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This connects to the &quot;why now&quot; angle - what enables a solution today?
              </p>
              {renderFeedback('recent_changes')}
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={onComplete} disabled={!isValid} className="w-full">
              Continue to Review
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {!isValid && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Please fill in all required fields (*)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
