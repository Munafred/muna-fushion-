export type ClothingCategory = 
  | 'T-Shirts & Tops'
  | 'Shirts & Blouses'
  | 'Pants & Denim'
  | 'Dresses & Skirts'
  | 'Hoodies & Sweaters'
  | 'Jackets & Outerwear'
  | 'Activewear'
  | 'Accessories & Footwear';

export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '28' | '30' | '32' | '34' | '36' | 'One Size';

export interface ProductVariant {
  id: string;
  size: ClothingSize;
  color: string;
  colorHex?: string;
  stock: number;
  sku: string;
  barcode: string;
}

export interface ClothingProduct {
  id: string;
  name: string;
  category: ClothingCategory;
  brand: string;
  price: number;
  costPrice: number;
  defaultSku: string;
  barcode: string;
  image: string;
  variants: ProductVariant[];
  totalStock: number;
  lowStockThreshold: number;
  description?: string;
}

export interface CartItem {
  id: string; // unique item cart id
  productId: string;
  name: string;
  category: ClothingCategory;
  price: number;
  costPrice: number;
  variantId: string;
  size: ClothingSize;
  color: string;
  sku: string;
  barcode: string;
  quantity: number;
  maxStock: number;
}

export type PaymentMethod = 'Cash' | 'Credit/Debit Card' | 'Mobile Pay' | 'Store Credit' | 'Split Payment';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  totalSpent: number;
}

export interface SaleTransaction {
  id: string; // Order # e.g. TT-2026-1001
  timestamp: string; // ISO string
  cashierName: string;
  customer?: {
    name: string;
    phone?: string;
    email?: string;
  };
  items: {
    productId: string;
    name: string;
    category: ClothingCategory;
    size: ClothingSize;
    color: string;
    sku: string;
    price: number;
    quantity: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountTendered?: number;
  changeDue?: number;
  notes?: string;
  syncedToGoogleSheets: boolean;
  sheetsRowIndex?: number;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  taxRatePercent: number;
  receiptFooter: string;
  activeCashier: string;
  spreadsheetId: string | null;
  spreadsheetName: string | null;
  spreadsheetUrl: string | null;
  autoSyncToSheets: boolean;
}
