import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { EmptyState, PageHeader } from '@mfe/ui-kit';
import { useRegistryContext } from './registry-context';

function stateColor(state: string): 'default' | 'success' | 'error' | 'warning' {
  if (state === 'loaded') {
    return 'success';
  }
  if (state === 'error') {
    return 'error';
  }
  if (state === 'loading') {
    return 'warning';
  }
  return 'default';
}

export function RemoteStatusPage() {
  const { statuses } = useRegistryContext();
  const values = Object.values(statuses);

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, border: 1, borderColor: 'divider' }}>
      <PageHeader title="Remote Status" subtitle="Inspect remote loading state, version alignment, and errors." />
      <Typography sx={{ mb: 2 }} />

      {values.length === 0 ? <EmptyState title="No remotes configured" description="Registry did not return any remotes." /> : null}

      <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell>Remote</TableCell>
              <TableCell>Scope</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Loaded</TableCell>
              <TableCell>Error</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {values.map((item) => (
              <TableRow key={item.scope} hover>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.scope}</TableCell>
                <TableCell>{item.version}</TableCell>
                <TableCell>
                  <Chip label={item.state} color={stateColor(item.state)} size="small" />
                </TableCell>
                <TableCell>{item.loadedAt ?? '-'}</TableCell>
                <TableCell>{item.error ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
