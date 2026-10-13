import { useState } from 'react';
import { Egg, LayoutDashboard, Landmark, LineChart, ReceiptText, Settings as SettingsIcon, Wallet } from 'lucide-react';
import { Overview } from './views/Overview';
import { Accounts } from './views/Accounts';
import { Projections } from './views/Projections';
import { Budget } from './views/Budget';
import { Tracker } from './views/Tracker';
import { SettingsView } from './views/Settings';

export type Tab = 'overview' | 'accounts' | 'projections' | 'budget' | 'tracker' | 'settings';

const NAV: { id: Tab; label: string; icon: typeof Egg }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'accounts', label: 'Accounts', icon: Landmark },
  { id: 'projections', label: 'Projections', icon: LineChart },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'tracker', label: 'Tracker', icon: ReceiptText },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function App() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="min-h-full lg:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-ink-900/60 px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-ink-900">
            <Egg size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-lg font-extrabold leading-none text-white">Nest</div>
            <div className="text-[11px] text-slate-400">savings & budget</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                tab === id ? 'bg-brand-500/15 text-brand-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto px-2 text-[11px] leading-relaxed text-slate-600">
          Your data lives only in this browser. Back it up from Settings.
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-white/5 bg-ink-900/80 px-4 py-3 backdrop-blur lg:hidden">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-ink-900">
          <Egg size={18} strokeWidth={2.5} />
        </div>
        <span className="text-base font-extrabold text-white">Nest</span>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 lg:px-8 lg:pb-12">
        {tab === 'overview' && <Overview onNavigate={setTab} />}
        {tab === 'accounts' && <Accounts />}
        {tab === 'projections' && <Projections />}
        {tab === 'budget' && <Budget />}
        {tab === 'tracker' && <Tracker />}
        {tab === 'settings' && <SettingsView />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-6 border-t border-white/5 bg-ink-900/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
              tab === id ? 'text-brand-400' : 'text-slate-500'
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
