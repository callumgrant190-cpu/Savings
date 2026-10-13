import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useStore } from '../store/AppStore';
import type { Currency } from '../types';
import { Card, Field, NumberInput, PageHeader, Segmented } from '../components/ui';
import { todayISO } from '../lib/date';

export function SettingsView() {
  const { data, updateSettings, exportJSON, importJSON, loadExample, resetAll } = useStore();
  const { settings } = data;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const download = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nest-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" />

      <div className="space-y-5">
        <Card title="You">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input className="input" value={settings.name} onChange={(e) => updateSettings({ name: e.target.value })} placeholder="Optional" />
            </Field>
            <Field label="Currency">
              <Segmented
                value={settings.currency}
                onChange={(c: Currency) => updateSettings({ currency: c })}
                options={[
                  { value: 'EUR', label: '€ EUR' },
                  { value: 'GBP', label: '£ GBP' },
                  { value: 'USD', label: '$ USD' },
                ]}
              />
            </Field>
          </div>
        </Card>

        <Card title="Projections">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Expected inflation" hint="Used when projections are shown in today's money. ECB target is 2%.">
              <NumberInput
                value={settings.inflation}
                onChange={(v) => updateSettings({ inflation: v === '' ? 0 : v })}
                suffix="%"
                step="0.1"
              />
            </Field>
            <Field label="Default horizon" hint="Years to project forward.">
              <NumberInput
                value={settings.horizonYears}
                onChange={(v) => updateSettings({ horizonYears: Math.min(40, Math.max(1, Number(v || 1))) })}
                min={1}
              />
            </Field>
          </div>
        </Card>

        <Card title="Your data" subtitle="Everything is stored in this browser only. Export a backup to move it to another device.">
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={download}>
              <Download size={16} /> Export backup
            </button>
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Import backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const ok = importJSON(await file.text());
                setMsg(ok ? 'Backup imported.' : "That file isn't a Nest backup.");
                e.target.value = '';
              }}
            />
            <button
              className="btn-ghost"
              onClick={() => {
                if (confirm('Replace your accounts, budget and transactions with example data?')) {
                  loadExample();
                  setMsg('Example data loaded.');
                }
              }}
            >
              Load example data
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                if (confirm('Delete all accounts, budget items and transactions? This cannot be undone.')) {
                  resetAll();
                  setMsg('All data cleared.');
                }
              }}
            >
              Clear everything
            </button>
          </div>
          {msg && <p className="mt-3 text-sm text-slate-300">{msg}</p>}
        </Card>

        <Card title="How the numbers work">
          <div className="space-y-2 text-sm leading-relaxed text-slate-400">
            <p>
              <span className="font-semibold text-slate-200">Compound interest.</span> Rates are annual (AER). Each month the balance grows by the
              monthly equivalent of that rate, then your contribution is added. Current accounts are held flat.
            </p>
            <p>
              <span className="font-semibold text-slate-200">S&P 500.</span> Investments set to S&P 500 history grow at the index's compound
              average annual total return over the period you choose, minus fees. The range chart replays every real stretch of history since 1928.
              Returns are in US dollars and before tax.
            </p>
            <p>
              <span className="font-semibold text-slate-200">Tax.</span> Projections ignore tax. In Ireland, deposit interest is taxed under DIRT and
              EU-domiciled ETFs pay exit tax with deemed disposal every 8 years, so after-tax returns will be lower. Check current rates on
              revenue.ie.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
