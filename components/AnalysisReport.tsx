import React from 'react';
import { AnalysisResult } from '../types';

interface AnalysisReportProps {
  analysis: AnalysisResult;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ analysis }) => {
  
  // Split headline into English and Chinese if possible
  const headlineParts = analysis.headline ? analysis.headline.split('//') : ["Analysis Complete", ""];

  return (
    <div className="mb-10 space-y-8">
      
      {/* Agent Headline Bubble - Data Formulator Style */}
      <div className="flex justify-center">
        <div className="relative max-w-3xl transform transition-all hover:scale-105">
           <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 relative z-10">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-indigo-900 text-center">
                {headlineParts[0]}
              </h2>
              {headlineParts[1] && (
                <p className="text-center text-indigo-600/80 font-serif mt-1 text-lg">
                  {headlineParts[1]}
                </p>
              )}
           </div>
           {/* Bubble Triangle */}
           <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-6 h-6 bg-white border-r border-b border-indigo-100"></div>
        </div>
      </div>

      {/* Academic Report Body */}
      <div className="bg-white border border-slate-200 p-8 shadow-sm max-w-5xl mx-auto mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Abstract / Summary */}
          <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-200 pb-6 lg:pb-0 lg:pr-8">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Abstract</h3>
            <div className="prose prose-slate prose-headings:font-serif max-w-none">
               <p className="font-serif text-slate-800 leading-loose text-justify">
                 {analysis.summary}
               </p>
            </div>
          </div>

          {/* Key Findings */}
          <div className="lg:col-span-5">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Key Findings</h3>
            <ul className="space-y-6">
              {analysis.keyInsights.map((insight, idx) => (
                <li key={idx} className="flex gap-4 group">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-slate-300 rounded-full font-serif font-bold text-slate-400 group-hover:border-indigo-500 group-hover:text-indigo-600 transition-colors">
                    {idx + 1}
                  </span>
                  <p className="font-serif text-sm text-slate-700 leading-relaxed pt-1 border-b border-slate-100 pb-4 w-full">
                    {insight}
                  </p>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};