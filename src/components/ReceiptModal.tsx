import React from 'react';
import { Printer, CheckCircle2, X, ExternalLink, Share2 } from 'lucide-react';
import { SaleTransaction, StoreSettings } from '../types/pos';

interface ReceiptModalProps {
  sale: SaleTransaction | null;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  settings,
  isOpen,
  onClose,
  onNewSale,
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.timestamp).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="no-print absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Banner */}
        <div className="no-print flex items-center gap-2 mb-6 text-emerald-600 bg-emerald-50 px-3.5 py-2 rounded-xl text-sm font-semibold border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Payment Successful & Recorded!</span>
        </div>

        {/* Printable Receipt Area */}
        <div id="pos-printable-receipt" className="receipt-content font-mono text-xs text-slate-800 space-y-4">
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold font-sans tracking-tight text-slate-950 uppercase">
              {settings.storeName}
            </h2>
            <p className="text-[11px] text-slate-500 font-sans">{settings.storeTagline}</p>
            <p className="text-slate-600 text-[11px]">{settings.address}</p>
            <p className="text-slate-600 text-[11px]">Tel: {settings.phone}</p>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-2.5 my-3 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt #:</span>
              <span className="font-bold">{sale.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span>{sale.cashierName}</span>
            </div>
            {sale.customer && (
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span>{sale.customer.name}</span>
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="space-y-2">
            <div className="flex justify-between font-bold border-b border-slate-200 pb-1 text-[11px]">
              <span className="w-1/2">Item & Variant</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/6 text-right">Price</span>
              <span className="w-1/6 text-right">Total</span>
            </div>

            {sale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[11px] py-1 border-b border-slate-100 last:border-none">
                <div className="w-1/2 pr-1">
                  <p className="font-semibold text-slate-900 leading-tight">{item.name}</p>
                  <p className="text-[10px] text-slate-500">
                    Size: {item.size} | Color: {item.color}
                  </p>
                  <p className="text-[9px] text-slate-400">SKU: {item.sku}</p>
                </div>
                <div className="w-1/6 text-center pt-0.5">{item.quantity}</div>
                <div className="w-1/6 text-right pt-0.5">${item.price.toFixed(2)}</div>
                <div className="w-1/6 text-right pt-0.5 font-semibold">${item.lineTotal.toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>${sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount ({sale.discountPercentage}%)</span>
                <span>-${sale.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Sales Tax ({sale.taxRate}%)</span>
              <span>${sale.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-950 pt-1 border-t border-slate-200">
              <span>TOTAL</span>
              <span>${sale.total.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-dotted border-slate-200 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Payment Method</span>
                <span className="font-semibold">{sale.paymentMethod}</span>
              </div>
              {sale.paymentMethod === 'Cash' && sale.amountTendered && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Cash Tendered</span>
                    <span>${sale.amountTendered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Change Due</span>
                    <span>${(sale.changeDue || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Simulated Barcode */}
          <div className="pt-3 text-center space-y-1">
            <div className="flex justify-center items-center gap-0.5 h-10 overflow-hidden py-1">
              {Array.from({ length: 42 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-900 h-full"
                  style={{
                    width: i % 3 === 0 ? '3px' : i % 2 === 0 ? '1px' : '2px',
                    marginRight: i % 5 === 0 ? '2px' : '1px',
                  }}
                />
              ))}
            </div>
            <p className="text-[10px] tracking-widest text-slate-500 font-mono">*{sale.id}*</p>
          </div>

          {/* Footer Return Policy */}
          <div className="text-center pt-2 text-[10px] text-slate-500 leading-tight font-sans">
            <p className="font-medium text-slate-700">{settings.receiptFooter}</p>
            <p className="mt-1">Returns or exchanges valid within 14 days with original tags attached.</p>
            <p className="mt-2 text-slate-400 font-medium tracking-wide">THANK YOU FOR SHOPPING WITH US!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
          >
            <span>Start New Sale</span>
          </button>
        </div>
      </div>
    </div>
  );
};
