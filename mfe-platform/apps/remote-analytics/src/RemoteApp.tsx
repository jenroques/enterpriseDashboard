import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography
} from '@mui/material';
import { publishPlatformEvent } from '@mfe/platform-contracts';
import { PageHeader } from '@mfe/ui-kit';
import { useMemo } from 'react';
import { useAnalyticsStore } from './store';

type MetricPoint = {
  label: string;
  value: number;
};

const baseData: Record<'7D' | '30D' | '90D', MetricPoint[]> = {
  '7D': [
    { label: 'Mon', value: 42 },
    { label: 'Tue', value: 55 },
    { label: 'Wed', value: 37 },
    { label: 'Thu', value: 61 },
    { label: 'Fri', value: 48 }
  ],
  '30D': [
    { label: 'W1', value: 220 },
    { label: 'W2', value: 260 },
    { label: 'W3', value: 210 },
    { label: 'W4', value: 300 }
  ],
  '90D': [
    { label: 'M1', value: 880 },
    { label: 'M2', value: 960 },
    { label: 'M3', value: 910 }
  ]
};

const segmentMultiplier: Record<'ALL' | 'SMB' | 'ENTERPRISE', number> = {
  ALL: 1,
  SMB: 0.75,
  ENTERPRISE: 1.25
};

export default function RemoteApp() {
  const { timeRange, segment, setTimeRange, setSegment } = useAnalyticsStore();

  const onRangeChange = (nextRange: typeof timeRange) => {
    setTimeRange(nextRange);
    publishPlatformEvent('TRACK_EVENT', {
      name: 'analytics.time_range_changed',
      properties: { range: nextRange }
    });
  };

  const onSegmentChange = (nextSegment: typeof segment) => {
    setSegment(nextSegment);
    publishPlatformEvent('SHOW_TOAST', { message: `Segment: ${nextSegment}`, severity: 'info' });
    publishPlatformEvent('TRACK_EVENT', {
      name: 'analytics.segment_changed',
      properties: { segment: nextSegment }
    });
  };

  const chartData = useMemo(() => {
    return baseData[timeRange].map((point) => ({
      ...point,
      value: Math.round(point.value * segmentMultiplier[segment])
    }));
  }, [timeRange, segment]);

  const maxValue = Math.max(...chartData.map((point) => point.value), 1);
  const total = chartData.reduce((sum, point) => sum + point.value, 0);

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, border: 1, borderColor: 'divider' }}>
      <Stack spacing={2}>
        <PageHeader title="Analytics Dashboard" subtitle="Monitor activity trends with segment and time-range filters." />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
          <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 1' } }}>
            <FormControl fullWidth size="small">
              <InputLabel id="analytics-range-label">Time Range</InputLabel>
              <Select
                labelId="analytics-range-label"
                label="Time Range"
                value={timeRange}
                onChange={(event) => onRangeChange(event.target.value as typeof timeRange)}
              >
                <MenuItem value="7D">Last 7 Days</MenuItem>
                <MenuItem value="30D">Last 30 Days</MenuItem>
                <MenuItem value="90D">Last 90 Days</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 1' } }}>
            <FormControl fullWidth size="small">
              <InputLabel id="analytics-segment-label">Segment</InputLabel>
              <Select
                labelId="analytics-segment-label"
                label="Segment"
                value={segment}
                onChange={(event) => onSegmentChange(event.target.value as typeof segment)}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="SMB">SMB</MenuItem>
                <MenuItem value="ENTERPRISE">Enterprise</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
          <Box>
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                Active Usage Trend
              </Typography>
              <Stack direction="row" alignItems="flex-end" spacing={1.5} sx={{ height: 188, px: 1, pb: 0.5 }}>
                {chartData.map((point) => (
                  <Stack key={point.label} alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">{point.value}</Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        width: '100%',
                        height: `${Math.max((point.value / maxValue) * 130, 8)}px`,
                        bgcolor: 'primary.main',
                        borderRadius: 1
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">{point.label}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Box>
          <Box>
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', minHeight: 188 }}>
              <Typography variant="subtitle1">KPI Snapshot</Typography>
              <Typography variant="body2" sx={{ mt: 1.5 }}>Total Activity: {total}</Typography>
              <Typography variant="body2">Average/Point: {Math.round(total / chartData.length)}</Typography>
              <Typography variant="body2">Segment: {segment}</Typography>
              <Typography variant="body2">Range: {timeRange}</Typography>
            </Paper>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}
