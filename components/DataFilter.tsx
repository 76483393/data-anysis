import React, { useState, useEffect, useMemo } from 'react';
import { DataRow } from '../types';

type Operator = 
  | 'contains' | 'equals' | 'starts_with' | 'ends_with' 
  | '>' | '<' | '>=' | '<=' | '!=';

interface Filter {
  id: string;
  column: string;
  operator: Operator;
  value: string;
}

interface DataFilterProps {
  data: DataRow[];
  onFilterUpdate: (filteredData: DataRow[]) => void;
}

export const DataFilter: React.FC<DataFilterProps> = ({ data, onFilterUpdate }) => {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Extract columns from the first row of data
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Determine column type helper
  const getColumnType = (col: string): 'number' | 'string' | 'boolean' => {
    if (!data || data.length === 0) return 'string';
    const val = data[0][col];
    return typeof val === 'number' ? 'number' : typeof val === 'boolean' ? 'boolean' : 'string';
  };

  // Apply filters whenever filters or data change
  useEffect(() => {
    if (filters.length === 0) {
      onFilterUpdate(data);
      return;
    }

    const filtered = data.filter(row => {
      return filters.every(filter => {
        const rowValue = row[filter.column];
        const filterValue = filter.value;
        
        // Handle empty values safely
        if (rowValue === null || rowValue === undefined) return false;

        const valStr = String(rowValue).toLowerCase();
        const filterValStr = filterValue.toLowerCase();
        const valNum = Number(rowValue);
        const filterValNum = Number(filterValue);

        switch (filter.operator) {
          case 'contains':
            return valStr.includes(filterValStr);
          case 'equals':
            // Loose equality for string/number flexibility
            // eslint-disable-next-line eqeqeq
            return rowValue == filterValue || valStr === filterValStr;
          case '!=':
            // eslint-disable-next-line eqeqeq
            return rowValue != filterValue;
          case 'starts_with':
            return valStr.startsWith(filterValStr);
          case 'ends_with':
            return valStr.endsWith(filterValStr);
          case '>':
            return !isNaN(valNum) && !isNaN(filterValNum) ? valNum > filterValNum : false;
          case '<':
            return !isNaN(valNum) && !isNaN(filterValNum) ? valNum < filterValNum : false;
          case '>=':
            return !isNaN(valNum) && !isNaN(filterValNum) ? valNum >= filterValNum : false;
          case '<=':
            return !isNaN(valNum) && !isNaN(filterValNum) ? valNum <= filterValNum : false;
          default:
            return true;
        }
      });
    });

    onFilterUpdate(filtered);
  }, [filters, data, onFilterUpdate]);

  const addFilter = () => {
    if (columns.length === 0) return;
    const newFilter: Filter = {
      id: Math.random().toString(36).substr(2, 9),
      column: columns[0],
      operator: 'contains',
      value: ''
    };
    setFilters([...filters, newFilter]);
    setIsExpanded(true);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, field: keyof Filter, value: string) => {
    setFilters(filters.map(f => {
      if (f.id === id) {
        const updated = { ...f, [field]: value };
        // Reset operator if column changes to ensure compatibility
        if (field === 'column') {
           const type = getColumnType(value);
           updated.operator = type === 'number' ? '>' : 'contains';
           updated.value = ''; // Clear value on column change
        }
        return updated;
      }
      return f;
    }));
  };

  const getOperatorsForColumn = (col: string) => {
    const type = getColumnType(col);
    if (type === 'number') {
      return ['>', '<', '>=', '<=', 'equals', '!='];
    }
    return ['contains', 'equals', '!=', 'starts_with', 'ends_with'];
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden transition-all duration-300">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800">Data Filters</h3>
          {filters.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {filters.length} active
            </span>
          )}
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="p-6">
          {filters.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm mb-3">No filters applied. Showing all data.</p>
              <button 
                onClick={addFilter}
                className="inline-flex items-center px-3 py-1.5 border border-dashed border-indigo-300 text-indigo-600 rounded-md hover:bg-indigo-50 text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Filter
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filters.map((filter) => (
                <div key={filter.id} className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 group hover:border-indigo-100 transition-colors">
                  <div className="flex-1 min-w-[140px]">
                    <select
                      value={filter.column}
                      onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}
                      className="w-full rounded-md border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm py-1.5"
                    >
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-[140px]">
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                      className="w-full rounded-md border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm py-1.5"
                    >
                      {getOperatorsForColumn(filter.column).map(op => (
                        <option key={op} value={op}>{op.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[140px]">
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                      placeholder="Value..."
                      className="w-full rounded-md border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm py-1.5"
                    />
                  </div>

                  <button 
                    onClick={() => removeFilter(filter.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove filter"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              
              <div className="pt-2">
                <button 
                  onClick={addFilter}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add another condition
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
