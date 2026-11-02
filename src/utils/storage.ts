/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Category, Sale, Expense, ExpenseCategory, AuditLog, StoreSettings } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'gestock_products_v1',
  CATEGORIES: 'gestock_categories_v1',
  SALES: 'gestock_sales_v1',
  EXPENSES: 'gestock_expenses_v1',
  EXPENSE_CATEGORIES: 'gestock_expense_categories_v1',
  AUDIT_LOGS: 'gestock_audit_logs_v1',
  SETTINGS: 'gestock_settings_v1',
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'GESTOCK Commerce & Magasin',
  storeSubtitle: 'Vente au détail & Gros - Libre-Service',
  phone: '+33 6 12 34 56 78',
  address: '14 Rue du Commerce',
  city: 'Paris',
  email: 'contact@gestock-commerce.com',
  taxNumber: 'FR 89 123456789',
  currency: '€',
  currencyPosition: 'after',
  vatRate: 20,
  vatEnabled: false, // Default disabled for simplified retail
  receiptHeader: 'Merci pour votre visite !',
  receiptFooter: 'Les articles peuvent être échangés sous 7 jours avec ticket.',
  receiptPaperWidth: '80mm',
  autoPrintReceipt: true,
  enableSound: true,
  pinSecurityEnabled: false,
  supervisorPin: '1234',
  themeColor: 'emerald',
  darkMode: false,
  enabledPaymentMethods: ['especes', 'carte', 'wave', 'orange_money', 'virement', 'cheque', 'credit'],
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Alimentation & Boissons', color: 'emerald' },
  { id: 'cat-2', name: 'Épicerie Sucrée & Salée', color: 'amber' },
  { id: 'cat-3', name: 'Hygiène & Beauté', color: 'blue' },
  { id: 'cat-4', name: 'Entretien & Maison', color: 'indigo' },
  { id: 'cat-5', name: 'Accessoires & Divers', color: 'violet' },
];

