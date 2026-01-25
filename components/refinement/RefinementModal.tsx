'use client';

import { useState, useEffect } from 'react';
import { X, MessageCircle, Layers, FileText, CheckCircle, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SocraticChat } from './SocraticChat';
import { FrameworkSelector } from './FrameworkSelector';
import { WhyNowForm } from './WhyNowForm';
import { LandscapeForm } from './LandscapeForm';
import { ProblemSolutionForm } from './ProblemSolutionForm';
import { ThesisReview } from './ThesisReview';
import {
  RefinementData,
  RefinementMessage,
  Framework,
  WhyNowData,
  LandscapeData,
  ProblemSolutionData,
  ThesisResult,
} from '@/lib/types';

type Step = 'socratic' | 'framework' | 'forms' | 'review';

interface RefinementModalProps {
  initialTopic: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: RefinementData) => void;
  onSkip: () => void;
}

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'socratic', label: 'Discovery', icon: <MessageCircle className="h-4 w-4" /> },
  { id: 'framework', label: 'Framework', icon: <Layers className="h-4 w-4" /> },
  { id: 'forms', label: 'Details', icon: <FileText className="h-4 w-4" /> },
  { id: 'review', label: 'Review', icon: <CheckCircle className="h-4 w-4" /> },
];

const LOCAL_STORAGE_KEY = 'refinement_draft';

