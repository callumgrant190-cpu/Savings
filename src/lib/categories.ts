import type { AccountType, FlowKind } from '../types';

export const INCOME_CATEGORIES = ['Wages', 'Grant / SUSI', 'Family support', 'Side income', 'Interest & dividends', 'Other income'];

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Groceries',
  'Transport',
  'Bills & utilities',
  'Phone & internet',
  'Subscriptions',
  'Eating out',
  'Social',
  'Sport & gym',
  'Supplements & health',
  'Education',
  'Clothing',
  'Other',
];

export function categoriesFor(kind: FlowKind): string[] {
  return kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export const ACCOUNT_LABEL: Record<AccountType, string> = {
  current: 'Current accounts',
  savings: 'Savings accounts',
  investment: 'Investments',
};

export const ACCOUNT_SINGULAR: Record<AccountType, string> = {
  current: 'Current account',
  savings: 'Savings account',
  investment: 'Investment',
};

/** Chart colours per account type. Keep in sync with tailwind `series.*`. */
export const SERIES_COLOR: Record<AccountType, string> = {
  current: '#3987e5',
  savings: '#d95926',
  investment: '#199e70',
};

export const INCOME_COLOR = '#3987e5';
export const EXPENSE_COLOR = '#d95926';
export const NEG_COLOR = '#e66767';

/** Chart chrome on the dark surface. */
export const CHART = {
  grid: '#1f2a3d',
  axis: '#64748b',
  tooltipBg: '#0b1120',
  tooltipBorder: 'rgba(255,255,255,0.1)',
};
