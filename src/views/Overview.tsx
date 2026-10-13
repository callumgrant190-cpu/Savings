import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Egg } from 'lucide-react';
import type { Tab } from '../App';
import { useStore } from '../store/AppStore';
import { useProjection } from '../lib/useProjection';
import { netWorthHistory, toMonthly, totalsByType } from '../lib/finance';
import { ACCOUNT_LABEL, CHART, EXPENSE_COLOR, INCOME_COLOR, SERIES_COLOR } from '../lib/categories';
import { dayLabel, monthOf, todayISO } from '../lib/date';
import { money, pct } from '../lib/format';
import type { AccountType } from '../types';
import { axisProps, Card, Legend, Stat, TooltipBox } from '../components/ui';

const TYPES: AccountType[] = ['current', 'savings', 'investment'];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function shortDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function Overview({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { data, loadExample } = useStore();
  const { currency, name, showReal } = data.settings;
  const fmt = (v: number) => money(v, currency);
  const projection = useProjection(20);

  if (data.accounts.length === 0 && data.budget.length === 0 && data.transactions.length === 0) {
    return (
      <div className="mx-auto max-w-xl pt-10">
        <Card>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 text-ink-900">
              <Egg size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Welcome to Nest</h1>
            <p className="max-w-md text-sm text-slate-400">
              Add your current accounts, savings and investments to see your total, then project it forward with compound interest or real S&P 500
              history. Set a weekly or monthly budget and log spending to see where it goes.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <button className="btn-primary" onClick={() => onNavigate('accounts')}>
                Add my first account
              </button>
              <button className="btn-ghost" onClick={loadExample}>
                Load example data
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const totals = totalsByType(data.accounts);
  const total = totals.current + totals.savings + totals.investment;
  const history = netWorthHistory(data.accounts);
  const first = history[0];
  const changeSinceStart = first ? total - first.total : 0;

  const monthlyIn = data.budget.filter((b) => b.kind === 'income').reduce((s, b) => s + toMonthly(b.amount, b.frequency), 0);
  const monthlyOut = data.budget.filter((b) => b.kind === 'expense').reduce((s, b) => s + toMonthly(b.amount, b.frequency), 0);
  const month = monthOf(todayISO());
  const monthTx = data.transactions.filter((t) => monthOf(t.date) === month);
  const spentThisMonth = monthTx.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amount, 0);
  const earnedThisMonth = monthTx.filter((t) => t.kind === 'income').reduce((s, t) => s + t.amount, 0);
  const monthlySaving = data.accounts.filter((a) => a.type !== 'current').reduce((s, a) => s + a.monthlyContribution, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="mb-6">
        <div className="text-sm text-slate-400">
          {greeting}
          {name ? `, ${name}` : ''}
        </div>
        <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">Total savings</div>
        <div className="tabular text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{money(total, currency, { cents: true })}</div>
        {first && history.length > 1 && (
          <div className={`mt-1 text-sm ${changeSinceStart >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {changeSinceStart >= 0 ? '▲' : '▼'} {fmt(Math.abs(changeSinceStart))} since {dayLabel(first.date)}
          </div>
        )}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TYPES.map((t) => (
          <button key={t} className="text-left" onClick={() => onNavigate('accounts')}>
            <Stat
              label={ACCOUNT_LABEL[t]}
              swatch={SERIES_COLOR[t]}
              value={fmt(totals[t])}
              sub={`${total > 0 ? pct((totals[t] / total) * 100, 0) : '0%'} of total · ${plural(data.accounts.filter((a) => a.type === t).length, 'account')}`}
            />
          </button>
        ))}
      </div>

      {total > 0 && (
        <div className="mb-5">
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Split of total savings by account type">
            {TYPES.filter((t) => totals[t] > 0).map((t) => (
              <div key={t} style={{ width: `${(totals[t] / total) * 100}%`, background: SERIES_COLOR[t] }} title={`${ACCOUNT_LABEL[t]}: ${fmt(totals[t])}`} />
            ))}
          </div>
        </div>
      )}

      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card title="Savings over time" subtitle="Built from every balance update you record on the Accounts page.">
          {history.length < 2 ? (
            <p className="py-10 text-center text-sm text-slate-400">
              Update your balances over the coming weeks and your history will build up here.
            </p>
          ) : (
            <>
              <Legend
                items={[
                  { label: 'Investments', color: SERIES_COLOR.investment },
                  { label: 'Savings', color: SERIES_COLOR.savings },
                  { label: 'Current', color: SERIES_COLOR.current },
                ]}
              />
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="date" {...axisProps} tickFormatter={shortDay} minTickGap={24} />
                    <YAxis {...axisProps} tickFormatter={(v) => money(v, currency, { compact: true })} width={52} />
                    <Tooltip
                      cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0].payload as (typeof history)[number];
                        return (
                          <TooltipBox
                            title={dayLabel(p.date)}
                            rows={[
                              { label: 'Investments', value: fmt(p.investment), color: SERIES_COLOR.investment },
                              { label: 'Savings', value: fmt(p.savings), color: SERIES_COLOR.savings },
                              { label: 'Current', value: fmt(p.current), color: SERIES_COLOR.current },
                              { label: 'Total', value: fmt(p.total), bold: true },
                            ]}
                          />
                        );
                      }}
                    />
                    <Area type="stepAfter" dataKey="current" stackId="1" stroke={SERIES_COLOR.current} fill={SERIES_COLOR.current} fillOpacity={0.35} strokeWidth={2} />
                    <Area type="stepAfter" dataKey="savings" stackId="1" stroke={SERIES_COLOR.savings} fill={SERIES_COLOR.savings} fillOpacity={0.35} strokeWidth={2} />
                    <Area type="stepAfter" dataKey="investment" stackId="1" stroke={SERIES_COLOR.investment} fill={SERIES_COLOR.investment} fillOpacity={0.35} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </Card>

        <Card
          title="Projected savings"
          subtitle={`${showReal ? "In today's money" : 'In future money'} · paying in ${fmt(monthlySaving)}/month`}
          action={
            <button className="text-xs font-semibold text-brand-300 hover:text-brand-400" onClick={() => onNavigate('projections')}>
              Details <ArrowRight size={12} className="inline" />
            </button>
          }
        >
          <ul className="divide-y divide-white/5">
            {[1, 5, 10, 20].map((y) => {
              const p = projection.series[y];
              return (
                <li key={y} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-slate-400">
                    In {y} {y === 1 ? 'year' : 'years'} <span className="text-slate-600">({p.label})</span>
                  </span>
                  <span className="tabular text-right">
                    <span className="block font-bold text-white">{fmt(p.total)}</span>
                    <span className="block text-[11px] text-emerald-400">+{fmt(p.total - p.paidIn)} growth</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Monthly budget"
          subtitle="From your regular income and expenses."
          action={
            <button className="text-xs font-semibold text-brand-300 hover:text-brand-400" onClick={() => onNavigate('budget')}>
              Edit <ArrowRight size={12} className="inline" />
            </button>
          }
        >
          {data.budget.length === 0 ? (
            <p className="text-sm text-slate-400">No budget yet. Add your income and expenses on the Budget page.</p>
          ) : (
            <FlowSummary
              rows={[
                { label: 'Income', value: monthlyIn, color: INCOME_COLOR },
                { label: 'Expenses', value: monthlyOut, color: EXPENSE_COLOR },
              ]}
              net={monthlyIn - monthlyOut}
              netLabel="Left over each month"
              fmt={fmt}
            />
          )}
        </Card>
        <Card
          title="This month so far"
          subtitle="From transactions you've logged."
          action={
            <button className="text-xs font-semibold text-brand-300 hover:text-brand-400" onClick={() => onNavigate('tracker')}>
              Log <ArrowRight size={12} className="inline" />
            </button>
          }
        >
          {monthTx.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing logged this month. Add transactions on the Tracker page.</p>
          ) : (
            <FlowSummary
              rows={[
                { label: 'Earned', value: earnedThisMonth, color: INCOME_COLOR },
                { label: 'Spent', value: spentThisMonth, color: EXPENSE_COLOR, of: monthlyOut },
              ]}
              net={earnedThisMonth - spentThisMonth}
              netLabel="Net this month"
              fmt={fmt}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function FlowSummary({ rows, net, netLabel, fmt }: {
  rows: { label: string; value: number; color: string; of?: number }[];
  net: number;
  netLabel: string;
  fmt: (v: number) => string;
}) {
  const max = Math.max(...rows.map((r) => Math.max(r.value, r.of ?? 0)), 1);
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-slate-300">{r.label}</span>
            <span className="tabular font-semibold text-white">
              {fmt(r.value)}
              {r.of ? <span className="font-normal text-slate-500"> / {fmt(r.of)} budget</span> : null}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </div>
        </div>
      ))}
      <div className="flex justify-between border-t border-white/5 pt-3 text-sm">
        <span className="text-slate-400">{netLabel}</span>
        <span className={`tabular font-bold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(net)}</span>
      </div>
    </div>
  );
}
