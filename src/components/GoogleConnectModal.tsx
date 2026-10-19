import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  CheckCircle, 
  PlusCircle, 
  Link2, 
  X, 
  AlertCircle,
  Loader2,
  LogOut
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSheetsService } from '../services/googleSheets';
import { StoreSettings } from '../types/pos';

interface GoogleConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  settings: StoreSettings;
  onUpdateSettings: (newSettings: Partial<StoreSettings>) => void;
}

export const GoogleConnectModal: React.FC<GoogleConnectModalProps> = ({
  isOpen,
  onClose,
  user,
  onGoogleSignIn,
  onGoogleSignOut,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const [isLoading, setIsLoading] = useState(false);
  const [existingSheetInput, setExistingSheetInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Extract Sheet ID from URL or ID string
  const extractSheetId = (input: string): string => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  };

  const handleCreateNewSheet = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const result = await GoogleSheetsService.createStoreSpreadsheet(settings.storeName);
      onUpdateSettings({
        spreadsheetId: result.spreadsheetId,
        spreadsheetName: result.title,
        spreadsheetUrl: result.spreadsheetUrl,
      });
      setSuccessMsg(`Spreadsheet created successfully! Ready to track sales.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create spreadsheet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingSheetInput.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const sheetId = extractSheetId(existingSheetInput);
      const metadata = await GoogleSheetsService.getSpreadsheetMetadata(sheetId);
      const title = metadata?.properties?.title || 'Connected Clothing POS Sheet';
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

      onUpdateSettings({
        spreadsheetId: sheetId,
        spreadsheetName: title,
        spreadsheetUrl: url,
      });
      setSuccessMsg(`Connected to "${title}"!`);
      setExistingSheetInput('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not access spreadsheet. Please check permissions and Sheet ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    onUpdateSettings({
      spreadsheetId: null,
      spreadsheetName: null,
      spreadsheetUrl: null,
    });
    setSuccessMsg('Disconnected from Google Sheet.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Google Sheets POS Integration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sync sales receipts, garment items, and inventory counts in real time
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-900">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Section */}
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5">
          {!user ? (
            <div className="text-center py-4 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Sign in with your Google account to connect your Google Sheets and automate your store sales tracking.
              </p>
              
              {/* Official styled Sign in with Google button */}
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-medium text-sm shadow-sm transition-all cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* User profile row */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user.displayName || 'Google User'}</p>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoogleSignOut}
                  className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>

              {/* Connected Spreadsheet Info */}
              {settings.spreadsheetId ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                          Connected Sheet
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        {settings.spreadsheetName || 'POS Sales & Inventory'}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 truncate max-w-xs mt-0.5">
                        ID: {settings.spreadsheetId}
                      </p>
                    </div>

                    {settings.spreadsheetUrl && (
                      <a
                        href={settings.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-xs"
                      >
                        <span>Open Sheet</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Tabs: Sales_Log, Sales_Items, Inventory, Daily_Summary</span>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="text-rose-600 dark:text-rose-400 hover:underline font-medium cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Option 1: 1-Click Create POS Spreadsheet */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-600 transition-colors bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <PlusCircle className="w-4 h-4 text-emerald-600" />
                          Create New POS Spreadsheet
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Automatically generates a complete spreadsheet in your Google Drive with formatted tabs for sales logs, garments breakdown, clothing inventory, and daily revenue summaries.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleCreateNewSheet}
                      className="mt-3 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating in Google Drive...</span>
                        </>
                      ) : (
                        <span>Generate Store Spreadsheet Now</span>
                      )}
                    </button>
                  </div>

                  {/* Option 2: Connect Existing Spreadsheet */}
                  <form onSubmit={handleConnectExisting} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" />
                      Or Link Existing Google Spreadsheet
                    </h4>
                    <input
                      type="text"
                      placeholder="Paste Google Sheet URL or Spreadsheet ID"
                      value={existingSheetInput}
                      onChange={(e) => setExistingSheetInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !existingSheetInput.trim()}
                      className="w-full py-2 px-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Link Spreadsheet
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
