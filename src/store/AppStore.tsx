import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Account, AppData, BudgetItem, Settings, Transaction } from '../types';
import { addMonths, todayISO } from '../lib/date';

const STORAGE_KEY = 'nest.appdata.v1';

const DEFAULT_SETTINGS: Settings = {
  name: '',
  currency: 'EUR',
  horizonYears: 10,
  inflation: 2.5,
  showReal: false,
  sp500Window: 'all',
  budgetView: 'monthly',
};

function emptyData(): AppData {
  return { version: 1, settings: DEFAULT_SETTINGS, accounts: [], budget: [], transactions: [] };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return { ...emptyData(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
  } catch {
    return emptyData();
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export type NewAccount = Omit<Account, 'id' | 'history' | 'createdAt'>;

interface Store {
  data: AppData;
  updateSettings: (patch: Partial<Settings>) => void;
  addAccount: (a: NewAccount) => void;
  /** Patching `balance` also records a dated balance in the account history. */
  updateAccount: (id: string, patch: Partial<NewAccount>) => void;
  removeAccount: (id: string) => void;
  addBudgetItem: (b: Omit<BudgetItem, 'id'>) => void;
  updateBudgetItem: (id: string, patch: Partial<BudgetItem>) => void;
  removeBudgetItem: (id: string) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  loadExample: () => void;
  resetAll: () => void;
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
}

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [data]);

  const store = useMemo<Store>(() => {
    const mutate = (fn: (d: AppData) => AppData) => setData((d) => fn(d));

    return {
      data,
      updateSettings: (patch) => mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } })),

      addAccount: (a) =>
        mutate((d) => {
          const today = todayISO();
          return {
            ...d,
            accounts: [...d.accounts, { ...a, id: uid(), createdAt: today, history: [{ date: today, balance: a.balance }] }],
          };
        }),

      updateAccount: (id, patch) =>
        mutate((d) => ({
          ...d,
          accounts: d.accounts.map((a) => {
            if (a.id !== id) return a;
            const next = { ...a, ...patch };
            if (patch.balance !== undefined && patch.balance !== a.balance) {
              const today = todayISO();
              next.history = [...a.history.filter((h) => h.date !== today), { date: today, balance: patch.balance }].sort(
                (x, y) => x.date.localeCompare(y.date),
              );
            }
            return next;
          }),
        })),

      removeAccount: (id) => mutate((d) => ({ ...d, accounts: d.accounts.filter((a) => a.id !== id) })),

      addBudgetItem: (b) => mutate((d) => ({ ...d, budget: [...d.budget, { ...b, id: uid() }] })),
      updateBudgetItem: (id, patch) =>
        mutate((d) => ({ ...d, budget: d.budget.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      removeBudgetItem: (id) => mutate((d) => ({ ...d, budget: d.budget.filter((b) => b.id !== id) })),

      addTransaction: (t) =>
        mutate((d) => ({
          ...d,
          transactions: [{ ...t, id: uid() }, ...d.transactions].sort((a, b) => b.date.localeCompare(a.date)),
        })),
      removeTransaction: (id) => mutate((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) })),

      loadExample: () => mutate((d) => ({ ...exampleData(), settings: d.settings })),
      resetAll: () => setData(emptyData()),
      exportJSON: () => JSON.stringify(data, null, 2),
      importJSON: (json) => {
        try {
          const parsed = JSON.parse(json) as Partial<AppData>;
          if (!parsed || !Array.isArray(parsed.accounts)) return false;
          setData({ ...emptyData(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } });
          return true;
        } catch {
          return false;
        }
      },
    };
  }, [data]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside AppStoreProvider');
  return s;
}

// ---------------------------------------------------------------------------
// Example data: a student budget with a few months of history.
// ---------------------------------------------------------------------------

