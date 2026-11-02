/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Product,
  Category,
  Sale,
  Expense,
  ExpenseCategory,
  AuditLog,
  StoreSettings,
  ActiveTab,
  CartItem
} from './types';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredProducts,
  saveStoredProducts,
  getStoredCategories,
  saveStoredCategories,
  getStoredSales,
  saveStoredSales,
  getStoredExpenses,
  saveStoredExpenses,
  getStoredExpenseCategories,
  saveStoredExpenseCategories,
  getStoredAuditLogs,
  saveStoredAuditLogs
} from './utils/storage';
import { Header } from './components/Header';
import { POSView } from './components/pos/POSView';
import { StockView } from './components/stock/StockView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { HistoryView } from './components/history/HistoryView';
import { DashboardView } from './components/dashboard/DashboardView';
import { SettingsView } from './components/settings/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');

  // Core persistent state
  const [settings, setSettings] = useState<StoreSettings>(() => getStoredSettings());
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [sales, setSales] = useState<Sale[]>(() => getStoredSales());
  const [expenses, setExpenses] = useState<Expense[]>(() => getStoredExpenses());
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() => getStoredExpenseCategories());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStoredAuditLogs());

  // Active cashier cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Sync state to LocalStorage
  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  useEffect(() => {
    saveStoredCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveStoredSales(sales);
  }, [sales]);

  useEffect(() => {
    saveStoredExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    saveStoredExpenseCategories(expenseCategories);
  }, [expenseCategories]);

  useEffect(() => {
    saveStoredAuditLogs(auditLogs);
  }, [auditLogs]);

  // Synchronize dark mode class on document element
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Reload all data from localStorage (e.g., after backup restore)
  const reloadAllData = () => {
    setSettings(getStoredSettings());
    setProducts(getStoredProducts());
    setCategories(getStoredCategories());
    setSales(getStoredSales());
    setExpenses(getStoredExpenses());
    setExpenseCategories(getStoredExpenseCategories());
    setAuditLogs(getStoredAuditLogs());
    setCart([]);
  };

  // Callback when a sale is completed at cashier
  const handleSaleCompleted = (newSale: Sale, updatedProducts: Product[]) => {
    setSales((prev) => [newSale, ...prev]);
    setProducts(updatedProducts);
    setAuditLogs(getStoredAuditLogs());
  };

  // Counts for header badges
  const cartItemCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Bar Header adhering strictly to the Top Bar Contract */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        settings={settings}
        cartCount={cartItemCount}
        lowStockCount={lowStockCount}
      />

      {/* Main Viewport */}
      <main className="flex-1 pb-16">
        {activeTab === 'pos' && (
          <POSView
            products={products}
            categories={categories}
            sales={sales}
            settings={settings}
            cart={cart}
            setCart={setCart}
            onSaleCompleted={handleSaleCompleted}
          />
        )}

        {activeTab === 'stock' && (
          <StockView
            products={products}
            setProducts={setProducts}
            categories={categories}
            setCategories={setCategories}
            sales={sales}
            settings={settings}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            setExpenses={setExpenses}
            expenseCategories={expenseCategories}
            setExpenseCategories={setExpenseCategories}
            settings={settings}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            auditLogs={auditLogs}
            sales={sales}
            setSales={setSales}
            products={products}
            setProducts={setProducts}
            settings={settings}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            sales={sales}
            expenses={expenses}
            products={products}
            settings={settings}
            onNavigateToStock={() => setActiveTab('stock')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            setSettings={setSettings}
            onReloadAllData={reloadAllData}
          />
        )}
      </main>

      {/* Quiet Offline Trust Footer */}
      <footer className="no-print border-t border-slate-200/80 dark:border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <span>
            <strong className="text-slate-800 dark:text-slate-200">GESTOCK</strong> — Votre commerce en toute autonomie, même sans internet.
          </span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Aucun abonnement</span>
            <span>·</span>
            <span>Données 100% locales & privées</span>
            <span>·</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Prêt hors-ligne</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