export const INITIAL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'expcat-1', name: 'Loyer & Charges' },
  { id: 'expcat-2', name: 'Électricité & Eau' },
  { id: 'expcat-3', name: 'Transport & Carburant' },
  { id: 'expcat-4', name: 'Fournisseurs & Marchandises' },
  { id: 'expcat-5', name: 'Salaires & Rémunérations' },
  { id: 'expcat-6', name: 'Fournitures de bureau & Emballages' },
  { id: 'expcat-7', name: 'Entretien & Réparations' },
  { id: 'expcat-8', name: 'Divers & Imprévus' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Pack Eau Minérale 6x1.5L',
    barcode: '3274080005003',
    category: 'Alimentation & Boissons',
    stock: 45,
    minStockAlert: 10,
    buyPrice: 2.10,
    sellPrice: 3.50,
    unit: 'pack',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Café Moulu Pur Arabica 250g',
    barcode: '3017620422003',
    category: 'Alimentation & Boissons',
    stock: 28,
    minStockAlert: 8,
    buyPrice: 2.40,
    sellPrice: 4.20,
    unit: 'paquet',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Huile de Tournesol 1L',
    barcode: '3155250001018',
    category: 'Épicerie Sucrée & Salée',
    stock: 35,
    minStockAlert: 10,
    buyPrice: 1.30,
    sellPrice: 2.20,
    unit: 'bouteille',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Riz Parfumé Jasmin 5kg',
    barcode: '3700142401012',
    category: 'Épicerie Sucrée & Salée',
    stock: 18,
    minStockAlert: 5,
    buyPrice: 6.50,
    sellPrice: 10.90,
    unit: 'sac',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    name: 'Pâtes Penne Rigate 500g',
    barcode: '8076809513753',
    category: 'Épicerie Sucrée & Salée',
    stock: 52,
    minStockAlert: 15,
    buyPrice: 0.75,
    sellPrice: 1.40,
    unit: 'paquet',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    name: 'Sucre Morceaux 1kg',
    barcode: '3174660000103',
    category: 'Épicerie Sucrée & Salée',
    stock: 4, // Low stock on purpose for testing alert!
    minStockAlert: 10,
    buyPrice: 1.10,
    sellPrice: 1.80,
    unit: 'boîte',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    name: 'Gel Douche Hydratant 400ml',
    barcode: '3600523000124',
    category: 'Hygiène & Beauté',
    stock: 22,
    minStockAlert: 6,
    buyPrice: 1.80,
    sellPrice: 3.20,
    unit: 'flacon',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    name: 'Dentifrice Blancheur Intense 75ml',
    barcode: '8718951131102',
    category: 'Hygiène & Beauté',
    stock: 3, // Low stock on purpose
    minStockAlert: 8,
    buyPrice: 1.20,
    sellPrice: 2.50,
    unit: 'tube',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-9',
    name: 'Lessive Liquide Concentrée 2L',
    barcode: '3014260020109',
    category: 'Entretien & Maison',
    stock: 14,
    minStockAlert: 5,
    buyPrice: 4.80,
    sellPrice: 8.50,
    unit: 'bidon',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-10',
    name: 'Papier Toilette Confort x12',
    barcode: '3133200052010',
    category: 'Entretien & Maison',
    stock: 26,
    minStockAlert: 8,
    buyPrice: 3.10,
    sellPrice: 5.40,
    unit: 'paquet',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-11',
    name: 'Sac Shopping Réutilisable Tissé',
    barcode: '2000000000115',
    category: 'Accessoires & Divers',
    stock: 80,
    minStockAlert: 20,
    buyPrice: 0.40,
    sellPrice: 1.00,
    unit: 'pièce',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-12',
    name: 'Chocolat Noir Pâtissier 200g',
    barcode: '7622210001019',
    category: 'Épicerie Sucrée & Salée',
    stock: 2, // Low stock alert
    minStockAlert: 8,
    buyPrice: 1.30,
    sellPrice: 2.40,
    unit: 'tablette',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-101',
    receiptNumber: 'TC-2026-001',
    date: new Date(Date.now() - 86400000 * 2 + 3600000 * 2).toISOString(),
    items: [
      {
        productId: 'prod-1',
        productName: 'Pack Eau Minérale 6x1.5L',
        barcode: '3274080005003',
        quantity: 2,
        buyPrice: 2.10,
        unitPrice: 3.50,
        totalPrice: 7.00,
        margin: 2.80,
      },
      {
        productId: 'prod-5',
        productName: 'Pâtes Penne Rigate 500g',
        barcode: '8076809513753',
        quantity: 3,
        buyPrice: 0.75,
        unitPrice: 1.40,
        totalPrice: 4.20,
        margin: 1.95,
      },
    ],
    subtotal: 11.20,
    discountAmount: 0,
    discountPercent: 0,
    taxAmount: 0,
    taxRate: 0,
    total: 11.20,
    totalCost: 6.45,
    grossProfit: 4.75,
    paymentMethod: 'especes',
    amountReceived: 20.00,
    changeGiven: 8.80,
    cashierName: 'Caisse Principale',
    status: 'completed',
  },
  {
    id: 'sale-102',
    receiptNumber: 'TC-2026-002',
    date: new Date(Date.now() - 86400000 + 3600000 * 5).toISOString(),
    items: [
      {
        productId: 'prod-4',
        productName: 'Riz Parfumé Jasmin 5kg',
        barcode: '3700142401012',
        quantity: 1,
        buyPrice: 6.50,
        unitPrice: 10.90,
        totalPrice: 10.90,
        margin: 4.40,
      },
      {
        productId: 'prod-3',
        productName: 'Huile de Tournesol 1L',
        barcode: '3155250001018',
        quantity: 2,
        buyPrice: 1.30,
        unitPrice: 2.20,
        totalPrice: 4.40,
        margin: 1.80,
      },
      {
        productId: 'prod-2',
        productName: 'Café Moulu Pur Arabica 250g',
        barcode: '3017620422003',
        quantity: 1,
        buyPrice: 2.40,
        unitPrice: 4.20,
        totalPrice: 4.20,
        margin: 1.80,
      },
    ],
    subtotal: 19.50,
    discountAmount: 1.00,
    discountPercent: 5.1,
    taxAmount: 0,
    taxRate: 0,
    total: 18.50,
    totalCost: 11.50,
    grossProfit: 7.00,
    paymentMethod: 'carte',
    amountReceived: 18.50,
    changeGiven: 0,
    customerName: 'Mme Traoré',
    cashierName: 'Caisse Principale',
    status: 'completed',
  },
  {
    id: 'sale-103',
    receiptNumber: 'TC-2026-003',
    date: new Date(Date.now() - 3600000 * 3).toISOString(),
    items: [
      {
        productId: 'prod-9',
        productName: 'Lessive Liquide Concentrée 2L',
        barcode: '3014260020109',
        quantity: 1,
        buyPrice: 4.80,
        unitPrice: 8.50,
        totalPrice: 8.50,
        margin: 3.70,
      },
      {
        productId: 'prod-7',
        productName: 'Gel Douche Hydratant 400ml',
        barcode: '3600523000124',
        quantity: 2,
        buyPrice: 1.80,
        unitPrice: 3.20,
        totalPrice: 6.40,
        margin: 2.80,
      },
    ],
    subtotal: 14.90,
    discountAmount: 0,
    discountPercent: 0,
    taxAmount: 0,
    taxRate: 0,
    total: 14.90,
    totalCost: 8.40,
    grossProfit: 6.50,
    paymentMethod: 'wave',
    amountReceived: 14.90,
    changeGiven: 0,
    cashierName: 'Caisse Principale',
    status: 'completed',
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    title: 'Facture d\'électricité magasin',
    amount: 85.00,
    category: 'Électricité & Eau',
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    paymentMethod: 'virement',
    beneficiary: 'Compagnie Électrique',
    notes: 'Consommation mensuelle éclairage et réfrigérateurs',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'exp-2',
    title: 'Rouleaux papier thermique pour caisse',
    amount: 18.50,
    category: 'Fournitures de bureau & Emballages',
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    paymentMethod: 'especes',
    beneficiary: 'Papeterie Centrale',
    notes: 'Lot de 20 rouleaux 80mm',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'exp-3',
    title: 'Frais de transport réassort stock',
    amount: 25.00,
    category: 'Transport & Carburant',
    date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    paymentMethod: 'especes',
    beneficiary: 'Livreur Express',
    notes: 'Livraison palettes boissons',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 86400000 * 15).toISOString(),
    action: 'produit_cree',
    category: 'PRODUIT',
    description: 'Initialisation du catalogue de produits',
    author: 'Gérant',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 2).toISOString(),
    action: 'vente_creee',
    category: 'VENTE',
    description: 'Vente #TC-2026-001 enregistrée (2 articles, total: 11.20)',
    author: 'Caisse Principale',
    entityId: 'sale-101',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 3).toISOString(),
    action: 'depense_creee',
    category: 'DÉPENSE',
    description: 'Dépense enregistrée : Rouleaux papier thermique (18.50)',
    author: 'Gérant',
    entityId: 'exp-2',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 86400000 + 3600000 * 5).toISOString(),
    action: 'vente_creee',
    category: 'VENTE',
    description: 'Vente #TC-2026-002 enregistrée (4 articles, total: 18.50, remise: 1.00)',
    author: 'Caisse Principale',
    entityId: 'sale-102',
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    action: 'vente_creee',
    category: 'VENTE',
    description: 'Vente #TC-2026-003 enregistrée (3 articles, total: 14.90)',
    author: 'Caisse Principale',
    entityId: 'sale-103',
  },
];

