import { useState, type FormEvent } from 'react';
import { Landmark, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStore, type NewAccount } from '../store/AppStore';
import type { Account, AccountType, Currency, ReturnMode } from '../types';
import { ACCOUNT_LABEL, ACCOUNT_SINGULAR, SERIES_COLOR } from '../lib/categories';
import { currencySymbol, money, pct } from '../lib/format';
import { accountRate, sp500Stats, WINDOW_LABEL } from '../lib/finance';
import { dayLabel } from '../lib/date';
import { Card, EmptyState, Field, Modal, NumberInput, PageHeader, Segmented } from '../components/ui';

const TYPES: AccountType[] = ['current', 'savings', 'investment'];

export function Accounts() {
  const { data, removeAccount } = useStore();
  const { currency } = data.settings;
  const [editing, setEditing] = useState<Account | 'new' | null>(null);
  const [newType, setNewType] = useState<AccountType>('savings');
  const sp = sp500Stats(data.settings.sp500Window);

  const openNew = (t: AccountType) => {
    setNewType(t);
    setEditing('new');
  };

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Every current account, savings account and investment you hold. Update a balance whenever you check it and Nest keeps the history."
        action={
          <button className="btn-primary" onClick={() => openNew('savings')}>
            <Plus size={16} /> Add account
          </button>
        }
      />

      <div className="space-y-5">
        {TYPES.map((type) => {
          const list = data.accounts.filter((a) => a.type === type);
          const total = list.reduce((s, a) => s + a.balance, 0);
          return (
            <Card
              key={type}
              title={ACCOUNT_LABEL[type]}
              subtitle={
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: SERIES_COLOR[type] }} />
                  {money(total, currency)} across {list.length} {list.length === 1 ? 'account' : 'accounts'}
                </span>
              }
              action={
                <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => openNew(type)}>
                  <Plus size={14} /> Add
                </button>
              }
            >
              {list.length === 0 ? (
                <EmptyState icon={<Landmark size={22} />} title={`No ${ACCOUNT_LABEL[type].toLowerCase()} yet`}>
                  {type === 'investment'
                    ? 'Add an ETF, index fund or share account. You can project it at your own rate or at the S&P 500 historical average.'
                    : type === 'savings'
                      ? 'Add a savings account with its interest rate and what you pay in each month.'
                      : 'Add the account your wages land in. It counts towards your total but is not projected to grow.'}
                </EmptyState>
              ) : (
                <ul className="divide-y divide-white/5">
                  {list.map((a) => (
                    <AccountRow
                      key={a.id}
                      account={a}
                      rateText={rateText(a, sp.cagr, data.settings.sp500Window)}
                      currency={currency}
                      onEdit={() => setEditing(a)}
                      onDelete={() => confirm(`Delete "${a.name}"? Its balance history goes with it.`) && removeAccount(a.id)}
                    />
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      {editing && (
        <AccountForm
          initial={editing === 'new' ? undefined : editing}
          defaultType={newType}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function AccountRow({ account: a, rateText, currency, onEdit, onDelete }: {
  account: Account;
  currency: Currency;
  rateText: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { updateAccount } = useStore();
  const [draft, setDraft] = useState<number | ''>('');
  const last = a.history[a.history.length - 1];
  const prev = a.history.length > 1 ? a.history[a.history.length - 2] : null;
  const change = prev ? a.balance - prev.balance : null;

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-slate-100">{a.name}</div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
          {a.provider && <span>{a.provider}</span>}
          {a.type !== 'current' && <span>{rateText}</span>}
          {a.type !== 'current' && a.monthlyContribution > 0 && <span>+{money(a.monthlyContribution, currency)}/month</span>}
          {last && <span>Updated {dayLabel(last.date)}</span>}
        </div>
      </div>
      <div className="text-right">
        <div className="tabular text-lg font-bold text-white">{money(a.balance, currency, { cents: true })}</div>
        {change !== null && change !== 0 && (
          <div className={`tabular text-xs ${change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {change > 0 ? '▲' : '▼'} {money(Math.abs(change), currency)} since last update
          </div>
        )}
      </div>
      <form
        className="flex w-full items-center gap-2 sm:w-auto"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft === '') return;
          updateAccount(a.id, { balance: draft });
          setDraft('');
        }}
      >
        <div className="w-full sm:w-36">
          <NumberInput value={draft} onChange={setDraft} placeholder="New balance" />
        </div>
        <button className="btn-ghost !px-3" disabled={draft === ''}>
          Update
        </button>
        <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" onClick={onEdit} aria-label="Edit">
          <Pencil size={16} />
        </button>
        <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400" onClick={onDelete} aria-label="Delete">
          <Trash2 size={16} />
        </button>
      </form>
    </li>
  );
}

function rateText(a: Account, spCagr: number, window: keyof typeof WINDOW_LABEL): string {
  if (a.type === 'savings') return `${pct(a.rate, 2)} AER`;
  const net = accountRate(a, spCagr);
  const fee = a.feePct > 0 ? ` after ${pct(a.feePct, 2)} fee` : '';
  return a.returnMode === 'sp500'
    ? `S&P 500 ${WINDOW_LABEL[window].toLowerCase()}: ${pct(net)}/yr${fee}`
    : `${pct(net)}/yr${fee}`;
}

function AccountForm({ initial, defaultType, onClose }: { initial?: Account; defaultType: AccountType; onClose: () => void }) {
  const { data, addAccount, updateAccount } = useStore();
  const { currency, sp500Window } = data.settings;
  const sp = sp500Stats(sp500Window);
  const [type, setType] = useState<AccountType>(initial?.type ?? defaultType);
  const [name, setName] = useState(initial?.name ?? '');
  const [provider, setProvider] = useState(initial?.provider ?? '');
  const [balance, setBalance] = useState<number | ''>(initial?.balance ?? '');
  const [monthly, setMonthly] = useState<number | ''>(initial?.monthlyContribution ?? '');
  const [rate, setRate] = useState<number | ''>(initial?.rate ?? (defaultType === 'investment' ? 7 : ''));
  const [mode, setMode] = useState<ReturnMode>(initial?.returnMode ?? 'sp500');
  const [fee, setFee] = useState<number | ''>(initial?.feePct ?? '');
  const sym = currencySymbol(currency);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || balance === '') return;
    const payload: NewAccount = {
      name: name.trim(),
      type,
      provider: provider.trim(),
      balance: Number(balance),
      monthlyContribution: type === 'current' ? 0 : Number(monthly || 0),
      rate: Number(rate || 0),
      returnMode: type === 'investment' ? mode : 'custom',
      feePct: type === 'investment' ? Number(fee || 0) : 0,
    };
    if (initial) updateAccount(initial.id, payload);
    else addAccount(payload);
    onClose();
  };

  return (
    <Modal title={initial ? `Edit ${initial.name}` : `Add ${ACCOUNT_SINGULAR[type].toLowerCase()}`} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: 'current', label: 'Current' },
            { value: 'savings', label: 'Savings' },
            { value: 'investment', label: 'Investment' },
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund" autoFocus />
          </Field>
          <Field label="Provider (optional)">
            <input className="input" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Bank or broker" />
          </Field>
          <Field label="Current balance">
            <NumberInput value={balance} onChange={setBalance} prefix={sym} />
          </Field>
          {type !== 'current' && (
            <Field label="Paid in each month">
              <NumberInput value={monthly} onChange={setMonthly} prefix={sym} placeholder="0" />
            </Field>
          )}
        </div>

        {type === 'savings' && (
          <Field label="Interest rate (AER)" hint="The annual rate your bank quotes. Interest is compounded monthly in projections.">
            <NumberInput value={rate} onChange={setRate} suffix="%" step="0.01" placeholder="e.g. 3" />
          </Field>
        )}

        {type === 'investment' && (
          <div className="space-y-3 rounded-2xl border border-white/5 bg-ink-900/40 p-3">
            <span className="label">Growth rate</span>
            <Segmented
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'sp500', label: 'S&P 500 history' },
                { value: 'custom', label: 'My own rate' },
              ]}
            />
            {mode === 'sp500' ? (
              <p className="text-xs leading-relaxed text-slate-400">
                Uses the S&P 500's average annual total return {WINDOW_LABEL[sp500Window].toLowerCase()} ({sp.from}–{sp.to}):{' '}
                <span className="font-semibold text-slate-200">{pct(sp.cagr)}</span> a year, dividends reinvested. Change the period on the
                Projections page.
              </p>
            ) : (
              <Field label="Expected annual return">
                <NumberInput value={rate} onChange={setRate} suffix="%" step="0.1" placeholder="e.g. 7" />
              </Field>
            )}
            <Field label="Annual fees (optional)" hint="Fund TER plus platform fee. Taken off the growth rate.">
              <NumberInput value={fee} onChange={setFee} suffix="%" step="0.01" placeholder="e.g. 0.2" />
            </Field>
          </div>
        )}

        {initial && balance !== initial.balance && (
          <p className="text-xs text-slate-400">Changing the balance records today's figure in this account's history.</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!name.trim() || balance === ''}>
            {initial ? 'Save' : 'Add account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
