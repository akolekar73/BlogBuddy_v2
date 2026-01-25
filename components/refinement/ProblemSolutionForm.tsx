'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { ProblemSolutionData } from '@/lib/types';
import { SidebarAssistant } from './SidebarAssistant';

interface ProblemSolutionFormProps {
  data: ProblemSolutionData | null;
  onDataChange: (data: ProblemSolutionData) => void;
  onComplete: () => void;
}

export function ProblemSolutionForm({ data, onDataChange, onComplete }: ProblemSolutionFormProps) {
  const [currentField, setCurrentField] = useState('');
  const [formData, setFormData] = useState<ProblemSolutionData>(
    data || {
      problem: '',
      who_affected: '',
      why_unsolved: '',
      recent_changes: '',
    }
  );

  const updateField = (field: keyof ProblemSolutionData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onDataChange(updated);
  };

  const isValid =
    formData.problem.trim().length > 0 &&
    formData.who_affected.trim().length > 0 &&
    formData.why_unsolved.trim().length > 0 &&
    formData.recent_changes.trim().length > 0;

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
              <Textarea
                id="problem"
                placeholder="Describe the problem in detail. What isn't working? What's broken or missing?"
                value={formData.problem}
                onChange={(e) => updateField('problem', e.target.value)}
                onFocus={() => setCurrentField('problem')}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Be specific about what the problem is and how it manifests.
              </p>
            </div>

            {/* Who is Affected Field */}
            <div className="space-y-2">
              <Label htmlFor="who_affected">
                Who Experiences This Problem <span className="text-red-500">*</span>
              </Label>
              <Input
                id="who_affected"
                placeholder="e.g., Enterprise developers, Startup founders, Healthcare providers"
                value={formData.who_affected}
                onChange={(e) => updateField('who_affected', e.target.value)}
                onFocus={() => setCurrentField('who_affected')}
              />
              <p className="text-xs text-muted-foreground">
                Define your target audience - who feels this pain the most?
              </p>
            </div>

            {/* Why Unsolved Field */}
            <div className="space-y-2">
              <Label htmlFor="why_unsolved">
                Why Is This Unsolved? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="why_unsolved"
                placeholder="What barriers have prevented this problem from being solved? Technical challenges? Market dynamics? Incentive misalignment?"
                value={formData.why_unsolved}
                onChange={(e) => updateField('why_unsolved', e.target.value)}
                onFocus={() => setCurrentField('why_unsolved')}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Understanding barriers helps identify what a solution needs to overcome.
              </p>
            </div>

            {/* Recent Changes Field */}
            <div className="space-y-2">
              <Label htmlFor="recent_changes">
                Recent Changes Enabling Solutions <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="recent_changes"
                placeholder="What has changed recently that makes solving this problem more feasible? New technology? New data? Changed economics?"
                value={formData.recent_changes}
                onChange={(e) => updateField('recent_changes', e.target.value)}
                onFocus={() => setCurrentField('recent_changes')}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This connects to the &quot;why now&quot; angle - what enables a solution today?
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
        framework="problem_solution"
        currentField={currentField}
        currentValue={
          currentField === 'problem'
            ? formData.problem
            : currentField === 'who_affected'
            ? formData.who_affected
            : currentField === 'why_unsolved'
            ? formData.why_unsolved
            : currentField === 'recent_changes'
            ? formData.recent_changes
            : ''
        }
        formContext={formData}
      />
    </div>
  );
}
