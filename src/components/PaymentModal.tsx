import React, { useState } from 'react';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Gift, 
  X, 
  Check, 
  Sparkles,
  UserCheck
} from 'lucide-react';
import { PaymentMethod, Customer } from '../types/pos';

interface PaymentModalProps {
  isOpen: boolean;
  total: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  selectedCustomer: Customer | null;
  customers: Customer[];
  onSelectCustomer: (cust: Customer | null) => void;
  onClose: () => void;
  onCompleteSale: (
    paymentMethod: PaymentMethod,
    amountTendered: number,
    changeDue: number,
    notes: string,
    customer?: { name: string; phone?: string; email?: string }
  ) => void;
  isSyncingToSheets: boolean;
  isSheetsConnected: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  total,
  subtotal,
  taxAmount,
  discountAmount,
  selectedCustomer,
  customers,
  onSelectCustomer,
  onClose,
  onCompleteSale,
  isSyncingToSheets,
  isSheetsConnected,
}) => {
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [tenderedStr, setTenderedStr] = useState<string>(Math.ceil(total).toString());
  const [notes, setNotes] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>(selectedCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(selectedCustomer?.phone || '');

  const tendered = parseFloat(tenderedStr) || 0;
  const changeDue = Math.max(0, tendered - total);
  const isCashInsufficient = paymentMethod === 'Cash' && tendered < total;

  const handleQuickCash = (amount: number) => {
    setTenderedStr(amount.toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCashInsufficient) return;

    const customerData = customerName.trim()
      ? { name: customerName.trim(), phone: customerPhone.trim() }
      : selectedCustomer
      ? { name: selectedCustomer.name, phone: selectedCustomer.phone, email: selectedCustomer.email }
      : undefined;

    onCompleteSale(
      paymentMethod,
      paymentMethod === 'Cash' ? tendered : total,
      paymentMethod === 'Cash' ? changeDue : 0,
      notes,
      customerData
    );
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

        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          Complete Clothing Sale
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Total Due: <span className="text-2xl font-black text-slate-900 dark:text-white font-mono ml-1">${total.toFixed(2)}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  paymentMethod === 'Cash'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Banknote className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Credit/Debit Card')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  paymentMethod === 'Credit/Debit Card'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <CreditCard className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Mobile Pay')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  paymentMethod === 'Mobile Pay'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 ring-2 ring-purple-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Smartphone className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Mobile Pay</span>
              </button>
            </div>
          </div>

          {/* Cash Tendered Section */}
          {paymentMethod === 'Cash' && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Cash Tendered
                </label>
                <div className="text-right">
                  <span className="text-xs text-slate-400 mr-2">Change Due:</span>
                  <span className={`text-base font-bold font-mono ${changeDue >= 0 && !isCashInsufficient ? 'text-emerald-600' : 'text-rose-500'}`}>
                    ${changeDue.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tenderedStr}
                  onChange={(e) => setTenderedStr(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickCash(total)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Exact (${total.toFixed(2)})
                </button>
                {[20, 50, 100, 200].map((amt) => {
                  if (amt >= total - 5) {
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickCash(amt)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                      >
                        ${amt}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              {isCashInsufficient && (
                <p className="text-xs text-rose-500 font-medium pt-1">
                  Amount tendered is less than the total due (${total.toFixed(2)}).
                </p>
              )}
            </div>
          )}

          {/* Customer Info (Optional for loyalty points & receipt) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Customer Info (Optional)
              </span>
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={() => onSelectCustomer(null)}
                  className="text-xs text-rose-500 hover:underline cursor-pointer"
                >
                  Clear customer
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <input
                type="text"
                placeholder="Phone / WhatsApp"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Sale Notes / Alterations */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Order Notes / Tailoring Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Gift wrapped, hem alteration required, or VIP discount"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Sheets sync status note */}
          {isSheetsConnected ? (
            <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Sale will automatically append to your connected Google Sheet.</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl">
              Google Sheet not linked yet. Sale will save locally and can be synced anytime.
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCashInsufficient || isSyncingToSheets}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-white text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isCashInsufficient
                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
            }`}
          >
            <Check className="w-5 h-5" />
            <span>
              {isSyncingToSheets
                ? 'Recording & Syncing...'
                : `Complete Payment ($${total.toFixed(2)})`}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
