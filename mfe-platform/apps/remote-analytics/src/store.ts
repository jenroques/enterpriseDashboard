import { create } from 'zustand';

type AnalyticsState = {
  timeRange: '7D' | '30D' | '90D';
  segment: 'ALL' | 'SMB' | 'ENTERPRISE';
  setTimeRange: (timeRange: AnalyticsState['timeRange']) => void;
  setSegment: (segment: AnalyticsState['segment']) => void;
};

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  timeRange: '30D',
  segment: 'ALL',
  setTimeRange: (timeRange) => set({ timeRange }),
  setSegment: (segment) => set({ segment })
}));
