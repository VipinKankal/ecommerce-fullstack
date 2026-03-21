import React from 'react';
import { CheckoutStep } from '../types/checkoutTypes';

interface Props {
  currentStep: CheckoutStep;
  steps: CheckoutStep[];
}

const CheckoutStepper = ({ currentStep, steps }: Props) => {
  const stepIndex = steps.indexOf(currentStep);

  return (
    <div className="border-b border-gray-100">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-4">
        <div className="flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.35em] sm:text-xs">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-4">
              <span
                className={`font-semibold ${
                  index === stepIndex
                    ? 'text-teal-600'
                    : index < stepIndex
                      ? 'text-gray-700'
                      : 'text-gray-400'
                }`}
              >
                {step}
              </span>
              {index < steps.length - 1 && (
                <span className="h-px w-10 border-t border-dashed border-gray-300 sm:w-16" />
              )}
            </div>
          ))}
        </div>
        <span className="w-12" />
      </div>
    </div>
  );
};

export default CheckoutStepper;