function exampleData(): AppData {
  const today = todayISO();
  const thisMonth = today.slice(0, 7);
  const monthDay = (offset: number, day: number) => `${addMonths(thisMonth, offset)}-${String(day).padStart(2, '0')}`;
  // Clamp so example entries never land in the future.
  const past = (offset: number, day: number) => {
    const d = monthDay(offset, day);
    return d > today ? today : d;
  };

  const acct = (
    name: string,
    type: Account['type'],
    provider: string,
    balances: number[],
    extra: Partial<Account> = {},
  ): Account => ({
    id: uid(),
    name,
    type,
    provider,
    balance: balances[balances.length - 1],
    monthlyContribution: 0,
    rate: 0,
    returnMode: 'custom',
    feePct: 0,
    createdAt: past(-(balances.length - 1), 1),
    history: balances.map((balance, i) => ({ date: past(i - (balances.length - 1), 1), balance })),
    ...extra,
  });

  const accounts: Account[] = [
    acct('Everyday current', 'current', 'Bank', [640, 910, 720, 850, 780, 850]),
    acct('Emergency fund', 'savings', 'Bank', [1900, 2000, 2100, 2200, 2300, 2400], { rate: 2.5, monthlyContribution: 75 }),
    acct('Masters fund', 'savings', 'Online saver', [800, 950, 1100, 1250, 1400, 1550], { rate: 3, monthlyContribution: 100 }),
    acct('S&P 500 index fund', 'investment', 'Broker', [700, 760, 840, 930, 1010, 1180], {
      returnMode: 'sp500',
      monthlyContribution: 100,
      feePct: 0.25,
    }),
  ];

  const budget: BudgetItem[] = [
    { id: uid(), kind: 'income', name: 'Part-time job', category: 'Wages', amount: 280, frequency: 'weekly' },
    { id: uid(), kind: 'income', name: 'Grant', category: 'Grant / SUSI', amount: 3000, frequency: 'yearly' },
    { id: uid(), kind: 'expense', name: 'Rent', category: 'Rent', amount: 520, frequency: 'monthly' },
    { id: uid(), kind: 'expense', name: 'Food shop', category: 'Groceries', amount: 65, frequency: 'weekly' },
    { id: uid(), kind: 'expense', name: 'Bus & fuel', category: 'Transport', amount: 25, frequency: 'weekly' },
    { id: uid(), kind: 'expense', name: 'Phone', category: 'Phone & internet', amount: 20, frequency: 'monthly' },
    { id: uid(), kind: 'expense', name: 'Spotify & Netflix', category: 'Subscriptions', amount: 22, frequency: 'monthly' },
    { id: uid(), kind: 'expense', name: 'Gym', category: 'Sport & gym', amount: 35, frequency: 'monthly' },
    { id: uid(), kind: 'expense', name: 'Protein & creatine', category: 'Supplements & health', amount: 40, frequency: 'monthly' },
    { id: uid(), kind: 'expense', name: 'Nights out', category: 'Social', amount: 30, frequency: 'weekly' },
  ];

  const transactions: Transaction[] = [];
  // Example entries dated after today are skipped, not moved, so the current
  // month only shows what would really have happened so far.
  const tx = (kind: Transaction['kind'], date: string, amount: number, category: string, note = '') => {
    if (date <= today) transactions.push({ id: uid(), kind, date, amount, category, note });
  };
  for (let m = -3; m <= 0; m++) {
    for (const day of [5, 12, 19, 26]) {
      tx('income', monthDay(m, day), 280, 'Wages', 'Weekly pay');
      tx('expense', monthDay(m, day + 1), 55 + ((day * 7 + m * 3) % 25), 'Groceries');
      tx('expense', monthDay(m, day + 2), 20 + ((day + m) % 15), 'Social');
    }
    tx('expense', monthDay(m, 1), 520, 'Rent');
    tx('expense', monthDay(m, 3), 20, 'Phone & internet');
    tx('expense', monthDay(m, 8), 35, 'Sport & gym');
    tx('expense', monthDay(m, 14), 22, 'Subscriptions');
    tx('expense', monthDay(m, 16), 85 + ((m + 4) * 13) % 40, 'Transport');
  }
  tx('income', monthDay(-2, 20), 1500, 'Grant / SUSI', 'Grant instalment');
  tx('expense', monthDay(-1, 22), 60, 'Clothing', 'Boots');
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return { version: 1, settings: DEFAULT_SETTINGS, accounts, budget, transactions };
}
