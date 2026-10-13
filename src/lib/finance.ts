import type { Account, AccountType, BudgetView, Frequency, ISODate, Sp500Window } from '../types';
import { SP500 } from '../data/sp500';

// ---------------------------------------------------------------------------
// Compound interest
// ---------------------------------------------------------------------------

/**
 * Monthly growth rate equivalent to an annual percentage. Rates are treated as
 * AER (the effective annual rate banks quote), so 12 months of this rate
 * compound back to exactly the annual figure.
 */
export function monthlyRate(annualPct: number): number {
  return Math.pow(1 + annualPct / 100, 1 / 12) - 1;
}

/**
 * Closed-form future value of a starting balance plus a fixed contribution paid
 * at the end of each month.
 */
export function futureValue(balance: number, monthly: number, annualPct: number, months: number): number {
  const i = monthlyRate(annualPct);
  const growth = Math.pow(1 + i, months);
  if (i === 0) return balance + monthly * months;
  return balance * growth + (monthly * (growth - 1)) / i;
}

export interface ProjectionPoint {
  year: number;
  value: number;
  /** Starting balance plus everything paid in so far. */
  paidIn: number;
}

/** Year-by-year values for one balance growing at a fixed annual rate. */
export function project(balance: number, monthly: number, annualPct: number, years: number): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  for (let y = 0; y <= years; y++) {
    points.push({
      year: y,
      value: futureValue(balance, monthly, annualPct, y * 12),
      paidIn: balance + monthly * 12 * y,
    });
  }
  return points;
}

/** Divide a future amount by inflation to express it in today's money. */
export function toReal(value: number, years: number, inflationPct: number): number {
  return value / Math.pow(1 + inflationPct / 100, years);
}

// ---------------------------------------------------------------------------
// S&P 500 history
// ---------------------------------------------------------------------------

export const SP500_FIRST_YEAR = SP500[0].year;
export const SP500_LAST_YEAR = SP500[SP500.length - 1].year;

export const WINDOW_LABEL: Record<Sp500Window, string> = {
  all: `Since ${SP500_FIRST_YEAR}`,
  '50': 'Last 50 years',
  '30': 'Last 30 years',
  '20': 'Last 20 years',
  '10': 'Last 10 years',
};

export function sp500Slice(window: Sp500Window) {
  return window === 'all' ? SP500 : SP500.slice(-Number(window));
}

export interface Sp500Stats {
  from: number;
  to: number;
  years: number;
  /** Compound annual growth rate, percent. The rate used in projections. */
  cagr: number;
  /** Inflation-adjusted CAGR, percent. */
  realCagr: number;
  best: { year: number; ret: number };
  worst: { year: number; ret: number };
  negativeYears: number;
}

export function sp500Stats(window: Sp500Window): Sp500Stats {
  const rows = sp500Slice(window);
  let nominal = 1;
  let prices = 1;
  let best = rows[0];
  let worst = rows[0];
  let negativeYears = 0;
  for (const r of rows) {
    nominal *= 1 + r.ret / 100;
    prices *= 1 + r.cpi / 100;
    if (r.ret > best.ret) best = r;
    if (r.ret < worst.ret) worst = r;
    if (r.ret < 0) negativeYears++;
  }
  const n = rows.length;
  return {
    from: rows[0].year,
    to: rows[n - 1].year,
    years: n,
    cagr: (Math.pow(nominal, 1 / n) - 1) * 100,
    realCagr: (Math.pow(nominal / prices, 1 / n) - 1) * 100,
    best: { year: best.year, ret: best.ret },
    worst: { year: worst.year, ret: worst.ret },
    negativeYears,
  };
}

/** Linear-interpolated percentile of an unsorted list. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

export interface Pot {
  balance: number;
  monthly: number;
  feePct: number;
}

export interface HistoricalBand {
  year: number;
  worst: number;
  p10: number;
  median: number;
  p90: number;
  best: number;
}

export interface HistoricalRuns {
  band: HistoricalBand[];
  /** Number of complete historical periods the band is built from. */
  runs: number;
  worstStart: number;
  bestStart: number;
  /** Periods that ended with less than the total paid in. */
  losingRuns: number;
}

