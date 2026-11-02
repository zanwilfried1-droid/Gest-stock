/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  RotateCcw,
  User,
  Receipt,
  Percent,
  X,
  AlertCircle
} from 'lucide-react';
import { Product, Category, CartItem, Sale, PaymentMethodType, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/format';
import { playScannerBeep, playSuccessChime, playWarningBuzz } from '../../utils/audio';
import { getNextReceiptNumber, logAuditEvent } from '../../utils/storage';
import { ReceiptModal } from './ReceiptModal';

interface POSViewProps {
  products: Product[];
  categories: Category[];
  sales: Sale[];
  settings: StoreSettings;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onSaleCompleted: (newSale: Sale, updatedProducts: Product[]) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  categories,
  sales,
  settings,
  cart,
  setCart,
  onSaleCompleted,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('especes');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter products by query and category
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.barcode.includes(query) ||
      (p.category && p.category.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  // Handle barcode scanner Enter or search direct barcode match
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const exactMatch = products.find(
        (p) => p.barcode.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery('');
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery('');
      }
    }
  };

  const addToCart = (product: Product) => {
    // Check available stock
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const currentInCart = existingIndex > -1 ? cart[existingIndex].quantity : 0;

    if (currentInCart >= product.stock) {
      playWarningBuzz(settings.enableSound);
      return;
    }

    playScannerBeep(settings.enableSound);

    if (existingIndex > -1) {
      const nextCart = [...cart];
      nextCart[existingIndex].quantity += 1;
      setCart(nextCart);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > product.stock) {
              playWarningBuzz(settings.enableSound);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setCustomerName('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.sellPrice * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = settings.vatEnabled ? (taxableAmount * settings.vatRate) / 100 : 0;
  const total = taxableAmount + taxAmount;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Quick cash payment calculation
  const changeGiven = Math.max(0, amountReceived - total);

  const openPaymentModal = () => {
    if (cart.length === 0) return;
    setAmountReceived(total);
    setIsPaymentModalOpen(true);
  };

  const finalizeSale = () => {
    if (cart.length === 0) return;

    const receiptNumber = getNextReceiptNumber(sales);

    // Compute items
    const saleItems = cart.map((item) => {
      const lineTotal = item.product.sellPrice * item.quantity;
      const lineCost = item.product.buyPrice * item.quantity;
      return {
        productId: item.product.id,
        productName: item.product.name,
        barcode: item.product.barcode,
        quantity: item.quantity,
        buyPrice: item.product.buyPrice,
        unitPrice: item.product.sellPrice,
        totalPrice: lineTotal,
        margin: lineTotal - lineCost,
      };
    });

    const totalCost = saleItems.reduce((acc, it) => acc + it.buyPrice * it.quantity, 0);
    const grossProfit = total - totalCost;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      receiptNumber,
      date: new Date().toISOString(),
      items: saleItems,
      subtotal,
      discountAmount,
      discountPercent,
      taxAmount,
      taxRate: settings.vatEnabled ? settings.vatRate : 0,
      total,
      totalCost,
      grossProfit,
      paymentMethod,
      amountReceived: paymentMethod === 'especes' ? amountReceived : total,
      changeGiven: paymentMethod === 'especes' ? changeGiven : 0,
      customerName: customerName.trim() || undefined,
      cashierName: 'Caisse 1',
      status: 'completed',
    };

    // Update stock levels
    const updatedProducts = products.map((prod) => {
      const cartItem = cart.find((item) => item.product.id === prod.id);
      if (cartItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartItem.quantity),
          updatedAt: new Date().toISOString(),
        };
      }
      return prod;
    });

    // Log to audit trail
    logAuditEvent(
      'vente_creee',
      'VENTE',
      `Vente ${receiptNumber} effectuée (${totalItemsCount} articles, Total: ${formatCurrency(total, settings)})`,
      'Caisse 1',
      newSale.id
    );

    // Play chime sound
    playSuccessChime(settings.enableSound);

    // Propagate up
    onSaleCompleted(newSale, updatedProducts);

    // Save for receipt
    setLastCompletedSale(newSale);
    setIsPaymentModalOpen(false);
    clearCart();

    // Auto open receipt or modal
    if (settings.autoPrintReceipt) {
      setIsReceiptModalOpen(true);
    }
  };

  // Quick cash buttons based on total
  const getQuickCashValues = () => {
    const isCFA = settings.currency.toUpperCase().includes('CFA') || settings.currency.toUpperCase().includes('F');
    if (isCFA) {
      const round500 = Math.ceil(total / 500) * 500;
      const round1000 = Math.ceil(total / 1000) * 1000;
      const round5000 = Math.ceil(total / 5000) * 5000;
      return Array.from(new Set([total, round500, round1000, round5000, 10000])).filter((v) => v >= total);
    }
    const round5 = Math.ceil(total / 5) * 5;
    const round10 = Math.ceil(total / 10) * 10;
    const round20 = Math.ceil(total / 20) * 20;
    const round50 = Math.ceil(total / 50) * 50;
    return Array.from(new Set([total, round5, round10, round20, round50])).filter((v) => v >= total);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Banner with Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Caisse Enregistreuse
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sélectionnez les articles ou scannez les codes-barres pour encaisser immédiatement.
          </p>
        </div>

        {lastCompletedSale && (
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dernier ticket (#{lastCompletedSale.receiptNumber})</span>
          </button>
        )}
      </div>

      {/* Main Grid: 7 cols Catalog + 5 cols Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Product Catalog & Search */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search bar & Scan affordance */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Rechercher par nom, référence ou scanner code-barre (Entrée)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => searchInputRef.current?.focus()}
              title="Lecteur de code-barres actif"
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-xs font-medium hover:bg-slate-200 transition-colors shrink-0"
            >
              <Barcode className="w-4 h-4" />
              <span className="hidden sm:inline">Scanner</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              Tous ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat.name).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat.name
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Aucun produit trouvé
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Modifiez votre recherche ou ajoutez un nouvel article dans l'onglet Stock.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
                const inCart = cart.find((i) => i.product.id === product.id)?.quantity || 0;

                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className={`relative text-left p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between h-32 select-none group ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                        <span className="truncate">{product.category}</span>
                        {inCart > 0 && (
                          <span className="shrink-0 font-bold font-mono px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px]">
                            x{inCart}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <div className="flex items-end justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Stock: {product.stock}
                        </span>
                        {isLowStock && (
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">
                            Stock faible
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[9px] text-rose-500 font-medium">
                            Épuisé
                          </span>
                        )}
                      </div>

                      <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(product.sellPrice, settings)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Cart & Checkout (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs sticky top-20 flex flex-col min-h-[580px]">
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Panier en cours
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {totalItemsCount} article{totalItemsCount > 1 ? 's' : ''}
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vider
              </button>
            )}
          </div>

          {/* Optional Customer Name */}
          <div className="py-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nom du client (facultatif)"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 max-h-[290px] pr-1">
            {cart.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                  <Receipt className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Le panier est vide
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">
                  Cliquez sur un article à gauche pour l'ajouter à la commande.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {formatCurrency(item.product.sellPrice, settings)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 active:scale-95"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-500 ml-1 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Total Line */}
                  <div className="text-right shrink-0 min-w-[65px]">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.product.sellPrice * item.quantity, settings)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Totals & Checkout Button */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 mt-auto">
            {/* Quick Discount Trigger */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-slate-400" />
                Remise client :
              </span>
              <div className="flex items-center gap-1">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPercent(pct)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors ${
                      discountPercent === pct
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {pct === 0 ? '0%' : `-${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span>Sous-total :</span>
              <span className="font-mono">{formatCurrency(subtotal, settings)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400 font-medium">
                <span>Remise ({discountPercent}%) :</span>
                <span className="font-mono">-{formatCurrency(discountAmount, settings)}</span>
              </div>
            )}

            {settings.vatEnabled && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>TVA ({settings.vatRate}%) :</span>
                <span className="font-mono">{formatCurrency(taxAmount, settings)}</span>
              </div>
            )}

            {/* Total Highlight */}
            <div className="flex items-baseline justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                TOTAL À PAYER
              </span>
              <span className="text-2xl font-extrabold text-slate-950 dark:text-white font-mono tracking-tight">
                {formatCurrency(total, settings)}
              </span>
            </div>

            {/* Big Action Button */}
            <button
              disabled={cart.length === 0}
              onClick={openPaymentModal}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-150 ${
                cart.length === 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>ENCAISSER ({formatCurrency(total, settings)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Règlement de la vente
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Total exigible : {formatCurrency(total, settings)}
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                Mode de paiement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'especes', label: 'Espèces', icon: <Banknote className="w-4 h-4" /> },
                  { id: 'carte', label: 'Carte Bancaire', icon: <CreditCard className="w-4 h-4" /> },
                  { id: 'wave', label: 'Wave', icon: <Smartphone className="w-4 h-4" /> },
                  { id: 'orange_money', label: 'Orange Money', icon: <Smartphone className="w-4 h-4" /> },
                  { id: 'virement', label: 'Virement', icon: <CreditCard className="w-4 h-4" /> },
                  { id: 'cheque', label: 'Chèque', icon: <Receipt className="w-4 h-4" /> },
                  { id: 'credit', label: 'À Crédit', icon: <User className="w-4 h-4" /> },
                ]
                  .filter((m) => settings.enabledPaymentMethods.includes(m.id as PaymentMethodType))
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethodType)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        paymentMethod === m.id
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="mb-1">{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* If Cash: Quick Cash Buttons and Change to Give */}
            {paymentMethod === 'especes' && (
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Montant reçu du client :
                  </label>
                  <input
                    type="number"
                    value={amountReceived || ''}
                    onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                    className="w-36 text-right px-3 py-1.5 text-base font-bold font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Quick denomination chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Raccourcis :</span>
                  {getQuickCashValues().map((val, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAmountReceived(val)}
                      className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:border-emerald-300"
                    >
                      {formatCurrency(val, settings)}
                    </button>
                  ))}
                </div>

                {/* Change calculation */}
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Monnaie à rendre :
                  </span>
                  <span
                    className={`text-xl font-extrabold font-mono ${
                      amountReceived < total ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {amountReceived < total
                      ? `Reste dû : ${formatCurrency(total - amountReceived, settings)}`
                      : formatCurrency(changeGiven, settings)}
                  </span>
                </div>
              </div>
            )}

            {/* Validation Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={finalizeSale}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Valider la vente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={lastCompletedSale}
        settings={settings}
      />
    </div>
  );
};
