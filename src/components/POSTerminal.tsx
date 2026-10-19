import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  Percent, 
  Tag, 
  Scissors, 
  ShoppingBag, 
  AlertCircle,
  Check
} from 'lucide-react';
import { 
  ClothingProduct, 
  CartItem, 
  ClothingCategory, 
  ClothingSize, 
  Customer, 
  StoreSettings,
  ProductVariant 
} from '../types/pos';

interface POSTerminalProps {
  products: ClothingProduct[];
  cart: CartItem[];
  onAddToCart: (product: ClothingProduct, variant: ProductVariant) => void;
  onUpdateCartQty: (cartItemId: string, newQty: number) => void;
  onRemoveFromCart: (cartItemId: string) => void;
  onClearCart: () => void;
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  customers: Customer[];
  discountPercent: number;
  onSetDiscountPercent: (percent: number) => void;
  taxRate: number;
  onOpenCheckout: () => void;
  settings: StoreSettings;
  onAddCustomItem: (name: string, price: number, category: ClothingCategory) => void;
}

const CATEGORIES: ('All' | ClothingCategory)[] = [
  'All',
  'T-Shirts & Tops',
  'Pants & Denim',
  'Hoodies & Sweaters',
  'Shirts & Blouses',
  'Jackets & Outerwear',
  'Dresses & Skirts',
  'Activewear',
  'Accessories & Footwear',
];

