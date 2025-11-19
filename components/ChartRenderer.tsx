import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label
} from 'recharts';
import { ChartConfig, ChartType, DataRow } from '../types';

interface ChartRendererProps {
  config: ChartConfig;
  data: DataRow[];
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ config, data }) => {
  
  // Nature/Science Style Constants
  const AXIS_COLOR = "#000000"; // Pure black axes
  const TICK_COLOR = "#000000";
  const GRID_COLOR = "transparent"; // No grid for strict academic look, or very subtle "#f0f0f0"
  const FONT_FAMILY = "'Roboto', sans-serif"; // Sans-serif for chart data
  
  // Fallback NPG Palette if API fails to provide one
  const NPG_PALETTE = ["#E64B35", "#4DBBD5", "#00A087", "#3C5488", "#F39B7F", "#8491B4"];
  const colors = config.colorPalette && config.colorPalette.length > 0 ? config.colorPalette : NPG_PALETTE;

  // Axis Props (Thicker lines, visible ticks)
  const commonAxisProps = {
    stroke: AXIS_COLOR,
    strokeWidth: 1.5,
    tick: { fill: TICK_COLOR, fontSize: 11, fontFamily: FONT_FAMILY },
    tickLine: { stroke: AXIS_COLOR, strokeWidth: 1 },
    axisLine: { stroke: AXIS_COLOR, strokeWidth: 1.5 },
  };

  const renderXAxis = () => (
    <XAxis 
      dataKey={config.xAxisKey} 
      type={config.type === ChartType.SCATTER ? "number" : "category"}
      domain={['auto', 'auto']}
      {...commonAxisProps}
      dy={5} // Padding
    />
  );

  const renderYAxis = () => (
    <YAxis 
      domain={['auto', 'auto']}
      {...commonAxisProps}
      tickFormatter={(value: any) => {
         if (typeof value === 'number') {
            // Clean number formatting
            if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
            return value.toString();
         }
         return value;
      }}
    />
  );

  const renderTooltip = () => (
    <Tooltip 
      contentStyle={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        border: '1px solid #ccc', 
        borderRadius: '0px', // Sharp corners for academic look
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
      iconType="rect" // Geometric icons
    />
  );

  const renderChartContent = () => {
    switch (config.type) {
      case ChartType.BAR:
        return (
          <BarChart data={data} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
            {renderXAxis()}
            {renderYAxis()}
            {renderTooltip()}
            {renderLegend()}
            {config.yAxisKeys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={colors[index % colors.length]} 
                animationDuration={1000}
              />
            ))}
          </BarChart>
        );

      case ChartType.LINE:
        return (
          <LineChart data={data} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
            {renderXAxis()}
            {renderYAxis()}
            {renderTooltip()}
            {renderLegend()}
            {config.yAxisKeys.map((key, index) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={colors[index % colors.length]} 
                strokeWidth={2.5}
                dot={{r: 3, fill: colors[index % colors.length], strokeWidth: 0}} // Solid dots
                activeDot={{r: 6}}
                animationDuration={1000}
              />
            ))}
          </LineChart>
        );

      case ChartType.AREA:
        return (
          <AreaChart data={data} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
            {renderXAxis()}
            {renderYAxis()}
            {renderTooltip()}
            {renderLegend()}
            {config.yAxisKeys.map((key, index) => (
              <Area 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={colors[index % colors.length]} 
                fill={colors[index % colors.length]} 
                fillOpacity={0.6} // Slight transparency
                animationDuration={1000}
              />
            ))}
          </AreaChart>
        );

      case ChartType.SCATTER:
        return (
          <ScatterChart margin={{top: 20, right: 30, left: 20, bottom: 5}}>
            {renderXAxis()}
            {renderYAxis()}
            {renderTooltip()}
            {renderLegend()}
            {config.yAxisKeys.map((key, index) => (
              <Scatter 
                key={key} 
                name={key} 
                data={data}
                dataKey={key} 
                fill={colors[index % colors.length]} 
                shape="circle"
                animationDuration={1000}
              />
            ))}
          </ScatterChart>
        );
        
      case ChartType.PIE:
        return (
          <PieChart margin={{top: 20, right: 30, left: 20, bottom: 5}}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={0} // Full pie
              outerRadius={100}
              dataKey={config.yAxisKeys[0]}
              nameKey={config.xAxisKey}
              animationDuration={1000}
              stroke="white" // White separators
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {renderTooltip()}
            {renderLegend()}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 h-[450px] flex flex-col border border-slate-200 shadow-sm">
      {/* Chart Area */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {renderChartContent()}
        </ResponsiveContainer>
      </div>
      
      {/* Academic Figure Caption Style */}
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