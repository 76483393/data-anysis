import React, { useState, useEffect } from 'react';

const STEPS = [
  "Reading dataset structure...",
  "Identifying data types and dimensions...",
  "Calculating statistical correlations...",
  "Detecting outliers and anomalies...",
  "Formulating visualization strategies...",
  "Drafting executive summary...",
  "Finalizing report layout..."
];

export const LoadingState = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 800); // Change step every 800ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-2xl">✨</span>
        </div>
      </div>
      
      <div className="w-full max-w-md space-y-3">
        <h3 className="text-center text-xl font-serif font-bold text-slate-800 mb-6">
          AI Agent is analyzing...
        </h3>
        
        <div className="space-y-2">
          {STEPS.map((step, idx) => (
            <div 
              key={idx} 
              className={`flex items-center gap-3 transition-all duration-500 ${
                idx === currentStep 
                  ? 'opacity-100 transform scale-105' 
                  : idx < currentStep 
                    ? 'opacity-40' 
                    : 'opacity-10'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${idx <= currentStep ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
              <span className={`text-sm font-medium ${idx === currentStep ? 'text-indigo-700' : 'text-slate-500'}`}>
                {step}
              </span>
              {idx < currentStep && (
                <svg className="w-4 h-4 text-green-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};