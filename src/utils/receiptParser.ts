/**
 * TallySpends Enterprise Receipt OCR & Thermal POS Parser Engine
 * 
 * Optimized for Nigerian POS Slips (Moniepoint, OPay, Baxi, Palmpay),
 * Supermarket Invoices (Shoprite, SPAR, Hubmart, Justrite),
 * and International standard receipts.
 */

export interface ParsedReceiptLineItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface ParsedReceiptResult {
  merchantName: string | null;
  totalAmount: number | null;
  currency: string;
  date: string | null;
  time: string | null;
  category: string;
  lineItems: ParsedReceiptLineItem[];
  tax: number | null;
  confidence: number; // 0.0 to 1.0
  fieldConfidence: {
    merchant: boolean;
    amount: boolean;
    date: boolean;
    category: boolean;
  };
  rawText: string;
  parsingMethod: "regex" | "heuristic_fallback" | "llm_secondary";
}

/**
 * Common Nigerian & Global Category Taxonomy
 */
const CATEGORY_MAP: Record<string, string[]> = {
  "Food & Dining": [
    "restaurant", "eatery", "cafe", "bistro", "diner", "bakery", "kitchen", "grill",
    "burger", "pizza", "sushi", "chicken republic", "kfc", "kilimanjaro", "sweet sensation",
    "tantalizers", "mr biggs", "mega chicken", "the place", "bukka", "suya", "shawarma",
    "chop", "drinks", "bar", "lounge", "food", "tacos", "pasta", "cafeteria", "lunch", "dinner"
  ],
  "Groceries": [
    "supermarket", "grocery", "groceries", "market", "mart", "store", "provisions",
    "shoprite", "spar", "hubmart", "justrite", "prince ebeano", "market square",
    "addide", "supermart", "fruits", "vegetables", "meat", "bakery"
  ],
  "Transport": [
    "fuel", "petrol", "gas", "diesel", "station", "filling", "totalenergies", "nnpc",
    "oando", "mobil", "conoil", "ardova", "bovas", "uber", "bolt", "taxify", "ride",
    "transit", "flight", "air peace", "ibom air", "toll", "lcc", "parking"
  ],
  "Shopping": [
    "boutique", "fashion", "apparel", "zara", "h&m", "nike", "adidas", "clothing",
    "electronics", "gadget", "slot", "oraimo", "jumia", "konga", "mall", "plaza"
  ],
  "Bills & Utilities": [
    "electricity", "power", "ikedc", "ekedc", "aedc", "eedc", "ibedc", "kedco", "phcn",
    "nepa", "water", "waste", "lawma", "internet", "wifi", "spectranet", "swift",
    "mtn", "airtel", "glo", "9mobile", "dstv", "gotv", "startimes", "showmax"
  ],
  "Entertainment": [
    "cinema", "movie", "filmhouse", "silverbird", "genesis", "netflix", "spotify",
    "concert", "game", "playstation", "xbox", "ticket", "club", "event", "nightlife"
  ],
};

/**
 * OCR Currency Artifacts Regex (Covers Nigerian thermal noise: |N|, |V, NGN, N., etc.)
 */
export const NAIRA_OCR_VARIANTS_REGEX =
  /(?:₦|NGN|NGN\.|NAIRA|Naira|N(?=[\s\d])|\|\s*N\s*\||\|\s*V\s*|\(N\)|\bN\b|¥|W\/)/i;

/**
 * Flexible Currency Detector Regex
 */
const CURRENCY_REGEX =
  /(?:₦|NGN|NAIRA|Naira|\$|USD|€|EUR|£|GBP|¥)/i;

/**
 * Thermal POS Receipt Keyword Patterns for Final Total Amount
 * Ranked by strict confidence level
 */
