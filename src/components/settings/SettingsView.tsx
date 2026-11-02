/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  CreditCard,
  Printer,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  Moon,
  Sun,
  ShieldAlert,
  Volume2,
  VolumeX,
  FileJson,
  RotateCcw
} from 'lucide-react';
import { StoreSettings, PaymentMethodType } from '../../types';
import {
  exportFullBackup,
  restoreFullBackup,
  resetAllData,
  triggerFileDownload,
  logAuditEvent
} from '../../utils/storage';
import { PINModal } from '../common/PINModal';

interface SettingsViewProps {
  settings: StoreSettings;
  setSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
  onReloadAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  setSettings,
  onReloadAllData,
}) => {
  const [formSettings, setFormSettings] = useState<StoreSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  // Security PIN state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'reset_zero' | 'reset_demo' | null>(null);

  // Restore file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(formSettings);
    logAuditEvent('parametre_modifie', 'SYSTÈME', 'Paramètres généraux du commerce mis à jour', 'Gérant');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const togglePaymentMethod = (method: PaymentMethodType) => {
    const current = formSettings.enabledPaymentMethods;
    const exists = current.includes(method);
    const updated = exists
      ? current.filter((m) => m !== method)
      : [...current, method];

    // Keep at least one method
    if (updated.length > 0) {
      setFormSettings({ ...formSettings, enabledPaymentMethods: updated });
    }
  };

  // Backup Export
  const handleExportBackup = () => {
    const jsonStr = exportFullBackup();
    const filename = `gestock_sauvegarde_complete_${new Date().toISOString().split('T')[0]}.json`;
    triggerFileDownload(jsonStr, filename, 'application/json;charset=utf-8');
  };

  // Restore File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = restoreFullBackup(content);
        if (res.success) {
          alert('Sauvegarde restaurée avec succès ! Les données ont été actualisées.');
          onReloadAllData();
        } else {
          alert(res.message);
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reset Actions
  const handlePromptReset = (action: 'reset_zero' | 'reset_demo') => {
    if (formSettings.pinSecurityEnabled) {
      setPendingAction(action);
      setIsPinModalOpen(true);
    } else {
      const msg =
        action === 'reset_zero'
          ? 'Attention : Voulez-vous effacer TOUTES les données (ventes, dépenses, produits) pour repartir de zéro ?'
          : 'Voulez-vous restaurer les données de démonstration de test ? Vos données actuelles seront remplacées.';
      if (confirm(msg)) {
        executeReset(action);
      }
    }
  };

  const executeReset = (action: 'reset_zero' | 'reset_demo') => {
    resetAllData(action === 'reset_demo');
    onReloadAllData();
    alert(
      action === 'reset_demo'
        ? 'Données de démonstration chargées avec succès !'
        : 'Base de données réinitialisée à zéro.'
    );
    setPendingAction(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Paramètres de l'Application
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Personnalisez votre boutique, vos reçus, votre sécurité et gérez vos sauvegardes hors-ligne.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Informations de la Boutique */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Store className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Identité de votre Commerce
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nom du commerce / Magasin *
              </label>
              <input
                type="text"
                required
                value={formSettings.storeName}
                onChange={(e) => setFormSettings({ ...formSettings, storeName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Slogan / Sous-titre
              </label>
              <input
                type="text"
                value={formSettings.storeSubtitle}
                onChange={(e) => setFormSettings({ ...formSettings, storeSubtitle: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Adresse
              </label>
              <input
                type="text"
                value={formSettings.address}
                onChange={(e) => setFormSettings({ ...formSettings, address: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Ville / Pays
              </label>
              <input
                type="text"
                value={formSettings.city}
                onChange={(e) => setFormSettings({ ...formSettings, city: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Téléphone de contact
              </label>
              <input
                type="text"
                value={formSettings.phone}
                onChange={(e) => setFormSettings({ ...formSettings, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Numéro fiscal / SIRET / RCCM / NIF
              </label>
              <input
                type="text"
                value={formSettings.taxNumber}
                onChange={(e) => setFormSettings({ ...formSettings, taxNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Devise & Fiscalité */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Monnaie & Fiscalité
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Devise / Symbole monétaire
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formSettings.currency}
                  onChange={(e) => setFormSettings({ ...formSettings, currency: e.target.value })}
                  placeholder="Ex: FCFA, €, $, DA..."
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {['FCFA', '€', '$', 'DA', 'DH', 'CHF'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormSettings({ ...formSettings, currency: c })}
                    className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Position du symbole
              </label>
              <select
                value={formSettings.currencyPosition}
                onChange={(e) => setFormSettings({ ...formSettings, currencyPosition: e.target.value as 'after' | 'before' })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="after">Après le montant (ex: 2 500 {formSettings.currency})</option>
                <option value="before">Avant le montant (ex: {formSettings.currency} 2 500)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Gestion de la TVA
                </label>
                <input
                  type="checkbox"
                  checked={formSettings.vatEnabled}
                  onChange={(e) => setFormSettings({ ...formSettings, vatEnabled: e.target.checked })}
                  className="rounded-sm text-emerald-600 focus:ring-emerald-500"
                />
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                disabled={!formSettings.vatEnabled}
                value={formSettings.vatRate}
                onChange={(e) => setFormSettings({ ...formSettings, vatRate: parseFloat(e.target.value) || 0 })}
                placeholder="Taux TVA (%)"
                className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl ${
                  !formSettings.vatEnabled ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {formSettings.vatEnabled ? 'TVA appliquée sur le ticket' : 'TVA désactivée (franchise)'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Moyens de Paiement Actifs */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Moyens de Paiement Autorisés en Caisse
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'especes', label: 'Espèces' },
              { id: 'carte', label: 'Carte Bancaire' },
              { id: 'wave', label: 'Wave Mobile' },
              { id: 'orange_money', label: 'Orange Money' },
              { id: 'mtn_momo', label: 'MTN MoMo' },
              { id: 'virement', label: 'Virement' },
              { id: 'cheque', label: 'Chèque' },
              { id: 'credit', label: 'À Crédit' },
            ].map((m) => {
              const isEnabled = formSettings.enabledPaymentMethods.includes(m.id as PaymentMethodType);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => togglePaymentMethod(m.id as PaymentMethodType)}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all ${
                    isEnabled
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <span>{m.label}</span>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Configuration Imprimante & Ticket */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Printer className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Imprimante & Ticket Thermique
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Format papier de l'imprimante thermique
              </label>
              <select
                value={formSettings.receiptPaperWidth}
                onChange={(e) => setFormSettings({ ...formSettings, receiptPaperWidth: e.target.value as '80mm' | '58mm' })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="80mm">80 mm (Standard commerce & supermarché)</option>
                <option value="58mm">58 mm (Compact mini-imprimante portable)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Impression automatique après vente
                </span>
                <span className="text-[10px] text-slate-500">
                  Ouvre l'aperçu du reçu dès l'encaissement
                </span>
              </div>
              <input
                type="checkbox"
                checked={formSettings.autoPrintReceipt}
                onChange={(e) => setFormSettings({ ...formSettings, autoPrintReceipt: e.target.checked })}
                className="rounded-sm text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Message d'en-tête du ticket
              </label>
              <input
                type="text"
                value={formSettings.receiptHeader}
                onChange={(e) => setFormSettings({ ...formSettings, receiptHeader: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Message de pied de ticket / Politique de retour
              </label>
              <input
                type="text"
                value={formSettings.receiptFooter}
                onChange={(e) => setFormSettings({ ...formSettings, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Sécurité Code PIN & Préférences */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Sécurité & Code PIN Superviseur
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Verrouiller les actions sensibles par PIN
                </span>
                <input
                  type="checkbox"
                  checked={formSettings.pinSecurityEnabled}
                  onChange={(e) => setFormSettings({ ...formSettings, pinSecurityEnabled: e.target.checked })}
                  className="rounded-sm text-emerald-600 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Protège les annulations de vente, suppressions d'articles et réinitialisations de base.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Code PIN Superviseur (4 chiffres)
              </label>
              <input
                type="password"
                maxLength={4}
                value={formSettings.supervisorPin}
                onChange={(e) => setFormSettings({ ...formSettings, supervisorPin: e.target.value.replace(/\D/g, '') })}
                className="w-full px-3 py-2 text-base font-mono tracking-widest text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Code par défaut : 1234
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Effets sonores (bip scanner & caisse)
                </span>
                <span className="text-[10px] text-slate-500">
                  Générés par synthèse audio hors-ligne
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormSettings({ ...formSettings, enableSound: !formSettings.enableSound })}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                {formSettings.enableSound ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Save button bar */}
        <div className="flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Paramètres enregistrés avec succès !
            </span>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:bg-slate-800 shadow-xs transition-all active:scale-95"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>

      {/* Section 6: Sauvegarde & Restauration 100% Hors-Ligne */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <FileJson className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Sauvegarde & Restauration des Données (100% Hors-Ligne)
          </h2>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Toutes vos données (produits, stock, ventes, dépenses, historique) sont stockées localement sur votre appareil sans besoin d'internet. Vous pouvez créer un fichier de sauvegarde à tout moment pour sécuriser vos données ou les transférer sur un autre appareil.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Download backup */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40 text-left flex items-start gap-3 transition-colors group"
          >
            <Download className="w-5 h-5 text-emerald-600 mt-0.5 group-hover:scale-110 transition-transform shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Télécharger une sauvegarde complète
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Exporte l'intégralité de votre base au format JSON sécurisé.
              </span>
            </div>
          </button>

          {/* Restore backup */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 text-left flex items-start gap-3 transition-colors group"
            >
              <Upload className="w-5 h-5 text-blue-600 mt-0.5 group-hover:scale-110 transition-transform shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Restaurer depuis un fichier JSON
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Récupérez vos données à partir d'une sauvegarde précédente.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Demo data or Reset */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handlePromptReset('reset_demo')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Recharger données de démonstration
          </button>

          <button
            type="button"
            onClick={() => handlePromptReset('reset_zero')}
            className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remettre la base à zéro
          </button>
        </div>
      </div>

      {/* Supervisor PIN Modal for sensitive resets */}
      <PINModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={() => {
          setIsPinModalOpen(false);
          if (pendingAction) executeReset(pendingAction);
        }}
        expectedPin={formSettings.supervisorPin}
        title="Code PIN requis"
        description="Cette opération modifie la base de données locale et requiert le code PIN superviseur."
      />
    </div>
  );
};