// LocalStorage helpers with type safety
export function getStoredSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: StoreSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function getStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export function saveStoredCategories(categories: Category[]): void {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

export function getStoredSales(): Sale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
      return INITIAL_SALES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SALES;
  }
}

export function saveStoredSales(sales: Sale[]): void {
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
}

export function getStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXPENSES;
  }
}

export function saveStoredExpenses(expenses: Expense[]): void {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

export function getStoredExpenseCategories(): ExpenseCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSE_CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(INITIAL_EXPENSE_CATEGORIES));
      return INITIAL_EXPENSE_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXPENSE_CATEGORIES;
  }
}

export function saveStoredExpenseCategories(cats: ExpenseCategory[]): void {
  localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(cats));
}

export function getStoredAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function saveStoredAuditLogs(logs: AuditLog[]): void {
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
}

/**
 * Append an entry to the tamper-evident audit trail
 */
export function logAuditEvent(
  action: AuditLog['action'],
  category: AuditLog['category'],
  description: string,
  author: string = 'Utilisateur',
  entityId?: string,
  oldValue?: string,
  newValue?: string
): void {
  const currentLogs = getStoredAuditLogs();
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    action,
    category,
    description,
    author,
    entityId,
    oldValue,
    newValue,
  };
  const updated = [newLog, ...currentLogs];
  saveStoredAuditLogs(updated);
}

/**
 * Generate next sequential receipt number
 */
