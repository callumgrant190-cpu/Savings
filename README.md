# Nest: savings & budget

A personal finance app that puts every account in one place, projects where it's heading, and tracks income against spending.

## Features

- **Overview**: total savings split into current accounts, savings accounts and investments, a savings-over-time chart built from your balance updates, projected totals at 1, 5, 10 and 20 years, and a snapshot of this month's budget.
- **Accounts**: add current, savings and investment accounts. Savings accounts take your own interest rate (AER) and monthly contribution. Investments take either your own expected return or the **S&P 500 historical average**, minus any fees. Updating a balance records it in that account's history.
- **Projections**: compound-interest projections over 1 to 40 years, stacked by account type, with paid-in vs growth, milestones and a per-account table. You can show them in future money or in today's money (inflation-adjusted).
  - **S&P 500 range**: replays your S&P 500 investments through every real stretch of market history since 1928 and shows the 10th to 90th percentile spread, the median, and the worst and best start years.
  - **S&P 500 yearly returns**: every year's total return. You can pick the averaging period (all years, or the last 50, 30, 20 or 10).
  - **Quick calculator**: a what-if that doesn't touch your accounts.
- **Budget**: enter income and expenses at whatever frequency they actually happen (weekly, fortnightly, monthly, quarterly, yearly) and view the totals per week, month or year. It shows what's left over and whether your planned account contributions fit inside it.
- **Tracker**: log actual income and spending, compare each category against the budget month by month, and see the last 6 months of income against expenses.
- **Settings**: currency (€/£/$), inflation, JSON backup export/import, example data.

All data stays in your browser's `localStorage`. There's no account and no server.

## How the maths works

- Rates are annual (AER). Each month the balance grows by `(1 + r)^(1/12) − 1` and then that month's contribution is added. Current accounts are held flat.
- S&P 500 mode uses the compound annual growth rate over the chosen period. History runs apply each real year's return month by month.
- S&P 500 data: annual total returns and US CPI for 1928 to 2025, computed from Robert Shiller's monthly dataset ([datasets/s-and-p-500](https://github.com/datasets/s-and-p-500)) in `src/data/sp500.ts`. The 2023 to 2025 dividends and CPI are estimated because the source columns stop mid-2023. Returns are in USD and before tax.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # finance unit tests
npm run build    # type-check + production build
```

## Deploying

`.github/workflows/deploy.yml` tests, builds and publishes to GitHub Pages on every push to `main`. One-time setup: **Settings → Pages → Source: GitHub Actions**.

## Structure

```
src/
  data/sp500.ts        S&P 500 returns + CPI, 1928 to 2025
  lib/finance.ts       compound interest, S&P stats, history runs, budget conversion
  lib/useProjection.ts combined projection hook
  store/AppStore.tsx   localStorage-backed store + example data
  views/               Overview, Accounts, Projections, Budget, Tracker, Settings
```
