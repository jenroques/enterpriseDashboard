import { Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={1.5}>
        <Typography variant="h6">{title}</Typography>
        {description ? <Typography variant="body2" color="text.secondary">{description}</Typography> : null}
        {action ? <div>{action}</div> : null}
      </Stack>
    </Paper>
  );
}
