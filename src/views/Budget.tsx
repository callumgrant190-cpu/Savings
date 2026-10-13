import { useState, type FormEvent } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { useStore } from '../store/AppStore';
import type { BudgetItem, BudgetView, FlowKind, Frequency } from '../types';
import { convert, FREQUENCY_LABEL } from '../lib/finance';
import { categoriesFor, CHART, EXPENSE_COLOR, INCOME_COLOR } from '../lib/categories';
import { currencySymbol, money, pct } from '../lib/format';
import { axisProps, Card, EmptyState, Field, NumberInput, PageHeader, Segmented, Stat, TooltipBox } from '../components/ui';

const VIEW_LABEL: Record<BudgetView, string> = { weekly: 'week', monthly: 'month', yearly: 'year' };

export function Budget() {
  const { data, updateSettings } = useStore();
  const { currency, budgetView: view } = data.settings;
  const fmt = (v: number) => money(v, currency);
  const per = (b: BudgetItem) => convert(b.amount, b.frequency, view);

  const income = data.budget.filter((b) => b.kind === 'income');
  const expenses = data.budget.filter((b) => b.kind === 'expense');
  const totalIn = income.reduce((s, b) => s + per(b), 0);
  const totalOut = expenses.reduce((s, b) => s + per(b), 0);
  const surplus = totalIn - totalOut;
  const plannedSaving = convert(
    data.accounts.filter((a) => a.type !== 'current').reduce((s, a) => s + a.monthlyContribution, 0),
    'monthly',
    view,
  );
  const unallocated = surplus - plannedSaving;

  const byCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, b) => {
      acc[b.category] = (acc[b.category] ?? 0) + per(b);
      return acc;
    }, {}),
  )
    .map(([category, amount]) => ({ category, amount, share: totalOut > 0 ? (amount / totalOut) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div>
      <PageHeader
        title="Budget"
        subtitle="Enter your regular income and expenses at whatever frequency they happen: weekly wages, monthly rent, a yearly grant. Nest converts them so you can see the whole picture per week, month or year."
        action={
          <Segmented
            value={view}
            onChange={(v) => updateSettings({ budgetView: v })}
            options={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`Income / ${VIEW_LABEL[view]}`} swatch={INCOME_COLOR} value={fmt(totalIn)} />
        <Stat label={`Expenses / ${VIEW_LABEL[view]}`} swatch={EXPENSE_COLOR} value={fmt(totalOut)} />
        <Stat
          label="Left over"
          value={fmt(surplus)}
          tone={surplus >= 0 ? 'good' : 'bad'}
          sub={totalIn > 0 ? `${pct((surplus / totalIn) * 100, 0)} of income` : undefined}
        />
        <Stat
          label="After planned saving"
          value={fmt(unallocated)}
          tone={unallocated >= 0 ? 'good' : 'bad'}
          sub={
            plannedSaving > 0
              ? `${fmt(plannedSaving)} goes to savings & investments`
              : 'Set monthly contributions on your accounts'
          }
        />
      </div>

      {unallocated < 0 && plannedSaving > 0 && (
        <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          ⚠ Your account contributions add up to more than you have left each {VIEW_LABEL[view]}. Either trim an expense or lower a contribution, otherwise
          the projections overstate what you'll save.
        </div>
      )}

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <FlowList kind="income" items={income} view={view} total={totalIn} />
        <FlowList kind="expense" items={expenses} view={view} total={totalOut} />
      </div>

      {byCategory.length > 0 && (
        <Card title={`Where the money goes each ${VIEW_LABEL[view]}`} subtitle="Expenses by category, largest first.">
          <div style={{ height: Math.max(160, byCategory.length * 34 + 30) }}>
            <ResponsiveContainer>
              <BarChart data={byCategory} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={6}>
                <CartesianGrid stroke={CHART.grid} horizontal={false} />
                <XAxis type="number" {...axisProps} tickFormatter={(v) => money(v, currency, { compact: true })} />
                <YAxis type="category" dataKey="category" {...axisProps} width={130} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const r = payload[0].payload as (typeof byCategory)[number];
                    return (
                      <TooltipBox
                        title={r.category}
                        rows={[
                          { label: `Per ${VIEW_LABEL[view]}`, value: money(r.amount, currency, { cents: true }), bold: true },
                          { label: 'Share of spending', value: pct(r.share) },
                        ]}
                      />
                    );
                  }}
                />
                <Bar dataKey="amount" fill={EXPENSE_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

function FlowList({ kind, items, view, total }: { kind: FlowKind; items: BudgetItem[]; view: BudgetView; total: number }) {
  const { data, removeBudgetItem } = useStore();
  const { currency } = data.settings;
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const isIncome = kind === 'income';

  return (
    <Card
      title={isIncome ? 'Income' : 'Expenses'}
      subtitle={`${money(total, currency)} per ${VIEW_LABEL[view]}`}
      action={
        editing !== 'new' && (
          <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setEditing('new')}>
            <Plus size={14} /> Add
          </button>
        )
      }
    >
      {editing === 'new' && <BudgetForm kind={kind} onDone={() => setEditing(null)} />}
      {items.length === 0 && editing !== 'new' ? (
        <EmptyState icon={<Wallet size={22} />} title={isIncome ? 'No income added' : 'No expenses added'}>
          {isIncome ? 'Add wages, grants, family support or anything else coming in.' : 'Add rent, food, transport, subscriptions, gym and so on.'}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-white/5">
          {items.map((b) =>
            editing === b.id ? (
              <li key={b.id} className="py-2">
                <BudgetForm kind={kind} initial={b} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-100">{b.name}</div>
                  <div className="text-xs text-slate-500">
                    {b.category} · {money(b.amount, currency, { cents: b.amount % 1 !== 0 })} {FREQUENCY_LABEL[b.frequency].toLowerCase()}
                  </div>
                </div>
                <div className="tabular text-right font-semibold text-white">
                  {money(convert(b.amount, b.frequency, view), currency)}
                  <span className="text-xs font-normal text-slate-500">/{VIEW_LABEL[view].slice(0, 2)}</span>
                </div>
                <button className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white" onClick={() => setEditing(b.id)} aria-label="Edit">
                  <Pencil size={15} />
                </button>
                <button
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => removeBudgetItem(b.id)}
                  aria-label="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}

function BudgetForm({ kind, initial, onDone }: { kind: FlowKind; initial?: BudgetItem; onDone: () => void }) {
  const { data, addBudgetItem, updateBudgetItem } = useStore();
  const categories = categoriesFor(kind);
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? categories[0]);
  const [amount, setAmount] = useState<number | ''>(initial?.amount ?? '');
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? (kind === 'income' ? 'weekly' : 'monthly'));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (amount === '' || amount <= 0) return;
    const item = { kind, name: name.trim() || category, category, amount: Number(amount), frequency };
    if (initial) updateBudgetItem(initial.id, item);
    else addBudgetItem(item);
    onDone();
  };

  return (
    <form onSubmit={submit} className="mb-3 space-y-3 rounded-2xl border border-white/5 bg-ink-900/40 p-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'income' ? 'e.g. Part-time job' : 'e.g. Rent'} autoFocus />
        </Field>
        <Field label="Category">
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Amount">
          <NumberInput value={amount} onChange={setAmount} prefix={currencySymbol(data.settings.currency)} />
        </Field>
        <Field label="How often">
          <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
            {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABEL[f]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost !py-1.5" onClick={onDone}>
          Cancel
        </button>
        <button className="btn-primary !py-1.5" disabled={amount === '' || amount <= 0}>
          {initial ? 'Save' : 'Add'}
        </button>
      </div>
    </form>
  );
}