const TOTAL_AMOUNT_REGEX_LIST = [
  // 1. Strict Grand Total / Amount Due / Total Payable
  /(?:GRAND\s*TOTAL|TOTAL\s*AMOUNT(?:\s*DUE)?|AMOUNT\s*DUE|NET\s*TOTAL|TOTAL\s*PAYABLE|BALANCE\s*DUE|AMOUNT\s*PAYABLE)\s*[:=\-]?\s*(?:(?:₦|NGN|N|USD|\$|EUR|€|GBP|£)\s*)?([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})|[0-9]+(?:\.[0-9]{1,2})?)/i,

  // 2. POS Slip Specific: TRANSACTION AMOUNT / APPROVED AMOUNT / SALE AMOUNT
  /(?:TRANSACTION\s*AMOUNT|APPROVED\s*AMOUNT|TOTAL\s*PAID|AMOUNT\s*PAID|SALE\s*AMOUNT|TOTAL\s*CHARGE)\s*[:=\-]?\s*(?:(?:₦|NGN|N|USD|\$|EUR|€|GBP|£)\s*)?([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})|[0-9]+(?:\.[0-9]{1,2})?)/i,

  // 3. Simple TOTAL: ₦4,500.00 or TOTAL: 4500.00
  /(?:\bTOTAL\b)\s*[:=\-]?\s*(?:(?:₦|NGN|N|USD|\$|EUR|€|GBP|£)\s*)?([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})|[0-9]+(?:\.[0-9]{1,2})?)/i,

  // 4. CASH / POS PAYMENT / CARD SALE
  /(?:CASH|CARD|VISA|MASTERCARD|VERVE|POS|TERMINAL)\s*(?:TENDERED|PAYMENT|SALE)?\s*[:=\-]?\s*(?:(?:₦|NGN|N|USD|\$|EUR|€|GBP|£)\s*)?([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})|[0-9]+(?:\.[0-9]{1,2})?)/i,

  // 5. SUBTOTAL fallback if no explicit grand total
  /(?:SUBTOTAL|SUB\s*TOTAL)\s*[:=\-]?\s*(?:(?:₦|NGN|N|USD|\$|EUR|€|GBP|£)\s*)?([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})|[0-9]+(?:\.[0-9]{1,2})?)/i,
];

/**
 * Flexible Date Patterns (handles thermal slashes, dashes, dots, and words)
 */
const DATE_REGEX_LIST = [
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (e.g. 29/08/2026)
  /\b([0-3]?[0-9])[\/\-\.]([0-1]?[0-9])[\/\-\.](20[2-3][0-9]|[2-3][0-9])\b/,
  // YYYY-MM-DD or YYYY/MM/DD (e.g. 2026-08-29)
  /\b(20[2-3][0-9])[\/\-\.]([0-1]?[0-9])[\/\-\.]([0-3]?[0-9])\b/,
  // 29 Aug 2026 or 29-Aug-2026 or Aug 29, 2026
  /\b([0-3]?[0-9])[\s\-]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-]+(20[2-3][0-9]|[2-3][0-9])\b/i,
  /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+([0-3]?[0-9]),?\s+(20[2-3][0-9]|[2-3][0-9])\b/i,
];

/**
 * Flexible Time Pattern (e.g., 14:32:05 or 02:45 PM)
 */
