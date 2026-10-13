import { useMemo } from 'react';
import { useStore } from '../store/AppStore';
import { accountMonthly, accountRate, futureValue, historicalRuns, sp500Stats, toReal } from './finance';
import type { Account } from '../types';

export interface CombinedPoint {
  year: number;
  label: string;
  current: number;
  savings: number;
  investment: number;
  total: number;
  paidIn: number;
}

export interface AccountProjection {
  account: Account;
  rate: number;
  final: number;
  paidIn: number;
}

/**
 * Projects every account forward over the chosen horizon, honouring the
 * "today's money" setting. Shared by Overview and Projections.
 */
export function useProjection(horizonOverride?: number) {
  const { data } = useStore();
  const { accounts, settings } = data;
  const years = horizonOverride ?? settings.horizonYears;

  return useMemo(() => {
    const sp = sp500Stats(settings.sp500Window);
    const adj = (v: number, y: number) => (settings.showReal ? toReal(v, y, settings.inflation) : v);
    const thisYear = new Date().getFullYear();

    const series: CombinedPoint[] = [];
    for (let y = 0; y <= years; y++) {
      const p: CombinedPoint = { year: y, label: String(thisYear + y), current: 0, savings: 0, investment: 0, total: 0, paidIn: 0 };
      for (const a of accounts) {
        const monthly = accountMonthly(a);
        const v = adj(futureValue(a.balance, monthly, accountRate(a, sp.cagr), y * 12), y);
        p[a.type] += v;
        p.total += v;
        p.paidIn += adj(a.balance + monthly * 12 * y, y);
      }
      series.push(p);
    }

    const perAccount: AccountProjection[] = accounts.map((a) => {
      const rate = accountRate(a, sp.cagr);
      const monthly = accountMonthly(a);
      return {
        account: a,
        rate,
        final: adj(futureValue(a.balance, monthly, rate, years * 12), years),
        paidIn: adj(a.balance + monthly * 12 * years, years),
      };
    });

    const spAccounts = accounts.filter((a) => a.type === 'investment' && a.returnMode === 'sp500');
    const history = historicalRuns(
      spAccounts.map((a) => ({ balance: a.balance, monthly: a.monthlyContribution, feePct: a.feePct })),
      years,
    );
    const historyBand = history
      ? history.band.map((b) => ({
          ...b,
          label: String(thisYear + b.year),
          worst: adj(b.worst, b.year),
          p10: adj(b.p10, b.year),
          median: adj(b.median, b.year),
          p90: adj(b.p90, b.year),
          best: adj(b.best, b.year),
          // Recharts range areas take [low, high] tuples.
          outer: [adj(b.p10, b.year), adj(b.p90, b.year)] as [number, number],
          expected: adj(
            spAccounts.reduce((s, a) => s + futureValue(a.balance, a.monthlyContribution, sp.cagr - a.feePct, b.year * 12), 0),
            b.year,
          ),
        }))
      : null;

    return { years, series, perAccount, sp, spAccounts, history, historyBand };
  }, [accounts, settings.sp500Window, settings.showReal, settings.inflation, years]);
}
