import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  setCachedAccessToken 
} from './services/auth';
import { GoogleSheetsService } from './services/googleSheets';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from './data/initialProducts';
import { 
  ClothingProduct, 
  CartItem, 
  SaleTransaction, 
  Customer, 
  StoreSettings, 
  ProductVariant, 
  PaymentMethod,
  ClothingCategory 
} from './types/pos';

import { Navbar } from './components/Navbar';
import { POSTerminal } from './components/POSTerminal';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { InventoryManager } from './components/InventoryManager';
import { SalesHistory } from './components/SalesHistory';
import { AnalyticsView } from './components/AnalyticsView';
import { AppsScriptGuide } from './components/AppsScriptGuide';
import { GoogleConnectModal } from './components/GoogleConnectModal';

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Thread & Till Apparel',
  storeTagline: 'Modern Clothing & Streetwear Essentials',
  address: '450 Fashion Avenue, Suite 12B, New York, NY',
  phone: '+1 (212) 555-0199',
  email: 'fredonmau@gmail.com',
  currency: '$',
  taxRatePercent: 8.5,
  receiptFooter: 'Follow @threadandtill for new garment drops',
  activeCashier: 'Sarah M. (Lead Cashier)',
  spreadsheetId: null,
  spreadsheetName: null,
  spreadsheetUrl: null,
  autoSyncToSheets: true,
};

