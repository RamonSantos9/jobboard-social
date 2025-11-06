"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Step {
  title: string;
  description?: string;
}

interface MultiStepFormProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onSubmit: () => void;
  canGoNext: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
  children: ReactNode;
}

export default function MultiStepForm({
  steps,
  currentStep,
  onStepChange,
  onSubmit,
  canGoNext,
  isLastStep,
  isSubmitting = false,
  children,
}: MultiStepFormProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onSubmit();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Passo {currentStep + 1} de {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {steps[currentStep].title}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center ${
              index < steps.length - 1 ? "flex-1" : ""
            }`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index === currentStep
                    ? "bg-blue-600 text-white"
                    : index < currentStep
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index < currentStep ? "✓" : index + 1}
              </div>
              <span
                className={`mt-2 text-xs text-center ${
                  index === currentStep
                    ? "text-blue-600 font-medium"
                    : "text-gray-500"
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 transition-colors ${
                  index < currentStep ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Description */}
      {steps[currentStep].description && (
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {steps[currentStep].description}
          </p>
        </div>
      )}

      {/* Form Content */}
      <div className="mb-8">{children}</div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext || isSubmitting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {isLastStep ? (
            isSubmitting ? (
              "Finalizando..."
            ) : (
              "Finalizar Cadastro"
            )
          ) : (
            <>
              Próximo
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}



