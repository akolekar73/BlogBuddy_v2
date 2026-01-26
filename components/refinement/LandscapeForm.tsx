'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, X, Sparkles, Lightbulb, Loader2 } from 'lucide-react';
import { LandscapeData, FieldFeedback } from '@/lib/types';

interface LandscapeFormProps {
  data: LandscapeData | null;
  onDataChange: (data: LandscapeData) => void;
  onComplete: () => void;
}

const SEGMENTATION_OPTIONS = [
  { value: 'technology', label: 'By Technology', description: 'Group players by their technical approach' },
  { value: 'customer', label: 'By Customer', description: 'Group players by who they serve' },
  { value: 'vertical', label: 'By Vertical', description: 'Group players by industry focus' },
  { value: 'business_model', label: 'By Business Model', description: 'Group players by how they make money' },
  { value: 'custom', label: 'Custom', description: 'Define your own segmentation' },
];

export function LandscapeForm({ data, onDataChange, onComplete }: LandscapeFormProps) {
  const [playerInput, setPlayerInput] = useState('');
  const [formData, setFormData] = useState<LandscapeData>(
    data || {
      market: '',
      segmentation_approach: 'technology',
      known_players: [],
      contested_aspects: '',
      value_proposition: '',
    }
  );

  const [feedback, setFeedback] = useState<Record<string, FieldFeedback | null>>({});
  const [loadingFeedback, setLoadingFeedback] = useState<string | null>(null);

  const updateField = (field: keyof LandscapeData, value: string | string[]) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onDataChange(updated);
  };

  const addPlayer = () => {
    if (playerInput.trim() && !formData.known_players.includes(playerInput.trim())) {
      const updated = [...formData.known_players, playerInput.trim()];
      updateField('known_players', updated);
      setPlayerInput('');
    }
  };

  const removePlayer = (player: string) => {
    const updated = formData.known_players.filter((p) => p !== player);
    updateField('known_players', updated);
  };

  const handlePlayerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPlayer();
    }
  };

  const getFeedback = async (fieldName: keyof LandscapeData) => {
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
          framework: 'landscape_analysis',
          field: fieldName,
          userInput: Array.isArray(fieldValue) ? fieldValue.join(', ') : fieldValue,
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

  const applyFeedback = (fieldName: keyof LandscapeData) => {
    const fieldFeedback = feedback[fieldName];
    if (fieldFeedback?.replacement) {
      updateField(fieldName, fieldFeedback.replacement);
      setFeedback((prev) => ({ ...prev, [fieldName]: null }));
    }
  };

  const clearFeedback = (fieldName: keyof LandscapeData) => {
    setFeedback((prev) => ({ ...prev, [fieldName]: null }));
  };

  const isValid =
    formData.market.trim().length > 0 &&
    formData.known_players.length > 0 &&
    formData.value_proposition.trim().length > 0;

  const renderFeedbackButton = (fieldName: keyof LandscapeData, hasValue: boolean) => (
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

  const renderFeedback = (fieldName: keyof LandscapeData) => {
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
            <h3 className="text-lg font-semibold mb-1">Landscape Analysis Framework</h3>
            <p className="text-sm text-muted-foreground">
              Map the market and understand who the key players are and how the space is structured.
            </p>
          </div>

          <div className="space-y-4">
            {/* Market Field */}
            <div className="space-y-2">
              <Label htmlFor="market">
                Market/Space Being Mapped <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="market"
                  placeholder="e.g., AI Code Assistants, Enterprise LLM Platforms, MLOps Tools"
                  value={formData.market}
                  onChange={(e) => updateField('market', e.target.value)}
                  className="flex-1"
                />
                {renderFeedbackButton('market', formData.market.length > 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Define the boundaries of the market you&apos;re analyzing.
              </p>
              {renderFeedback('market')}
            </div>

            {/* Segmentation Approach */}
            <div className="space-y-2">
              <Label>Segmentation Approach</Label>
              <p className="text-xs text-muted-foreground mb-2">
                How do you want to organize and categorize players?
              </p>
              <RadioGroup
                value={formData.segmentation_approach}
                onValueChange={(value) =>
                  updateField(
                    'segmentation_approach',
                    value as LandscapeData['segmentation_approach']
                  )
                }
                className="space-y-2"
              >
                {SEGMENTATION_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <label htmlFor={option.value} className="cursor-pointer">
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Known Players Field */}
            <div className="space-y-2">
              <Label htmlFor="known_players">
                Known Players <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="known_players"
                  placeholder="Type a company/product name and press Enter"
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  onKeyDown={handlePlayerKeyDown}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={addPlayer}>
                  Add
                </Button>
                {renderFeedbackButton('known_players', formData.known_players.length > 0)}
              </div>
              {formData.known_players.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.known_players.map((player) => (
                    <Badge key={player} variant="secondary" className="pr-1">
                      {player}
                      <button
                        onClick={() => removePlayer(player)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Add companies, products, or projects you&apos;re aware of in this space.
              </p>
              {renderFeedback('known_players')}
            </div>

            {/* Contested Aspects Field */}
            <div className="space-y-2">
              <Label htmlFor="contested_aspects">Contested or Unclear Aspects</Label>
              <div className="flex gap-2 items-start">
                <Textarea
                  id="contested_aspects"
                  placeholder="What aspects of this market are debated or unclear? Where do experts disagree?"
                  value={formData.contested_aspects}
                  onChange={(e) => updateField('contested_aspects', e.target.value)}
                  rows={3}
                  className="flex-1"
                />
                {renderFeedbackButton('contested_aspects', formData.contested_aspects.length > 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Identifying controversies makes your analysis more valuable.
              </p>
              {renderFeedback('contested_aspects')}
            </div>

            {/* Value Proposition Field */}
            <div className="space-y-2">
              <Label htmlFor="value_proposition">
                Value to Readers <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 items-start">
                <Textarea
                  id="value_proposition"
                  placeholder="What unique insight will readers gain from your landscape analysis? Why should they care?"
                  value={formData.value_proposition}
                  onChange={(e) => updateField('value_proposition', e.target.value)}
                  rows={3}
                  className="flex-1"
                />
                {renderFeedbackButton('value_proposition', formData.value_proposition.length > 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Help readers understand what they&apos;ll learn from your analysis.
              </p>
              {renderFeedback('value_proposition')}
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
