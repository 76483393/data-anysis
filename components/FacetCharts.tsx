import React, { useState, useMemo, useEffect } from 'react';
import { ChartType, DataRow, ChartConfig } from '../types';
import { ChartRenderer } from './ChartRenderer';

interface FacetChartsProps {
  data: DataRow[];
}

export const FacetCharts: React.FC<FacetChartsProps> = ({ data }) => {
  const [groupKey, setGroupKey] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [chartType, setChartType] = useState<ChartType>(ChartType.RADAR);
  const [isExpanded, setIsExpanded] = useState(true);

  // 1. Analyze Columns
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // 2. Identify potential grouping keys (strings) and metrics (numbers)
  const { potentialGroups, potentialMetrics } = useMemo(() => {
    const pGroups: string[] = [];
    const pMetrics: string[] = [];

    if (data.length > 0) {
      const row = data[0];
      columns.forEach(col => {
        const val = row[col];
        if (typeof val === 'string') {
          pGroups.push(col);
        } else if (typeof val === 'number') {
          pMetrics.push(col);
        }
      });
    }
    return { potentialGroups: pGroups, potentialMetrics: pMetrics };
  }, [data, columns]);

  // 3. Set Defaults
  useEffect(() => {
    if (potentialGroups.length > 0 && !groupKey) {
      setGroupKey(potentialGroups[0]);
    }
    if (potentialMetrics.length > 0 && selectedMetrics.length === 0) {
      setSelectedMetrics(potentialMetrics); // Select all metrics by default
    }
  }, [potentialGroups, potentialMetrics, groupKey, selectedMetrics.length]);

  // 4. Get Unique Values for the Group Key
  const uniqueGroupValues = useMemo(() => {
    if (!groupKey) return [];
    const values = new Set<string>();
    data.forEach(row => {
      if (row[groupKey]) values.add(String(row[groupKey]));
    });
    return Array.from(values);
  }, [data, groupKey]);

  // 5. Select all items by default when group key changes
  useEffect(() => {
    if (uniqueGroupValues.length > 0) {
      setSelectedItems(uniqueGroupValues.slice(0, 6)); // Default select first 6 to avoid overload
    }
  }, [uniqueGroupValues]);

  // Toggle Helpers
  const toggleItem = (item: string) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter(i => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const selectAllItems = () => setSelectedItems(uniqueGroupValues);
  const clearItems = () => setSelectedItems([]);
  const selectAllMetrics = () => setSelectedMetrics(potentialMetrics);
  const clearMetrics = () => setSelectedMetrics([]);

  // 6. Generate Charts Data
  // We assume "Composition" mode: For each item, we transpose the data.
  // Row: { Well: 'A', Calcite: 10, Dolomite: 5 }
  // Transposed for Chart: [ { name: 'Calcite', value: 10 }, { name: 'Dolomite', value: 5 } ]
  
  const charts = useMemo(() => {
    return selectedItems.map(item => {
      // Find row(s)
      const rows = data.filter(r => String(r[groupKey]) === item);
      
      // If multiple rows exist for one item, we average them or just take the first. 
      // For simplicity in this "Snapshot" view, we take the first or average.
      // Let's assume single row per entity for composition data.
      if (rows.length === 0) return null;
      const row = rows[0];

      // Transpose
      const chartData = selectedMetrics.map(metric => ({
        metric: metric,
        value: Number(row[metric]) || 0
      }));

      const config: ChartConfig = {
        title: `${groupKey}: ${item}`,
        description: `Analysis of ${selectedMetrics.length} variables for ${item}`,
        type: chartType,
        xAxisKey: 'metric',
        yAxisKeys: ['value'],
        colorPalette: ["#4DBBD5", "#E64B35", "#00A087", "#3C5488", "#F39B7F", "#8491B4"]
      };

      return { config, data: chartData, id: item };
    }).filter(Boolean) as { config: ChartConfig, data: DataRow[], id: string }[];
  }, [selectedItems, selectedMetrics, groupKey, data, chartType]);


  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-6 animate-fade-in" id="facet-analysis">
        
        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
           <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
             <div className="flex items-center gap-2">
               <div className="p-1.5 bg-purple-100 text-purple-600 rounded-md">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                 </svg>
               </div>
               <h2 className="font-bold text-slate-800">Multi-Chart Analysis (Facet View)</h2>
             </div>
             <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-400 hover:text-purple-600">
                {isExpanded ? 'Hide Settings' : 'Show Settings'}
             </button>
           </div>

           {isExpanded && (
             <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
               
               {/* 1. Group By */}
               <div className="md:col-span-3 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">1. Group By (Entity)</label>
                  <select 
                    value={groupKey} 
                    onChange={(e) => setGroupKey(e.target.value)}
                    className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm"
                  >
                    {potentialGroups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <p className="text-xs text-slate-400">Select the column identifying your items (e.g., Well Name).</p>
               </div>

               {/* 2. Chart Type */}
               <div className="md:col-span-2 space-y-2">
                 <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">2. Chart Type</label>
                 <div className="flex gap-2">
                    <button 
                       onClick={() => setChartType(ChartType.RADAR)} 
                       className={`flex-1 py-2 rounded-md text-sm font-medium border ${chartType === ChartType.RADAR ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                       Radar
                    </button>
                    <button 
                       onClick={() => setChartType(ChartType.BAR)} 
                       className={`flex-1 py-2 rounded-md text-sm font-medium border ${chartType === ChartType.BAR ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                       Bar
                    </button>
                 </div>
               </div>

               {/* 3. Variables */}
               <div className="md:col-span-7 space-y-2">
                  <div className="flex justify-between items-center">
                     <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">3. Variables to Plot</label>
                     <div className="space-x-2">
                       <button onClick={selectAllMetrics} className="text-xs text-purple-600 hover:underline">Select All</button>
                       <button onClick={clearMetrics} className="text-xs text-slate-400 hover:underline">Clear</button>
                     </div>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border border-slate-100 rounded-lg bg-slate-50/50">
                     {potentialMetrics.map(m => (
                        <button 
                          key={m}
                          onClick={() => toggleMetric(m)}
                          className={`px-2 py-1 text-xs rounded-full border transition-all ${selectedMetrics.includes(m) ? 'bg-purple-600 border-purple-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'}`}
                        >
                          {m}
                        </button>
                     ))}
                  </div>
               </div>

               {/* 4. Entities Selection */}
               <div className="md:col-span-12 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                     <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">4. Select Entities ({selectedItems.length})</label>
                     <div className="space-x-2">
                       <button onClick={selectAllItems} className="text-xs text-purple-600 hover:underline">Select All</button>
                       <button onClick={clearItems} className="text-xs text-slate-400 hover:underline">Clear</button>
                     </div>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 border border-slate-200 rounded-lg bg-white">
                     {uniqueGroupValues.map(val => (
                        <button 
                          key={val}
                          onClick={() => toggleItem(val)}
                          className={`px-3 py-1.5 text-sm rounded-md border transition-all ${selectedItems.includes(val) ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
                        >
                          {val}
                        </button>
                     ))}
                  </div>
               </div>

             </div>
           )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {charts.map(({config, data, id}) => (
              <div key={id} className="animate-fade-in-up">
                 <ChartRenderer config={config} data={data} className="h-[350px] bg-white rounded-xl shadow-sm border border-slate-200 p-4" />
              </div>
           ))}
           {charts.length === 0 && (
             <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
               No items selected. Please select entities to display.
             </div>
           )}
        </div>

    </div>
  );
};