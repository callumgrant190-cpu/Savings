import { useMemo, useState, type FormEvent } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronLeft, ChevronRight, ReceiptText, Trash2 } from 'lucide-react';
import { useStore } from '../store/AppStore';
import type { FlowKind, MonthKey } from '../types';
import { addMonths, dayLabel, monthLabel, monthOf, todayISO } from '../lib/date';
import { toMonthly } from '../lib/finance';
import { categoriesFor, CHART, EXPENSE_COLOR, INCOME_COLOR } from '../lib/categories';
import { currencySymbol, money } from '../lib/format';
import { axisProps, Card, EmptyState, Field, Legend, NumberInput, PageHeader, Segmented, Stat, TooltipBox } from '../components/ui';

export function Tracker() {
  const { data, removeTransaction } = useStore();
  const { currency } = data.settings;
  const fmt = (v: number) => money(v, currency);
  const thisMonth = monthOf(todayISO());
  const [month, setMonth] = useState<MonthKey>(thisMonth);

  const inMonth = data.transactions.filter((t) => monthOf(t.date) === month);
  const income = inMonth.filter((t) => t.kind === 'income').reduce((s, t) => s + t.amount, 0);
  const spent = inMonth.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amount, 0);

  // Budgeted monthly spend per category, from the Budget page.
  const budgetByCat = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of data.budget) if (b.kind === 'expense') m[b.category] = (m[b.category] ?? 0) + toMonthly(b.amount, b.frequency);
    return m;
  }, [data.budget]);
  const budgetTotal = Object.values(budgetByCat).reduce((s, v) => s + v, 0);

  const actualByCat: Record<string, number> = {};
  for (const t of inMonth) if (t.kind === 'expense') actualByCat[t.category] = (actualByCat[t.category] ?? 0) + t.amount;

  const categoryRows = [...new Set([...Object.keys(budgetByCat), ...Object.keys(actualByCat)])]
    .map((category) => ({ category, budget: budgetByCat[category] ?? 0, actual: actualByCat[category] ?? 0 }))
    .sort((a, b) => b.actual - a.actual || b.budget - a.budget);

  const sixMonths = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const m = addMonths(month, i - 5);
        const txs = data.transactions.filter((t) => monthOf(t.date) === m);
        const inc = txs.filter((t) => t.kind === 'income').reduce((s, t) => s + t.amount, 0);
        const exp = txs.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amount, 0);
        return { month: m, label: monthLabel(m, true), income: inc, expenses: exp };
      }),
    [data.transactions, month],
  );

  return (
    <div>
      <PageHeader
        title="Tracker"
        subtitle="Log what actually comes in and goes out. Each month is compared against the budget you set, category by category."
      />

      <div className="mb-5 flex items-center justify-between gap-3">
        <button className="btn-ghost !px-2.5" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <div className="text-lg font-bold text-white">{monthLabel(month)}</div>
        <button className="btn-ghost !px-2.5" onClick={() => setMonth(addMonths(month, 1))} disabled={month >= thisMonth} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Income" swatch={INCOME_COLOR} value={fmt(income)} />
        <Stat label="Spent" swatch={EXPENSE_COLOR} value={fmt(spent)} sub={budgetTotal > 0 ? `of ${fmt(budgetTotal)} budgeted` : undefined} />
        <Stat label="Net" value={fmt(income - spent)} tone={income - spent >= 0 ? 'good' : 'bad'} sub={income - spent >= 0 ? 'saved this month' : 'spent more than earned'} />
        <Stat
          label="Budget left"
          value={budgetTotal > 0 ? fmt(budgetTotal - spent) : '–'}
          tone={budgetTotal > 0 ? (budgetTotal - spent >= 0 ? 'good' : 'bad') : undefined}
          sub={budgetTotal > 0 ? undefined : 'Set expenses on the Budget page'}
        />
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-[360px_1fr]">
        <QuickAdd month={month} />

        <Card title="Budget vs actual" subtitle="Spending this month against your monthly budget per category.">
          {categoryRows.length === 0 ? (
            <EmptyState icon={<ReceiptText size={22} />} title="Nothing to compare yet">
              Add expenses on the Budget page and log spending here.
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {categoryRows.map((r) => {
                const over = r.budget > 0 && r.actual > r.budget;
                const unbudgeted = r.budget === 0;
                const fill = r.budget > 0 ? Math.min(100, (r.actual / r.budget) * 100) : 100;
                return (
                  <li key={r.category}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-slate-200">{r.category}</span>
                      <span className="tabular text-xs text-slate-400">
                        <span className="font-semibold text-slate-100">{fmt(r.actual)}</span>
                        {r.budget > 0 && <> / {fmt(r.budget)}</>}
                        {over && <span className="ml-2 font-semibold text-red-400">▲ over by {fmt(r.actual - r.budget)}</span>}
                        {unbudgeted && <span className="ml-2 text-amber-300">not budgeted</span>}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${fill}%`,
                          background: over ? '#d03b3b' : unbudgeted ? '#fab219' : '#0ca30c',
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Last 6 months" subtitle="Logged income against logged spending." className="mb-5">
        <Legend
          items={[
            { label: 'Income', color: INCOME_COLOR },
            { label: 'Expenses', color: EXPENSE_COLOR },
          ]}
        />
        <div className="h-60">
          <ResponsiveContainer>
            <BarChart data={sixMonths} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="25%">
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => money(v, currency, { compact: true })} width={52} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const r = payload[0].payload as (typeof sixMonths)[number];
                  return (
                    <TooltipBox
                      title={monthLabel(r.month)}
                      rows={[
                        { label: 'Income', value: fmt(r.income), color: INCOME_COLOR },
                        { label: 'Expenses', value: fmt(r.expenses), color: EXPENSE_COLOR },
                        { label: 'Net', value: fmt(r.income - r.expenses), bold: true },
                      ]}
                    />
                  );
                }}
              />
              <Bar dataKey="income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title={`Transactions · ${monthLabel(month)}`} subtitle={`${inMonth.length} logged`}>
        {inMonth.length === 0 ? (
          <EmptyState icon={<ReceiptText size={22} />} title="No transactions this month">
            Use the form above to log income or spending as it happens.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-white/5">
            {inMonth.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: t.kind === 'income' ? INCOME_COLOR : EXPENSE_COLOR }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-100">
                    {t.category}
                    {t.note && <span className="font-normal text-slate-400"> · {t.note}</span>}
                  </div>
                  <div className="text-xs text-slate-500">{dayLabel(t.date)}</div>
                </div>
                <div className={`tabular font-semibold ${t.kind === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                  {t.kind === 'income' ? '+' : '−'}
                  {money(t.amount, currency, { cents: t.amount % 1 !== 0 })}
                </div>
                <button
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => removeTransaction(t.id)}
                  aria-label="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function QuickAdd({ month }: { month: MonthKey }) {
  const { data, addTransaction } = useStore();
  const today = todayISO();
  const defaultDate = monthOf(today) === month ? today : `${month}-01`;
  const [kind, setKind] = useState<FlowKind>('expense');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState(categoriesFor('expense')[1]);
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState('');
  const [lastMonth, setLastMonth] = useState(month);

  // Follow the month navigator so new entries land in the month being viewed.
  if (lastMonth !== month) {
    setLastMonth(month);
    setDate(defaultDate);
  }

  const switchKind = (k: FlowKind) => {
    setKind(k);
    setCategory(categoriesFor(k)[k === 'expense' ? 1 : 0]);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (amount === '' || amount <= 0) return;
    addTransaction({ kind, amount: Number(amount), category, date, note: note.trim() });
    setAmount('');
    setNote('');
  };

  return (
    <Card title="Log a transaction">
      <form onSubmit={submit} className="space-y-3">
        <Segmented
          size="sm"
          value={kind}
          onChange={switchKind}
          options={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount">
            <NumberInput value={amount} onChange={setAmount} prefix={currencySymbol(data.settings.currency)} />
          </Field>
          <Field label="Date">
            <input type="date" className="input" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Category">
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categoriesFor(kind).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Note (optional)">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Tesco, match fees" />
        </Field>
        <button className="btn-primary w-full" disabled={amount === '' || amount <= 0 || !date}>
          Add {kind}
        </button>
      </form>
    </Card>
  );
}
