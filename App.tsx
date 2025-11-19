import React, { useState, useEffect } from 'react';
import { AppState, DataRow } from './types';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ChartRenderer } from './components/ChartRenderer';
import { AnalysisReport } from './components/AnalysisReport';
import { LoadingState } from './components/LoadingState';
import { DataFilter } from './components/DataFilter';
import { FacetCharts } from './components/FacetCharts';
import { parseFile } from './utils/dataParser';
import { analyzeData, extractDataFromImage } from './services/geminiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'upload',
    data: [],
    fileName: null,
    analysis: null,
    error: null,
  });

  const [filteredData, setFilteredData] = useState<DataRow[]>([]);
  const [pastedData, setPastedData] = useState("");
  const [isExporting, setIsExporting] = useState(false);

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
      let data: DataRow[] = [];

      // Check if file is an image
      if (file.type.startsWith('image/')) {
        data = await extractDataFromImage(file);
      } else {
        data = await parseFile(file);
      }
      
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

  const handlePasteAnalysis = () => {
    if (!pastedData.trim()) return;

    // Simple heuristic to detect JSON vs CSV
    const text = pastedData.trim();
    const isJson = text.startsWith('[') || text.startsWith('{');
    const fileName = isJson ? "raw_input.json" : "raw_input.csv";
    const mimeType = isJson ? "application/json" : "text/csv";

    const file = new File([text], fileName, { type: mimeType });
    handleFileUpload(file);
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
    setPastedData("");
  };

  // Export to PDF using html2canvas and jsPDF
  const exportToPDF = async () => {
    const element = document.getElementById('printable-report');
    if (!element) return;

    setIsExporting(true);
    try {
      // High quality capture
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages if content overflows
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Lumina_Report_${state.fileName}.pdf`);

    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Word (simplified HTML based)
  const exportToWord = () => {
    if (!state.analysis) return;

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Analysis Report</title></head>
      <body>
        <h1 style="font-family: 'Times New Roman', serif; font-size: 24pt;">${state.analysis.headline}</h1>
        <br/>
        <h2 style="font-family: 'Arial', sans-serif; font-size: 16pt; color: #333;">Executive Summary</h2>
        <p style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5;">${state.analysis.summary}</p>
        <br/>
        <h2 style="font-family: 'Arial', sans-serif; font-size: 16pt; color: #333;">Key Insights</h2>
        <ul>
          ${state.analysis.keyInsights.map(i => `<li style="font-family: 'Times New Roman', serif; font-size: 12pt; margin-bottom: 10px;">${i}</li>`).join('')}
        </ul>
        <br/>
        <hr/>
        <p style="font-size: 10pt; color: #666;">Generated by Lumina Analytics. Charts must be exported separately as images.</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lumina_Report_${state.fileName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div className="flex flex-col items-center justify-center min-h-[60vh] relative pb-20">
            <div className="text-center mb-10 relative z-10">
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
            
            <div className="relative z-10 w-full max-w-3xl bg-white p-2 rounded-3xl shadow-xl shadow-indigo-100/50 mb-8">
              <FileUpload onUpload={handleFileUpload} />
            </div>

            {/* Text Input Section */}
            <div className="relative z-10 w-full max-w-3xl animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-slate-300 flex-1"></div>
                    <span className="text-slate-400 font-serif italic text-sm">or paste data directly</span>
                    <div className="h-px bg-slate-300 flex-1"></div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
                    <div className="relative">
                      <textarea
                          value={pastedData}
                          onChange={(e) => setPastedData(e.target.value)}
                          placeholder="Paste your CSV or JSON data here..."
                          className="w-full h-32 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-mono text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none transition-colors"
                      />
                      <div className="absolute bottom-4 right-4">
                        <button
                            onClick={handlePasteAnalysis}
                            disabled={!pastedData.trim()}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-md shadow-indigo-200 flex items-center gap-2 transform hover:scale-105 active:scale-95"
                        >
                            <span>Analyze Text</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 ml-1">
                      Supported formats: CSV (comma separated) or JSON array.
                    </p>
                </div>
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
              <div className="flex flex-wrap items-center gap-3">
                 <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
                 <button 
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-50"
                 >
                    {isExporting ? (
                      <span className="animate-pulse">Exporting...</span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        <span>PDF Report</span>
                      </>
                    )}
                 </button>
                 <button 
                    onClick={exportToWord}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                    <span>Word Doc</span>
                 </button>
                 <button 
                    onClick={resetApp}
                    className="px-4 py-2 ml-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors"
                 >
                    New
                 </button>
              </div>
            </div>

            {/* Main Report Container (for PDF export) */}
            <div id="printable-report" className="space-y-8 bg-[#F9F9F8] p-2">
                {/* AI Report */}
                <AnalysisReport analysis={state.analysis} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Col: Filters & Table */}
                    <div className="lg:col-span-1 space-y-6" data-html2canvas-ignore="true">
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

                {/* Facet Analysis Section (New) */}
                <FacetCharts data={filteredData} />
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;