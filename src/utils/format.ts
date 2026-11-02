/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoreSettings } from '../types';

export function formatCurrency(amount: number, settings?: Partial<StoreSettings>): string {
  const currency = settings?.currency || 'FCFA';
  const position = settings?.currencyPosition || 'after';

  // Format with space separators
  const isCFA = currency.toUpperCase().includes('CFA') || currency.toUpperCase().includes('F');
  const formattedNumber = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: isCFA ? 0 : 2,
    maximumFractionDigits: isCFA ? 0 : 2,
  }).format(amount || 0);

  if (position === 'before') {
    return `${currency} ${formattedNumber}`;
  }
  return `${formattedNumber} ${currency}`;
}

export function formatDate(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
