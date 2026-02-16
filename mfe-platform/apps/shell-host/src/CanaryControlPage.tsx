import {
  Button,
  Paper,
  Slider,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader } from '@mfe/ui-kit';
import { useEffect, useState } from 'react';
import { fetchCanaryFlags, updateCanaryFlag } from './registry';
import type { CanaryFlag } from './types';

type CanaryControlPageProps = {
  accessToken: string;
  onFlagsSaved: () => void;
};

export function CanaryControlPage({ accessToken, onFlagsSaved }: CanaryControlPageProps) {
  const [flags, setFlags] = useState<CanaryFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetchCanaryFlags(accessToken)
      .then((response) => {
        if (!ignore) {
          setFlags(response);
        }
      })
      .catch((fetchError) => {
        if (!ignore) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load canary flags');
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

  const save = async (flag: CanaryFlag) => {
    setSaving(flag.remoteId);
    setError(null);
    try {
      const updated = await updateCanaryFlag(accessToken, flag.remoteId, flag.enabled, flag.rolloutPercentage);
      setFlags((previous) => previous.map((item) => (item.remoteId === updated.remoteId ? updated : item)));
      onFlagsSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save canary flag');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <LoadingSkeleton lines={5} />;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <PageHeader title="Canary Control" subtitle="ADMIN-only rollout controls for remote canary versions." />

        {error ? <ErrorState message={error} /> : null}

        {flags.length === 0 ? <EmptyState title="No remotes available" description="Registry returned no canary-configurable remotes." /> : null}

        {flags.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Remote</TableCell>
                <TableCell>Canary Enabled</TableCell>
                <TableCell>Rollout %</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flags.map((flag) => (
                <TableRow key={flag.remoteId}>
                  <TableCell>{flag.remoteId}</TableCell>
                  <TableCell>
                    <Switch
                      checked={flag.enabled}
                      onChange={(event) => {
                        const enabled = event.target.checked;
                        setFlags((previous) =>
                          previous.map((item) =>
                            item.remoteId === flag.remoteId ? { ...item, enabled } : item
                          )
                        );
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 220 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Slider
                        size="small"
                        min={0}
                        max={100}
                        disabled={!flag.enabled}
                        value={flag.rolloutPercentage}
                        onChange={(_event, value) => {
                          const nextValue = typeof value === 'number' ? value : value[0];
                          setFlags((previous) =>
                            previous.map((item) =>
                              item.remoteId === flag.remoteId ? { ...item, rolloutPercentage: nextValue } : item
                            )
                          );
                        }}
                      />
                      <Typography variant="body2" sx={{ width: 36, textAlign: 'right' }}>
                        {flag.rolloutPercentage}%
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => void save(flag)}
                      disabled={saving === flag.remoteId}
                    >
                      {saving === flag.remoteId ? 'Saving...' : 'Save'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </Stack>
    </Paper>
  );
}
