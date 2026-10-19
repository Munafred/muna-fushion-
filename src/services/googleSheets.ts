import { SaleTransaction, ClothingProduct } from '../types/pos';
import { getAccessToken } from './auth';

export interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

export class GoogleSheetsService {
  /**
   * Helper to execute Google API calls with the cached access token
   */
  private static async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Not signed in to Google. Please sign in to sync with Google Sheets.');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const res = await fetch(`https://sheets.googleapis.com/v4/${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      throw new Error('Google authorization session expired. Please sign in again.');
    }

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data?.error?.message || `Google Sheets API error (${res.status})`;
      throw new Error(errorMsg);
    }

    return data;
  }

  /**
   * Creates a dedicated Clothing Store POS spreadsheet in the user's Google Drive
   */
  static async createStoreSpreadsheet(storeName: string): Promise<CreateSpreadsheetResult> {
    const spreadsheetTitle = `${storeName} - POS Sales & Inventory Tracker`;

    const requestBody = {
      properties: {
        title: spreadsheetTitle,
        locale: 'en_US',
        autoRecalc: 'ON_CHANGE',
      },
      sheets: [
        {
          properties: {
            title: 'Sales_Log',
            gridProperties: {
              frozenRowCount: 1,
              columnCount: 17,
            },
          },
        },
        {
          properties: {
            title: 'Sales_Items',
            gridProperties: {
              frozenRowCount: 1,
              columnCount: 10,
            },
          },
        },
        {
          properties: {
            title: 'Inventory',
            gridProperties: {
              frozenRowCount: 1,
              columnCount: 10,
            },
          },
        },
        {
          properties: {
            title: 'Daily_Summary',
            gridProperties: {
              frozenRowCount: 1,
              columnCount: 8,
            },
          },
        },
      ],
    };

    const created = await this.request('spreadsheets', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const spreadsheetId = created.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // Initialize header rows
    await this.initializeHeaders(spreadsheetId);

    return {
      spreadsheetId,
      spreadsheetUrl,
      title: spreadsheetTitle,
    };
  }

  /**
   * Write stylish, clear header rows to all sheets
   */
  private static async initializeHeaders(spreadsheetId: string) {
    const headersData = [
      {
        range: 'Sales_Log!A1:Q1',
        values: [[
          'Order ID',
          'Timestamp',
          'Date',
          'Time',
          'Cashier',
          'Customer Name',
          'Customer Phone',
          'Items Summary',
          'Total Items',
          'Subtotal',
          'Discount',
          'Tax',
          'Total Amount',
          'Payment Method',
          'Amount Tendered',
          'Change Due',
          'Notes'
        ]],
      },
      {
        range: 'Sales_Items!A1:J1',
        values: [[
          'Timestamp',
          'Order ID',
          'Item Name',
          'Category',
          'Size',
          'Color',
          'SKU',
          'Unit Price',
          'Quantity',
          'Line Total'
        ]],
      },
      {
        range: 'Inventory!A1:J1',
        values: [[
          'SKU',
          'Item Name',
          'Category',
          'Size',
          'Color',
          'Stock Qty',
          'Retail Price',
          'Cost Price',
          'Low Stock Alert (<5)',
          'Barcode'
        ]],
      },
      {
        range: 'Daily_Summary!A1:H1',
        values: [[
          'Date',
          'Total Orders',
          'Gross Revenue',
          'Cash Sales',
          'Card Sales',
          'Mobile Sales',
          'Total Garments Sold',
          'Average Basket Value'
        ]],
      },
    ];

    await this.request(`spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: headersData,
      }),
    });
  }

  /**
   * Record a completed sale into Google Sheets (Sales_Log & Sales_Items)
   */
  static async recordSale(spreadsheetId: string, sale: SaleTransaction): Promise<boolean> {
    try {
      const dateObj = new Date(sale.timestamp);
      const dateStr = dateObj.toLocaleDateString();
      const timeStr = dateObj.toLocaleTimeString();

      const itemsSummary = sale.items
        .map(i => `${i.quantity}x ${i.name} (${i.size}/${i.color})`)
        .join(', ');
      
      const totalUnits = sale.items.reduce((sum, i) => sum + i.quantity, 0);

      // 1. Append to Sales_Log
      const salesLogRow = [
        sale.id,
        sale.timestamp,
        dateStr,
        timeStr,
        sale.cashierName,
        sale.customer?.name || 'Walk-in Customer',
        sale.customer?.phone || '-',
        itemsSummary,
        totalUnits,
        sale.subtotal.toFixed(2),
        sale.discountAmount.toFixed(2),
        sale.taxAmount.toFixed(2),
        sale.total.toFixed(2),
        sale.paymentMethod,
        sale.amountTendered ? sale.amountTendered.toFixed(2) : sale.total.toFixed(2),
        sale.changeDue ? sale.changeDue.toFixed(2) : '0.00',
        sale.notes || '',
      ];

      await this.request(
        `spreadsheets/${spreadsheetId}/values/Sales_Log!A:Q:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          body: JSON.stringify({
            values: [salesLogRow],
          }),
        }
      );

      // 2. Append each item to Sales_Items
      if (sale.items.length > 0) {
        const itemRows = sale.items.map(item => [
          sale.timestamp,
          sale.id,
          item.name,
          item.category,
          item.size,
          item.color,
          item.sku,
          item.price.toFixed(2),
          item.quantity,
          item.lineTotal.toFixed(2),
        ]);

        await this.request(
          `spreadsheets/${spreadsheetId}/values/Sales_Items!A:J:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
          {
            method: 'POST',
            body: JSON.stringify({
              values: itemRows,
            }),
          }
        );
      }

      return true;
    } catch (err) {
      console.error('Failed to append sale to Google Sheet:', err);
      throw err;
    }
  }

  /**
   * Sync complete clothing store inventory table to Google Sheets
   */
  static async syncInventory(spreadsheetId: string, products: ClothingProduct[]): Promise<number> {
    const rows: (string | number)[][] = [];

    products.forEach(product => {
      product.variants.forEach(variant => {
        rows.push([
          variant.sku,
          product.name,
          product.category,
          variant.size,
          variant.color,
          variant.stock,
          product.price.toFixed(2),
          product.costPrice.toFixed(2),
          variant.stock <= product.lowStockThreshold ? 'LOW STOCK' : 'IN STOCK',
          variant.barcode || product.barcode,
        ]);
      });
    });

    // Clear existing inventory rows (keeping header row intact)
    await this.request(`spreadsheets/${spreadsheetId}/values/Inventory!A2:J:clear`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    // Write updated inventory rows
    await this.request(`spreadsheets/${spreadsheetId}/values/Inventory!A2:J?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({
        values: rows,
      }),
    });

    return rows.length;
  }

  /**
   * Verify that a spreadsheet exists and is accessible
   */
  static async getSpreadsheetMetadata(spreadsheetId: string) {
    return await this.request(`spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`);
  }
}
