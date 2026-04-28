'use client';

import React from 'react';

interface Props {
  currentStep: number;
  totalSteps: number;
  labels: string[];
  onStepClick: (step: number) => void;
}

// Progress indicator showing which wizard step the user is on.
// Completed steps are clickable — users can go back to edit.
export function StepIndicator({ currentStep, totalSteps, labels, onStepClick }: Props) {
  return (
    <div className="flex items-center gap-0 w-full min-w-[500px]">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const done = step < currentStep;
        const active = step === currentStep;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5 flex-1 shrink-0">
              <button
                onClick={() => done && onStepClick(step)}
                disabled={!done}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[13px] font-bold transition-all duration-200 ${
                  done 
                    ? 'border-primary bg-primary text-white cursor-pointer' 
                    : active 
                      ? 'border-primary bg-white text-primary cursor-default' 
                      : 'border-gray-300 bg-white text-gray-400 cursor-default'
                }`}
              >
                {done ? '✓' : step}
              </button>
              <span className={`text-[10px] text-center leading-tight max-w-[70px] transition-colors ${
                active 
                  ? 'font-bold text-primary' 
                  : done 
                    ? 'font-normal text-primary' 
                    : 'font-normal text-gray-400'
              }`}>
                {labels[i]}
              </span>
            </div>
            {step < totalSteps && (
              <div className={`h-0.5 flex-1 mb-[18px] transition-colors duration-300 ${
                done ? 'bg-primary' : 'bg-[#E5E7EB]'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}