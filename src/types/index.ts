/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  stock: number;
  minStockAlert: number;
  buyPrice: number;    // Prix d'achat
  sellPrice: number;   // Prix de vente
  unit?: string;       // pcs, kg, litre, boîte, etc.
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
  discountPercent?: number;
}

export type PaymentMethodType = 'especes' | 'carte' | 'wave' | 'orange_money' | 'mtn_momo' | 'virement' | 'cheque' | 'credit';

export interface PaymentMethodConfig {
  id: PaymentMethodType;
  label: string;
  enabled: boolean;
  iconName: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  buyPrice: number;
  unitPrice: number;
  totalPrice: number;
  margin: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  totalCost: number;     // Coût d'achat total
  grossProfit: number;   // Bénéfice brut
  paymentMethod: PaymentMethodType;
  amountReceived: number;
  changeGiven: number;
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  status: 'completed' | 'refunded' | 'cancelled';
  notes?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: PaymentMethodType;
  beneficiary?: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export type ActionType = 
  | 'vente_creee'
  | 'vente_remboursee'
  | 'stock_ajoute'
  | 'stock_reduit'
  | 'produit_cree'
  | 'produit_modifie'
  | 'produit_supprime'
  | 'depense_creee'
  | 'depense_modifiee'
  | 'depense_supprimee'
  | 'parametre_modifie'
  | 'sauvegarde_restauree'
  | 'donnees_reinitialisees';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: ActionType;
  category: 'VENTE' | 'STOCK' | 'DÉPENSE' | 'PRODUIT' | 'SÉCURITÉ' | 'SYSTÈME';
  description: string;
  author: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
}

export interface StoreSettings {
  storeName: string;
  storeSubtitle: string;
  phone: string;
  address: string;
  city: string;
  email: string;
  taxNumber: string;      // NIF / SIRET / RCCM
  currency: string;       // e.g. "FCFA", "€", "$", "DA", "DH"
  currencyPosition: 'after' | 'before';
  vatRate: number;        // e.g. 18 or 20 (%)
  vatEnabled: boolean;
  receiptHeader: string;
  receiptFooter: string;
  receiptPaperWidth: '80mm' | '58mm';
  autoPrintReceipt: boolean;
  enableSound: boolean;
  pinSecurityEnabled: boolean;
  supervisorPin: string; // 4-digit PIN
  themeColor: 'emerald' | 'blue' | 'indigo' | 'amber' | 'slate' | 'violet';
  darkMode: boolean;
  enabledPaymentMethods: PaymentMethodType[];
}

export type ActiveTab = 'pos' | 'stock' | 'expenses' | 'history' | 'dashboard' | 'settings';
