import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onUpload: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files[0]);
    }
  }, [onUpload]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-4 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ease-in-out cursor-pointer
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 scale-102' 
            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
          }
        `}
      >
        <input
          type="file"
          accept=".csv,.json,.xlsx,.xls"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-xl font-bold text-slate-700">Drop your data file here</p>
            <p className="text-sm text-slate-400 mt-1">Supports CSV, JSON, and Excel (XLSX/XLS)</p>
          </div>
          
          <div className="flex gap-2 mt-4">
             <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded font-mono">.CSV</span>
             <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded font-mono">.JSON</span>
             <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded font-mono">.XLSX</span>
          </div>
        </div>
      </div>
    </div>
  );
};