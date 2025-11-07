import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { useStore } from '@/store/useStore';

interface GuidedTourProps {
  tourType?: 'dashboard' | 'mvp' | 'research';
}

const GuidedTour: React.FC<GuidedTourProps> = ({ tourType = 'dashboard' }) => {
  const [run, setRun] = useState(false);
  const { hasCompletedOnboarding, setHasCompletedOnboarding } = useStore();

  useEffect(() => {
    // Auto-start tour for first-time users
    if (!hasCompletedOnboarding) {
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding]);

  const dashboardSteps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Welcome to NEXORA! 🎉</h2>
          <p className="text-gray-600">
            Let's take a quick tour to help you build your startup MVP in minutes.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="mvp-builder"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">MVP Builder</h3>
          <p className="text-sm text-gray-600">
            Generate complete, production-ready code for your product idea using AI.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="market-research"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Market Research</h3>
          <p className="text-sm text-gray-600">
            Analyze competitors, market size, and trends with AI-powered insights.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="pitch-deck"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Pitch Deck Generator</h3>
          <p className="text-sm text-gray-600">
            Create investor-ready presentations with AI-generated slides and voiceovers.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="credits"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Your Credits</h3>
          <p className="text-sm text-gray-600">
            Each AI generation uses credits. Click here to upgrade for more!
          </p>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  const mvpSteps: Step[] = [
    {
      target: '[data-tour="product-idea"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Describe Your Idea</h3>
          <p className="text-sm text-gray-600">
            Tell us about your product. Be specific about what problem it solves!
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="tech-stack"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Choose Tech Stack</h3>
          <p className="text-sm text-gray-600">
            Select your preferred technologies. We'll generate optimized code for them.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="generate-button"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Generate Your MVP</h3>
          <p className="text-sm text-gray-600">
            Click here to let AI create your complete application code!
          </p>
        </div>
      ),
      placement: 'top',
    },
  ];

  const steps = tourType === 'mvp' ? mvpSteps : dashboardSteps;

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      setHasCompletedOnboarding(true);
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Handle step changes if needed
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#f97316',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: '#f97316',
          borderRadius: 8,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#9ca3af',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default GuidedTour;

// Hook to manually trigger tour
export const useGuidedTour = () => {
  const [runTour, setRunTour] = useState(false);

  const startTour = () => setRunTour(true);
  const stopTour = () => setRunTour(false);

  return { runTour, startTour, stopTour };
};
