import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { publishPlatformEvent } from '@mfe/platform-contracts';
import { EmptyState, PageHeader } from '@mfe/ui-kit';
import { useMemo } from 'react';
import { useBillingStore } from './store';

type InvoiceStatus = 'PAID' | 'DUE' | 'OVERDUE';

type Invoice = {
  id: string;
  customer: string;
  amount: string;
  dueDate: string;
  status: InvoiceStatus;
};

const invoices: Invoice[] = [
  { id: 'INV-4102', customer: 'Northwind Trading', amount: '$18,400', dueDate: '2026-02-18', status: 'DUE' },
  { id: 'INV-4103', customer: 'Contoso Health', amount: '$42,100', dueDate: '2026-02-05', status: 'OVERDUE' },
  { id: 'INV-4104', customer: 'Globex Retail', amount: '$11,000', dueDate: '2026-01-31', status: 'PAID' },
  { id: 'INV-4105', customer: 'Aperture Labs', amount: '$7,850', dueDate: '2026-02-22', status: 'DUE' }
];

function statusColor(status: InvoiceStatus): 'success' | 'warning' | 'error' {
  if (status === 'PAID') {
    return 'success';
  }
  if (status === 'OVERDUE') {
    return 'error';
  }
  return 'warning';
}

export default function RemoteApp() {
  const { statusFilter, selectedInvoiceId, setStatusFilter, selectInvoice } = useBillingStore();

  const onStatusChange = (value: typeof statusFilter) => {
    setStatusFilter(value);
    publishPlatformEvent('TRACK_EVENT', {
      name: 'billing.status_filter_changed',
      properties: { status: value }
    });
  };

  const onInvoiceSelect = (invoiceId: string) => {
    selectInvoice(invoiceId);
    publishPlatformEvent('SHOW_TOAST', { message: `Opened invoice ${invoiceId}`, severity: 'info' });
    publishPlatformEvent('TRACK_EVENT', {
      name: 'billing.invoice_selected',
      properties: { invoiceId }
    });
  };

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'ALL') {
      return invoices;
    }
    return invoices.filter((invoice) => invoice.status === statusFilter);
  }, [statusFilter]);

  const selected = filteredInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? filteredInvoices[0] ?? null;

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, border: 1, borderColor: 'divider' }}>
      <Stack spacing={2}>
        <PageHeader title="Billing Operations" subtitle="Track invoice status and drill into payment details." />
        <FormControl size="small" sx={{ maxWidth: 220 }}>
          <InputLabel id="invoice-filter-label">Invoice Status</InputLabel>
          <Select
            labelId="invoice-filter-label"
            label="Invoice Status"
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value as typeof statusFilter)}
          >
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="PAID">Paid</MenuItem>
            <MenuItem value="DUE">Due</MenuItem>
            <MenuItem value="OVERDUE">Overdue</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
          <Box>
            <Paper variant="outlined" sx={{ borderColor: 'divider' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      hover
                      selected={selected?.id === invoice.id}
                      onClick={() => onInvoiceSelect(invoice.id)}
                      sx={{
                        cursor: 'pointer',
                        '&.Mui-selected': {
                          bgcolor: 'action.selected'
                        }
                      }}
                    >
                      <TableCell>{invoice.id}</TableCell>
                      <TableCell>{invoice.customer}</TableCell>
                      <TableCell>{invoice.amount}</TableCell>
                      <TableCell>
                        <Chip size="small" color={statusColor(invoice.status)} label={invoice.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>

          <Box>
            <Paper variant="outlined" sx={{ p: 2, minHeight: 220, borderColor: 'divider' }}>
              {selected ? (
                <Stack spacing={1}>
                  <Typography variant="h6">Invoice Details</Typography>
                  <Typography variant="body2">Invoice: {selected.id}</Typography>
                  <Typography variant="body2">Customer: {selected.customer}</Typography>
                  <Typography variant="body2">Due Date: {selected.dueDate}</Typography>
                  <Typography variant="body2">Amount: {selected.amount}</Typography>
                  <Chip size="small" color={statusColor(selected.status)} label={selected.status} sx={{ width: 'fit-content' }} />
                </Stack>
              ) : (
                <EmptyState title="No invoices found" description="Change the status filter to view additional invoices." />
              )}
            </Paper>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}
