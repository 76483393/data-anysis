export interface DataRow {
  [key: string]: string | number | boolean | null;
}

export enum ChartType {
  BAR = 'BAR',
  LINE = 'LINE',
  AREA = 'AREA',
  PIE = 'PIE',
  SCATTER = 'SCATTER'
}

export interface ChartConfig {
  title: string;
  description: string;
  type: ChartType;
  xAxisKey: string;
  yAxisKeys: string[];
  colorPalette: string[];
}

export interface AnalysisResult {
  headline: string; // New field for the "Agent Bubble" insight
  summary: string;
  keyInsights: string[];
  charts: ChartConfig[];
}

export interface AppState {
  step: 'upload' | 'processing' | 'dashboard';
  data: DataRow[];
  fileName: string | null;
  analysis: AnalysisResult | null;
  error: string | null;
}