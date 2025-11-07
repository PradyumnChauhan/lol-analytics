/**
 * Type definitions for AI Dashboard Insights
 */

export type ChartType = 'line' | 'bar' | 'pie' | 'radar' | 'progress' | 'heatmap';

export interface VisualData {
  chartType: ChartType;
  data: unknown[];
  labels?: string[];
  colors?: string[];
  options?: Record<string, unknown>;
}

export interface InsightCard {
  type: string;
  title: string;
  textInsights: string;
  visualData: VisualData;
  available: boolean;
}

export interface DashboardInsightsResponse {
  insights: InsightCard[];
  analysisType: string;
  matchesAnalyzed: number;
  model: string;
  prompt?: string;
  promptMetadata?: {
    promptLength: number;
  };
}

// Legacy format for backward compatibility
export interface LegacyDashboardInsights {
  insights: string;
  analysisType: string;
  matchesAnalyzed: number;
  model: string;
}

