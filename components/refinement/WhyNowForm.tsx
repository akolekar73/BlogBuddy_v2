'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Sparkles, Lightbulb, Loader2 } from 'lucide-react';
import { WhyNowData, FieldFeedback } from '@/lib/types';

interface WhyNowFormProps {
  data: WhyNowData | null;
  onDataChange: (data: WhyNowData) => void;
  onComplete: () => void;
}

const CATALYST_OPTIONS = [
  { id: 'technical_breakthrough', label: 'Technical breakthrough' },
  { id: 'regulatory_change', label: 'Regulatory change' },
  { id: 'market_shift', label: 'Market shift' },
  { id: 'cost_reduction', label: 'Cost reduction' },
  { id: 'user_behavior_change', label: 'User behavior change' },
  { id: 'competition_dynamics', label: 'Competition dynamics' },
  { id: 'other', label: 'Other' },
];

export function WhyNowForm({ data, onDataChange, onComplete }: WhyNowFormProps) {
  const [formData, setFormData] = useState<WhyNowData>(
    data || {
      technology: '',
      catalysts: [],
      catalyst_details: '',
      evidence_needed: '',
      past_failures: '',
      current_enablers: '',
    }
  );

  const [feedback, setFeedback] = useState<Record<string, FieldFeedback | null>>({});
  const [loadingFeedback, setLoadingFeedback] = useState<string | null>(null);

  const updateField = (field: keyof WhyNowData, value: string | string[]) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onDataChange(updated);
  };

  const toggleCatalyst = (catalystId: string) => {
    const current = formData.catalysts;
    const updated = current.includes(catalystId)
      ? current.filter((c) => c !== catalystId)
      : [...current, catalystId];
    updateField('catalysts', updated);
  };

  const getFeedback = async (fieldName: keyof WhyNowData) => {
    const fieldValue = formData[fieldName];
    if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.length < 3)) {
      return;
    }

    setLoadingFeedback(fieldName);

    try {
      const response = await fetch('/api/refine/assist-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framework: 'why_now',
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

  const applyFeedback = (fieldName: keyof WhyNowData) => {
    const fieldFeedback = feedback[fieldName];
    if (fieldFeedback?.replacement) {
      updateField(fieldName, fieldFeedback.replacement);
      setFeedback((prev) => ({ ...prev, [fieldName]: null }));
    }
  };

  const clearFeedback = (fieldName: keyof WhyNowData) => {
    setFeedback((prev) => ({ ...prev, [fieldName]: null }));
  };

  const isValid =
    formData.technology.trim().length > 0 &&
    formData.catalysts.length > 0 &&
    formData.catalyst_details.trim().length > 0 &&
    formData.current_enablers.trim().length > 0;

  const renderFeedbackButton = (fieldName: keyof WhyNowData, hasValue: boolean) => (
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

  const renderFeedback = (fieldName: keyof WhyNowData) => {
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
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Why Now Framework</h3>
          <p className="text-sm text-muted-foreground">
            Explore why this topic is relevant now. What has changed to make this
            possible or important?
          </p>
        </div>

        <div className="space-y-4">
          {/* Technology/Trend Field */}
          <div className="space-y-2">
            <Label htmlFor="technology">
              Technology or Trend Being Analyzed{' '}
              <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="technology"
                placeholder="e.g., Large Language Models, Edge Computing, Quantum Computing"
                value={formData.technology}
                onChange={(e) => updateField('technology', e.target.value)}
                className="flex-1"
              />
              {renderFeedbackButton('technology', formData.technology.length > 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Be specific about what technology or trend you&apos;re examining.
            </p>
            {renderFeedback('technology')}
          </div>

          {/* Catalysts Field */}
          <div className="space-y-2">
            <Label>
              Key Catalysts <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              What factors are driving this change? Select all that apply.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CATALYST_OPTIONS.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={formData.catalysts.includes(option.id)}
                    onCheckedChange={() => toggleCatalyst(option.id)}
                  />
                  <label htmlFor={option.id} className="text-sm cursor-pointer">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Catalyst Details Field */}
          <div className="space-y-2">
            <Label htmlFor="catalyst_details">
              Elaborate on Catalysts <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 items-start">
              <Textarea
                id="catalyst_details"
                placeholder="Describe the specific events, breakthroughs, or changes that are driving this..."
                value={formData.catalyst_details}
                onChange={(e) => updateField('catalyst_details', e.target.value)}
                rows={3}
                className="flex-1"
              />
              {renderFeedbackButton(
                'catalyst_details',
                formData.catalyst_details.length > 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Provide concrete examples and data points where possible.
            </p>
            {renderFeedback('catalyst_details')}
          </div>

          {/* Evidence Needed Field */}
          <div className="space-y-2">
            <Label htmlFor="evidence_needed">Evidence Needed</Label>
            <div className="flex gap-2 items-start">
              <Textarea
                id="evidence_needed"
                placeholder="What data or evidence would strengthen your argument? e.g., market size, adoption rates, technical benchmarks..."
                value={formData.evidence_needed}
                onChange={(e) => updateField('evidence_needed', e.target.value)}
                rows={2}
                className="flex-1"
              />
              {renderFeedbackButton(
                'evidence_needed',
                formData.evidence_needed.length > 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              This helps guide what to look for during research.
            </p>
            {renderFeedback('evidence_needed')}
          </div>

          {/* Past Failures Field */}
          <div className="space-y-2">
            <Label htmlFor="past_failures">Why Past Attempts Failed</Label>
            <div className="flex gap-2 items-start">
              <Textarea
                id="past_failures"
                placeholder="If this has been tried before, why didn't it work? What was different then?"
                value={formData.past_failures || ''}
                onChange={(e) => updateField('past_failures', e.target.value)}
                rows={2}
                className="flex-1"
              />
              {renderFeedbackButton(
                'past_failures',
                (formData.past_failures || '').length > 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Understanding past failures strengthens the &quot;why now&quot;
              argument.
            </p>
            {renderFeedback('past_failures')}
          </div>

          {/* Current Enablers Field */}
          <div className="space-y-2">
            <Label htmlFor="current_enablers">
              What&apos;s Different Now <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 items-start">
              <Textarea
                id="current_enablers"
                placeholder="What has changed that enables success now? e.g., cheaper compute, new algorithms, regulatory clarity..."
                value={formData.current_enablers}
                onChange={(e) => updateField('current_enablers', e.target.value)}
                rows={3}
                className="flex-1"
              />
              {renderFeedbackButton(
                'current_enablers',
                formData.current_enablers.length > 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              This is the core of your &quot;why now&quot; thesis.
            </p>
            {renderFeedback('current_enablers')}
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
  );
}
