/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  ArrowDownRight,
  AlertTriangle,
  Award,
  PieChart,
  Percent,
  Calendar,
  Package,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Sale, Expense, Product, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/format';

interface DashboardViewProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  settings: StoreSettings;
  onNavigateToStock: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sales,
  expenses,
  products,
  settings,
  onNavigateToStock,
}) => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | '7days' | 'month' | 'year' | 'all'>('month');

  // Filter sales and expenses by period
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const sevenDaysAgoDate = new Date(now);
  sevenDaysAgoDate.setDate(now.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().split('T')[0];

  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentYearStr = `${now.getFullYear()}`;

  const filterByDate = (dateIso: string) => {
    const dStr = dateIso.split('T')[0];
    if (period === 'today') return dStr === todayStr;
    if (period === 'yesterday') return dStr === yesterdayStr;
    if (period === '7days') return dStr >= sevenDaysAgoStr;
    if (period === 'month') return dStr.startsWith(currentMonthStr);
    if (period === 'year') return dStr.startsWith(currentYearStr);
    return true; // all
  };

  const periodSales = sales.filter((s) => s.status === 'completed' && filterByDate(s.date));
  const periodExpenses = expenses.filter((e) => filterByDate(e.date));

  // High-level financial KPIs
  const totalRevenue = periodSales.reduce((acc, s) => acc + s.total, 0);
  const totalCostOfGoodsSold = periodSales.reduce((acc, s) => acc + s.totalCost, 0);
  const grossProfit = totalRevenue - totalCostOfGoodsSold;
  const totalExpenses = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const salesCount = periodSales.length;
  const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0;
  const grossMarginRate = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';
  const totalDiscounts = periodSales.reduce((acc, s) => acc + s.discountAmount, 0);

  // Top 5 Best Sellers
  const productSalesMap: Record<string, { product: Product; quantity: number; revenue: number }> = {};
  periodSales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        const prod = products.find((p) => p.id === item.productId) || {
          id: item.productId,
          name: item.productName,
          barcode: item.barcode,
          category: 'Autre',
          stock: 0,
          minStockAlert: 0,
          buyPrice: item.buyPrice,
          sellPrice: item.unitPrice,
          createdAt: '',
          updatedAt: '',
        };
        productSalesMap[item.productId] = { product: prod, quantity: 0, revenue: 0 };
      }
      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].revenue += item.totalPrice;
    });
  });

  const bestSellers = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Low stock products alert list
  const lowStockProducts = products.filter((p) => p.stock <= p.minStockAlert);

  // Expense breakdown by category
  const expenseByCategoryMap: Record<string, number> = {};
  periodExpenses.forEach((exp) => {
    expenseByCategoryMap[exp.category] = (expenseByCategoryMap[exp.category] || 0) + exp.amount;
  });
  const expenseBreakdown = Object.entries(expenseByCategoryMap)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      percentage: totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.amount - a.amount);

  // 7-Day Revenue Trend (daily aggregation)
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    const dayRevenue = sales
      .filter((s) => s.status === 'completed' && s.date.split('T')[0] === dayStr)
      .reduce((sum, s) => sum + s.total, 0);
    return { dayLabel, dayRevenue };
  });

  const maxRevenue = Math.max(...last7DaysData.map((d) => d.dayRevenue), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header & Period Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tableau de Bord & Rentabilité
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Indicateurs en temps réel, marges, analyse des ventes et santé financière de votre commerce.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-xs">
          {[
            { id: 'today', label: "Aujourd'hui" },
            { id: 'yesterday', label: 'Hier' },
            { id: '7days', label: '7 jours' },
            { id: 'month', label: 'Ce mois' },
            { id: 'year', label: 'Année' },
            { id: 'all', label: 'Tout' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as typeof period)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                period === item.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Grid (6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Chiffre d'Affaires */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Chiffre d'Affaires
          </span>
          <div>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatCurrency(totalRevenue, settings)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {salesCount} vente{salesCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Bénéfice Brut */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Bénéfice Brut (Marge)
          </span>
          <div>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              +{formatCurrency(grossProfit, settings)}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
              Taux marge: {grossMarginRate}%
            </span>
          </div>
        </div>

        {/* Dépenses Totales */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Dépenses & Frais
          </span>
          <div>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
              -{formatCurrency(totalExpenses, settings)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {periodExpenses.length} dépense{periodExpenses.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* BÉNÉFICE NET RÉEL */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
            Bénéfice Net Réel
          </span>
          <div>
            <span
              className={`text-xl font-black font-mono tracking-tight ${
                netProfit >= 0
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(netProfit, settings)}
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-0.5 font-medium">
              (Brut - Dépenses)
            </span>
          </div>
        </div>

        {/* Panier Moyen */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Panier Moyen
          </span>
          <div>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatCurrency(averageTicket, settings)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Par passage en caisse
            </span>
          </div>
        </div>

        {/* Remises accordées */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Remises Accordées
          </span>
          <div>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
              {formatCurrency(totalDiscounts, settings)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Réductions clients
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Revenue Trend Chart (SVG) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Activité des 7 derniers jours
            </h3>
            <p className="text-xs text-slate-500">
              Progression quotidienne du chiffre d'affaires
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            Max: {formatCurrency(maxRevenue, settings)}
          </span>
        </div>

        {/* Bar chart visualization */}
        <div className="grid grid-cols-7 gap-2 items-end h-36 pt-4">
          {last7DaysData.map((d, idx) => {
            const heightPercent = Math.max(8, (d.dayRevenue / maxRevenue) * 100);
            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] font-mono text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {formatCurrency(d.dayRevenue, settings)}
                </span>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-full flex items-end p-1">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-emerald-500 group-hover:bg-emerald-600 rounded-md transition-all duration-300"
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-2 truncate w-full text-center">
                  {d.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Columns Grid: Best Sellers + Expense Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Pratique 1: 🏆 Meilleures Ventes */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Meilleures Ventes (Top 5)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Période active
              </span>
            </div>

            {bestSellers.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Aucune vente enregistrée sur cette période.
              </p>
            ) : (
              <div className="space-y-3">
                {bestSellers.map((item, idx) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-mono font-bold text-[10px] text-slate-700 dark:text-slate-200 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {item.quantity} vendus · Stock restant : {item.product.stock}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                      {formatCurrency(item.revenue, settings)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zone Pratique 2: 💸 Détails des Dépenses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Répartition des Dépenses
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-rose-600">
                Total: {formatCurrency(totalExpenses, settings)}
              </span>
            </div>

            {expenseBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Aucune dépense enregistrée sur cette période.
              </p>
            ) : (
              <div className="space-y-3">
                {expenseBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount, settings)} ({item.percentage}%)
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className="h-full bg-rose-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zone Pratique 3: ⚠️ Produits en Stock Faible */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Alerte Stock Faible ({lowStockProducts.length} article{lowStockProducts.length > 1 ? 's' : ''} à réapprovisionner)
              </h3>
            </div>
            <button
              onClick={onNavigateToStock}
              className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1"
            >
              <span>Accéder au Stock</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {lowStockProducts.slice(0, 8).map((prod) => (
              <div
                key={prod.id}
                className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs flex justify-between items-center"
              >
                <div className="truncate mr-2">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {prod.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Seuil: {prod.minStockAlert}
                  </p>
                </div>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 shrink-0">
                  {prod.stock} restants
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
