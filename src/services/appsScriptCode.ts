export const generateAppsScriptCode = (storeName: string = 'Thread & Till Apparel', managerEmail: string = 'fredonmau@gmail.com') => {
  return `/**
 * @name ${storeName} - POS Automation Apps Script
 * @description Google Apps Script for Clothing Store POS:
 *  1. Automatic Daily Sales Summaries & End-of-Day Balancing
 *  2. Low Stock Alerts & Inventory Notification to Store Manager
 *  3. Custom POS Menu in Google Sheets
 *  4. Webhook API (doPost) for receiving sales from POS hardware or apps
 */

// STORE CONFIGURATION
const CONFIG = {
  STORE_NAME: "${storeName}",
  MANAGER_EMAIL: "${managerEmail}", // Update with your store email
  LOW_STOCK_THRESHOLD: 5,
  SALES_LOG_SHEET: "Sales_Log",
  SALES_ITEMS_SHEET: "Sales_Items",
  INVENTORY_SHEET: "Inventory",
  DAILY_SUMMARY_SHEET: "Daily_Summary"
};

/**
 * Creates custom menu when opening the Google Sheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('👕 Clothing POS Tools')
    .addItem('📊 Generate Today\\'s Sales Summary', 'generateDailySalesSummary')
    .addItem('⚠️ Check Low Stock & Email Alert', 'checkLowStockAndAlert')
    .addItem('🎨 Apply Pretty POS Styling', 'applyPOSFormatting')
    .addSeparator()
    .addItem('ℹ️ Setup Automated Nightly Triggers', 'setupAutomatedNightlyTriggers')
    .addToUi();
}

/**
 * 1. AUTOMATIC DAILY SALES SUMMARY
 * Reads Sales_Log for today's date, aggregates metrics, and logs to Daily_Summary
 */
function generateDailySalesSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const salesSheet = ss.getSheetByName(CONFIG.SALES_LOG_SHEET);
  const summarySheet = ss.getSheetByName(CONFIG.DAILY_SUMMARY_SHEET);

  if (!salesSheet || !summarySheet) {
    SpreadsheetApp.getUi().alert("Error: Sheets not found. Make sure Sales_Log and Daily_Summary tabs exist.");
    return;
  }

  const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const salesData = salesSheet.getDataRange().getValues();
  if (salesData.length <= 1) {
    Logger.log("No sales data recorded yet.");
    return;
  }

  let totalOrders = 0;
  let grossRevenue = 0;
  let cashSales = 0;
  let cardSales = 0;
  let mobileSales = 0;
  let totalGarments = 0;

  // Header row is index 0:
  // Cols: [Order ID(0), Timestamp(1), Date(2), Time(3), Cashier(4), Customer(5), Phone(6), ItemsSummary(7), Qty(8), Subtotal(9), Discount(10), Tax(11), Total(12), PaymentMethod(13), ...]
  for (let i = 1; i < salesData.length; i++) {
    const row = salesData[i];
    const rowDate = row[2] ? Utilities.formatDate(new Date(row[1] || row[2]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "";
    
    if (rowDate === todayStr) {
      totalOrders++;
      const orderTotal = parseFloat(row[12]) || 0;
      const orderQty = parseInt(row[8], 10) || 0;
      const method = String(row[13] || '').toLowerCase();

      grossRevenue += orderTotal;
      totalGarments += orderQty;

      if (method.includes('cash')) {
        cashSales += orderTotal;
      } else if (method.includes('card')) {
        cardSales += orderTotal;
      } else {
        mobileSales += orderTotal;
      }
    }
  }

  const avgBasket = totalOrders > 0 ? (grossRevenue / totalOrders).toFixed(2) : "0.00";

  // Check if today already has a summary row
  const summaryData = summarySheet.getDataRange().getValues();
  let existingRow = -1;
  for (let j = 1; j < summaryData.length; j++) {
    const sDate = Utilities.formatDate(new Date(summaryData[j][0]), Session.getScriptTimeZone(), "yyyy-MM-dd");
    if (sDate === todayStr) {
      existingRow = j + 1;
      break;
    }
  }

  const summaryRow = [
    todayStr,
    totalOrders,
    grossRevenue.toFixed(2),
    cashSales.toFixed(2),
    cardSales.toFixed(2),
    mobileSales.toFixed(2),
    totalGarments,
    avgBasket
  ];

  if (existingRow > 0) {
    summarySheet.getRange(existingRow, 1, 1, 8).setValues([summaryRow]);
  } else {
    summarySheet.appendRow(summaryRow);
  }

  Logger.log("Daily summary updated for " + todayStr + ": " + totalOrders + " orders, Total: $" + grossRevenue.toFixed(2));
  return {
    date: todayStr,
    orders: totalOrders,
    revenue: grossRevenue.toFixed(2)
  };
}

/**
 * 2. LOW STOCK CHECK & MANAGER EMAIL ALERT
 * Scans the Inventory sheet for any clothing item at or below threshold
 */
function checkLowStockAndAlert() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const invSheet = ss.getSheetByName(CONFIG.INVENTORY_SHEET);
  if (!invSheet) return;

  const data = invSheet.getDataRange().getValues();
  if (data.length <= 1) return;

  // Cols: [SKU(0), Item Name(1), Category(2), Size(3), Color(4), Stock Qty(5), Price(6), Cost(7), Status(8), Barcode(9)]
  const lowStockItems = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sku = row[0];
    const name = row[1];
    const size = row[3];
    const color = row[4];
    const stock = parseInt(row[5], 10);

    if (!isNaN(stock) && stock <= CONFIG.LOW_STOCK_THRESHOLD) {
      lowStockItems.push({ sku, name, size, color, stock });
    }
  }

  if (lowStockItems.length > 0) {
    let emailBody = "Attention " + CONFIG.STORE_NAME + " Manager,\\n\\n";
    emailBody += "The following " + lowStockItems.length + " clothing items are running LOW ON STOCK:\\n\\n";
    
    lowStockItems.forEach(item => {
      emailBody += "• " + item.name + " (" + item.size + " / " + item.color + ") - SKU: " + item.sku + " -> CURRENT STOCK: " + item.stock + " units\\n";
    });

    emailBody += "\\nPlease place a reorder with suppliers or transfer store inventory.\\n\\n";
    emailBody += "Automated POS Alert from " + CONFIG.STORE_NAME;

    try {
      MailApp.sendEmail({
        to: CONFIG.MANAGER_EMAIL,
        subject: "⚠️ Low Stock Alert: " + lowStockItems.length + " items low at " + CONFIG.STORE_NAME,
        body: emailBody
      });
      Logger.log("Low stock email sent to " + CONFIG.MANAGER_EMAIL);
    } catch (e) {
      Logger.log("Could not send email (MailApp quota or invalid email): " + e.message);
    }
  } else {
    Logger.log("All inventory levels are healthy.");
  }
}

/**
 * 3. WEBHOOK ENDPOINT (doPost)
 * Allows POS client or external scanners to push sales via JSON
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const salesSheet = ss.getSheetByName(CONFIG.SALES_LOG_SHEET);
    
    if (body.action === "record_sale") {
      const sale = body.sale;
      salesSheet.appendRow([
        sale.id,
        new Date().toISOString(),
        sale.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
        sale.time || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm:ss"),
        sale.cashierName || "Main Register",
        sale.customerName || "Walk-in",
        sale.customerPhone || "-",
        sale.itemsSummary || "",
        sale.itemsQty || 1,
        sale.subtotal || 0,
        sale.discount || 0,
        sale.tax || 0,
        sale.total || 0,
        sale.paymentMethod || "Cash",
        sale.tendered || 0,
        sale.changeDue || 0,
        sale.notes || ""
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Sale recorded successfully",
        orderId: sale.id
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "ignored" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 4. ONE-CLICK FORMATTING
 * Colors header rows, sets currency formats, and highlights low stock cells
 */
function applyPOSFormatting() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Format Sales_Log
  const salesSheet = ss.getSheetByName(CONFIG.SALES_LOG_SHEET);
  if (salesSheet) {
    const headerRange = salesSheet.getRange(1, 1, 1, 17);
    headerRange.setBackground("#1e293b"); // Slate 800
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    salesSheet.setFrozenRows(1);
    
    // Set currency format on subtotal, tax, total cols (J, K, L, M)
    const lastRow = Math.max(salesSheet.getLastRow(), 2);
    salesSheet.getRange(2, 10, lastRow, 4).setNumberFormat("$#,##0.00");
  }

  // Format Inventory
  const invSheet = ss.getSheetByName(CONFIG.INVENTORY_SHEET);
  if (invSheet) {
    const invHeader = invSheet.getRange(1, 1, 1, 10);
    invHeader.setBackground("#0f766e"); // Teal 700
    invHeader.setFontColor("#ffffff");
    invHeader.setFontWeight("bold");
    invSheet.setFrozenRows(1);
  }

  SpreadsheetApp.getUi().alert("✨ Beautiful POS styling applied to your sheets!");
}

/**
 * 5. INSTALL AUTOMATED NIGHTLY TRIGGERS
 * Automatically runs End-of-Day summary and inventory scan every night at 11 PM
 */
function setupAutomatedNightlyTriggers() {
  // Clear existing duplicate triggers
  const existingTriggers = ScriptApp.getProjectTriggers();
  existingTriggers.forEach(t => {
    if (t.getHandlerFunction() === 'generateDailySalesSummary' || t.getHandlerFunction() === 'checkLowStockAndAlert') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Schedule daily sales summary at 11:00 PM
  ScriptApp.newTrigger('generateDailySalesSummary')
    .timeBased()
    .atHour(23)
    .everyDays(1)
    .create();

  // Schedule daily stock check at 8:00 AM
  ScriptApp.newTrigger('checkLowStockAndAlert')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .create();

  SpreadsheetApp.getUi().alert("✅ Nightly End-of-Day Summary trigger scheduled for 11:00 PM every day, and Morning Stock Check scheduled for 8:00 AM!");
}
`;
};
