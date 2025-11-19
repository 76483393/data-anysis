import React, { useMemo, useRef, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { ChartConfig, ChartType, DataRow } from '../types';
import html2canvas from 'html2canvas';

interface ChartRendererProps {
  config: ChartConfig;
  data: DataRow[];
  className?: string;
}

/**
 * Helper to calculate Box Plot Statistics (Min, Q1, Median, Q3, Max)
 */
const calculateBoxPlotStats = (data: DataRow[], groupKey: string, valueKey: string) => {
  const groups: Record<string, number[]> = {};
  
  // Group data
  data.forEach(row => {
    const group = String(row[groupKey]);
    const val = parseFloat(String(row[valueKey]));
    if (!isNaN(val)) {
      if (!groups[group]) groups[group] = [];
      groups[group].push(val);
    }
  });

  // Calculate stats
  return Object.keys(groups).map(group => {
    const values = groups[group].sort((a, b) => a - b);
    const min = values[0];
    const max = values[values.length - 1];
    const q1 = values[Math.floor(values.length * 0.25)];
    const median = values[Math.floor(values.length * 0.5)];
    const q3 = values[Math.floor(values.length * 0.75)];
    
    return {
      name: group,
      min,
      q1,
      median,
      q3,
      max,
      // Pass [min, max] as the "value" for the BarChart to set the Y-axis range correctly
      range: [min, max]
    };
  });
};

/**
 * Custom SVG Shape for rendering a Box Plot item within a BarChart
 */
const BoxPlotShape = (props: any) => {
  const { x, y, width, height, payload, fill } = props;
  const { min, q1, median, q3, max } = payload;

  if (min === undefined || max === undefined) return null;

  // We assume a linear scale. 
  // The BarChart passes 'y' as the top pixel (max value) and 'height' as the total height (max - min).
  // We calculate the internal relative positions.
  
  const totalRange = max - min;
  if (totalRange === 0) return null;

  const pixelFactor = height / totalRange;

  // Calculate pixel offsets from the top (y)
  // Note: SVG coordinates go down. 'y' is the top (max value).
  const yMax = y; 
  const yQ3 = y + (max - q3) * pixelFactor;
  const yMedian = y + (max - median) * pixelFactor;
  const yQ1 = y + (max - q1) * pixelFactor;
  const yMin = y + (max - min) * pixelFactor;

  const center = x + width / 2;
  const boxWidth = width * 0.6;

  return (
    <g>
      {/* Vertical Whisker Line */}
      <line x1={center} y1={yMax} x2={center} y2={yMin} stroke="#333" strokeWidth={1.5} />
      
      {/* Top Cap (Max) */}
      <line x1={center - boxWidth/4} y1={yMax} x2={center + boxWidth/4} y2={yMax} stroke="#333" strokeWidth={1.5} />
      
      {/* Bottom Cap (Min) */}
      <line x1={center - boxWidth/4} y1={yMin} x2={center + boxWidth/4} y2={yMin} stroke="#333" strokeWidth={1.5} />

      {/* The Box (Q3 to Q1) */}
      <rect 
        x={center - boxWidth / 2} 
        y={yQ3} 
        width={boxWidth} 
        height={Math.max(0, yQ1 - yQ3)} 
        fill={fill} 
        fillOpacity={0.6}
        stroke="#333"
        strokeWidth={1} 
      />

      {/* Median Line */}
      <line 
        x1={center - boxWidth / 2} 
        y1={yMedian} 
        x2={center + boxWidth / 2} 
        y2={yMedian} 
        stroke="#000" 
        strokeWidth={2} 
      />
    </g>
  );
};


export const ChartRenderer: React.FC<ChartRendererProps> = ({ config, data, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Nature/Science Style Constants
  const AXIS_COLOR = "#000000"; 
  const TICK_COLOR = "#000000";
  const FONT_FAMILY = "'Roboto', sans-serif"; 
  
  const NPG_PALETTE = ["#E64B35", "#4DBBD5", "#00A087", "#3C5488", "#F39B7F", "#8491B4"];
  const colors = config.colorPalette && config.colorPalette.length > 0 ? config.colorPalette : NPG_PALETTE;

  const commonAxisProps = {
    stroke: AXIS_COLOR,
    strokeWidth: 1.5,
    tick: { fill: TICK_COLOR, fontSize: 11, fontFamily: FONT_FAMILY },
    tickLine: { stroke: AXIS_COLOR, strokeWidth: 1 },
    axisLine: { stroke: AXIS_COLOR, strokeWidth: 1.5 },
  };

  const handleDownload = async (format: 'png' | 'jpg') => {
    if (!containerRef.current) return;
    
    try {
      setIsDownloading(true);
      setIsMenuOpen(false);

      // Brief delay to allow menu to close
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2 // High resolution
      });

      const link = document.createElement('a');
      link.download = `${config.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
      link.href = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 1.0);
      link.click();
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const renderTooltip = () => (
    <Tooltip 
      contentStyle={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        border: '1px solid #ccc', 
        borderRadius: '0px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontFamily: FONT_FAMILY,
        fontSize: '12px'
      }} 
      itemStyle={{ color: '#000' }}
      cursor={{ stroke: '#ccc', strokeDasharray: '3 3' }}
    />
  );

  const renderLegend = () => (
    <Legend 
      wrapperStyle={{ fontFamily: FONT_FAMILY, fontSize: '12px', paddingTop: '10px' }} 
      iconType="rect" 
    />
  );

  // Prepare data for BoxPlot if needed
  const boxPlotData = useMemo(() => {
    if (config.type === ChartType.BOXPLOT && config.yAxisKeys.length > 0) {
      return calculateBoxPlotStats(data, config.xAxisKey, config.yAxisKeys[0]);
    }
    return [];
  }, [config, data]);

  const renderChartContent = () => {
    switch (config.type) {
      case ChartType.BAR:
        return (
          <BarChart data={data} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
            <XAxis dataKey={config.xAxisKey} {...commonAxisProps} dy={5} />
            <YAxis {...commonAxisProps} />
            {renderTooltip()}
            {renderLegend()}
            {config.yAxisKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={colors[index % colors.length]} animationDuration={1000} />
            ))}
          </BarChart>
        );

      case ChartType.LINE:
        return (
          <LineChart data={data} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
            <XAxis dataKey={config.xAxisKey} {...commonAxisProps} dy={5} />
            <YAxis {...commonAxisProps} />
            {renderTooltip()}
            {renderLegend()}
            {config.yAxisKeys.map((key, index) => (
              <Line 
                key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} strokeWidth={2.5}
                dot={{r: 3, fill: colors[index % colors.length], strokeWidth: 0}} activeDot={{r: 6}} animationDuration={1000}
              />
            ))}
          </LineChart>
        );

      case ChartType.AREA:
        return (
          <AreaChart data={data} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
            <XAxis dataKey={config.xAxisKey} {...commonAxisProps} dy={5} />
            <YAxis {...commonAxisProps} />
            {renderTooltip()}
            {renderLegend()}
            {config.yAxisKeys.map((key, index) => (
              <Area key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} fill={colors[index % colors.length]} fillOpacity={0.6} animationDuration={1000} />
            ))}
          </AreaChart>
        );

      case ChartType.SCATTER:
        return (
          <ScatterChart margin={{top: 20, right: 30, left: 20, bottom: 5}}>
             <XAxis dataKey={config.xAxisKey} type="number" name={config.xAxisKey} {...commonAxisProps} dy={5} />
            <YAxis type="number" name={config.yAxisKeys[0]} {...commonAxisProps} />
            {renderTooltip()}
            {renderLegend()}
            {config.yAxisKeys.map((key, index) => (
              <Scatter key={key} name={key} data={data} dataKey={key} fill={colors[index % colors.length]} shape="circle" animationDuration={1000} />
            ))}
          </ScatterChart>
        );
        
      case ChartType.PIE:
        return (
          <PieChart margin={{top: 20, right: 30, left: 20, bottom: 5}}>
            <Pie
              data={data} cx="50%" cy="50%" innerRadius={0} outerRadius={100}
              dataKey={config.yAxisKeys[0]} nameKey={config.xAxisKey}
              animationDuration={1000} stroke="white" strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {renderTooltip()}
            {renderLegend()}
          </PieChart>
        );

      case ChartType.BOXPLOT:
        return (
          <BarChart data={boxPlotData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
            <XAxis dataKey="name" {...commonAxisProps} dy={5} />
            <YAxis {...commonAxisProps} label={{ value: config.yAxisKeys[0], angle: -90, position: 'insideLeft' }} />
            <Tooltip 
               cursor={{fill: 'transparent'}}
               content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white/95 border border-slate-300 p-3 shadow-md font-sans text-xs">
                        <p className="font-bold mb-1">{d.name}</p>
                        <p>Max: {d.max}</p>
                        <p>Q3: {d.q3}</p>
                        <p>Median: {d.median}</p>
                        <p>Q1: {d.q1}</p>
                        <p>Min: {d.min}</p>
                      </div>
                    );
                  }
                  return null;
               }}
            />
            <Bar 
              dataKey="range" 
              shape={<BoxPlotShape />} 
              fill={colors[0]} 
              animationDuration={1000} 
            />
          </BarChart>
        );

      case ChartType.RADAR:
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}> 
            <PolarGrid gridType="polygon" />
            <PolarAngleAxis dataKey={config.xAxisKey} tick={{ fontSize: 11, fontFamily: FONT_FAMILY }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
            {config.yAxisKeys.map((key, index) => (
              <Radar
                key={key}
                name={key}
                dataKey={key}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.3}
              />
            ))}
            {renderLegend()}
            {renderTooltip()}
          </RadarChart>
        );

      default:
        return (
           <div className="flex items-center justify-center h-full text-slate-400">
              Unsupported chart type
           </div>
        );
    }
  };

  return (
    <div ref={containerRef} className={`bg-white p-6 flex flex-col border border-slate-200 shadow-sm relative group ${className || 'h-[450px]'}`}>
      {/* Export Button */}
      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 bg-white/90 hover:bg-indigo-50 border border-slate-200 rounded shadow-sm text-slate-500 hover:text-indigo-600 transition-colors"
              title="Export Chart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
                 <button 
                   onClick={() => handleDownload('png')}
                   className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                 >
                   <span className="font-mono text-xs border border-slate-300 rounded px-1">PNG</span> High Res
                 </button>
                 <button 
                   onClick={() => handleDownload('jpg')}
                   className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                 >
                   <span className="font-mono text-xs border border-slate-300 rounded px-1">JPG</span> Standard
                 </button>
              </div>
            )}
         </div>
      </div>
      {/* Overlay for interactions outside to close menu */}
      {isMenuOpen && <div className="fixed inset-0 z-0" onClick={() => setIsMenuOpen(false)} />}

      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {renderChartContent()}
        </ResponsiveContainer>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <h4 className="font-serif text-slate-900 font-bold text-sm leading-tight">
          <span className="uppercase text-xs tracking-wider text-slate-500 mr-2">Figure</span>
           {config.title}
        </h4>
        <p className="font-serif text-xs text-slate-600 mt-1 leading-relaxed">
          {config.description}
        </p>
      </div>
    </div>
  );
};