const TIME_REGEX = /\b([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?(?:\s*(AM|PM))?\b/i;

/**
 * Sanitizes numeric strings from thermal OCR noise
 * Handles: "8,438.75" -> 8438.75 | "8 438,75" -> 8438.75 | "8438.75" -> 8438.75
 */
export function cleanCurrencyNumber(raw: string): number {
  if (!raw) return 0;

  // Trim whitespace and remove rogue currency symbols
  let cleaned = raw.replace(/[^\d.,]/g, "").trim();

  // If European format with comma decimal (e.g. 1.250,50 or 250,50)
  if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(cleaned) || /^\d+,\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // Standard international format (e.g. 1,250.50 or 250.50)
    cleaned = cleaned.replace(/,/g, "");
  }

  const result = parseFloat(cleaned);
  return isNaN(result) ? 0 : result;
}

/**
 * Currency Symbol Resolver
 */
export function parseCurrencySymbol(text: string): string {
  if (NAIRA_OCR_VARIANTS_REGEX.test(text)) return "₦";
  if (/\$|USD/i.test(text)) return "$";
  if (/€|EUR/i.test(text)) return "€";
  if (/£|GBP/i.test(text)) return "£";
  return "₦"; // Default to Nigerian Naira
}

/**
 * Normalizes extracted date strings into standard ISO YYYY-MM-DD
 */
export function parseReceiptDate(text: string): string | null {
  for (const regex of DATE_REGEX_LIST) {
    const match = text.match(regex);
    if (!match) continue;

    try {
      // Form: DD/MM/YYYY
      if (match[1] && match[2] && match[3] && match[3].length >= 2) {
        let year = match[3];
        if (year.length === 2) year = `20${year}`;
        let month = match[2];
        let day = match[1];

        // If month is text abbreviation (e.g. Aug)
        if (isNaN(Number(month))) {
          const monthIndex = new Date(`${month} 1, 2000`).getMonth() + 1;
          month = String(monthIndex).padStart(2, "0");
        } else {
          month = month.padStart(2, "0");
        }

        day = day.padStart(2, "0");
        const formatted = `${year}-${month}-${day}`;
        if (!isNaN(new Date(formatted).getTime())) {
          return formatted;
        }
      }
    } catch {
      // Fall through to next pattern
    }
  }

  return null;
}

/**
 * Extracts Transaction Time (e.g. "14:23:45")
 */
export function parseReceiptTime(text: string): string | null {
  const match = text.match(TIME_REGEX);
  return match ? match[0] : null;
}

/**
 * Intelligent Merchant Header Extractor
 * Filters out POS machine metadata, tax codes, and receipt boilerplate
 */
export function parseMerchantName(lines: string[]): string | null {
  const boilerplateTerms = [
    "tax invoice", "customer copy", "merchant copy", "original", "duplicate",
    "pos receipt", "terminal id", "merchant id", "stan", "rrn", "auth code",
    "welcome", "thank you", "tel:", "phone:", "date:", "time:", "cashier", "order #"
  ];

  // 1. Pass 1: Prioritize explicit "MERCHANT:" or "STORE:" tags
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const rawLine = lines[i]?.trim();
    if (!rawLine) continue;

    const merchantPrefixMatch = rawLine.match(/^(?:MERCHANT(?:\s*NAME)?|STORE(?:\s*NAME)?)\s*[:=\-]\s*(.+)$/i);
    if (merchantPrefixMatch && merchantPrefixMatch[1]) {
      const candidate = merchantPrefixMatch[1].trim().replace(/^[\W_]+|[\W_]+$/g, "");
      if (candidate.length > 2) return candidate;
    }
  }

  // 2. Pass 2: Pick top business name header
  for (let i = 0; i < Math.min(lines.length, 7); i++) {
    const rawLine = lines[i]?.trim();
    if (!rawLine || rawLine.length < 3) continue;

    const lower = rawLine.toLowerCase();
    const isBoilerplate = boilerplateTerms.some((b) => lower === b || lower.startsWith(b));
    const isPureDigits = /^[\d\s\-+#./()]+$/.test(rawLine);

    if (!isBoilerplate && !isPureDigits) {
      return rawLine.replace(/^[\W_]+|[\W_]+$/g, "").trim();
    }
  }

  return null;
}

/**
 * Line Items Parser (captures product, quantity and price)
 */
export function parseLineItems(lines: string[]): ParsedReceiptLineItem[] {
  const items: ParsedReceiptLineItem[] = [];

  // Pattern: Item name ... x2 ... 4,500.00
  const itemPattern = /^([a-zA-Z0-9\s&'\-./]+?)(?:\s+(?:x|qty|count)\s*([0-9]+))?\s+(?:(?:₦|NGN|N|\$|€|£)\s*)?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))$/i;

  for (const line of lines) {
    const match = line.trim().match(itemPattern);
    if (!match) continue;

    const name = match[1]?.trim();
    const qty = match[2] ? parseInt(match[2], 10) : 1;
    const price = cleanCurrencyNumber(match[3]);

    if (
      name &&
      name.length > 2 &&
      price > 0 &&
      !/total|subtotal|tax|vat|change|cash|card|balance/i.test(name)
    ) {
      items.push({ name, price, quantity: qty });
    }
  }

  return items;
}

/**
 * Automated Category Classifier
 */
export function classifyReceiptCategory(merchant: string | null, fullText: string): string {
  const corpus = `${merchant || ""} ${fullText}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((kw) => corpus.includes(kw))) {
      return category;
    }
  }

  return "Food & Dining"; // Standard default
}

/**
 * MASTER DETERMINISTIC PARSER
 * Processes raw OCR text lines and extracts high-confidence structured receipt data
 */
export function parseReceiptText(rawText: string): ParsedReceiptResult {
  if (!rawText || !rawText.trim()) {
    return {
      merchantName: null,
      totalAmount: null,
      currency: "₦",
      date: null,
      time: null,
      category: "Food & Dining",
      lineItems: [],
      tax: null,
      confidence: 0,
      fieldConfidence: { merchant: false, amount: false, date: false, category: false },
      rawText: "",
      parsingMethod: "regex",
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const currency = parseCurrencySymbol(rawText);
  const merchantName = parseMerchantName(lines);
  const date = parseReceiptDate(rawText) || new Date().toISOString().slice(0, 10);
  const time = parseReceiptTime(rawText);
  const lineItems = parseLineItems(lines);
  const category = classifyReceiptCategory(merchantName, rawText);

  // 1. Identify Total Amount
  let totalAmount: number | null = null;
  let parsedWithRegex = false;

  for (let i = 0; i < TOTAL_AMOUNT_REGEX_LIST.length; i++) {
    const match = rawText.match(TOTAL_AMOUNT_REGEX_LIST[i]);
    if (match && match[1]) {
      const candidate = cleanCurrencyNumber(match[1]);
      if (candidate > 0) {
        totalAmount = candidate;
        parsedWithRegex = true;
        break;
      }
    }
  }

  // 2. Fallback Heuristic: Locate maximum reasonable numeric value
  if (!totalAmount || totalAmount <= 0) {
    const allNumericMatches = rawText.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d{2})\b/g) || [];
    let max = 0;
    for (const numStr of allNumericMatches) {
      const val = cleanCurrencyNumber(numStr);
      if (val > max && val < 50000000) {
        max = val;
      }
    }
    if (max > 0) {
      totalAmount = max;
    }
  }

  // Compute confidence scores
  const hasMerchant = Boolean(merchantName && merchantName.length > 2);
  const hasAmount = Boolean(totalAmount && totalAmount > 0);
  const hasDate = Boolean(date);

  let confidenceScore = 0.4;
  if (hasAmount) confidenceScore += 0.35;
  if (hasMerchant) confidenceScore += 0.15;
  if (lineItems.length > 0) confidenceScore += 0.1;

  return {
    merchantName,
    totalAmount,
    currency,
    date,
    time,
    category,
    lineItems,
    tax: null,
    confidence: Math.min(1.0, confidenceScore),
    fieldConfidence: {
      merchant: hasMerchant,
      amount: hasAmount,
      date: hasDate,
      category: true,
    },
    rawText,
    parsingMethod: parsedWithRegex ? "regex" : "heuristic_fallback",
  };
}

/**
 * Secondary LLM Prompt & Schema Specification for Cloud/Multimodal Fallback
 */
export const RECEIPT_LLM_PROMPT = `
You are an expert financial OCR parser. Given the following unstructured text from a printed/thermal receipt, extract the core transaction details into the exact JSON schema below:

SCHEMA:
{
  "merchantName": string | null,
  "totalAmount": number | null,
  "currency": "₦" | "$" | "€" | "£",
  "date": "YYYY-MM-DD" | null,
  "time": "HH:MM:SS" | null,
  "category": "Food & Dining" | "Groceries" | "Transport" | "Shopping" | "Bills & Utilities" | "Entertainment" | "Others",
  "lineItems": Array<{ "name": string, "price": number, "quantity": number }>,
  "tax": number | null
}

RULES:
1. "totalAmount" must be the final amount paid (excluding change).
2. Clean all comma thousands separators (e.g. 5,400.00 -> 5400.00).
3. Return ONLY valid raw JSON with no Markdown fences or commentary.
`.trim();

/**
 * Debugging Console Logger for ML Kit OCR Blocks & Bounding Boxes
 */
export function debugMLKitBlocks(blocks: Array<{ text: string; frame?: any; lines?: any[] }>) {
  console.log("================ ML KIT OCR DEBUG LOG ================");
  console.log(`Total Text Blocks Recognized: ${blocks?.length || 0}`);

  blocks?.forEach((block, bIdx) => {
    console.log(`\n[Block #${bIdx + 1}]`);
    if (block.frame) {
      console.log(`  Bounding Box: [x:${block.frame.x}, y:${block.frame.y}, w:${block.frame.width}, h:${block.frame.height}]`);
    }
    block.lines?.forEach((line, lIdx) => {
      console.log(`    Line ${lIdx + 1}: "${line.text}"`);
    });
  });
  console.log("======================================================");
}
