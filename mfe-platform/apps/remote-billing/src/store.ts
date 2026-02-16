import { create } from 'zustand';

type BillingState = {
  statusFilter: 'ALL' | 'PAID' | 'DUE' | 'OVERDUE';
  selectedInvoiceId: string | null;
  setStatusFilter: (statusFilter: BillingState['statusFilter']) => void;
  selectInvoice: (invoiceId: string) => void;
};

export const useBillingStore = create<BillingState>((set) => ({
  statusFilter: 'ALL',
  selectedInvoiceId: null,
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  selectInvoice: (selectedInvoiceId) => set({ selectedInvoiceId })
}));
