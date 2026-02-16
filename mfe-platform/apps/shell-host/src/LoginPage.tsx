import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { ErrorState, PageHeader } from '@mfe/ui-kit';
import { FormEvent, useState } from 'react';
import { login } from './registry';
import { parseJwt } from './auth';
import type { AuthState } from './types';

type LoginPageProps = {
  onAuthenticated: (nextState: AuthState) => void;
};

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [username, setUsername] = useState('user');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login(username, password);
      const payload = parseJwt(response.accessToken);
      onAuthenticated({
        accessToken: response.accessToken,
        roles: response.roles,
        username: payload.sub ?? username
      });
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper sx={{ p: { xs: 2.5, sm: 3 }, width: '100%', maxWidth: 460, border: 1, borderColor: 'divider' }}>
        <PageHeader title="Mock Login" subtitle="Authenticate against app-registry local JWT issuer." />
        <Typography variant="body2" sx={{ mt: 1.5, mb: 2.5, color: 'text.secondary' }}>
          Use username `admin` for ADMIN+USER roles, or any other username for USER role.
        </Typography>
        <Alert severity="info" sx={{ mb: 2.5, border: 1, borderColor: 'divider' }}>
          Access token is kept in memory only. For production, use short-lived access tokens with refresh via HttpOnly secure cookie.
        </Alert>
        {error ? <Box sx={{ mb: 2 }}><ErrorState message={error} /></Box> : null}
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField label="Username" value={username} onChange={(event) => setUsername(event.target.value)} required size="small" />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            size="small"
          />
          <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 1, py: 1 }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
