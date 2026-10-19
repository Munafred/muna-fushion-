import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  ArrowUpDown, 
  AlertTriangle, 
  CloudUpload, 
  Edit3, 
  Check, 
  ExternalLink,
  Loader2,
  DollarSign
} from 'lucide-react';
import { ClothingProduct, ClothingCategory, ClothingSize, StoreSettings } from '../types/pos';
import { ConfirmationModal } from './ConfirmationModal';

interface InventoryManagerProps {
  products: ClothingProduct[];
  onUpdateVariantStock: (productId: string, variantId: string, newStock: number) => void;
  onAddNewProduct: (newProduct: ClothingProduct) => void;
  onSyncInventoryToSheets: () => Promise<void>;
  isSyncing: boolean;
  settings: StoreSettings;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  onUpdateVariantStock,
  onAddNewProduct,
  onSyncInventoryToSheets,
  isSyncing,
  settings,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmSyncModal, setShowConfirmSyncModal] = useState(false);

  // New product form state
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('Thread & Till');
  const [newCategory, setNewCategory] = useState<ClothingCategory>('T-Shirts & Tops');
  const [newPrice, setNewPrice] = useState('45.00');
  const [newCost, setNewCost] = useState('15.00');
  const [newSizes, setNewSizes] = useState<ClothingSize[]>(['S', 'M', 'L', 'XL']);
  const [newColor, setNewColor] = useState('Black');
  const [newStockPerVariant, setNewStockPerVariant] = useState('10');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80');

  // Inventory Totals
  const stats = useMemo(() => {
    let totalUnits = 0;
    let totalRetailValue = 0;
    let totalCostValue = 0;
    let lowStockCount = 0;

    products.forEach((p) => {
      p.variants.forEach((v) => {
        totalUnits += v.stock;
        totalRetailValue += v.stock * p.price;
        totalCostValue += v.stock * p.costPrice;
        if (v.stock <= p.lowStockThreshold) {
          lowStockCount++;
        }
      });
    });

    return {
      totalUnits,
      totalRetailValue,
      totalCostValue,
      lowStockCount,
      estimatedProfit: totalRetailValue - totalCostValue,
    };
  }, [products]);

  // Flatten products into variant rows for table display
  const flattenedVariants = useMemo(() => {
    const list: {
      productId: string;
      productName: string;
      brand: string;
      category: ClothingCategory;
      price: number;
      costPrice: number;
      variantId: string;
      size: ClothingSize;
      color: string;
      stock: number;
      sku: string;
      barcode: string;
      threshold: number;
      image: string;
    }[] = [];

    products.forEach((p) => {
      p.variants.forEach((v) => {
        if (selectedCategory !== 'All' && p.category !== selectedCategory) return;
        if (search.trim()) {
          const q = search.toLowerCase();
          const match =
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            v.sku.toLowerCase().includes(q) ||
            v.barcode.includes(q) ||
            v.color.toLowerCase().includes(q);
          if (!match) return;
        }

        list.push({
          productId: p.id,
          productName: p.name,
          brand: p.brand,
          category: p.category,
          price: p.price,
          costPrice: p.costPrice,
          variantId: v.id,
          size: v.size,
          color: v.color,
          stock: v.stock,
          sku: v.sku,
          barcode: v.barcode,
          threshold: p.lowStockThreshold,
          image: p.image,
        });
      });
    });

    return list;
  }, [products, selectedCategory, search]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newSizes.length === 0) return;

    const baseSku = newName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    const stockQty = parseInt(newStockPerVariant, 10) || 5;

    const variants = newSizes.map((sz, idx) => ({
      id: `v-custom-${Date.now()}-${idx}`,
      size: sz,
      color: newColor,
      stock: stockQty,
      sku: `${baseSku}-${sz}-${newColor.substring(0, 3).toUpperCase()}`,
      barcode: `793${Math.floor(1000000 + Math.random() * 9000000)}`,
    }));

    const newProd: ClothingProduct = {
      id: `prod-custom-${Date.now()}`,
      name: newName.trim(),
      brand: newBrand.trim(),
      category: newCategory,
      price: parseFloat(newPrice) || 30,
      costPrice: parseFloat(newCost) || 12,
      defaultSku: `${baseSku}-01`,
      barcode: variants[0].barcode,
      image: newImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
      variants,
      totalStock: stockQty * variants.length,
      lowStockThreshold: 4,
    };

    onAddNewProduct(newProd);
    setShowAddModal(false);
    setNewName('');
  };

  const toggleSizeSelection = (sz: ClothingSize) => {
    if (newSizes.includes(sz)) {
      setNewSizes(newSizes.filter((s) => s !== sz));
    } else {
      setNewSizes([...newSizes, sz]);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Inventory Stock
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-950 dark:text-white">
              {stats.totalUnits}
            </span>
            <span className="text-xs text-slate-500">units</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Retail Inventory Value
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              ${stats.totalRetailValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Estimated Gross Margin
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-950 dark:text-white">
              ${stats.estimatedProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              ({stats.totalRetailValue > 0 ? ((stats.estimatedProfit / stats.totalRetailValue) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Low Stock Alerts
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${stats.lowStockCount > 0 ? 'text-amber-500' : 'text-slate-950 dark:text-white'}`}>
              {stats.lowStockCount}
            </span>
            <span className="text-xs text-slate-500">variants &le; 4 left</span>
          </div>
        </div>
      </div>

      {/* Action Controls & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by SKU, name, color, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="T-Shirts & Tops">T-Shirts & Tops</option>
            <option value="Pants & Denim">Pants & Denim</option>
            <option value="Hoodies & Sweaters">Hoodies & Sweaters</option>
            <option value="Shirts & Blouses">Shirts & Blouses</option>
            <option value="Jackets & Outerwear">Jackets & Outerwear</option>
            <option value="Dresses & Skirts">Dresses & Skirts</option>
            <option value="Activewear">Activewear</option>
            <option value="Accessories & Footwear">Accessories</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Add Product Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-950 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Garment</span>
          </button>

          {/* Sync to Google Sheets */}
          <button
            onClick={() => setShowConfirmSyncModal(true)}
            disabled={isSyncing || !settings.spreadsheetId}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              !settings.spreadsheetId
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
            title={!settings.spreadsheetId ? 'Connect Google Sheet first' : 'Push inventory to Google Sheet'}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CloudUpload className="w-4 h-4" />
            )}
            <span>Push to Google Sheet</span>
          </button>
        </div>
      </div>

      {/* Variants Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Garment</th>
                <th className="py-3.5 px-4">Size & Color</th>
                <th className="py-3.5 px-4 font-mono">SKU / Barcode</th>
                <th className="py-3.5 px-4 text-right">Price</th>
                <th className="py-3.5 px-4 text-right">Cost</th>
                <th className="py-3.5 px-4 text-center">Stock Count</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Quick Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {flattenedVariants.map((item) => {
                const isLow = item.stock <= item.threshold;
                return (
                  <tr key={`${item.productId}-${item.variantId}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{item.productName}</p>
                          <p className="text-[11px] text-slate-400">{item.category} • {item.brand}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200 mr-2 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {item.size}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">{item.color}</span>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{item.sku}</p>
                      <p className="text-[10px] text-slate-400">{item.barcode}</p>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ${item.price.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      ${item.costPrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                      <span className={item.stock === 0 ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-slate-900 dark:text-white'}>
                        {item.stock}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {item.stock === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600">
                          Sold Out
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-600">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                          In Stock
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onUpdateVariantStock(item.productId, item.variantId, Math.max(0, item.stock - 1))}
                          className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                          title="Decrease stock by 1"
                        >
                          -
                        </button>
                        <button
                          onClick={() => onUpdateVariantStock(item.productId, item.variantId, item.stock + 1)}
                          className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                          title="Increase stock by 1"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Google Sheets Bulk Inventory Sync (Mandatory destructive/overwrite confirmation) */}
      <ConfirmationModal
        isOpen={showConfirmSyncModal}
        title="Sync All Inventory to Google Sheet?"
        message={`This will overwrite the contents of the 'Inventory' tab in your Google Sheet ("${settings.spreadsheetName || 'Connected Sheet'}") with ${flattenedVariants.length} current clothing variant records, their real-time quantities, and price points.`}
        confirmLabel="Push & Overwrite Sheet"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={async () => {
          setShowConfirmSyncModal(false);
          await onSyncInventoryToSheets();
        }}
        onCancel={() => setShowConfirmSyncModal(false)}
      />

      {/* Add Garment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              Add New Clothing Item
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter garment details to create sized variants and add to POS inventory
            </p>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Classic Oxford Cotton Shirt"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Brand / Label
                  </label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ClothingCategory)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="T-Shirts & Tops">T-Shirts & Tops</option>
                    <option value="Pants & Denim">Pants & Denim</option>
                    <option value="Hoodies & Sweaters">Hoodies & Sweaters</option>
                    <option value="Shirts & Blouses">Shirts & Blouses</option>
                    <option value="Jackets & Outerwear">Jackets & Outerwear</option>
                    <option value="Dresses & Skirts">Dresses & Skirts</option>
                    <option value="Activewear">Activewear</option>
                    <option value="Accessories & Footwear">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Retail Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Sizes Selection */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['XS', 'S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', 'One Size'] as ClothingSize[]).map((sz) => (
                    <button
                      type="button"
                      key={sz}
                      onClick={() => toggleSizeSelection(sz)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        newSizes.includes(sz)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Color Name
                  </label>
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Stock per Variant
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newStockPerVariant}
                    onChange={(e) => setNewStockPerVariant(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Create Garment & Variants
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
