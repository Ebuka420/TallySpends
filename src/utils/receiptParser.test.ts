/**
 * TallySpends Receipt OCR Parser Unit Test Suite
 * 
 * Verifies real-world test cases across:
 * - Nigerian Supermarket Tax Invoices (SPAR, Shoprite)
 * - Fast Food Eatery Slips (Chicken Republic)
 * - Moniepoint / OPay POS Terminal Slips
 * - Noisy OCR thermal printer artifacts
 */

import {
  parseReceiptText,
  cleanCurrencyNumber,
  parseReceiptDate,
  parseCurrencySymbol,
  parseMerchantName,
} from "./receiptParser";

export function runReceiptParserTests() {
  console.log("\n🧪 Running TallySpends Receipt Parser Test Suite...\n");
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  // ----------------------------------------------------
  // TEST CASE 1: SPAR Nigeria Tax Invoice
  // ----------------------------------------------------
  const sparReceipt = `
    SPAR NIGERIA (ARTEE GROUP)
    VICTORIA ISLAND, LAGOS
    TEL: 01-2719200
    TAX INVOICE #90281
    DATE: 29/08/2026  TIME: 14:32:00
    --------------------------------
    GOLDEN PENNY FLOUR 1KG    ₦ 1,450.00
    PEAK MILK POWDER 400G     ₦ 3,200.00
    SUNLIGHT DISHWASH 750ML   ₦ 1,800.00
    --------------------------------
    SUBTOTAL:                 ₦ 6,450.00
    VAT (7.5%):               ₦ 483.75
    GRAND TOTAL:              ₦ 6,933.75
    PAYMENT: VISA             ₦ 6,933.75
    THANK YOU FOR SHOPPING AT SPAR!
  `;
  const res1 = parseReceiptText(sparReceipt);
  assert(res1.merchantName?.includes("SPAR") ?? false, "SPAR: Merchant name identified");
  assert(res1.totalAmount === 6933.75, `SPAR: Grand total amount is 6933.75 (got ${res1.totalAmount})`);
  assert(res1.date === "2026-08-29", `SPAR: Date normalized to 2026-08-29 (got ${res1.date})`);
  assert(res1.category === "Groceries", `SPAR: Category classified as Groceries (got ${res1.category})`);

  // ----------------------------------------------------
  // TEST CASE 2: Shoprite Hypermarket Invoice
  // ----------------------------------------------------
  const shopriteReceipt = `
    SHOPRITE HYPERMARKET
    PALMS SHOPPING MALL, LEKKI
    DATE: 2026-08-28 18:12
    CASHIER: BLESSING
    --------------------------------
    TOTAL AMOUNT DUE: NGN 14,850.00
    AMOUNT PAID:      NGN 15,000.00
    CHANGE:           NGN 150.00
  `;
  const res2 = parseReceiptText(shopriteReceipt);
  assert(res2.merchantName?.includes("SHOPRITE") ?? false, "Shoprite: Merchant identified");
  assert(res2.totalAmount === 14850.0, `Shoprite: Amount Due is 14850.0 (got ${res2.totalAmount})`);
  assert(res2.currency === "₦", "Shoprite: Currency identified as ₦");

  // ----------------------------------------------------
  // TEST CASE 3: Chicken Republic Eatery POS
  // ----------------------------------------------------
  const chickenRepReceipt = `
    CHICKEN REPUBLIC
    ADETOKUNBO ADEMOLA VI LAGOS
    --------------------------------
    1x Refuel Combo Meal      ₦ 3,400.00
    1x 50cl Drink             ₦ 600.00
    --------------------------------
    TOTAL:                    ₦ 4,000.00
    DATE: 27-08-2026
  `;
  const res3 = parseReceiptText(chickenRepReceipt);
  assert(res3.merchantName?.includes("CHICKEN REPUBLIC") ?? false, "Chicken Republic: Merchant identified");
  assert(res3.totalAmount === 4000.0, `Chicken Republic: Total is 4000.00 (got ${res3.totalAmount})`);
  assert(res3.category === "Food & Dining", "Chicken Republic: Category is Food & Dining");

  // ----------------------------------------------------
  // TEST CASE 4: Moniepoint / OPay POS Slip with OCR Noise (|N|)
  // ----------------------------------------------------
  const moniepointSlip = `
    MONIEPOINT TERMINAL
    MERCHANT: OLUWASEUN STORES
    STAN: 094821  RRN: 99482019482
    DATE: 26/08/2026  TIME: 11:05
    --------------------------------
    TRANSACTION AMOUNT: |N| 25,400.00
    STATUS: APPROVED 00
    CARD: **** **** **** 4912
  `;
  const res4 = parseReceiptText(moniepointSlip);
  assert(res4.merchantName?.includes("OLUWASEUN") ?? false, "Moniepoint: Merchant identified");
  assert(res4.totalAmount === 25400.0, `Moniepoint: Total Amount 25400.00 parsed with |N| noise (got ${res4.totalAmount})`);

  // ----------------------------------------------------
  // TEST CASE 5: Number Sanitizer Unit Tests
  // ----------------------------------------------------
  assert(cleanCurrencyNumber("8,438.75") === 8438.75, "Sanitizer: 8,438.75 -> 8438.75");
  assert(cleanCurrencyNumber("₦ 125,000.00") === 125000.0, "Sanitizer: ₦ 125,000.00 -> 125000.0");
  assert(cleanCurrencyNumber("250.50") === 250.5, "Sanitizer: 250.50 -> 250.5");

  console.log(`\n📊 Test Results: ${passedCount}/${totalCount} tests passed!\n`);
  return passedCount === totalCount;
}
