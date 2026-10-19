import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  Mail, 
  FileSpreadsheet, 
  AlertCircle 
} from 'lucide-react';
import { generateAppsScriptCode } from '../services/appsScriptCode';
import { StoreSettings } from '../types/pos';

interface AppsScriptGuideProps {
  settings: StoreSettings;
}

export const AppsScriptGuide: React.FC<AppsScriptGuideProps> = ({ settings }) => {
  const [copied, setCopied] = useState(false);
  const [managerEmail, setManagerEmail] = useState('fredonmau@gmail.com');
  const [activeTab, setActiveTab] = useState<'code' | 'instructions'>('instructions');

  const code = generateAppsScriptCode(settings.storeName, managerEmail);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Google Apps Script Automation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Automate Your Store in Google Sheets
          </h2>
          <p className="mt-2 text-sm text-emerald-100/80 leading-relaxed">
            Apps Script powers your Google Sheet in the background. It sends nightly sales rollups, automatically alerts your team before clothing sizes sell out, and adds custom menu buttons to your spreadsheet.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopy}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Code Copied to Clipboard!' : 'Copy Apps Script Code'}</span>
            </button>

            {settings.spreadsheetUrl && (
              <a
                href={settings.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 transition-all border border-white/15"
              >
                <span>Open Connected Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Nightly Sales Rollup (11 PM)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Aggregates total transactions, revenue, cash vs. card vs. mobile breakdown, and average ticket size into the <code className="text-emerald-600 dark:text-emerald-400 font-mono">Daily_Summary</code> sheet.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Low Stock Email Alerts (8 AM)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Scans all garment sizes and colors. If any item dips below 5 units, an itemized reorder email is dispatched to the store manager.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Custom POS Menu Bar
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Adds an interactive <code className="text-purple-600 dark:text-purple-400 font-mono">👕 Clothing POS Tools</code> menu right inside Google Sheets with 1-click recalculations and styling.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('instructions')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'instructions'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Setup Instructions (3 Steps)
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'code'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>View Full Apps Script Code</span>
        </button>
      </div>

      {activeTab === 'instructions' ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Open Google Sheets & Launch Apps Script
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  In your Google Sheet, navigate to the top menu bar and select <strong className="text-slate-900 dark:text-white">Extensions &gt; Apps Script</strong>. A new browser tab will open showing the code editor.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Paste the POS Automation Script
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Delete any default template lines in <code className="font-mono text-emerald-600">Code.gs</code>, configure your manager email alert below, and copy & paste the code.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="email"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    placeholder="manager@store.com"
                    className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-72"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy Code with Email'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Save & Reload Google Sheet
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Click the 💾 <strong className="text-slate-900 dark:text-white">Save</strong> button in the Apps Script toolbar. Then return to your Google Sheet tab and refresh the page (<kbd className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">Ctrl+R</kbd> or <kbd className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">Cmd+R</kbd>).
                </p>
                <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>You will now see a new <strong>👕 Clothing POS Tools</strong> menu at the top of your Google Sheet! Click it to run your first automated rollup or activate nightly triggers.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute right-4 top-4 z-10">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy All'}</span>
            </button>
          </div>
          <pre className="p-6 rounded-3xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[600px] border border-slate-800 leading-relaxed selection:bg-emerald-900 selection:text-white">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