const SIZES: ('All' | ClothingSize)[] = ['All', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', 'One Size'];

export const POSTerminal: React.FC<POSTerminalProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onClearCart,
  selectedCustomer,
  onSelectCustomer,
  customers,
  discountPercent,
  onSetDiscountPercent,
  taxRate,
  onOpenCheckout,
  settings,
  onAddCustomItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | ClothingCategory>('All');
  const [selectedSize, setSelectedSize] = useState<'All' | ClothingSize>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeFeedback, setBarcodeFeedback] = useState<string | null>(null);

  // Custom Item Modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customCategory, setCustomCategory] = useState<ClothingCategory>('Accessories & Footwear');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Filter products based on search, category, and size
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }

      // Size filter
      if (selectedSize !== 'All') {
        const hasSize = p.variants.some((v) => v.size === selectedSize && v.stock > 0);
        if (!hasSize) return false;
      }

      // Search query (matches name, brand, SKU, or barcode)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesSku = p.variants.some((v) => v.sku.toLowerCase().includes(q));
        const matchesBarcode = p.barcode.includes(q) || p.variants.some((v) => v.barcode.includes(q));
        return matchesName || matchesBrand || matchesSku || matchesBarcode;
      }

      return true;
    });
  }, [products, selectedCategory, selectedSize, searchQuery]);

  // Handle direct Barcode Scanner submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // Search through all products and their variants
    let foundProduct: ClothingProduct | null = null;
    let foundVariant: ProductVariant | null = null;

    for (const prod of products) {
      for (const variant of prod.variants) {
        if (variant.barcode === code || variant.sku.toLowerCase() === code.toLowerCase()) {
          foundProduct = prod;
          foundVariant = variant;
          break;
        }
      }
      if (foundProduct) break;
      if (prod.barcode === code) {
        foundProduct = prod;
        // default to first in-stock variant
        foundVariant = prod.variants.find((v) => v.stock > 0) || prod.variants[0];
        break;
      }
    }

    if (foundProduct && foundVariant) {
      onAddToCart(foundProduct, foundVariant);
      setBarcodeFeedback(`Added ${foundProduct.name} (${foundVariant.size})`);
      setBarcodeInput('');
    } else {
      setBarcodeFeedback(`Item not found for code: "${code}"`);
    }

    setTimeout(() => {
      setBarcodeFeedback(null);
    }, 2500);
  };

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = (discountedSubtotal * taxRate) / 100;
  const total = discountedSubtotal + taxAmount;
  const totalItemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleCreateCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(customPrice);
    if (!customName.trim() || isNaN(priceNum) || priceNum <= 0) return;
    onAddCustomItem(customName.trim(), priceNum, customCategory);
    setCustomName('');
    setCustomPrice('');
    setShowCustomModal(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-12">
      {/* LEFT COLUMN: Product Catalog & Scanner (8 Cols) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* Search & Barcode Scanner Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search apparel name, brand, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Hardware / Simulated Barcode Scanner Field */}
            <form onSubmit={handleBarcodeSubmit} className="relative sm:w-64">
              <Barcode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan / Type Barcode + ↵"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-9 pr-14 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:opacity-90 cursor-pointer"
              >
                Enter
              </button>
            </form>

            {/* Quick Alteration / Custom Sale Button */}
            <button
              onClick={() => setShowCustomModal(true)}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              title="Add custom tailoring fee or unlisted clothing item"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Tailoring / Custom</span>
            </button>
          </div>

          {/* Barcode feedback alert */}
          {barcodeFeedback && (
            <div className={`p-2 rounded-xl text-xs font-medium flex items-center gap-2 ${
              barcodeFeedback.includes('Added')
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
            }`}>
              {barcodeFeedback.includes('Added') ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{barcodeFeedback}</span>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Size Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1">
              Size:
            </span>
            {SIZES.map((sz) => (
              <button
                key={sz}
                onClick={() => setSelectedSize(sz)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedSize === sz
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectVariant={(variant) => onAddToCart(product, variant)}
            />
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No matching apparel found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try clearing search filters or add a new clothing item in Inventory.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active POS Cart & Register (4-5 Cols) */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md p-5 sticky top-20 flex flex-col max-h-[calc(100vh-6rem)]">
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              Current Sale
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {totalItemsCount} items
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Customer Select dropdown */}
        <div className="py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Customer:</span>
          </div>
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const cust = customers.find((c) => c.id === e.target.value) || null;
              onSelectCustomer(cust);
            }}
            className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[160px] truncate"
          >
            <option value="">Walk-in Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.loyaltyPoints} pts)
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List (Scrollable) */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 my-2 pr-1 min-h-[180px] max-h-[320px]">
          {cart.map((item) => (
            <div key={item.id} className="py-3 flex items-start justify-between gap-2">
              <div className="space-y-0.5 flex-1 pr-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Size: {item.size}
                  </span>
                  <span>•</span>
                  <span>{item.color}</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  ${item.price.toFixed(2)} each
                </p>
              </div>

              {/* Quantity Controls & Line Total */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                  <button
                    onClick={() => onUpdateCartQty(item.id, item.quantity - 1)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2 text-xs font-bold font-mono text-slate-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateCartQty(item.id, item.quantity + 1)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <ShoppingBag className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs font-medium">Cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Scan barcode or select an apparel size to add
              </p>
            </div>
          )}
        </div>

        {/* Totals & Discounts Section */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 text-xs">
          {/* Quick Discount selector */}
          <div className="flex items-center justify-between text-slate-500">
            <span className="flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" /> Discount
            </span>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 20].map((pct) => (
                <button
                  key={pct}
                  onClick={() => onSetDiscountPercent(pct)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    discountPercent === pct
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pct === 0 ? 'None' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Discount ({discountPercent}%)</span>
              <span className="font-mono">-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Sales Tax ({taxRate}%)</span>
            <span className="font-mono">${taxAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white">
            <span className="text-sm font-bold uppercase tracking-wider">Total</span>
            <span className="text-2xl font-black font-mono">
              ${total.toFixed(2)}
            </span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onOpenCheckout}
            disabled={cart.length === 0}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Proceed to Payment</span>
            <span className="font-mono font-normal opacity-90">(${total.toFixed(2)})</span>
          </button>
        </div>
      </div>

      {/* Custom Tailoring / Custom Item Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-emerald-600" />
                Add Custom Charge / Tailoring
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Item or Service Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jeans Hemming, Custom Embroidery"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="15.00"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Add to Current Cart
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual Clothing Product Card with Variant Chips
interface ProductCardProps {
  product: ClothingProduct;
  onSelectVariant: (variant: ProductVariant) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectVariant }) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants.find((v) => v.stock > 0)?.id || product.variants[0]?.id
  );

  const currentVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const isLowStock = currentVariant.stock <= product.lowStockThreshold;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group">
      {/* Product Image */}
      <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Category badge */}
        <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/70 text-white backdrop-blur-xs">
          {product.category}
        </span>

        {/* Stock status indicator */}
        <div className="absolute top-2.5 right-2.5">
          {currentVariant.stock <= 0 ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
              {currentVariant.stock} left
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
              {currentVariant.stock} in stock
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {product.brand}
          </p>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {product.name}
          </h4>
          <p className="text-base font-black font-mono text-slate-950 dark:text-emerald-400 mt-1">
            ${product.price.toFixed(2)}
          </p>
        </div>

        {/* Variant Selectors: Sizes & Colors */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Variant:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {currentVariant.size} • {currentVariant.color}
            </span>
          </div>

          {/* Size / Variant buttons */}
          <div className="flex flex-wrap gap-1">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariantId(v.id)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedVariantId === v.id
                    ? 'bg-slate-950 dark:bg-emerald-600 text-white ring-1 ring-slate-950'
                    : v.stock <= 0
                    ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 line-through'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>

        {/* Add to Cart button */}
        <button
          onClick={() => onSelectVariant(currentVariant)}
          disabled={currentVariant.stock <= 0}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            currentVariant.stock <= 0
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white hover:border-transparent'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add to Sale ({currentVariant.size})</span>
        </button>
      </div>
    </div>
  );
};
