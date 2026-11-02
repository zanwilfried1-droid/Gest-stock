/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Printer,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Check,
  X,
  FileSpreadsheet,
  Boxes,
  Barcode as BarcodeIcon
} from 'lucide-react';
import { Product, Category, StoreSettings, Sale } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { generateRandomBarcode } from '../../utils/barcode';
import {
  exportProductsToCSV,
  triggerFileDownload,
  logAuditEvent
} from '../../utils/storage';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { BarcodePrintModal } from './BarcodePrintModal';
import { PINModal } from '../common/PINModal';

interface StockViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  sales: Sale[];
  settings: StoreSettings;
}

export const StockView: React.FC<StockViewProps> = ({
  products,
  setProducts,
  categories,
  setCategories,
  sales,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales_movement'>('inventory');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isStockAdjustModalOpen, setIsStockAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Réapprovisionnement fournisseur');

  const [isBarcodePrintModalOpen, setIsBarcodePrintModalOpen] = useState(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Product | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // PIN security for deletions
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Form state for Add/Edit product
  const [formName, setFormName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStock, setFormStock] = useState<number>(0);
  const [formMinAlert, setFormMinAlert] = useState<number>(5);
  const [formBuyPrice, setFormBuyPrice] = useState<number>(0);
  const [formSellPrice, setFormSellPrice] = useState<number>(0);
  const [formUnit, setFormUnit] = useState<string>('pièce');

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.barcode.includes(query) ||
      (p.category && p.category.toLowerCase().includes(query));

    let matchesStock = true;
    if (stockFilter === 'low') matchesStock = p.stock > 0 && p.stock <= p.minStockAlert;
    if (stockFilter === 'out') matchesStock = p.stock <= 0;

    return matchesCat && matchesQuery && matchesStock;
  });

  // KPI calculations
  const totalStockItems = products.reduce((sum, p) => sum + p.stock, 0);
  const totalStockBuyValue = products.reduce((sum, p) => sum + p.buyPrice * p.stock, 0);
  const totalStockSellValue = products.reduce((sum, p) => sum + p.sellPrice * p.stock, 0);
  const potentialGrossMargin = totalStockSellValue - totalStockBuyValue;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  // Open Add Product Modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBarcode(generateRandomBarcode());
    setFormCategory(categories[0]?.name || 'Général');
    setFormStock(10);
    setFormMinAlert(5);
    setFormBuyPrice(0);
    setFormSellPrice(0);
    setFormUnit('pièce');
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormBarcode(prod.barcode);
    setFormCategory(prod.category);
    setFormStock(prod.stock);
    setFormMinAlert(prod.minStockAlert);
    setFormBuyPrice(prod.buyPrice);
    setFormSellPrice(prod.sellPrice);
    setFormUnit(prod.unit || 'pièce');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBarcode.trim()) return;

    if (editingProduct) {
      // Update
      const updatedList = products.map((p) => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: formName.trim(),
            barcode: formBarcode.trim(),
            category: formCategory,
            stock: formStock,
            minStockAlert: formMinAlert,
            buyPrice: formBuyPrice,
            sellPrice: formSellPrice,
            unit: formUnit,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      setProducts(updatedList);
      logAuditEvent(
        'produit_modifie',
        'PRODUIT',
        `Article "${formName}" modifié (Prix: ${formatCurrency(formSellPrice, settings)}, Stock: ${formStock})`,
        'Gérant',
        editingProduct.id
      );
    } else {
      // Create new
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: formName.trim(),
        barcode: formBarcode.trim(),
        category: formCategory,
        stock: formStock,
        minStockAlert: formMinAlert,
        buyPrice: formBuyPrice,
        sellPrice: formSellPrice,
        unit: formUnit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProducts([newProd, ...products]);
      logAuditEvent(
        'produit_cree',
        'PRODUIT',
        `Nouvel article créé "${newProd.name}" (Code: ${newProd.barcode})`,
        'Gérant',
        newProd.id
      );
    }

    setIsProductModalOpen(false);
  };

  // Stock Adjustment (Add / Reduce)
  const handleOpenStockAdjust = (prod: Product, type: 'add' | 'remove') => {
    setAdjustingProduct(prod);
    setAdjustType(type);
    setAdjustQuantity(type === 'add' ? 10 : 1);
    setAdjustReason(type === 'add' ? 'Réapprovisionnement fournisseur' : 'Casse / Dépréciation');
    setIsStockAdjustModalOpen(true);
  };

  const handleSaveStockAdjust = () => {
    if (!adjustingProduct || adjustQuantity <= 0) return;

    const newStock =
      adjustType === 'add'
        ? adjustingProduct.stock + adjustQuantity
        : Math.max(0, adjustingProduct.stock - adjustQuantity);

    const updatedList = products.map((p) => {
      if (p.id === adjustingProduct.id) {
        return {
          ...p,
          stock: newStock,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setProducts(updatedList);

    logAuditEvent(
      adjustType === 'add' ? 'stock_ajoute' : 'stock_reduit',
      'STOCK',
      `${adjustType === 'add' ? '+' : '-'}${adjustQuantity} ${adjustingProduct.unit || 'pcs'} sur "${adjustingProduct.name}" (Nouveau stock: ${newStock}) - Motif: ${adjustReason}`,
      'Gérant',
      adjustingProduct.id
    );

    setIsStockAdjustModalOpen(false);
  };

  // Delete product with PIN if enabled
  const handleDeleteProductPrompt = (id: string) => {
    if (settings.pinSecurityEnabled) {
      setPendingDeleteId(id);
      setIsPinModalOpen(true);
    } else {
      if (confirm('Voulez-vous vraiment supprimer cet article définitivement ?')) {
        executeDeleteProduct(id);
      }
    }
  };

  const executeDeleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (prod) {
      logAuditEvent(
        'produit_supprime',
        'PRODUIT',
        `Article supprimé: "${prod.name}" (Code: ${prod.barcode})`,
        'Superviseur',
        id
      );
    }
    setPendingDeleteId(null);
  };

  // Categories management
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
    };
    setCategories([...categories, newCat]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  // Export CSV
  const handleExportCSV = () => {
    const csv = exportProductsToCSV(products);
    triggerFileDownload(csv, `gestock_inventaire_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
  };

  // Calculate Product Sales Movements
  const getProductSalesStats = (prodId: string) => {
    let soldQty = 0;
    let totalRevenue = 0;
    sales.forEach((s) => {
      s.items.forEach((it) => {
        if (it.productId === prodId) {
          soldQty += it.quantity;
          totalRevenue += it.totalPrice;
        }
      });
    });
    return { soldQty, totalRevenue };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gestion du Stock & Inventaire
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des quantités, réapprovisionnements, codes-barres et valorisation du stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exporter Excel / CSV</span>
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span>Gérer Catégories</span>
          </button>

          <button
            onClick={handleOpenAddProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Produit</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Articles au catalogue
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
              {products.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {totalStockItems} unités
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Valeur du stock (Achat)
          </span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatCurrency(totalStockBuyValue, settings)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Valeur vente estimée
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(totalStockSellValue, settings)}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">
              +{formatCurrency(potentialGrossMargin, settings)} marge
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Alertes de stock
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
              className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors ${
                stockFilter === 'low'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
              }`}
            >
              ⚠️ {lowStockCount} faibles
            </button>
            <button
              onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
              className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors ${
                stockFilter === 'out'
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
              }`}
            >
              🚫 {outOfStockCount} épuisés
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Stock Catalog vs Espace Ventes */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'inventory'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Inventaire & Produits
          </button>
          <button
            onClick={() => setActiveTab('sales_movement')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'sales_movement'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Espace Ventes & Rotations</span>
          </button>
        </div>

        {/* Quick stock state toggle */}
        {stockFilter !== 'all' && (
          <button
            onClick={() => setStockFilter('all')}
            className="text-xs text-slate-500 hover:text-slate-800 underline flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Réinitialiser filtre stock
          </button>
        )}
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher produit, code-barres..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Toutes catégories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.name
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Produit & Code-barres</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4 text-center">Stock actuel</th>
                {activeTab === 'inventory' ? (
                  <>
                    <th className="py-3 px-4 text-right">Prix d'Achat</th>
                    <th className="py-3 px-4 text-right">Prix de Vente</th>
                    <th className="py-3 px-4 text-right">Marge unitaire</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4 text-center">Quantité Vendue</th>
                    <th className="py-3 px-4 text-right">Chiffre d'Affaires</th>
                    <th className="py-3 px-4 text-center">Rotation</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Aucun article ne correspond aux critères de filtre.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const margin = prod.sellPrice - prod.buyPrice;
                  const marginPercent = prod.buyPrice > 0 ? ((margin / prod.buyPrice) * 100).toFixed(0) : '100';
                  const isLow = prod.stock > 0 && prod.stock <= prod.minStockAlert;
                  const isOut = prod.stock <= 0;
                  const stats = getProductSalesStats(prod.id);

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Product Name & Barcode */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {prod.name}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px] mt-0.5">
                          <span>{prod.barcode}</span>
                          <span>·</span>
                          <span>{prod.unit || 'pièce'}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {prod.category}
                      </td>

                      {/* Stock Level with alert indicator */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold text-sm px-2 py-0.5 rounded-md ${
                              isOut
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                : isLow
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {prod.stock}
                          </span>
                        </div>
                        {isLow && (
                          <div className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                            Seuil min: {prod.minStockAlert}
                          </div>
                        )}
                        {isOut && (
                          <div className="text-[9px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                            Rupture
                          </div>
                        )}
                      </td>

                      {activeTab === 'inventory' ? (
                        <>
                          {/* Buy Price */}
                          <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                            {formatCurrency(prod.buyPrice, settings)}
                          </td>

                          {/* Sell Price */}
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(prod.sellPrice, settings)}
                          </td>

                          {/* Unit Margin */}
                          <td className="py-3 px-4 text-right font-mono">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              +{formatCurrency(margin, settings)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({marginPercent}%)
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Add stock */}
                              <button
                                onClick={() => handleOpenStockAdjust(prod, 'add')}
                                title="Ajouter du stock (+)"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>

                              {/* Reduce stock */}
                              <button
                                onClick={() => handleOpenStockAdjust(prod, 'remove')}
                                title="Réduire du stock (perte/casse)"
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                              >
                                <ArrowDownRight className="w-4 h-4" />
                              </button>

                              {/* Print Barcode Label */}
                              <button
                                onClick={() => {
                                  setSelectedBarcodeProduct(prod);
                                  setIsBarcodePrintModalOpen(true);
                                }}
                                title="Imprimer étiquette code-barres"
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Edit product */}
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                title="Modifier le produit"
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Delete product */}
                              <button
                                onClick={() => handleDeleteProductPrompt(prod.id)}
                                title="Supprimer le produit"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Sold quantity */}
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                            {stats.soldQty}
                          </td>

                          {/* Total revenue for this product */}
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            {formatCurrency(stats.totalRevenue, settings)}
                          </td>

                          {/* Velocity status */}
                          <td className="py-3 px-4 text-center">
                            {stats.soldQty > 10 ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Forte vente
                              </span>
                            ) : stats.soldQty > 0 ? (
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                Régulière
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                Pas encore vendu
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenStockAdjust(prod, 'add')}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                            >
                              Réapprovisionner
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit Product */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Riz Parfumé 5kg, Savon Liquide 500ml..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Code-barres / Référence *
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormBarcode(generateRandomBarcode())}
                      className="text-[10px] text-emerald-600 hover:underline"
                    >
                      Générer auto
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="EAN-13 ou code perso"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Prix d'Achat ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formBuyPrice || ''}
                    onChange={(e) => setFormBuyPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Prix de Vente * ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formSellPrice || ''}
                    onChange={(e) => setFormSellPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Unité de vente
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="pièce, kg, boîte..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Stock and Alert Levels */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Quantité en stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Seuil alerte stock faible
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinAlert}
                    onChange={(e) => setFormMinAlert(parseInt(e.target.value, 10) || 5)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Barcode preview */}
              {formBarcode && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 block mb-1">
                    Aperçu Code-Barres
                  </span>
                  <BarcodeSvg value={formBarcode} height={36} showText={true} />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  {editingProduct ? 'Enregistrer les modifications' : 'Créer le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Stock (Add / Reduce) */}
      {isStockAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {adjustType === 'add' ? 'Ajouter du stock' : 'Réduire le stock'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {adjustingProduct.name} (Stock actuel: {adjustingProduct.stock})
                </p>
              </div>
              <button
                onClick={() => setIsStockAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantité à {adjustType === 'add' ? 'ajouter' : 'déduire'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-base font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Motif de l'opération
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {adjustType === 'add' ? (
                    <>
                      <option value="Réapprovisionnement fournisseur">Réapprovisionnement fournisseur</option>
                      <option value="Retour client">Retour client</option>
                      <option value="Correction inventaire (+)">Correction inventaire (+)</option>
                      <option value="Autre réassort">Autre réassort</option>
                    </>
                  ) : (
                    <>
                      <option value="Casse / Dépréciation">Casse / Dépréciation</option>
                      <option value="Péremption">Péremption</option>
                      <option value="Vol / Perte">Vol / Perte</option>
                      <option value="Correction inventaire (-)">Correction inventaire (-)</option>
                      <option value="Consommation interne">Consommation interne</option>
                    </>
                  )}
                </select>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center font-mono">
                <span className="text-slate-500">Nouveau stock après validation :</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {adjustType === 'add'
                    ? adjustingProduct.stock + adjustQuantity
                    : Math.max(0, adjustingProduct.stock - adjustQuantity)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStockAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveStockAdjust}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs ${
                    adjustType === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Confirmer l'opération
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Category Manager */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Gérer les catégories
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add new category */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nouvelle catégorie..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl"
              >
                Ajouter
              </button>
            </div>

            {/* Existing Categories List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const productCount = products.filter((p) => p.category === cat.name).length;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">
                        ({productCount} article{productCount > 1 ? 's' : ''})
                      </span>
                    </div>
                    {productCount === 0 && (
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Print Modal */}
      <BarcodePrintModal
        isOpen={isBarcodePrintModalOpen}
        onClose={() => setIsBarcodePrintModalOpen(false)}
        product={selectedBarcodeProduct}
        settings={settings}
      />

      {/* PIN Modal for supervisor-secured deletion */}
      <PINModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingDeleteId(null);
        }}
        onSuccess={() => {
          setIsPinModalOpen(false);
          if (pendingDeleteId) executeDeleteProduct(pendingDeleteId);
        }}
        expectedPin={settings.supervisorPin}
        title="Code PIN requis"
        description="La suppression d'un article du stock nécessite l'autorisation superviseur."
      />
    </div>
  );
};
