import {
  Box,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { publishPlatformEvent } from '@mfe/platform-contracts';
import { EmptyState, PageHeader } from '@mfe/ui-kit';
import { useMemo } from 'react';
import { useAccountsStore } from './store';

type Account = {
  id: string;
  name: string;
  owner: string;
  region: string;
  status: 'Healthy' | 'At Risk';
  arr: string;
};

const accounts: Account[] = [
  { id: 'ACC-1024', name: 'Northwind Trading', owner: 'Alice Kim', region: 'US-East', status: 'Healthy', arr: '$210K' },
  { id: 'ACC-2008', name: 'Contoso Health', owner: 'Rob Patel', region: 'EU-West', status: 'At Risk', arr: '$480K' },
  { id: 'ACC-3410', name: 'Globex Retail', owner: 'Maria Lopez', region: 'APAC', status: 'Healthy', arr: '$320K' },
  { id: 'ACC-7781', name: 'Aperture Labs', owner: 'Jordan Lee', region: 'US-West', status: 'At Risk', arr: '$150K' }
];

export default function RemoteApp() {
  const { searchTerm, selectedAccountId, setSearchTerm, selectAccount } = useAccountsStore();

  const handleAccountClick = (accountId: string, accountName: string) => {
    selectAccount(accountId);
    publishPlatformEvent('NAVIGATE_TO_ACCOUNT', { accountId, route: '/accounts' });
    publishPlatformEvent('SHOW_TOAST', { message: `Focused account ${accountName}`, severity: 'success' });
    publishPlatformEvent('TRACK_EVENT', {
      name: 'accounts.account_selected',
      properties: { accountId }
    });
  };

  const filteredAccounts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      return accounts;
    }
    return accounts.filter((account) => {
      return (
        account.name.toLowerCase().includes(term) ||
        account.owner.toLowerCase().includes(term) ||
        account.id.toLowerCase().includes(term)
      );
    });
  }, [searchTerm]);

  const selected = filteredAccounts.find((account) => account.id === selectedAccountId) ?? filteredAccounts[0] ?? null;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <PageHeader title="Accounts Overview" subtitle="Search customer accounts and inspect ownership details." />
        <TextField
          size="small"
          label="Search account, owner, or ID"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 40%) 1fr' }, gap: 2 }}>
          <Box>
            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List disablePadding>
                {filteredAccounts.map((account) => (
                  <ListItemButton
                    key={account.id}
                    selected={selected?.id === account.id}
                    onClick={() => handleAccountClick(account.id, account.name)}
                  >
                    <ListItemText primary={account.name} secondary={`${account.id} • ${account.owner}`} />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Box>

          <Box>
            <Paper variant="outlined" sx={{ p: 2, minHeight: 300 }}>
              {selected ? (
                <Stack spacing={1.5}>
                  <Typography variant="h6">{selected.name}</Typography>
                  <Divider />
                  <Typography variant="body2">Account ID: {selected.id}</Typography>
                  <Typography variant="body2">Owner: {selected.owner}</Typography>
                  <Typography variant="body2">Region: {selected.region}</Typography>
                  <Typography variant="body2">ARR: {selected.arr}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Health:</Typography>
                    <Chip
                      size="small"
                      color={selected.status === 'Healthy' ? 'success' : 'warning'}
                      label={selected.status}
                    />
                  </Stack>
                </Stack>
              ) : (
                <EmptyState title="No matching accounts" description="Try broadening your search terms." />
              )}
            </Paper>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}
