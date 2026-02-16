import { Button, Paper, Stack, Typography } from '@mui/material';
import { EmptyState, PageHeader } from '@mfe/ui-kit';

type RemoteFallbackPageProps = {
  title: string;
  error: string;
  onRetry: () => void;
};

export function RemoteFallbackPage({ title, error, onRetry }: RemoteFallbackPageProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <PageHeader title={`${title} (Degraded)`} subtitle="Remote failed to load. Showing local fallback." />
        <EmptyState
          title="Troubleshooting"
          description="Verify remote dev server is running, check network/CORS, and confirm remoteEntry URL and federation scope match registry config."
          action={
            <Button variant="contained" onClick={onRetry}>
              Retry Load Remote
            </Button>
          }
        />
        <Typography variant="body2" color="text.secondary">
          Last error: {error}
        </Typography>
      </Stack>
    </Paper>
  );
}
