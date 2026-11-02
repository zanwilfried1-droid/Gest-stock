/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Download,
  RotateCcw,
  Receipt,
  Printer,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';
import { AuditLog, Sale, Product, StoreSettings } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { triggerFileDownload, logAuditEvent } from '../../utils/storage';
import { ReceiptModal } from '../pos/ReceiptModal';
import { PINModal } from '../common/PINModal';

interface HistoryViewProps {
  auditLogs: AuditLog[];
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: StoreSettings;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  auditLogs,
  sales,
  setSales,
  products,
  setProducts,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'sales'>('audit');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Sale details modal & receipt modal
  const [inspectingSale, setInspectingSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Refund / Cancel sale state
  const [saleToRefund, setSaleToRefund] = useState<Sale | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Filtered audit logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesCat = categoryFilter === 'all' || log.category === categoryFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      log.description.toLowerCase().includes(query) ||
      log.author.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });

  // Filtered sales
  const filteredSales = sales.filter((sale) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      !query ||
      sale.receiptNumber.toLowerCase().includes(query) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(query)) ||
      sale.paymentMethod.toLowerCase().includes(query) ||
      sale.items.some((it) => it.productName.toLowerCase().includes(query))
    );
  });

  // Refund / Cancel sale
  const handleRequestRefund = (sale: Sale) => {
    setSaleToRefund(sale);
    if (settings.pinSecurityEnabled) {
      setIsPinModalOpen(true);
    } else {
      if (confirm(`Confirmez-vous le remboursement de la vente ${sale.receiptNumber} ? Les stocks seront réintégrés automatiquement.`)) {
        executeRefund(sale);
      }
    }
  };

  const executeRefund = (sale: Sale) => {
    // 1. Mark sale as refunded
    const updatedSales = sales.map((s) => {
      if (s.id === sale.id) {
        return { ...s, status: 'refunded' as const };
      }
      return s;
    });
    setSales(updatedSales);

    // 2. Restore stocks of sold items
    const updatedProducts = products.map((prod) => {
      const soldItem = sale.items.find((it) => it.productId === prod.id);
      if (soldItem) {
        return {
          ...prod,
          stock: prod.stock + soldItem.quantity,
          updatedAt: new Date().toISOString(),
        };
      }
      return prod;
    });
    setProducts(updatedProducts);

    // 3. Log to audit trail
    logAuditEvent(
      'vente_remboursee',
      'VENTE',
      `Vente ${sale.receiptNumber} annulée et remboursée (Montant: ${formatCurrency(sale.total, settings)}). Stock réintégré.`,
      'Superviseur',
      sale.id
    );

    setSaleToRefund(null);
    if (inspectingSale?.id === sale.id) {
      setInspectingSale({ ...inspectingSale, status: 'refunded' });
    }
  };

  // Export audit logs to CSV
  const handleExportAuditLogs = () => {
    const headers = ['ID', 'Date & Heure', 'Catégorie', 'Action', 'Description', 'Auteur'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${formatDateTime(l.timestamp)}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      `"${l.author}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    triggerFileDownload(csvContent, `gestock_journal_audit_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Historique Complet & Traçabilité
            </h1>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              100% Tracé
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Journal d'audit infalsifiable : visualisez qui a ajouté, modifié ou supprimé quoi à chaque instant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAuditLogs}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exporter le journal CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Journal d'Audit vs Liste des Ventes */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>Journal d'audit ({auditLogs.length} événements)</span>
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Ventes & Tickets ({sales.length})</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'audit'
                ? "Rechercher dans l'historique par action, auteur, mot-clé..."
                : "Rechercher par n° de ticket, client, produit..."
            }
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {activeTab === 'audit' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {['all', 'VENTE', 'STOCK', 'DÉPENSE', 'PRODUIT', 'SYSTÈME'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'Toutes les actions' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: Journal d'Audit */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Description de l'action</th>
                  <th className="py-3 px-4">Auteur / Caisse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400">
                      Aucun événement trouvé dans le journal.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const badgeStyles: Record<string, string> = {
                      VENTE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
                      STOCK: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
                      DÉPENSE: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
                      PRODUIT: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
                      SYSTÈME: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                    };

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {formatDateTime(log.timestamp)}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                              badgeStyles[log.category] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {log.category}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                          {log.description}
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                          {log.author}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Ventes & Tickets */}
      {activeTab === 'sales' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">N° Ticket</th>
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4 text-center">Articles</th>
                  <th className="py-3 px-4">Règlement</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      Aucune vente trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => {
                    const totalQty = sale.items.reduce((s, it) => s + it.quantity, 0);

                    return (
                      <tr
                        key={sale.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {sale.receiptNumber}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-500">
                          {formatDateTime(sale.date)}
                        </td>

                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {sale.customerName || 'Client de passage'}
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-semibold">
                          {totalQty}
                        </td>

                        <td className="py-3 px-4 uppercase font-mono text-[10px] text-slate-600 dark:text-slate-400">
                          {sale.paymentMethod}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(sale.total, settings)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {sale.status === 'completed' ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                              Validée
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded-full">
                              Remboursée
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Inspect details */}
                            <button
                              onClick={() => setInspectingSale(sale)}
                              title="Voir les détails"
                              className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Print receipt */}
                            <button
                              onClick={() => {
                                setInspectingSale(sale);
                                setIsReceiptModalOpen(true);
                              }}
                              title="Réimprimer le ticket"
                              className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Refund */}
                            {sale.status === 'completed' && (
                              <button
                                onClick={() => handleRequestRefund(sale)}
                                title="Annuler / Rembourser (réintègre le stock)"
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sale Details Inspection Modal */}
      {inspectingSale && !isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Détails de la Vente #{inspectingSale.receiptNumber}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {formatDateTime(inspectingSale.date)} · Enregistrée par {inspectingSale.cashierName}
                </p>
              </div>
              <button
                onClick={() => setInspectingSale(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items in this sale */}
            <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Articles achetés
              </span>
              {inspectingSale.items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {it.productName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {it.quantity} x {formatCurrency(it.unitPrice, settings)}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(it.totalPrice, settings)}
                    </span>
                    <span className="block text-[10px] text-emerald-600">
                      Marge: +{formatCurrency(it.margin, settings)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial summary */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs font-mono mb-4 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Sous-total :</span>
                <span>{formatCurrency(inspectingSale.subtotal, settings)}</span>
              </div>
              {inspectingSale.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Remise accordée :</span>
                  <span>-{formatCurrency(inspectingSale.discountAmount, settings)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700 text-sm">
                <span>Total encaissé :</span>
                <span>{formatCurrency(inspectingSale.total, settings)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 text-[11px] pt-0.5">
                <span>Bénéfice brut sur cette vente :</span>
                <span>+{formatCurrency(inspectingSale.grossProfit, settings)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              {inspectingSale.status === 'completed' ? (
                <button
                  type="button"
                  onClick={() => handleRequestRefund(inspectingSale)}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Rembourser la vente
                </button>
              ) : (
                <span className="text-xs font-bold text-rose-500">
                  Vente déjà remboursée
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Voir / Imprimer le ticket
                </button>
                <button
                  onClick={() => setInspectingSale(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={inspectingSale}
        settings={settings}
      />

      {/* Supervisor PIN modal for refunds */}
      <PINModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setSaleToRefund(null);
        }}
        onSuccess={() => {
          setIsPinModalOpen(false);
          if (saleToRefund) executeRefund(saleToRefund);
        }}
        expectedPin={settings.supervisorPin}
        title="Code PIN requis"
        description="L'annulation ou le remboursement d'une vente nécessite le code PIN superviseur."
      />
    </div>
  );
};