export function getNextReceiptNumber(existingSales: Sale[]): string {
  const year = new Date().getFullYear();
  const count = existingSales.length + 1;
  const padded = count.toString().padStart(4, '0');
  return `TC-${year}-${padded}`;
}

/**
 * Full Offline Database Backup Export
 */
export function exportFullBackup(): string {
  const backup = {
    app: 'GESTOCK',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    settings: getStoredSettings(),
    products: getStoredProducts(),
    categories: getStoredCategories(),
    sales: getStoredSales(),
    expenses: getStoredExpenses(),
    expenseCategories: getStoredExpenseCategories(),
    auditLogs: getStoredAuditLogs(),
  };
  return JSON.stringify(backup, null, 2);
}

/**
 * Restore Full Offline Database from JSON
 */
export function restoreFullBackup(jsonContent: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!parsed || (!parsed.products && !parsed.sales)) {
      return { success: false, message: 'Le fichier ne correspond pas au format de sauvegarde GESTOCK valide.' };
    }

    if (parsed.settings) saveStoredSettings(parsed.settings);
    if (parsed.products) saveStoredProducts(parsed.products);
    if (parsed.categories) saveStoredCategories(parsed.categories);
    if (parsed.sales) saveStoredSales(parsed.sales);
    if (parsed.expenses) saveStoredExpenses(parsed.expenses);
    if (parsed.expenseCategories) saveStoredExpenseCategories(parsed.expenseCategories);
    if (parsed.auditLogs) saveStoredAuditLogs(parsed.auditLogs);

    logAuditEvent(
      'sauvegarde_restauree',
      'SYSTÈME',
      `Sauvegarde restaurée avec succès (${parsed.products?.length || 0} produits, ${parsed.sales?.length || 0} ventes)`,
      'Superviseur'
    );

    return { success: true, message: 'Sauvegarde restaurée avec succès !' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
    return { success: false, message: `Erreur lors de la lecture du fichier : ${errorMsg}` };
  }
}

/**
 * Reset all data to empty or initial
 */
export function resetAllData(restoreDemo: boolean = false): void {
  if (restoreDemo) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(INITIAL_EXPENSE_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  } else {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(INITIAL_EXPENSE_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    logAuditEvent('donnees_reinitialisees', 'SYSTÈME', 'Base de données réinitialisée à zéro', 'Superviseur');
  }
}

/**
 * Export products to CSV string (Excel compatible with UTF-8 BOM)
 */
export function exportProductsToCSV(products: Product[]): string {
  const headers = ['ID', 'Nom', 'Code-barres', 'Catégorie', 'Stock', 'Seuil Alerte', 'Prix Achat', 'Prix Vente', 'Unité'];
  const rows = products.map(p => [
    `"${p.id}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.barcode}"`,
    `"${p.category}"`,
    p.stock,
    p.minStockAlert,
    p.buyPrice,
    p.sellPrice,
    `"${p.unit || ''}"`,
  ]);
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  return csvContent;
}

/**
 * Export sales to CSV string
 */
export function exportSalesToCSV(sales: Sale[]): string {
  const headers = ['N° Ticket', 'Date', 'Nombre Articles', 'Sous-total', 'Remise', 'Total', 'Moyen Paiement', 'Bénéfice Brut', 'Statut'];
  const rows = sales.map(s => [
    `"${s.receiptNumber}"`,
    `"${new Date(s.date).toLocaleString('fr-FR')}"`,
    s.items.reduce((sum, item) => sum + item.quantity, 0),
    s.subtotal.toFixed(2),
    s.discountAmount.toFixed(2),
    s.total.toFixed(2),
    `"${s.paymentMethod}"`,
    s.grossProfit.toFixed(2),
    `"${s.status}"`,
  ]);
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  return csvContent;
}

/**
 * Export expenses to CSV string
 */
export function exportExpensesToCSV(expenses: Expense[]): string {
  const headers = ['ID', 'Date', 'Titre', 'Catégorie', 'Montant', 'Moyen Paiement', 'Bénéficiaire', 'Notes'];
  const rows = expenses.map(e => [
    `"${e.id}"`,
    `"${e.date}"`,
    `"${e.title.replace(/"/g, '""')}"`,
    `"${e.category}"`,
    e.amount.toFixed(2),
    `"${e.paymentMethod}"`,
    `"${(e.beneficiary || '').replace(/"/g, '""')}"`,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ]);
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  return csvContent;
}

/**
 * Helper to download text as file
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
