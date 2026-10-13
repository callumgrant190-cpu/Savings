export type ISODate = string; // YYYY-MM-DD
export type MonthKey = string; // YYYY-MM

export type AccountType = 'current' | 'savings' | 'investment';

/** How an investment's growth rate is chosen. */
export type ReturnMode = 'custom' | 'sp500';

/** Which slice of S&P 500 history the average return is taken from. */
export type Sp500Window = 'all' | '50' | '30' | '20' | '10';

export interface BalancePoint {
  date: ISODate;
  balance: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  /** Bank, broker or platform. Optional label only. */
  provider: string;
  balance: number;
  /** Amount paid in each month. Ignored for current accounts. */
  monthlyContribution: number;
  /** Annual interest (savings) or custom annual return (investments), percent. */
  rate: number;
  /** Investments only: use a custom rate or S&P 500 history. */
  returnMode: ReturnMode;
  /** Investments only: annual fund + platform fee, percent. */
  feePct: number;
  /** Every recorded balance, oldest first. Drives the net-worth history. */
  history: BalancePoint[];
  createdAt: ISODate;
}

export type Frequency = 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'yearly';
export type FlowKind = 'income' | 'expense';

/** A recurring line in the budget: "Part-time job, €220 weekly". */
export interface BudgetItem {
  id: string;
  kind: FlowKind;
  name: string;
  category: string;
  amount: number;
  frequency: Frequency;
}

/** A single logged income or expense. */
export interface Transaction {
  id: string;
  kind: FlowKind;
  date: ISODate;
  amount: number;
  category: string;
  note: string;
}

export type Currency = 'EUR' | 'GBP' | 'USD';
export type BudgetView = 'weekly' | 'monthly' | 'yearly';

export interface Settings {
  name: string;
  currency: Currency;
  /** Projection length in years. */
  horizonYears: number;
  /** Expected annual inflation, percent. Used for "today's money" figures. */
  inflation: number;
  /** Show projections in today's money (inflation-adjusted). */
  showReal: boolean;
  sp500Window: Sp500Window;
  budgetView: BudgetView;
}

export interface AppData {
  version: 1;
  settings: Settings;
  accounts: Account[];
  budget: BudgetItem[];
  transactions: Transaction[];
}
