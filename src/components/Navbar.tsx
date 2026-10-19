import React from 'react';
import { 
  ShoppingBag, 
  Layers, 
  Receipt, 
  BarChart3, 
  FileSpreadsheet, 
  UserCircle, 
  ExternalLink, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { StoreSettings } from '../types/pos';
import { User } from 'firebase/auth';

interface NavbarProps {
  activeTab: 'pos' | 'inventory' | 'history' | 'analytics' | 'script';
  setActiveTab: (tab: 'pos' | 'inventory' | 'history' | 'analytics' | 'script') => void;
  settings: StoreSettings;
  user: User | null;
  onOpenGoogleModal: () => void;
  onSyncAll: () => void;
  isSyncing: boolean;
  cartCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  user,
  onOpenGoogleModal,
  onSyncAll,
  isSyncing,
  cartCount,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Store Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 dark:bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <ShoppingBag className="w-5 h-5 text-emerald-400 dark:text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-950 dark:text-white leading-none">
                  {settings.storeName}
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400">
                  POS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Live Sales &amp; Google Sheets
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pos'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Register</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Sales Log</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('script')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'script'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Apps Script</span>
            </button>
          </nav>

          {/* Right Action: Google Sheets Connection & Cashier */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Google Sheets Status Button */}
            {settings.spreadsheetId ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenGoogleModal}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Google Sheet Connected"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline truncate max-w-[120px]">
                    {settings.spreadsheetName || 'POS Sheet'}
                  </span>
                </button>

                {settings.spreadsheetUrl && (
                  <a
                    href={settings.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Open Google Sheet in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={onSyncAll}
                  disabled={isSyncing}
                  className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors cursor-pointer"
                  title="Sync inventory & sales now"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenGoogleModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Connect Google Sheets</span>
              </button>
            )}

            {/* Cashier Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
              <UserCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>{settings.activeCashier}</span>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pos')}
            className={`py-1 px-2 rounded-lg ${activeTab === 'pos' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-500'}`}
          >
            Register ({cartCount})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-1 px-2 rounded-lg ${activeTab === 'inventory' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-500'}`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-1 px-2 rounded-lg ${activeTab === 'history' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-500'}`}
          >
            Sales
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-1 px-2 rounded-lg ${activeTab === 'analytics' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-500'}`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`py-1 px-2 rounded-lg ${activeTab === 'script' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-500'}`}
          >
            Apps Script
          </button>
        </div>
      </div>
    </header>
  );
};
