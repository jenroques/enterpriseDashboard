import { Paper, Skeleton, Stack } from '@mui/material';

type LoadingSkeletonProps = {
  lines?: number;
};

export function LoadingSkeleton({ lines = 3 }: LoadingSkeletonProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Skeleton variant="text" width="45%" />
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={26} />
        ))}
      </Stack>
    </Paper>
  );
}
