/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WifiOff, ShoppingCart, Package, ArrowDownRight, History, LayoutDashboard, Settings } from 'lucide-react';
import { ActiveTab, StoreSettings } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  settings: StoreSettings;
  cartCount: number;
  lowStockCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  settings,
  cartCount,
  lowStockCount,
}) => {
  const navTabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'pos', label: 'Caisse', icon: <ShoppingCart className="w-4 h-4" />, badge: cartCount > 0 ? cartCount : undefined },
    { id: 'stock', label: 'Stock', icon: <Package className="w-4 h-4" />, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'expenses', label: 'Dépenses', icon: <ArrowDownRight className="w-4 h-4" /> },
    { id: 'history', label: 'Historique', icon: <History className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm tracking-tighter shadow-xs">
            GS
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            GESTOCK
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 no-scrollbar">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-0.5 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      tab.id === 'stock'
                        ? 'bg-amber-500 text-white'
                        : isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action / status */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            title="Application 100% hors-ligne. Toutes vos données restent stockées en local sur cet appareil."
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg whitespace-nowrap cursor-default border border-slate-200/60 dark:border-slate-700/60"
          >
            <WifiOff className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden lg:inline text-[11px]">100% Hors-Ligne</span>
          </div>
        </div>
      </div>
    </header>
  );
};
