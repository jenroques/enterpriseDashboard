import { Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader } from '@mfe/ui-kit';
import { useEffect, useState } from 'react';
import { fetchAdminTelemetry } from './registry';
import type { TelemetryRecord } from './types';

type TelemetryDashboardPageProps = {
  accessToken: string;
};

export function TelemetryDashboardPage({ accessToken }: TelemetryDashboardPageProps) {
  const [records, setRecords] = useState<TelemetryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetchAdminTelemetry(accessToken)
      .then((response) => {
        if (!ignore) {
          setRecords(response);
        }
      })
      .catch((fetchError) => {
        if (!ignore) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load telemetry');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [accessToken]);

  if (loading) {
    return <LoadingSkeleton lines={6} />;
  }

  if (error) {
    return <ErrorState title="Telemetry load failed" message={error} />;
  }

  if (records.length === 0) {
    return <EmptyState title="No telemetry yet" description="Client events will appear here once remotes start loading." />;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <PageHeader title="Telemetry Dashboard" subtitle="In-memory telemetry events received by app-registry." />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Event</TableCell>
              <TableCell>Remote</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Correlation ID</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={`${record.requestId}-${record.timestamp}`}>
                <TableCell>{record.timestamp}</TableCell>
                <TableCell>{record.eventType}</TableCell>
                <TableCell>{record.remoteId ?? '-'}</TableCell>
                <TableCell>{record.level}</TableCell>
                <TableCell>{record.durationMs ?? '-'}</TableCell>
                <TableCell>{record.correlationId}</TableCell>
                <TableCell>{record.message ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
    </Paper>
  );
}
