import { create } from 'zustand';

type AccountsState = {
  searchTerm: string;
  selectedAccountId: string | null;
  setSearchTerm: (searchTerm: string) => void;
  selectAccount: (accountId: string) => void;
};

export const useAccountsStore = create<AccountsState>((set) => ({
  searchTerm: '',
  selectedAccountId: null,
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  selectAccount: (selectedAccountId) => set({ selectedAccountId })
}));