export function RefinementModal({
  initialTopic,
  isOpen,
  onClose,
  onComplete,
  onSkip,
}: RefinementModalProps) {
  const [step, setStep] = useState<Step>('socratic');
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // State for each step
  const [socraticMessages, setSocraticMessages] = useState<RefinementMessage[]>([]);
  const [selectedFrameworks, setSelectedFrameworks] = useState<Framework[]>([]);
  const [currentFrameworkIndex, setCurrentFrameworkIndex] = useState(0);
  const [whyNowData, setWhyNowData] = useState<WhyNowData | null>(null);
  const [landscapeData, setLandscapeData] = useState<LandscapeData | null>(null);
  const [problemSolutionData, setProblemSolutionData] = useState<ProblemSolutionData | null>(null);
  const [thesis, setThesis] = useState<ThesisResult | null>(null);

  // Auto-save to localStorage
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (isOpen && socraticMessages.length > 0) {
        const draft = {
          topic: initialTopic,
          step,
          socraticMessages,
          selectedFrameworks,
          whyNowData,
          landscapeData,
          problemSolutionData,
          timestamp: Date.now(),
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [isOpen, step, socraticMessages, selectedFrameworks, whyNowData, landscapeData, problemSolutionData, initialTopic]);

  // Check for saved draft on mount
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          // Only restore if it's the same topic and less than 1 hour old
          if (
            draft.topic === initialTopic &&
            Date.now() - draft.timestamp < 3600000
          ) {
            setSocraticMessages(draft.socraticMessages || []);
            setSelectedFrameworks(draft.selectedFrameworks || []);
            setWhyNowData(draft.whyNowData || null);
            setLandscapeData(draft.landscapeData || null);
            setProblemSolutionData(draft.problemSolutionData || null);
            // Don't restore step - let user start fresh
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [isOpen, initialTopic]);

  const clearDraft = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const getCurrentFramework = (): Framework | null => {
    return selectedFrameworks[currentFrameworkIndex] || null;
  };

  const handleFrameworkFormComplete = () => {
    if (currentFrameworkIndex < selectedFrameworks.length - 1) {
      setCurrentFrameworkIndex(currentFrameworkIndex + 1);
    } else {
      setStep('review');
    }
  };

  const handleStartResearch = () => {
    if (!thesis) return;

    const refinementData: RefinementData = {
      refinement_method: selectedFrameworks.length > 1 ? 'hybrid' : 'single_framework',
      initial_idea: initialTopic,
      socratic_conversation: socraticMessages,
      frameworks_used: selectedFrameworks,
      why_now_data: whyNowData || undefined,
      landscape_data: landscapeData || undefined,
      problem_solution_data: problemSolutionData || undefined,
      thesis: thesis.thesis,
      structure: thesis.structure,
      research_questions: thesis.research_questions,
      target_sources: thesis.target_sources,
      estimated_scope: thesis.estimated_scope,
      recommended_autonomy: thesis.recommended_autonomy,
    };

    clearDraft();
    onComplete(refinementData);
  };

  const handleSkipConfirm = () => {
    clearDraft();
    onSkip();
  };

  const handleClose = () => {
    // Don't clear draft on close - user might want to continue later
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 'socratic':
        return (
          <SocraticChat
            initialTopic={initialTopic}
            messages={socraticMessages}
            onMessagesChange={setSocraticMessages}
            onReadyForFramework={() => setStep('framework')}
          />
        );

      case 'framework':
        return (
          <FrameworkSelector
            conversationHistory={socraticMessages}
            selectedFrameworks={selectedFrameworks}
            onFrameworksChange={setSelectedFrameworks}
            onContinue={() => {
              setCurrentFrameworkIndex(0);
              setStep('forms');
            }}
          />
        );

      case 'forms': {
        const currentFramework = getCurrentFramework();
        if (!currentFramework) {
          setStep('review');
          return null;
        }

        if (currentFramework === 'why_now') {
          return (
            <WhyNowForm
              data={whyNowData}
              onDataChange={setWhyNowData}
              onComplete={handleFrameworkFormComplete}
            />
          );
        }

        if (currentFramework === 'landscape_analysis') {
          return (
            <LandscapeForm
              data={landscapeData}
              onDataChange={setLandscapeData}
              onComplete={handleFrameworkFormComplete}
            />
          );
        }

        if (currentFramework === 'problem_solution') {
          return (
            <ProblemSolutionForm
              data={problemSolutionData}
              onDataChange={setProblemSolutionData}
              onComplete={handleFrameworkFormComplete}
            />
          );
        }

        return null;
      }

      case 'review':
        return (
          <ThesisReview
            initialIdea={initialTopic}
            socraticData={socraticMessages}
            frameworksUsed={selectedFrameworks}
            whyNowData={whyNowData || undefined}
            landscapeData={landscapeData || undefined}
            problemSolutionData={problemSolutionData || undefined}
            thesis={thesis}
            onThesisChange={setThesis}
            onRegenerate={() => setThesis(null)}
            onBack={() => {
              setCurrentFrameworkIndex(selectedFrameworks.length - 1);
              setStep('forms');
            }}
            onStartResearch={handleStartResearch}
          />
        );

      default:
        return null;
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <>
      <div
        className={`fixed inset-0 bg-background z-50 flex flex-col transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-lg">Refine Your Idea</h2>
            <div className="hidden sm:flex items-center gap-2">
              {STEPS.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      index === currentStepIndex
                        ? 'bg-primary text-primary-foreground'
                        : index < currentStepIndex
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {s.icon}
                    <span className="hidden md:inline">{s.label}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-4 h-0.5 mx-1 ${
                        index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSkipConfirm(true)}>
              <SkipForward className="h-4 w-4 mr-1" />
              Skip
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{renderStep()}</div>

        {/* Mobile step indicator */}
        <div className="sm:hidden border-t p-2 flex justify-center gap-1">
          {STEPS.map((s, index) => (
            <div
              key={s.id}
              className={`w-2 h-2 rounded-full ${
                index === currentStepIndex
                  ? 'bg-primary'
                  : index < currentStepIndex
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Skip Confirmation Dialog */}
      <Dialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip Refinement?</DialogTitle>
            <DialogDescription>
              Skipping the refinement process may result in less focused research.
              Your searches will use the original topic without specific research questions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkipConfirm(false)}>
              Continue Refining
            </Button>
            <Button onClick={handleSkipConfirm}>Skip to Research</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