// Seed sample sales if empty
const INITIAL_SALES: SaleTransaction[] = [
  {
    id: 'TT-2026-1001',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    cashierName: 'Sarah M. (Lead Cashier)',
    customer: { name: 'Sophia Sterling', phone: '+1 (555) 234-5678' },
    items: [
      {
        productId: 'prod-1',
        name: 'Heavyweight Boxy Cotton Tee',
        category: 'T-Shirts & Tops',
        size: 'M',
        color: 'Vintage Black',
        sku: 'TEE-BOX-BLK-M',
        price: 38.00,
        quantity: 2,
        lineTotal: 76.00,
      },
      {
        productId: 'prod-2',
        name: 'Relaxed Selvedge Denim Jeans',
        category: 'Pants & Denim',
        size: '32',
        color: 'Indigo Raw',
        sku: 'DNM-RLX-IND-32',
        price: 98.00,
        quantity: 1,
        lineTotal: 98.00,
      },
    ],
    subtotal: 174.00,
    discountPercentage: 10,
    discountAmount: 17.40,
    taxRate: 8.5,
    taxAmount: 13.31,
    total: 169.91,
    paymentMethod: 'Credit/Debit Card',
    syncedToGoogleSheets: false,
  },
  {
    id: 'TT-2026-1002',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    cashierName: 'Sarah M. (Lead Cashier)',
    customer: { name: 'Marcus Chen', phone: '+1 (555) 876-5432' },
    items: [
      {
        productId: 'prod-3',
        name: 'French Terry Oversized Hoodie',
        category: 'Hoodies & Sweaters',
        size: 'L',
        color: 'Sage Green',
        sku: 'HD-FT-SGE-L',
        price: 78.00,
        quantity: 1,
        lineTotal: 78.00,
      },
    ],
    subtotal: 78.00,
    discountPercentage: 0,
    discountAmount: 0,
    taxRate: 8.5,
    taxAmount: 6.63,
    total: 84.63,
    paymentMethod: 'Cash',
    amountTendered: 100.00,
    changeDue: 15.37,
    syncedToGoogleSheets: false,
  },
];

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'history' | 'analytics' | 'script'>('pos');

  // Auth & Google state
  const [user, setUser] = useState<User | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('tt_pos_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_SETTINGS;
  });

  // Inventory & Catalog
  const [products, setProducts] = useState<ClothingProduct[]>(() => {
    const saved = localStorage.getItem('tt_pos_products');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_PRODUCTS;
  });

  // Customers
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('tt_pos_customers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_CUSTOMERS;
  });

  // Sales Transactions
  const [sales, setSales] = useState<SaleTransaction[]>(() => {
    const saved = localStorage.getItem('tt_pos_sales');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_SALES;
  });

  // Active Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Modals & Popups
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState<SaleTransaction | null>(null);

  // Syncing states
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingSaleId, setSyncingSaleId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('tt_pos_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('tt_pos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('tt_pos_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('tt_pos_customers', JSON.stringify(customers));
  }, [customers]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setCachedAccessToken(token);
      },
      () => {
        setUser(null);
        setCachedAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Google Sign-in Handler
  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        showToast(`Signed in as ${result.user.displayName || result.user.email}`);
      }
    } catch (err: any) {
      showToast(`Sign in error: ${err.message}`);
    }
  };

  // Google Sign-out Handler
  const handleGoogleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      showToast('Signed out of Google account');
    } catch (err: any) {
      showToast(`Sign out error: ${err.message}`);
    }
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // CART OPERATIONS
  const handleAddToCart = (product: ClothingProduct, variant: ProductVariant) => {
    setCart((prevCart) => {
      const cartItemId = `${product.id}-${variant.id}`;
      const existing = prevCart.find((item) => item.id === cartItemId);

      if (existing) {
        if (existing.quantity >= variant.stock) {
          showToast(`Cannot add more than ${variant.stock} available units`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        costPrice: product.costPrice,
        variantId: variant.id,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        barcode: variant.barcode,
        quantity: 1,
        maxStock: variant.stock,
      };

      return [...prevCart, newItem];
    });
  };

  const handleUpdateCartQty = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(cartItemId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === cartItemId) {
          if (newQty > item.maxStock) {
            showToast(`Maximum available stock is ${item.maxStock}`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscountPercent(0);
  };

  const handleAddCustomItem = (name: string, price: number, category: ClothingCategory) => {
    const customCartItem: CartItem = {
      id: `custom-${Date.now()}`,
      productId: 'prod-custom',
      name,
      category,
      price,
      costPrice: 0,
      variantId: 'v-custom',
      size: 'One Size',
      color: 'Custom',
      sku: 'CUSTOM-SVC',
      barcode: '000000',
      quantity: 1,
      maxStock: 999,
    };
    setCart((prev) => [...prev, customCartItem]);
    showToast(`Added "${name}" ($${price.toFixed(2)}) to cart`);
  };

  // CHECKOUT & SALE COMPLETION
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const handleCompleteSale = async (
    paymentMethod: PaymentMethod,
    amountTendered: number,
    changeDue: number,
    notes: string,
    customerData?: { name: string; phone?: string; email?: string }
  ) => {
    // 1. Calculate totals
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discountAmount = (subtotal * discountPercent) / 100;
    const discounted = subtotal - discountAmount;
    const taxAmount = (discounted * settings.taxRatePercent) / 100;
    const total = discounted + taxAmount;

    // 2. Generate unique order ID
    const nextOrderNum = 1000 + sales.length + 1;
    const orderId = `TT-${new Date().getFullYear()}-${nextOrderNum}`;

    const newSale: SaleTransaction = {
      id: orderId,
      timestamp: new Date().toISOString(),
      cashierName: settings.activeCashier,
      customer: customerData,
      items: cart.map((i) => ({
        productId: i.productId,
        name: i.name,
        category: i.category,
        size: i.size,
        color: i.color,
        sku: i.sku,
        price: i.price,
        quantity: i.quantity,
        lineTotal: i.price * i.quantity,
      })),
      subtotal,
      discountPercentage: discountPercent,
      discountAmount,
      taxRate: settings.taxRatePercent,
      taxAmount,
      total,
      paymentMethod,
      amountTendered,
      changeDue,
      notes,
      syncedToGoogleSheets: false,
    };

    // 3. Deduct stock from products inventory
    setProducts((prevProds) =>
      prevProds.map((prod) => {
        let updatedVariants = [...prod.variants];
        let deductedTotal = 0;

        cart.forEach((cItem) => {
          if (cItem.productId === prod.id) {
            updatedVariants = updatedVariants.map((v) => {
              if (v.id === cItem.variantId) {
                const newStock = Math.max(0, v.stock - cItem.quantity);
                deductedTotal += cItem.quantity;
                return { ...v, stock: newStock };
              }
              return v;
            });
          }
        });

        const newTotalStock = Math.max(0, prod.totalStock - deductedTotal);
        return { ...prod, variants: updatedVariants, totalStock: newTotalStock };
      })
    );

    // 4. Close payment modal, clear cart, set receipt
    setIsPaymentModalOpen(false);
    handleClearCart();
    setActiveReceiptSale(newSale);
    setIsReceiptModalOpen(true);

    // 5. Sync to Google Sheets if connected
    if (settings.spreadsheetId) {
      try {
        await GoogleSheetsService.recordSale(settings.spreadsheetId, newSale);
        newSale.syncedToGoogleSheets = true;
        showToast(`Receipt ${orderId} synced to Google Sheets!`);
      } catch (err: any) {
        console.error('Auto sync to sheet failed:', err);
        showToast(`Sale recorded locally. (Sheets sync: ${err.message})`);
      }
    } else {
      showToast(`Sale ${orderId} recorded!`);
    }

    // Save to sales state
    setSales((prev) => [newSale, ...prev]);
  };

  // STOCK ADJUSTMENT & INVENTORY
  const handleUpdateVariantStock = (productId: string, variantId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== productId) return prod;
        const updated = prod.variants.map((v) => (v.id === variantId ? { ...v, stock: newStock } : v));
        const totalStock = updated.reduce((sum, v) => sum + v.stock, 0);
        return { ...prod, variants: updated, totalStock };
      })
    );
  };

  const handleAddNewProduct = (newProduct: ClothingProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Added ${newProduct.name} to store inventory`);
  };

  // Sync entire inventory to Google Sheets
  const handleSyncInventoryToSheets = async () => {
    if (!settings.spreadsheetId) {
      showToast('Please connect a Google Sheet first');
      return;
    }
    setIsSyncingAll(true);
    try {
      const count = await GoogleSheetsService.syncInventory(settings.spreadsheetId, products);
      showToast(`Pushed ${count} apparel variants to Google Sheet!`);
    } catch (err: any) {
      showToast(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Sync a single sale to Google Sheets
  const handleSyncSingleSale = async (saleToSync: SaleTransaction) => {
    if (!settings.spreadsheetId) {
      showToast('Please connect a Google Sheet first');
      return;
    }
    setSyncingSaleId(saleToSync.id);
    try {
      await GoogleSheetsService.recordSale(settings.spreadsheetId, saleToSync);
      setSales((prev) =>
        prev.map((s) => (s.id === saleToSync.id ? { ...s, syncedToGoogleSheets: true } : s))
      );
      showToast(`Sale ${saleToSync.id} synced to Google Sheets!`);
    } catch (err: any) {
      showToast(`Failed to sync sale: ${err.message}`);
    } finally {
      setSyncingSaleId(null);
    }
  };

  // Sync All (Unsynced sales + Inventory)
  const handleSyncAll = async () => {
    if (!settings.spreadsheetId) {
      setIsGoogleModalOpen(true);
      return;
    }
    setIsSyncingAll(true);
    try {
      // 1. Sync inventory
      await GoogleSheetsService.syncInventory(settings.spreadsheetId, products);

      // 2. Sync unsynced sales
      const unsynced = sales.filter((s) => !s.syncedToGoogleSheets);
      for (const sale of unsynced) {
        await GoogleSheetsService.recordSale(settings.spreadsheetId, sale);
      }

      setSales((prev) => prev.map((s) => ({ ...s, syncedToGoogleSheets: true })));
      showToast('All inventory counts and sales receipts synced to Google Sheets!');
    } catch (err: any) {
      showToast(`Sync error: ${err.message}`);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Calculations for current cart
  const cartSubtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartDiscountAmount = (cartSubtotal * discountPercent) / 100;
  const cartDiscounted = cartSubtotal - cartDiscountAmount;
  const cartTaxAmount = (cartDiscounted * settings.taxRatePercent) / 100;
  const cartTotal = cartDiscounted + cartTaxAmount;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        user={user}
        onOpenGoogleModal={() => setIsGoogleModalOpen(true)}
        onSyncAll={handleSyncAll}
        isSyncing={isSyncingAll}
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white dark:bg-white dark:text-slate-950 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-800 animate-in slide-in-from-bottom duration-300">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'pos' && (
          <POSTerminal
            products={products}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQty={handleUpdateCartQty}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
            customers={customers}
            discountPercent={discountPercent}
            onSetDiscountPercent={setDiscountPercent}
            taxRate={settings.taxRatePercent}
            onOpenCheckout={handleOpenCheckout}
            settings={settings}
            onAddCustomItem={handleAddCustomItem}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            products={products}
            onUpdateVariantStock={handleUpdateVariantStock}
            onAddNewProduct={handleAddNewProduct}
            onSyncInventoryToSheets={handleSyncInventoryToSheets}
            isSyncing={isSyncingAll}
            settings={settings}
          />
        )}

        {activeTab === 'history' && (
          <SalesHistory
            sales={sales}
            onViewReceipt={(sale) => {
              setActiveReceiptSale(sale);
              setIsReceiptModalOpen(true);
            }}
            onSyncSingleSale={handleSyncSingleSale}
            syncingSaleId={syncingSaleId}
            settings={settings}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            sales={sales}
            settings={settings}
          />
        )}

        {activeTab === 'script' && (
          <AppsScriptGuide
            settings={settings}
          />
        )}
      </main>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        total={cartTotal}
        subtotal={cartSubtotal}
        taxAmount={cartTaxAmount}
        discountAmount={cartDiscountAmount}
        selectedCustomer={selectedCustomer}
        customers={customers}
        onSelectCustomer={setSelectedCustomer}
        onClose={() => setIsPaymentModalOpen(false)}
        onCompleteSale={handleCompleteSale}
        isSyncingToSheets={isSyncingAll}
        isSheetsConnected={!!settings.spreadsheetId}
      />

      <ReceiptModal
        sale={activeReceiptSale}
        settings={settings}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onNewSale={() => {
          setIsReceiptModalOpen(false);
          setActiveReceiptSale(null);
          setActiveTab('pos');
        }}
      />

      <GoogleConnectModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        user={user}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
