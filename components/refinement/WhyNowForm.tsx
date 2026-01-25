'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { WhyNowData } from '@/lib/types';
import { SidebarAssistant } from './SidebarAssistant';

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
  const [currentField, setCurrentField] = useState('');
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

  const isValid =
    formData.technology.trim().length > 0 &&
    formData.catalysts.length > 0 &&
    formData.catalyst_details.trim().length > 0 &&
    formData.current_enablers.trim().length > 0;

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Why Now Framework</h3>
            <p className="text-sm text-muted-foreground">
              Explore why this topic is relevant now. What has changed to make this possible or important?
            </p>
          </div>

          <div className="space-y-4">
            {/* Technology/Trend Field */}
            <div className="space-y-2">
              <Label htmlFor="technology">
                Technology or Trend Being Analyzed <span className="text-red-500">*</span>
              </Label>
              <Input
                id="technology"
                placeholder="e.g., Large Language Models, Edge Computing, Quantum Computing"
                value={formData.technology}
                onChange={(e) => updateField('technology', e.target.value)}
                onFocus={() => setCurrentField('technology')}
              />
              <p className="text-xs text-muted-foreground">
                Be specific about what technology or trend you&apos;re examining.
              </p>
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
                    <label
                      htmlFor={option.id}
                      className="text-sm cursor-pointer"
                    >
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
              <Textarea
                id="catalyst_details"
                placeholder="Describe the specific events, breakthroughs, or changes that are driving this..."
                value={formData.catalyst_details}
                onChange={(e) => updateField('catalyst_details', e.target.value)}
                onFocus={() => setCurrentField('catalyst_details')}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Provide concrete examples and data points where possible.
              </p>
            </div>

            {/* Evidence Needed Field */}
            <div className="space-y-2">
              <Label htmlFor="evidence_needed">Evidence Needed</Label>
              <Textarea
                id="evidence_needed"
                placeholder="What data or evidence would strengthen your argument? e.g., market size, adoption rates, technical benchmarks..."
                value={formData.evidence_needed}
                onChange={(e) => updateField('evidence_needed', e.target.value)}
                onFocus={() => setCurrentField('evidence_needed')}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                This helps guide what to look for during research.
              </p>
            </div>

            {/* Past Failures Field */}
            <div className="space-y-2">
              <Label htmlFor="past_failures">Why Past Attempts Failed</Label>
              <Textarea
                id="past_failures"
                placeholder="If this has been tried before, why didn't it work? What was different then?"
                value={formData.past_failures || ''}
                onChange={(e) => updateField('past_failures', e.target.value)}
                onFocus={() => setCurrentField('past_failures')}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Understanding past failures strengthens the &quot;why now&quot; argument.
              </p>
            </div>

            {/* Current Enablers Field */}
            <div className="space-y-2">
              <Label htmlFor="current_enablers">
                What&apos;s Different Now <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="current_enablers"
                placeholder="What has changed that enables success now? e.g., cheaper compute, new algorithms, regulatory clarity..."
                value={formData.current_enablers}
                onChange={(e) => updateField('current_enablers', e.target.value)}
                onFocus={() => setCurrentField('current_enablers')}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This is the core of your &quot;why now&quot; thesis.
              </p>
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

      <SidebarAssistant
        framework="why_now"
        currentField={currentField}
        currentValue={
          currentField === 'technology'
            ? formData.technology
            : currentField === 'catalyst_details'
            ? formData.catalyst_details
            : currentField === 'evidence_needed'
            ? formData.evidence_needed
            : currentField === 'past_failures'
            ? formData.past_failures || ''
            : currentField === 'current_enablers'
            ? formData.current_enablers
            : ''
        }
        formContext={formData}
        onSuggestionApply={(suggestion) => {
          if (currentField) {
            updateField(currentField as keyof WhyNowData, suggestion);
          }
        }}
      />
    </div>
  );
}