/**
 * Replays every real stretch of S&P 500 history of the given length against
 * the pots (e.g. "what if I'd started in 1929, 1930, ... ?") and returns the
 * spread of outcomes for each year. Returns null when history is too short.
 */
export function historicalRuns(pots: Pot[], years: number): HistoricalRuns | null {
  const starts = SP500.length - years + 1;
  if (years < 1 || starts < 1 || pots.length === 0) return null;

  const paths: number[][] = [];
  for (let s = 0; s < starts; s++) {
    const values = pots.map((p) => p.balance);
    const path = [values.reduce((a, b) => a + b, 0)];
    for (let y = 0; y < years; y++) {
      const ret = SP500[s + y].ret;
      for (let k = 0; k < pots.length; k++) {
        const i = monthlyRate(ret - pots[k].feePct);
        for (let m = 0; m < 12; m++) values[k] = values[k] * (1 + i) + pots[k].monthly;
      }
      path.push(values.reduce((a, b) => a + b, 0));
    }
    paths.push(path);
  }

  const band: HistoricalBand[] = [];
  for (let y = 0; y <= years; y++) {
    const col = paths.map((p) => p[y]);
    band.push({
      year: y,
      worst: Math.min(...col),
      p10: percentile(col, 0.1),
      median: percentile(col, 0.5),
      p90: percentile(col, 0.9),
      best: Math.max(...col),
    });
  }
  const finals = paths.map((p) => p[years]);
  const paidIn = pots.reduce((s, p) => s + p.balance + p.monthly * 12 * years, 0);
  return {
    losingRuns: finals.filter((f) => f < paidIn).length,
    band,
    runs: starts,
    worstStart: SP500[finals.indexOf(Math.min(...finals))].year,
    bestStart: SP500[finals.indexOf(Math.max(...finals))].year,
  };
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

/** The annual growth rate an account is projected at, after fees. */
export function accountRate(a: Account, sp500Cagr: number): number {
  if (a.type === 'current') return 0;
  if (a.type === 'savings') return a.rate;
  const gross = a.returnMode === 'sp500' ? sp500Cagr : a.rate;
  return gross - a.feePct;
}

export function accountMonthly(a: Account): number {
  return a.type === 'current' ? 0 : a.monthlyContribution;
}

export function totalsByType(accounts: Account[]): Record<AccountType, number> {
  const t: Record<AccountType, number> = { current: 0, savings: 0, investment: 0 };
  for (const a of accounts) t[a.type] += a.balance;
  return t;
}

export interface NetWorthPoint {
  date: ISODate;
  current: number;
  savings: number;
  investment: number;
  total: number;
}

/**
 * Net worth on every date any balance was recorded. Each account carries its
 * last known balance forward until it is updated again.
 */
export function netWorthHistory(accounts: Account[]): NetWorthPoint[] {
  const dates = [...new Set(accounts.flatMap((a) => a.history.map((h) => h.date)))].sort();
  return dates.map((date) => {
    const p: NetWorthPoint = { date, current: 0, savings: 0, investment: 0, total: 0 };
    for (const a of accounts) {
      let bal: number | null = null;
      for (const h of a.history) {
        if (h.date <= date) bal = h.balance;
        else break;
      }
      if (bal !== null) {
        p[a.type] += bal;
        p.total += bal;
      }
    }
    return p;
  });
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const PER_YEAR: Record<Frequency, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

/** Convert an amount paid at one frequency into the equivalent at another view. */
export function convert(amount: number, from: Frequency, to: BudgetView): number {
  return (amount * PER_YEAR[from]) / PER_YEAR[to];
}

export function toMonthly(amount: number, from: Frequency): number {
  return convert(amount, from, 'monthly');
}
