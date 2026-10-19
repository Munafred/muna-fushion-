import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  PieChart, 
  CheckCircle2, 
  ExternalLink,
  Calendar,
  Sparkles,
  Loader2
} from 'lucide-react';
import { SaleTransaction, StoreSettings } from '../types/pos';
import { GoogleSheetsService } from '../services/googleSheets';

interface AnalyticsViewProps {
  sales: SaleTransaction[];
  settings: StoreSettings;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ sales, settings }) => {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<string | null>(null);

  // Today's Date String in local format
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const stats = useMemo(() => {
    let todayRevenue = 0;
    let todayOrdersCount = 0;
    let todayUnits = 0;
    let cashSales = 0;
    let cardSales = 0;
    let mobileSales = 0;

    const categoryRevenueMap: Record<string, number> = {};
    const itemSoldMap: Record<string, { name: string; qty: number; revenue: number }> = {};

    sales.forEach((s) => {
      const isToday = s.timestamp.startsWith(todayStr);

      if (isToday) {
        todayRevenue += s.total;
        todayOrdersCount++;
        const unitsInSale = s.items.reduce((sum, i) => sum + i.quantity, 0);
        todayUnits += unitsInSale;

        if (s.paymentMethod === 'Cash') cashSales += s.total;
        else if (s.paymentMethod === 'Credit/Debit Card') cardSales += s.total;
        else mobileSales += s.total;
      }

      // Aggregate categories & top items across all sales
      s.items.forEach((item) => {
        categoryRevenueMap[item.category] = (categoryRevenueMap[item.category] || 0) + item.lineTotal;

        if (!itemSoldMap[item.name]) {
          itemSoldMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
        }
        itemSoldMap[item.name].qty += item.quantity;
        itemSoldMap[item.name].revenue += item.lineTotal;
      });
    });

    const averageBasket = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0;

    const topItems = Object.values(itemSoldMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const categories = Object.entries(categoryRevenueMap)
      .map(([name, rev]) => ({ name, rev }))
      .sort((a, b) => b.rev - a.rev);

    return {
      todayRevenue,
      todayOrdersCount,
      todayUnits,
      cashSales,
      cardSales,
      mobileSales,
      averageBasket,
      topItems,
      categories,
    };
  }, [sales, todayStr]);

  const handleSyncDailySummary = async () => {
    if (!settings.spreadsheetId) return;
    setIsGeneratingSummary(true);
    setSummaryStatus(null);
    try {
      const dateStr = new Date().toLocaleDateString();
      const summaryRow = [
        dateStr,
        stats.todayOrdersCount,
        stats.todayRevenue.toFixed(2),
        stats.cashSales.toFixed(2),
        stats.cardSales.toFixed(2),
        stats.mobileSales.toFixed(2),
        stats.todayUnits,
        stats.averageBasket.toFixed(2),
      ];

      // Append row to Daily_Summary sheet
      await (GoogleSheetsService as any).request(
        `spreadsheets/${settings.spreadsheetId}/values/Daily_Summary!A:H:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          body: JSON.stringify({ values: [summaryRow] }),
        }
      );

      setSummaryStatus(`Today's summary ($${stats.todayRevenue.toFixed(2)}) synced to Daily_Summary sheet!`);
    } catch (err: any) {
      setSummaryStatus(`Error: ${err.message}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Daily Sync */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Today's Store Performance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
            End-of-Day Sales &amp; Revenue
          </h2>
        </div>

        {settings.spreadsheetId && (
          <button
            onClick={handleSyncDailySummary}
            disabled={isGeneratingSummary || sales.length === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGeneratingSummary ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Sync EOD Summary to Sheets</span>
          </button>
        )}
      </div>

      {summaryStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{summaryStatus}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Today's Gross Sales
          </span>
          <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            ${stats.todayRevenue.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400">
            Across {stats.todayOrdersCount} checkout receipts
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Ticket Size (AOV)
          </span>
          <p className="text-2xl sm:text-3xl font-black font-mono text-slate-950 dark:text-white">
            ${stats.averageBasket.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400">Per customer order</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Garments Sold Today
          </span>
          <p className="text-2xl sm:text-3xl font-black font-mono text-slate-950 dark:text-white">
            {stats.todayUnits}
          </p>
          <p className="text-[11px] text-slate-400">Total apparel units rung up</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Cash vs. Card Split
          </span>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
            Cash: ${stats.cashSales.toFixed(2)}
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
            Card/Mobile: ${(stats.cardSales + stats.mobileSales).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Two Column Section: Top Sellers & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Best Selling Garments */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Top Selling Clothing Items
            </h3>
            <span className="text-xs text-slate-400">By quantity</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.topItems.map((item, idx) => (
              <div key={item.name} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.qty} units sold</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                  ${item.revenue.toFixed(2)}
                </span>
              </div>
            ))}

            {stats.topItems.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">No items sold yet.</p>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              Revenue by Apparel Category
            </h3>
            <span className="text-xs text-slate-400">All-time</span>
          </div>

          <div className="space-y-3 pt-1">
            {stats.categories.map((cat) => {
              const maxRev = stats.categories[0]?.rev || 1;
              const percent = Math.round((cat.rev / maxRev) * 100);

              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <span className="font-mono text-slate-950 dark:text-white">${cat.rev.toFixed(2)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {stats.categories.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">No category sales recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
