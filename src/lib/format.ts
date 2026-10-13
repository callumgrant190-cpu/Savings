import type { Currency } from '../types';

const LOCALE: Record<Currency, string> = { EUR: 'en-IE', GBP: 'en-GB', USD: 'en-US' };

export function money(value: number, currency: Currency, opts: { cents?: boolean; compact?: boolean } = {}): string {
  return new Intl.NumberFormat(LOCALE[currency], {
    style: 'currency',
    currency,
    notation: opts.compact ? 'compact' : 'standard',
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : opts.compact ? 1 : 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function currencySymbol(currency: Currency): string {
  return { EUR: '€', GBP: '£', USD: '$' }[currency];
}

export function pct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function signedPct(value: number, digits = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
}
