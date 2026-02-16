import { Alert, Button, Stack, Typography } from '@mui/material';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <Alert severity="error">
      <Stack spacing={1}>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="body2">{message}</Typography>
        {onRetry ? (
          <div>
            <Button size="small" color="inherit" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : null}
      </Stack>
    </Alert>
  );
}
