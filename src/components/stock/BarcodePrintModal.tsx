/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Printer, Copy, Check } from 'lucide-react';
import { Product, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/format';
import { BarcodeSvg } from '../common/BarcodeSvg';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  settings: StoreSettings;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  product,
  settings,
}) => {
  const [copies, setCopies] = useState<number>(12);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showStoreName, setShowStoreName] = useState<boolean>(true);

  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Impression d'étiquettes & codes-barres
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {product.name} ({product.barcode})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Imprimer la planche ({copies} étiquettes)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuration Toolbar */}
        <div className="no-print p-4 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Nombre d'étiquettes :
            </label>
            <div className="flex items-center gap-1">
              {[4, 8, 12, 24, 40].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCopies(num)}
                  className={`px-2.5 py-1 font-mono rounded-md border text-xs font-medium ${
                    copies === num
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
                className="rounded-sm text-emerald-600 focus:ring-emerald-500"
              />
              <span>Afficher le prix</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showStoreName}
                onChange={(e) => setShowStoreName(e.target.checked)}
                className="rounded-sm text-emerald-600 focus:ring-emerald-500"
              />
              <span>Nom du magasin</span>
            </label>
          </div>
        </div>

        {/* Printable Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200 dark:bg-slate-950">
          <div className="barcode-sheet grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl shadow-xs border border-slate-200">
            {Array.from({ length: copies }).map((_, idx) => (
              <div
                key={idx}
                className="border border-slate-300 rounded-md p-2 flex flex-col items-center justify-between text-center bg-white min-h-[110px]"
              >
                {showStoreName && (
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate w-full">
                    {settings.storeName}
                  </span>
                )}
                <span className="text-[11px] font-bold text-slate-900 line-clamp-1 w-full my-0.5">
                  {product.name}
                </span>

                <BarcodeSvg value={product.barcode} height={34} showText={true} />

                {showPrice && (
                  <span className="text-xs font-black text-slate-950 font-mono mt-1">
                    {formatCurrency(product.sellPrice, settings)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Bottom note */}
        <div className="no-print p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex justify-between items-center">
          <span>Format compatible feuilles autocollantes A4 ou imprimante thermique d'étiquettes.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
