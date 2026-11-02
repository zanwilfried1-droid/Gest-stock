/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Calendar,
  X,
  CreditCard,
  Banknote,
  Tag
} from 'lucide-react';
import { Expense, ExpenseCategory, StoreSettings, PaymentMethodType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { exportExpensesToCSV, triggerFileDownload, logAuditEvent } from '../../utils/storage';
import { PINModal } from '../common/PINModal';

interface ExpensesViewProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  expenseCategories: ExpenseCategory[];
  setExpenseCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
  settings: StoreSettings;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  setExpenses,
  expenseCategories,
  setExpenseCategories,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // PIN security for deleting an expense
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCategory, setFormCategory] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethodType>('especes');
  const [formBeneficiary, setFormBeneficiary] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Date filtering logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const startOfWeek = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const currentYearStr = `${new Date().getFullYear()}`;

  const filteredExpenses = expenses.filter((e) => {
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      e.title.toLowerCase().includes(query) ||
      (e.beneficiary && e.beneficiary.toLowerCase().includes(query)) ||
      (e.notes && e.notes.toLowerCase().includes(query));

    let matchesPeriod = true;
    if (periodFilter === 'today') matchesPeriod = e.date === todayStr;
    if (periodFilter === 'week') matchesPeriod = e.date >= startOfWeek;
    if (periodFilter === 'month') matchesPeriod = e.date.startsWith(currentMonthStr);
    if (periodFilter === 'year') matchesPeriod = e.date.startsWith(currentYearStr);

    return matchesCat && matchesQuery && matchesPeriod;
  });

  // Totals calculations
  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalMonthAmount = expenses
    .filter((e) => e.date.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + e.amount, 0);
  const totalTodayAmount = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormTitle('');
    setFormAmount(0);
    setFormCategory(expenseCategories[0]?.name || 'Divers');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('especes');
    setFormBeneficiary('');
    setFormNotes('');
    setIsExpenseModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setFormTitle(exp.title);
    setFormAmount(exp.amount);
    setFormCategory(exp.category);
    setFormDate(exp.date);
    setFormPaymentMethod(exp.paymentMethod);
    setFormBeneficiary(exp.beneficiary || '');
    setFormNotes(exp.notes || '');
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formAmount <= 0) return;

    if (editingExpense) {
      const updatedList = expenses.map((item) => {
        if (item.id === editingExpense.id) {
          return {
            ...item,
            title: formTitle.trim(),
            amount: formAmount,
            category: formCategory,
            date: formDate,
            paymentMethod: formPaymentMethod,
            beneficiary: formBeneficiary.trim() || undefined,
            notes: formNotes.trim() || undefined,
          };
        }
        return item;
      });
      setExpenses(updatedList);
      logAuditEvent(
        'depense_modifiee',
        'DÉPENSE',
        `Dépense modifiée: "${formTitle}" (${formatCurrency(formAmount, settings)})`,
        'Gérant',
        editingExpense.id
      );
    } else {
      const newExp: Expense = {
        id: `exp-${Date.now()}`,
        title: formTitle.trim(),
        amount: formAmount,
        category: formCategory,
        date: formDate,
        paymentMethod: formPaymentMethod,
        beneficiary: formBeneficiary.trim() || undefined,
        notes: formNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      setExpenses([newExp, ...expenses]);
      logAuditEvent(
        'depense_creee',
        'DÉPENSE',
        `Nouvelle dépense: "${newExp.title}" (${formatCurrency(newExp.amount, settings)})`,
        'Gérant',
        newExp.id
      );
    }

    setIsExpenseModalOpen(false);
  };

  const handleDeleteExpensePrompt = (id: string) => {
    if (settings.pinSecurityEnabled) {
      setPendingDeleteId(id);
      setIsPinModalOpen(true);
    } else {
      if (confirm('Voulez-vous supprimer cette dépense ?')) {
        executeDelete(id);
      }
    }
  };

  const executeDelete = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (exp) {
      logAuditEvent(
        'depense_supprimee',
        'DÉPENSE',
        `Dépense supprimée: "${exp.title}" (${formatCurrency(exp.amount, settings)})`,
        'Superviseur',
        id
      );
    }
    setPendingDeleteId(null);
  };

  const handleExportCSV = () => {
    const csv = exportExpensesToCSV(filteredExpenses);
    triggerFileDownload(csv, `gestock_depenses_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    setExpenseCategories([...expenseCategories, { id: `expcat-${Date.now()}`, name: newCatName.trim() }]);
    setNewCatName('');
  };

  const handleDeleteCategory = (catId: string) => {
    setExpenseCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gestion des Dépenses & Frais
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des charges, loyers, factures, salaires et déductions directes pour calculer le bénéfice net réel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span>Catégories Dépenses</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl shadow-xs transition-all active:scale-95 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Dépense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Total période sélectionnée
          </span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatCurrency(totalFilteredAmount, settings)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Dépenses ce mois-ci
          </span>
          <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            {formatCurrency(totalMonthAmount, settings)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Dépenses aujourd'hui
          </span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatCurrency(totalTodayAmount, settings)}
          </span>
        </div>
      </div>

      {/* Period & Category Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Period tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'today', label: "Aujourd'hui" },
            { id: 'week', label: '7 jours' },
            { id: 'month', label: 'Ce mois' },
            { id: 'year', label: 'Année' },
            { id: 'all', label: 'Tout' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriodFilter(tab.id as typeof periodFilter)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                periodFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher libellé, fournisseur..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Category dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
        >
          <option value="all">Toutes les catégories</option>
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Libellé / Titre</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Bénéficiaire / Fournisseur</th>
                <th className="py-3 px-4">Règlement</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Aucune dépense enregistrée pour cette sélection.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {formatDate(exp.date)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {exp.title}
                      </div>
                      {exp.notes && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{exp.notes}</p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {exp.beneficiary || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-mono">
                      {exp.paymentMethod}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      -{formatCurrency(exp.amount, settings)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpensePrompt(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Expense */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingExpense ? 'Modifier la dépense' : 'Enregistrer une dépense'}
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description / Libellé de la dépense *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Loyer mensuel local, Facture électricité..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Montant * ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formAmount || ''}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Règlement
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethodType)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="especes">Espèces</option>
                    <option value="carte">Carte</option>
                    <option value="wave">Wave</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="virement">Virement</option>
                    <option value="cheque">Chèque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Bénéficiaire / Prestataire (facultatif)
                </label>
                <input
                  type="text"
                  value={formBeneficiary}
                  onChange={(e) => setFormBeneficiary(e.target.value)}
                  placeholder="Ex: Propriétaire, EDF, Compagnie d'eau, Livreur..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes / Réf pièce justificative (facultatif)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="N° de facture, détails supplémentaires..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl shadow-xs"
                >
                  {editingExpense ? 'Mettre à jour' : 'Enregistrer la dépense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Category manager for expenses */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Catégories de Dépenses
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nouvelle catégorie (ex: Assurance, Publicité)..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
              <button
                onClick={handleAddCategory}
                className="px-3 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl"
              >
                Ajouter
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {expenseCategories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {c.name}
                  </span>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
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

      {/* PIN Security modal */}
      <PINModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingDeleteId(null);
        }}
        onSuccess={() => {
          setIsPinModalOpen(false);
          if (pendingDeleteId) executeDelete(pendingDeleteId);
        }}
        expectedPin={settings.supervisorPin}
        title="Code PIN superviseur"
        description="La suppression de dépense requiert l'autorisation superviseur."
      />
    </div>
  );
};
