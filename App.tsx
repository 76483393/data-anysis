import React, { useState, useEffect } from 'react';
import { AppState, DataRow } from './types';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ChartRenderer } from './components/ChartRenderer';
import { AnalysisReport } from './components/AnalysisReport';
import { LoadingState } from './components/LoadingState';
import { DataFilter } from './components/DataFilter';
import { parseFile } from './utils/dataParser';
import { analyzeData } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'upload',
    data: [],
    fileName: null,
    analysis: null,
    error: null,
  });

  const [filteredData, setFilteredData] = useState<DataRow[]>([]);

  useEffect(() => {
    if (state.data.length > 0) {
      setFilteredData(state.data);
    } else {
      setFilteredData([]);
    }
  }, [state.data]);

  const handleFileUpload = async (file: File) => {
    setState(prev => ({ ...prev, step: 'processing', fileName: file.name, error: null }));
    
    try {
      const data = await parseFile(file);
      
      if (data.length === 0) {
        throw new Error("Dataset appears to be empty.");
      }

      const analysis = await analyzeData(data, file.name);

      setState({
        step: 'dashboard',
        data,
        fileName: file.name,
        analysis,
        error: null
      });

    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        step: 'upload', 
        error: err.message || "An unexpected error occurred during analysis." 
      }));
    }
  };

  const resetApp = () => {
    setState({
      step: 'upload',
      data: [],
      fileName: null,
      analysis: null,
      error: null,
    });
    setFilteredData([]);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F8] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900" 
         style={{ 
           backgroundImage: 'radial-gradient(#cfd8dc 1px, transparent 1px)', 
           backgroundSize: '20px 20px' 
         }}>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {state.error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded shadow-sm flex items-center justify-between animate-fade-in-down">
            <div className="flex items-center gap-2">
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
               <span className="font-serif">{state.error}</span>
            </div>
            <button onClick={() => setState(s => ({...s, error: null}))} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
          </div>
        )}

        {/* View: Upload */}
        {state.step === 'upload' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] relative">
            <div className="text-center mb-12 relative z-10">
              <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold tracking-widest text-slate-500 mb-4 uppercase shadow-sm">
                Intelligent Data Agent
              </div>
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 mb-6 tracking-tight">
                Scientific <span className="text-indigo-700 italic">Discovery</span> Engine
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto font-serif italic leading-relaxed">
                "Turn raw data into publication-ready insights."
              </p>
            </div>
            
            <div className="relative z-10 w-full max-w-3xl bg-white p-2 rounded-3xl shadow-xl shadow-indigo-100/50">
              <FileUpload onUpload={handleFileUpload} />
            </div>
          </div>
        )}

        {/* View: Processing */}
        {state.step === 'processing' && (
          <LoadingState />
        )}

        {/* View: Dashboard */}
        {state.step === 'dashboard' && state.analysis && (
          <div className="animate-fade-in space-y-8">
            
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 </div>
                 <div>
                    <h1 className="text-lg font-bold text-slate-800 font-serif">{state.fileName}</h1>
                    <p className="text-xs text-slate-500 font-mono">{filteredData.length} records | {Object.keys(state.data[0] || {}).length} variables</p>
                 </div>
              </div>
              <div className="flex gap-3">
                 <button 
                    onClick={resetApp}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors"
                 >
                    Start New Session
                 </button>
              </div>
            </div>

            {/* AI Report */}
            <AnalysisReport analysis={state.analysis} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Col: Filters & Table */}
                <div className="lg:col-span-1 space-y-6">
                    <DataFilter data={state.data} onFilterUpdate={setFilteredData} />
                    
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-serif font-bold text-slate-700 text-sm">Data Source Preview</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-500 font-mono">
                          <thead className="text-slate-400 bg-slate-50 uppercase">
                            <tr>
                              {Object.keys(state.data[0] || {}).slice(0, 3).map((key) => (
                                <th key={key} className="px-3 py-2 font-medium border-b border-slate-100">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredData.slice(0, 8).map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                {Object.values(row).slice(0, 3).map((val, j) => (
                                  <td key={j} className="px-3 py-2 truncate max-w-[100px]">
                                    {val?.toString()}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                </div>

                {/* Right Col: Charts */}
                <div className="lg:col-span-2 space-y-8">
                   <div className="grid grid-cols-1 gap-8">
                      {state.analysis.charts.map((chartConfig, idx) => (
                        <ChartRenderer 
                          key={idx} 
                          config={chartConfig} 
                          data={filteredData} 
                        />
                      ))}
                   </div>
                </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;