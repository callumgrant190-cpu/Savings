import { describe, expect, it } from 'vitest';
import {
  convert,
  futureValue,
  historicalRuns,
  monthlyRate,
  netWorthHistory,
  percentile,
  project,
  sp500Stats,
  toReal,
} from './finance';
import { SP500 } from '../data/sp500';
import type { Account } from '../types';

describe('compound interest', () => {
  it('monthly rate compounds back to the annual rate', () => {
    expect(Math.pow(1 + monthlyRate(5), 12)).toBeCloseTo(1.05, 12);
  });

  it('lump sum grows by the annual rate each year', () => {
    expect(futureValue(1000, 0, 5, 12)).toBeCloseTo(1050, 8);
    expect(futureValue(1000, 0, 5, 120)).toBeCloseTo(1000 * Math.pow(1.05, 10), 6);
  });

  it('matches a month-by-month simulation with contributions', () => {
    const i = monthlyRate(7);
    let v = 2500;
    for (let m = 0; m < 240; m++) v = v * (1 + i) + 150;
    expect(futureValue(2500, 150, 7, 240)).toBeCloseTo(v, 6);
  });

  it('handles a zero rate', () => {
    expect(futureValue(1000, 100, 0, 24)).toBe(3400);
  });

  it('project tracks paid-in separately from growth', () => {
    const p = project(1000, 100, 4, 3);
    expect(p).toHaveLength(4);
    expect(p[0].value).toBe(1000);
    expect(p[3].paidIn).toBe(1000 + 3600);
    expect(p[3].value).toBeGreaterThan(p[3].paidIn);
  });

  it('converts to today\'s money', () => {
    expect(toReal(1102.5, 2, 5)).toBeCloseTo(1000, 8);
  });
});

describe('S&P 500', () => {
  it('has continuous yearly data', () => {
    SP500.forEach((r, i) => i > 0 && expect(r.year).toBe(SP500[i - 1].year + 1));
  });

  it('long-run CAGR is in the well-known ~10% range', () => {
    const s = sp500Stats('all');
    expect(s.cagr).toBeGreaterThan(9);
    expect(s.cagr).toBeLessThan(11.5);
    expect(s.realCagr).toBeLessThan(s.cagr);
    expect(s.worst.year).toBe(1931);
  });

  it('historical runs replay every complete period', () => {
    const r = historicalRuns([{ balance: 1000, monthly: 0, feePct: 0 }], 10)!;
    expect(r.runs).toBe(SP500.length - 9);
    expect(r.band[0].median).toBe(1000);
    const last = r.band[10];
    expect(last.worst).toBeLessThanOrEqual(last.p10);
    expect(last.p10).toBeLessThanOrEqual(last.median);
    expect(last.median).toBeLessThanOrEqual(last.p90);
    expect(last.p90).toBeLessThanOrEqual(last.best);
  });

  it('one-year run equals the actual return', () => {
    const r = historicalRuns([{ balance: 100, monthly: 0, feePct: 0 }], 1)!;
    expect(r.band[1].best).toBeCloseTo(100 * (1 + Math.max(...SP500.map((s) => s.ret)) / 100), 6);
  });

  it('returns null when history is too short', () => {
    expect(historicalRuns([{ balance: 1, monthly: 0, feePct: 0 }], SP500.length + 1)).toBeNull();
  });
});

describe('helpers', () => {
  it('percentile interpolates', () => {
    expect(percentile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(percentile([0, 10], 0.1)).toBe(1);
  });

  it('converts budget frequencies', () => {
    expect(convert(100, 'weekly', 'monthly')).toBeCloseTo(433.333, 2);
    expect(convert(1200, 'yearly', 'monthly')).toBe(100);
    expect(convert(1000, 'monthly', 'weekly')).toBeCloseTo(230.77, 2);
  });

  it('net worth carries balances forward', () => {
    const base = { provider: '', monthlyContribution: 0, rate: 0, returnMode: 'custom', feePct: 0, createdAt: '2026-01-01' } as const;
    const accounts: Account[] = [
      { ...base, id: 'a', name: 'A', type: 'current', balance: 0, history: [{ date: '2026-01-01', balance: 100 }, { date: '2026-03-01', balance: 300 }] },
      { ...base, id: 'b', name: 'B', type: 'savings', balance: 0, history: [{ date: '2026-02-01', balance: 50 }] },
    ];
    const h = netWorthHistory(accounts);
    expect(h.map((p) => p.total)).toEqual([100, 150, 350]);
    expect(h[2].savings).toBe(50);
  });
});

describe('losing runs', () => {
  it('a one-year horizon loses in every negative year', () => {
    const r = historicalRuns([{ balance: 100, monthly: 0, feePct: 0 }], 1)!;
    expect(r.losingRuns).toBe(SP500.filter((s) => s.ret < 0).length);
  });
});
