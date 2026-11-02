/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Printer, X, Check, Download } from 'lucide-react';
import { Sale, StoreSettings } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { BarcodeSvg } from '../common/BarcodeSvg';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings: StoreSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  settings,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const paymentLabels: Record<string, string> = {
    especes: 'Espèces',
    carte: 'Carte Bancaire',
    wave: 'Wave Mobile Money',
    orange_money: 'Orange Money',
    mtn_momo: 'MTN Mobile Money',
    virement: 'Virement Bancaire',
    cheque: 'Chèque',
    credit: 'À Crédit / Compte Client',
  };

  const is58mm = settings.receiptPaperWidth === '58mm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header toolbar */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Ticket de Caisse #{sale.receiptNumber}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-medium">
              Payé
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimer
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
          {/* Printable Ticket Container */}
          <div
            ref={receiptRef}
            className={`receipt-container ${is58mm ? 'receipt-58mm' : ''} bg-white text-slate-900 p-5 rounded-lg shadow-sm border border-slate-200 font-mono text-xs w-full max-w-[340px]`}
          >
            {/* Store Information */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base font-bold tracking-tight text-slate-950 uppercase">
                {settings.storeName}
              </h2>
              {settings.storeSubtitle && (
                <p className="text-[11px] text-slate-600 mt-0.5">{settings.storeSubtitle}</p>
              )}
              {settings.address && (
                <p className="text-[10px] text-slate-600 mt-0.5">{settings.address}, {settings.city}</p>
              )}
              {settings.phone && (
                <p className="text-[10px] text-slate-600">Tél: {settings.phone}</p>
              )}
              {settings.taxNumber && (
                <p className="text-[9px] text-slate-500 mt-0.5">NIF/SIRET: {settings.taxNumber}</p>
              )}
            </div>

            {/* Ticket Metadata */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-500">N° Reçu :</span>
                <span className="font-bold">{sale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date :</span>
                <span>{formatDateTime(sale.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Caisse :</span>
                <span>{sale.cashierName}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Client :</span>
                  <span>{sale.customerName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-[10px] font-bold text-slate-700 pb-1 mb-1 border-b border-slate-200">
                <span>Désignation</span>
                <span>Total</span>
              </div>
              <div className="space-y-2">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="text-[11px]">
                    <div className="flex justify-between font-medium">
                      <span className="truncate pr-2">{item.productName}</span>
                      <span className="shrink-0">{formatCurrency(item.totalPrice, settings)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.quantity} x {formatCurrency(item.unitPrice, settings)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Sous-total :</span>
                <span>{formatCurrency(sale.subtotal, settings)}</span>
              </div>

              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Remise accordée :</span>
                  <span>-{formatCurrency(sale.discountAmount, settings)}</span>
                </div>
              )}

              {settings.vatEnabled && sale.taxAmount > 0 && (
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Dont TVA ({sale.taxRate}%) :</span>
                  <span>{formatCurrency(sale.taxAmount, settings)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200 text-slate-950">
                <span>TOTAL :</span>
                <span>{formatCurrency(sale.total, settings)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Règlement :</span>
                <span className="font-semibold">{paymentLabels[sale.paymentMethod] || sale.paymentMethod}</span>
              </div>
              {sale.amountReceived > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Montant reçu :</span>
                    <span>{formatCurrency(sale.amountReceived, settings)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Monnaie rendue :</span>
                    <span>{formatCurrency(sale.changeGiven, settings)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Store Greeting & Policy */}
            <div className="pt-3 text-center space-y-1">
              {settings.receiptHeader && (
                <p className="text-[10px] font-semibold text-slate-700">{settings.receiptHeader}</p>
              )}
              {settings.receiptFooter && (
                <p className="text-[9px] text-slate-500">{settings.receiptFooter}</p>
              )}
              <div className="pt-2 flex justify-center">
                <BarcodeSvg value={sale.receiptNumber} height={32} showText={true} />
              </div>
              <p className="text-[8px] text-slate-400 mt-1">GESTOCK - Commerce Hors-Ligne</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="no-print p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-500" />
            Vente validée et stock ajusté
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
