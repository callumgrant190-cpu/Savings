import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineIcon } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useProjection } from '../lib/useProjection';
import { futureValue, SP500_FIRST_YEAR, sp500Slice, WINDOW_LABEL } from '../lib/finance';
import { ACCOUNT_SINGULAR, CHART, NEG_COLOR, SERIES_COLOR } from '../lib/categories';
import { currencySymbol, money, pct, signedPct } from '../lib/format';
import type { Sp500Window } from '../types';
import { axisProps, Card, EmptyState, Field, Legend, NumberInput, PageHeader, Segmented, Stat, TooltipBox } from '../components/ui';

const WINDOWS: Sp500Window[] = ['all', '50', '30', '20', '10'];

export function Projections() {
  const { data, updateSettings } = useStore();
  const { settings } = data;
  const { currency } = settings;
  const { years, series, perAccount, sp, spAccounts, history, historyBand } = useProjection();
  const end = series[series.length - 1];
  const growth = end.total - end.paidIn;
  const fmt = (v: number) => money(v, currency);
  const compact = (v: number) => money(v, currency, { compact: true });
  const moneyNote = settings.showReal ? `in today's money (${pct(settings.inflation)} inflation)` : 'in future money, not adjusted for inflation';

  const milestones = [1, 5, 10, 20, 30, years].filter((y, i, arr) => y <= years && arr.indexOf(y) === i).sort((a, b) => a - b);

  return (
    <div>
      <PageHeader
        title="Projections"
        subtitle="Where your savings and investments are heading if you keep paying in at today's rate. Savings use your own interest rates; investments use your rate or real S&P 500 history."
      />

      <div className="card mb-5 flex flex-wrap items-end gap-x-6 gap-y-4 p-4">
        <div className="min-w-[220px] flex-1">
          <span className="label">Time horizon: {years} {years === 1 ? 'year' : 'years'}</span>
          <input
            type="range"
            min={1}
            max={40}
            value={years}
            onChange={(e) => updateSettings({ horizonYears: Number(e.target.value) })}
            className="w-full accent-brand-500"
          />
        </div>
        <div>
          <span className="label">Show values</span>
          <Segmented
            size="sm"
            value={settings.showReal ? 'real' : 'nominal'}
            onChange={(v) => updateSettings({ showReal: v === 'real' })}
            options={[
              { value: 'nominal', label: 'Future money' },
              { value: 'real', label: "Today's money" },
            ]}
          />
        </div>
        <div>
          <span className="label">S&P 500 average</span>
          <Segmented
            size="sm"
            value={settings.sp500Window}
            onChange={(v) => updateSettings({ sp500Window: v })}
            options={WINDOWS.map((w) => ({ value: w, label: w === 'all' ? 'All' : `${w}y` }))}
          />
        </div>
      </div>

      {data.accounts.length === 0 ? (
        <Card>
          <EmptyState icon={<LineIcon size={22} />} title="Add an account to see projections">
            Head to Accounts, or load the example data from Settings to see how it works. The quick calculator below works on its own.
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={`Total in ${years}y`} value={fmt(end.total)} sub={moneyNote} />
            <Stat label="You pay in" value={fmt(end.paidIn)} sub="starting balances + contributions" />
            <Stat label="Growth earned" value={fmt(growth)} sub={end.paidIn > 0 ? `${pct((growth / end.paidIn) * 100, 0)} on top of what you put in` : undefined} tone={growth >= 0 ? 'good' : 'bad'} />
            <Stat
              label="Investments"
              swatch={SERIES_COLOR.investment}
              value={fmt(end.investment)}
              sub={`Savings ${fmt(end.savings)} · Current ${fmt(end.current)}`}
            />
          </div>

          <Card title="Projected total" subtitle={`Stacked by account type, ${moneyNote}. Dashed line is what you paid in; the gap above it is compound growth.`} className="mb-5">
            <Legend
              items={[
                { label: 'Investments', color: SERIES_COLOR.investment },
                { label: 'Savings', color: SERIES_COLOR.savings },
                { label: 'Current', color: SERIES_COLOR.current },
                { label: 'Paid in', color: '#cbd5e1', dashed: true },
              ]}
            />
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                  <YAxis {...axisProps} tickFormatter={compact} width={56} />
                  <Tooltip
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as (typeof series)[number];
                      return (
                        <TooltipBox
                          title={`${p.label} · year ${p.year}`}
                          rows={[
                            { label: 'Investments', value: fmt(p.investment), color: SERIES_COLOR.investment },
                            { label: 'Savings', value: fmt(p.savings), color: SERIES_COLOR.savings },
                            { label: 'Current', value: fmt(p.current), color: SERIES_COLOR.current },
                            { label: 'Paid in', value: fmt(p.paidIn) },
                            { label: 'Growth', value: fmt(p.total - p.paidIn) },
                            { label: 'Total', value: fmt(p.total), bold: true },
                          ]}
                        />
                      );
                    }}
                  />
                  <Area dataKey="current" stackId="1" stroke={SERIES_COLOR.current} fill={SERIES_COLOR.current} fillOpacity={0.35} strokeWidth={2} />
                  <Area dataKey="savings" stackId="1" stroke={SERIES_COLOR.savings} fill={SERIES_COLOR.savings} fillOpacity={0.35} strokeWidth={2} />
                  <Area dataKey="investment" stackId="1" stroke={SERIES_COLOR.investment} fill={SERIES_COLOR.investment} fillOpacity={0.35} strokeWidth={2} />
                  <Line dataKey="paidIn" stroke="#cbd5e1" strokeDasharray="5 4" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="mb-5 grid gap-5 lg:grid-cols-2">
            <Card title="Milestones" subtitle={moneyNote}>
              <div className="overflow-x-auto">
                <table className="tabular w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-2 font-medium">Year</th>
                      <th className="pb-2 text-right font-medium">Total</th>
                      <th className="pb-2 text-right font-medium">Paid in</th>
                      <th className="pb-2 text-right font-medium">Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {milestones.map((y) => {
                      const p = series[y];
                      return (
                        <tr key={y}>
                          <td className="py-2 text-slate-300">
                            {p.label} <span className="text-slate-500">({y}y)</span>
                          </td>
                          <td className="py-2 text-right font-semibold text-white">{fmt(p.total)}</td>
                          <td className="py-2 text-right text-slate-300">{fmt(p.paidIn)}</td>
                          <td className="py-2 text-right text-emerald-400">{fmt(p.total - p.paidIn)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="By account" subtitle={`Value in ${years} years at each account's rate`}>
              <div className="overflow-x-auto">
                <table className="tabular w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-2 font-medium">Account</th>
                      <th className="pb-2 text-right font-medium">Rate</th>
                      <th className="pb-2 text-right font-medium">Now</th>
                      <th className="pb-2 text-right font-medium">In {years}y</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {perAccount.map(({ account: a, rate, final }) => (
                      <tr key={a.id}>
                        <td className="py-2">
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: SERIES_COLOR[a.type] }} />
                            {a.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {ACCOUNT_SINGULAR[a.type]}
                            {a.type === 'investment' && a.returnMode === 'sp500' && ' · S&P 500'}
                          </div>
                        </td>
                        <td className="py-2 text-right text-slate-300">{a.type === 'current' ? '–' : pct(rate)}</td>
                        <td className="py-2 text-right text-slate-300">{fmt(a.balance)}</td>
                        <td className="py-2 text-right font-semibold text-white">{fmt(final)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}

      <Card
        title="S&P 500: what history says could happen"
        subtitle={
          spAccounts.length > 0 && history
            ? `Your ${spAccounts.length === 1 ? 'S&P 500 investment' : `${spAccounts.length} S&P 500 investments`} replayed through every real ${years}-year stretch since ${SP500_FIRST_YEAR} (${history.runs} periods), ${moneyNote}.`
            : 'Set an investment to "S&P 500 history" on the Accounts page to see the range of outcomes it could have had.'
        }
        className="mb-5"
      >
        {historyBand && history ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Bad case (10th pct)" value={fmt(historyBand[years].p10)} />
              <MiniStat label="Typical (median)" value={fmt(historyBand[years].median)} />
              <MiniStat label="Good case (90th pct)" value={fmt(historyBand[years].p90)} />
              <MiniStat label={`At ${pct(sp.cagr)} average`} value={fmt(historyBand[years].expected)} />
            </div>
            <Legend
              items={[
                { label: '10th–90th percentile range', color: SERIES_COLOR.investment },
                { label: 'Median outcome', color: '#e2e8f0' },
                { label: `Steady ${pct(sp.cagr)} a year`, color: '#fbbf24', dashed: true },
              ]}
            />
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={historyBand} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                  <YAxis {...axisProps} tickFormatter={compact} width={56} />
                  <Tooltip
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const b = payload[0].payload as NonNullable<typeof historyBand>[number];
                      return (
                        <TooltipBox
                          title={`${b.label} · year ${b.year}`}
                          rows={[
                            { label: 'Best ever', value: fmt(b.best) },
                            { label: '90th percentile', value: fmt(b.p90) },
                            { label: 'Median', value: fmt(b.median), bold: true },
                            { label: '10th percentile', value: fmt(b.p10) },
                            { label: 'Worst ever', value: fmt(b.worst) },
                            { label: 'Steady average', value: fmt(b.expected) },
                          ]}
                        />
                      );
                    }}
                  />
                  <Area dataKey="outer" stroke="none" fill={SERIES_COLOR.investment} fillOpacity={0.3} />
                  <Line dataKey="median" stroke="#e2e8f0" strokeWidth={2} dot={false} />
                  <Line dataKey="expected" stroke="#fbbf24" strokeDasharray="5 4" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Worst {years}-year start: <span className="text-slate-200">{history.worstStart}</span> ({fmt(historyBand[years].worst)}). Best:{' '}
              <span className="text-slate-200">{history.bestStart}</span> ({fmt(historyBand[years].best)}). The steady line assumes the same return
              every year; real markets swing, and the shorter the horizon the wider the range.{' '}
              {history.losingRuns === 0
                ? `No historical ${years}-year period ended with less than you paid in.`
                : `${history.losingRuns} of ${history.runs} historical ${years}-year periods ended with less than you paid in.`}
            </p>
          </>
        ) : spAccounts.length > 0 ? (
          <p className="text-sm text-slate-400">
            S&P 500 history only covers {sp500Slice('all').length} years, so the range can't be shown for a {years}-year horizon.
          </p>
        ) : null}
      </Card>

      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_340px]">
        <Sp500History />
        <QuickCalculator />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-900/50 p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="tabular mt-0.5 text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function Sp500History() {
  const { data } = useStore();
  const { sp } = useProjection();
  const window = data.settings.sp500Window;
  const rows = sp500Slice(window);

  return (
    <Card
      title={`S&P 500 yearly returns · ${WINDOW_LABEL[window].toLowerCase()}`}
      subtitle="Total return with dividends reinvested, in US dollars. Source: Shiller S&P 500 dataset; 2023–25 dividends estimated."
    >
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Average / year" value={pct(sp.cagr)} />
        <MiniStat label="After inflation" value={pct(sp.realCagr)} />
        <MiniStat label={`Best (${sp.best.year})`} value={signedPct(sp.best.ret)} />
        <MiniStat label={`Worst (${sp.worst.year})`} value={signedPct(sp.worst.ret)} />
      </div>
      <Legend
        items={[
          { label: 'Up year', color: SERIES_COLOR.current },
          { label: 'Down year', color: NEG_COLOR },
        ]}
      />
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={1}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="year" {...axisProps} minTickGap={16} />
            <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} width={44} />
            <ReferenceLine y={0} stroke={CHART.axis} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const r = payload[0].payload as (typeof rows)[number];
                return (
                  <TooltipBox
                    title={`${r.year}${r.estimated ? ' (estimated)' : ''}`}
                    rows={[
                      { label: 'Total return', value: signedPct(r.ret), bold: true },
                      { label: 'US inflation', value: signedPct(r.cpi) },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="ret" radius={[2, 2, 0, 0]}>
              {rows.map((r) => (
                <Cell key={r.year} fill={r.ret >= 0 ? SERIES_COLOR.current : NEG_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        {sp.negativeYears} of {sp.years} years were negative. Returns are in dollars; a euro or sterling investor also carries currency swings.
      </p>
    </Card>
  );
}

function QuickCalculator() {
  const { data } = useStore();
  const { currency } = data.settings;
  const sym = currencySymbol(currency);
  const [start, setStart] = useState<number | ''>(1000);
  const [monthly, setMonthly] = useState<number | ''>(100);
  const [rate, setRate] = useState<number | ''>(4);
  const [yrs, setYrs] = useState<number | ''>(10);

  const points = useMemo(() => {
    const n = Math.min(60, Math.max(0, Number(yrs || 0)));
    return Array.from({ length: n + 1 }, (_, y) => ({
      y,
      value: futureValue(Number(start || 0), Number(monthly || 0), Number(rate || 0), y * 12),
      paidIn: Number(start || 0) + Number(monthly || 0) * 12 * y,
    }));
  }, [start, monthly, rate, yrs]);
  const last = points[points.length - 1];

  return (
    <Card title="Quick calculator" subtitle="Try a rate or amount without changing your accounts.">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start with">
          <NumberInput value={start} onChange={setStart} prefix={sym} />
        </Field>
        <Field label="Add monthly">
          <NumberInput value={monthly} onChange={setMonthly} prefix={sym} />
        </Field>
        <Field label="Annual rate">
          <NumberInput value={rate} onChange={setRate} suffix="%" step="0.1" />
        </Field>
        <Field label="Years">
          <NumberInput value={yrs} onChange={setYrs} min={0} />
        </Field>
      </div>
      <div className="mt-4 rounded-2xl bg-ink-900/50 p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">You'd have</div>
        <div className="tabular text-3xl font-extrabold text-white">{money(last.value, currency)}</div>
        <div className="mt-1 text-xs text-slate-400">
          {money(last.paidIn, currency)} paid in + <span className="text-emerald-400">{money(last.value - last.paidIn, currency)}</span> interest
        </div>
        <div className="mt-3 h-20">
          <ResponsiveContainer>
            <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <Area dataKey="value" stroke={SERIES_COLOR.savings} fill={SERIES_COLOR.savings} fillOpacity={0.25} strokeWidth={2} />
              <Area dataKey="paidIn" stroke="#cbd5e1" strokeDasharray="4 3" fill="none" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
