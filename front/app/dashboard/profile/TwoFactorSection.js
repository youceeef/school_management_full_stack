"use client";

import React, { useState } from "react";
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  QrCodeIcon,
  KeyIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  XMarkIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import toast from "../../utils/toast";
import Button from "../../components/Button";
import { Card } from "../../components/ui";
import {
  enableTwoFactor,
  confirmTwoFactor,
  getTwoFactorRecoveryCodes,
  regenerateTwoFactorRecoveryCodes,
  disableTwoFactor,
} from "../../services/authService";

export default function TwoFactorSection({ initialEnabled = false, onStatusChange }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  // Setup modal state
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Recovery codes modal state
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [passwordForCodes, setPasswordForCodes] = useState("");
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [codesError, setCodesError] = useState("");

  // Disable modal state
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [passwordForDisable, setPasswordForDisable] = useState("");
  const [disabling, setDisabling] = useState(false);
  const [disableError, setDisableError] = useState("");

  // Start 2FA Setup
  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const data = await enableTwoFactor();
      setSetupData(data);
      setShowSetupModal(true);
      setVerificationCode("");
    } catch (err) {
      toast.error(err.message || "Erreur lors de l’initialisation du 2FA");
    } finally {
      setLoading(false);
    }
  };

  // Confirm 2FA Setup with 6-digit code
  const handleConfirmSetup = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      toast.error("Veuillez saisir le code à 6 chiffres");
      return;
    }

    setConfirming(true);
    try {
      await confirmTwoFactor(verificationCode.trim());
      setEnabled(true);
      setShowSetupModal(false);
      toast.success("Validation en deux étapes activée avec succès !");
      if (onStatusChange) onStatusChange(true);
    } catch (err) {
      toast.error(err.errors?.code?.[0] || err.message || "Code invalide");
    } finally {
      setConfirming(false);
    }
  };

  // View Recovery Codes (prompt password)
  const handleViewCodes = async (e) => {
    e.preventDefault();
    setCodesError("");
    setLoadingCodes(true);

    try {
      const res = await getTwoFactorRecoveryCodes(passwordForCodes);
      setRecoveryCodes(res.recovery_codes || []);
      setPasswordForCodes("");
    } catch (err) {
      setCodesError(err.errors?.password?.[0] || err.message || "Mot de passe incorrect");
    } finally {
      setLoadingCodes(false);
    }
  };

  // Regenerate Recovery Codes
  const handleRegenerateCodes = async () => {
    if (!passwordForCodes) {
      setCodesError("Veuillez renseigner votre mot de passe pour régénérer les codes");
      return;
    }

    setLoadingCodes(true);
    setCodesError("");

    try {
      const res = await regenerateTwoFactorRecoveryCodes(passwordForCodes);
      setRecoveryCodes(res.recovery_codes || []);
      toast.success("Nouveaux codes de récupération générés");
    } catch (err) {
      setCodesError(err.errors?.password?.[0] || err.message || "Erreur lors de la régénération");
    } finally {
      setLoadingCodes(false);
    }
  };

  // Disable 2FA
  const handleDisable = async (e) => {
    e.preventDefault();
    if (!passwordForDisable) {
      setDisableError("Veuillez renseigner votre mot de passe");
      return;
    }

    setDisabling(true);
    setDisableError("");

    try {
      await disableTwoFactor(passwordForDisable);
      setEnabled(false);
      setShowDisableModal(false);
      setPasswordForDisable("");
      toast.success("Validation en deux étapes désactivée");
      if (onStatusChange) onStatusChange(false);
    } catch (err) {
      setDisableError(err.errors?.password?.[0] || err.message || "Mot de passe incorrect");
    } finally {
      setDisabling(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "secret") {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                enabled
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
              }`}
            >
              {enabled ? (
                <ShieldCheckIcon className="w-6 h-6" />
              ) : (
                <ShieldExclamationIcon className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                  Validation en deux étapes (2FA)
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    enabled
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}
                >
                  {enabled ? "Activé" : "Non configuré"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                {enabled
                  ? "Votre compte administrateur est protégé par une application d'authentification TOTP (Google Authenticator, Microsoft Authenticator, 1Password, etc.)."
                  : "Protégez vos privilèges d'administration contre les compromissions de mot de passe en exigeant un code à 6 chiffres lors de la connexion."}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {enabled ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowCodesModal(true);
                    setRecoveryCodes([]);
                    setPasswordForCodes("");
                    setCodesError("");
                  }}
                >
                  Codes de secours
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setShowDisableModal(true);
                    setPasswordForDisable("");
                    setDisableError("");
                  }}
                >
                  Désactiver
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={loading}
                onClick={handleStartSetup}
              >
                Activer le 2FA
              </Button>
            )}
          </div>
        </div>

        {/* Setup Modal */}
        {showSetupModal && setupData && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl max-w-lg w-full space-y-6 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <QrCodeIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                    Configurer la validation en deux étapes
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSetupModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Step 1: Scan QR */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Étape 1 · Scannez le code QR
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ouvrez votre application d’authentification (Google Authenticator, Microsoft
                  Authenticator, Authy) et scannez ce code :
                </p>
                <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-200 dark:border-slate-700 w-fit mx-auto">
                  <div
                    dangerouslySetInnerHTML={{ __html: setupData.svg }}
                    className="w-48 h-48 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">
                    Ou saisissez la clé manuellement :
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                    <span>{setupData.secret}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(setupData.secret, "secret")}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-white"
                      title="Copier la clé"
                    >
                      {copiedSecret ? (
                        <ClipboardDocumentCheckIcon className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Emergency Recovery Codes */}
              {setupData.recovery_codes && setupData.recovery_codes.length > 0 && (
                <div className="space-y-2 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      Étape 2 · Enregistrez vos codes de secours
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(setupData.recovery_codes.join("\n"), "codes")
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 dark:text-amber-300 hover:underline"
                    >
                      {copiedCodes ? (
                        <>
                          <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />
                          <span>Copié</span>
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                          <span>Copier tout</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Ces codes à usage unique vous permettront de vous connecter si vous perdez
                    l’accès à votre appareil. Conservez-les en lieu sûr.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                    {setupData.recovery_codes.map((code, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-white/80 dark:bg-slate-900/80 border border-amber-200/50 dark:border-amber-800/50 text-center"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation Code Form */}
              <form onSubmit={handleConfirmSetup} className="space-y-4 pt-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Étape 3 · Confirmer le code
                  </p>
                  <label
                    htmlFor="confirm2fa"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Saisissez le code à 6 chiffres affiché sur votre application :
                  </label>
                  <input
                    id="confirm2fa"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full text-center text-xl tracking-[0.25em] font-mono px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowSetupModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" loading={confirming}>
                    Confirmer et activer
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Recovery Codes Modal */}
        {showCodesModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl max-w-md w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <KeyIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                    Codes de secours 2FA
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCodesModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {recoveryCodes.length === 0 ? (
                <form onSubmit={handleViewCodes} className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Pour des raisons de sécurité, veuillez confirmer votre mot de passe pour afficher
                    vos codes de récupération.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      autoFocus
                      value={passwordForCodes}
                      onChange={(e) => setPasswordForCodes(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full text-sm px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      required
                    />
                  </div>

                  {codesError && (
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">{codesError}</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowCodesModal(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" variant="primary" loading={loadingCodes}>
                      Déverrouiller
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Codes à usage unique disponibles ({recoveryCodes.length}) :
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(recoveryCodes.join("\n"), "codes")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {copiedCodes ? (
                        <>
                          <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />
                          <span>Copié</span>
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                          <span>Copier tout</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    {recoveryCodes.map((code, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                      >
                        {code}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={loadingCodes}
                      onClick={handleRegenerateCodes}
                    >
                      <ArrowPathIcon className="w-4 h-4 mr-1.5" />
                      Régénérer
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setShowCodesModal(false)}
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disable 2FA Modal */}
        {showDisableModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl max-w-md w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <LockClosedIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                    Désactiver la validation en deux étapes
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Êtes-vous sûr de vouloir désactiver la validation en deux étapes ? Votre compte ne sera
                protégé que par votre mot de passe.
              </p>

              <form onSubmit={handleDisable} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Confirmez votre mot de passe actuel :
                  </label>
                  <input
                    type="password"
                    autoFocus
                    value={passwordForDisable}
                    onChange={(e) => setPasswordForDisable(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-sm px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    required
                  />
                </div>

                {disableError && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    {disableError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowDisableModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" variant="danger" loading={disabling}>
                    Désactiver le 2FA
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
