import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Printer, 
  Download, 
  Filter, 
  CloudUpload,
  Loader2 
} from 'lucide-react';
import { SaleTransaction, StoreSettings } from '../types/pos';

interface SalesHistoryProps {
  sales: SaleTransaction[];
  onViewReceipt: (sale: SaleTransaction) => void;
  onSyncSingleSale: (sale: SaleTransaction) => Promise<void>;
  syncingSaleId: string | null;
  settings: StoreSettings;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  sales,
  onViewReceipt,
  onSyncSingleSale,
  syncingSaleId,
  settings,
}) => {
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('All');

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (selectedMethod !== 'All' && s.paymentMethod !== selectedMethod) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesId = s.id.toLowerCase().includes(q);
        const matchesCustomer = s.customer?.name.toLowerCase().includes(q) || s.customer?.phone?.includes(q);
        const matchesItems = s.items.some((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
        const matchesCashier = s.cashierName.toLowerCase().includes(q);
        return matchesId || matchesCustomer || matchesItems || matchesCashier;
      }

      return true;
    });
  }, [sales, selectedMethod, search]);

  const exportCSV = () => {
    if (sales.length === 0) return;

    const headers = ['Order ID', 'Timestamp', 'Cashier', 'Customer', 'Items Summary', 'Total Items', 'Subtotal', 'Tax', 'Total', 'Payment Method', 'Synced'];
    const rows = sales.map((s) => [
      s.id,
      s.timestamp,
      s.cashierName,
      s.customer?.name || 'Walk-in',
      `"${s.items.map((i) => `${i.quantity}x ${i.name} (${i.size})`).join('; ')}"`,
      s.items.reduce((sum, i) => sum + i.quantity, 0),
      s.subtotal.toFixed(2),
      s.taxAmount.toFixed(2),
      s.total.toFixed(2),
      s.paymentMethod,
      s.syncedToGoogleSheets ? 'YES' : 'NO',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clothing_store_sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, customer, garment, cashier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="All">All Payment Types</option>
            <option value="Cash">Cash</option>
            <option value="Credit/Debit Card">Card</option>
            <option value="Mobile Pay">Mobile Pay</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={sales.length === 0}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {settings.spreadsheetUrl && (
            <a
              href={settings.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>View in Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Sales Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-mono">Order ID</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Garments Sold</th>
                <th className="py-3.5 px-4 text-center">Payment</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-center">Sheets Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.map((sale) => {
                const dateStr = new Date(sale.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const totalUnits = sale.items.reduce((sum, i) => sum + i.quantity, 0);
                const isSyncingThis = syncingSaleId === sale.id;

                return (
                  <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {sale.id}
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {dateStr}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {sale.customer?.name || 'Walk-in Customer'}
                      </p>
                      {sale.customer?.phone && (
                        <p className="text-[10px] text-slate-400">{sale.customer.phone}</p>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {sale.items.map((i) => `${i.quantity}x ${i.name} (${i.size})`).join(', ')}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {totalUnits} items total
                      </p>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {sale.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-slate-950 dark:text-white">
                      ${sale.total.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {sale.syncedToGoogleSheets ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Synced</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => onSyncSingleSale(sale)}
                          disabled={isSyncingThis || !settings.spreadsheetId}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                          title="Click to sync this transaction to Google Sheets"
                        >
                          {isSyncingThis ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CloudUpload className="w-3 h-3" />
                          )}
                          <span>Sync Now</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewReceipt(sale)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                        title="View and re-print receipt"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      No sales recorded yet
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Completed checkout transactions will appear here and sync to your Google Sheet.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
