import React, { useState, useEffect } from "react";
import { CheckCircle, Circle, Clock, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  path: string;
  estimatedTime: string;
  credits: number;
}

const ProgressTracker = () => {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      id: 'idea-validation',
      title: 'Idea Validation',
      description: 'Validate your startup concept with AI analysis',
      status: 'completed',
      path: '/idea-validation',
      estimatedTime: '5 min',
      credits: 5
    },
    {
      id: 'market-research',
      title: 'Marketing Strategy',
      description: 'Comprehensive market research and marketing plans',
      status: 'in-progress',
      path: '/marketing-strategy',
      estimatedTime: '10 min',
      credits: 5
    },
    {
      id: 'business-plan',
      title: 'Business Plan',
      description: 'Generate detailed business plan and strategy',
      status: 'pending',
      path: '/business-plan',
      estimatedTime: '15 min',
      credits: 15
    },
    {
      id: 'mvp-development',
      title: 'MVP Development',
      description: 'Build your minimum viable product',
      status: 'pending',
      path: '/mvp-development',
      estimatedTime: '20 min',
      credits: 25
    },
    {
      id: 'pitch-deck',
      title: 'Pitch Deck',
      description: 'Create investor-ready presentation',
      status: 'pending',
      path: '/pitch-deck',
      estimatedTime: '10 min',
      credits: 10
    }
  ]);

  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const progress = (completedSteps / steps.length) * 100;
    setOverallProgress(progress);
  }, [steps]);

  const handleStepClick = (step: ProgressStep) => {
    if (step.status !== 'pending') {
      navigate(step.path);
    }
  };

  const getNextStep = () => {
    return steps.find(step => step.status === 'in-progress') || 
           steps.find(step => step.status === 'pending');
  };

  const nextStep = getNextStep();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Startup Progress</h3>
          <p className="text-gray-600 text-sm">Complete these steps to launch your startup</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-pulse-600">{Math.round(overallProgress)}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{steps.filter(s => s.status === 'completed').length} of {steps.length} completed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-pulse-500 to-pulse-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="relative">
              <div
                onClick={() => handleStepClick(step)}
                className={cn(
                  "flex items-center p-4 rounded-xl transition-all duration-300 cursor-pointer",
                  step.status === 'completed' && "bg-green-50 border border-green-200 hover:bg-green-100",
                  step.status === 'in-progress' && "bg-pulse-50 border border-pulse-200 hover:bg-pulse-100",
                  step.status === 'pending' && "bg-gray-50 border border-gray-200 hover:bg-gray-100 opacity-60"
                )}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 mr-4">
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : step.status === 'in-progress' ? (
                    <div className="relative">
                      <Circle className="w-6 h-6 text-pulse-500" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-pulse-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={cn(
                      "font-semibold",
                      step.status === 'completed' && "text-green-900",
                      step.status === 'in-progress' && "text-pulse-900",
                      step.status === 'pending' && "text-gray-600"
                    )}>
                      {step.title}
                    </h4>
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="flex items-center text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {step.estimatedTime}
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Zap className="w-3 h-3 mr-1" />
                        {step.credits} credits
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>

                {/* Arrow for actionable steps */}
                {step.status !== 'pending' && (
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-2" />
                )}
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="absolute left-7 top-16 w-0.5 h-4 bg-gray-200" />
              )}
            </div>
          );
        })}
      </div>

      {/* Next Step CTA */}
      {nextStep && (
        <div className="mt-6 p-4 bg-gradient-to-r from-pulse-500 to-pulse-600 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">Next: {nextStep.title}</h4>
              <p className="text-white/90 text-sm">{nextStep.description}</p>
            </div>
            <button
              onClick={() => navigate(nextStep.path)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors flex items-center"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Completion Celebration */}
      {overallProgress === 100 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white text-center">
          <div className="text-2xl mb-2">🎉</div>
          <h4 className="font-bold mb-1">Congratulations!</h4>
          <p className="text-white/90 text-sm mb-3">You've completed all startup essentials</p>
          <button
            onClick={() => navigate('/team-collaboration')}
            className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
          >
            Launch Your Startup
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
