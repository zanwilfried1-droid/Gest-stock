/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, X, Delete } from 'lucide-react';

interface PINModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedPin: string;
  title?: string;
  description?: string;
}

export const PINModal: React.FC<PINModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expectedPin,
  title = 'Autorisation Superviseur',
  description = 'Entrez votre code PIN à 4 chiffres pour autoriser cette action.',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === expectedPin) {
          setTimeout(() => {
            setPin('');
            onSuccess();
          }, 150);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center">
        <div className="flex justify-between items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          {description}
        </p>

        {/* PIN Dots */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  error
                    ? 'bg-rose-500 scale-110 animate-shake'
                    : isFilled
                    ? 'bg-slate-900 dark:bg-white scale-110'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-rose-500 font-medium mb-3">
            Code PIN incorrect
          </p>
        )}

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl text-lg font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl text-lg font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
