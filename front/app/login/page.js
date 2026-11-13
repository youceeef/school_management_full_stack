"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon, ArrowLeftIcon, ShieldCheckIcon, KeyIcon } from "@heroicons/react/24/outline";
import toast from "../utils/toast";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Button from "../components/Button";
import { resendVerificationEmail } from "../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [accountRejection, setAccountRejection] = useState(null);
  const [emailUnverified, setEmailUnverified] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const router = useRouter();
  const { login, verifyTwoFactorChallenge } = useAuth();
  const { t, tr, isRtl } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAccountRejection(null);
    setEmailUnverified(false);
    try {
      if (!email && !password) {
        throw new Error(tr("Veuillez remplir votre email et votre mot de passe"));
      } else if (!email) {
        throw new Error(tr("Veuillez remplir votre email"));
      } else if (!password) {
        throw new Error(tr("Veuillez remplir votre mot de passe"));
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error(tr("Veuillez entrer une adresse email valide"));
      }
      const response = await login(email, password);
      if (response?.two_factor) {
        setChallengeToken(response.challenge_token);
        setShowTwoFactor(true);
        return;
      }
      toast.success(tr("Connexion réussie"));
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "ACCOUNT_REJECTED") {
        setAccountRejection({
          reason: err.rejection_reason || null,
          email,
        });
      } else {
        setAccountRejection(null);
      }
      setEmailUnverified(err.code === "EMAIL_UNVERIFIED");
      // The dedicated panel below already carries the translated explanation
      // and the resend action, so do not repeat a second, untranslated banner.
      setError(
        err.code === "EMAIL_UNVERIFIED"
          ? ""
          : tr(err.message || "Identifiants invalides ou serveur momentanément indisponible")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    setTwoFactorLoading(true);
    setError("");

    try {
      if (!useRecoveryCode && (!twoFactorCode || twoFactorCode.trim().length !== 6)) {
        throw new Error(tr("Veuillez saisir un code à 6 chiffres"));
      }
      if (useRecoveryCode && !recoveryCode.trim()) {
        throw new Error(tr("Veuillez saisir un code de récupération"));
      }

      await verifyTwoFactorChallenge({
        challenge_token: challengeToken,
        code: useRecoveryCode ? null : twoFactorCode.trim(),
        recovery_code: useRecoveryCode ? recoveryCode.trim() : null,
      });

      toast.success(tr("Connexion réussie"));
      router.push("/dashboard");
    } catch (err) {
      console.error("2FA Challenge error:", err);
      setError(tr(err.message || "Code d'authentification invalide"));
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);

    try {
      await resendVerificationEmail(email);
      toast.success(t("auth.emailVerifiedResendSuccess"));
    } catch (err) {
      toast.error(
        err?.status === 429
          ? t("auth.emailVerifiedResendRateLimited")
          : t("auth.emailVerifiedResendError")
      );
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-950">
      {/* Left Institutional Context Panel */}
      <div
        className={`hidden lg:flex lg:col-span-5 bg-slate-900 text-white p-12 flex-col justify-between ${
          isRtl ? "border-l border-slate-800" : "border-r border-slate-800"
        }`}
      >
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold font-display tracking-tight text-white">
            EduSpace
          </Link>
          <p className="mt-1 text-xs text-slate-400">
            {t("auth.platformSubtitle")}
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-display tracking-tight text-balance leading-snug">
            {t("auth.loginPanelTitle")}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            {t("auth.loginPanelDesc")}
          </p>
          <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
            <p>{t("auth.loginBullet1")}</p>
            <p>{t("auth.loginBullet2")}</p>
            <p>{t("auth.loginBullet3")}</p>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} EduSpace · CSFT Tunisie
        </div>
      </div>

      {/* Right Authentication Form Area */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeftIcon className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
            {t("common.backHome")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-12">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            {showTwoFactor ? (
              <div>
                <div className="mb-6 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 shrink-0">
                    <ShieldCheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                      {t("auth.twoFactorTitle")}
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {useRecoveryCode ? t("auth.twoFactorRecoveryDesc") : t("auth.twoFactorDesc")}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2.5">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                <form onSubmit={handleTwoFactorSubmit} className="space-y-5" noValidate>
                  {!useRecoveryCode ? (
                    <div>
                      <label htmlFor="twoFactorCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        {t("auth.twoFactorCodeLabel")}
                      </label>
                      <input
                        id="twoFactorCode"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoFocus
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full text-center text-2xl tracking-[0.3em] font-mono px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                      />
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="recoveryCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        {t("auth.twoFactorRecoveryCodeLabel")}
                      </label>
                      <input
                        id="recoveryCode"
                        type="text"
                        autoFocus
                        value={recoveryCode}
                        onChange={(e) => setRecoveryCode(e.target.value)}
                        placeholder="abcde-12345"
                        className="w-full font-mono text-sm px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={twoFactorLoading}
                    className="w-full"
                  >
                    {twoFactorLoading ? t("auth.twoFactorVerifying") : t("auth.twoFactorVerifyBtn")}
                  </Button>

                  <div className="pt-2 flex flex-col gap-2.5 text-center text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setUseRecoveryCode(!useRecoveryCode);
                        setError("");
                      }}
                      className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {useRecoveryCode ? t("auth.twoFactorUseTotp") : t("auth.twoFactorUseRecovery")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTwoFactor(false);
                        setChallengeToken("");
                        setTwoFactorCode("");
                        setRecoveryCode("");
                        setError("");
                      }}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      {t("auth.twoFactorBackToLogin")}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                    {t("auth.loginHeading")}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {t("auth.loginSubheading")}
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2.5">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                {accountRejection && (
                  <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <ExclamationCircleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{tr("Demande de compte refusée par l'administration")}</span>
                    </div>
                    {accountRejection.reason && (
                      <p className="pl-6 text-slate-700 dark:text-slate-300 italic">
                        &ldquo;{accountRejection.reason}&rdquo;
                      </p>
                    )}
                    <div className="pl-6 pt-1">
                      <Link
                        href={`/resubmit?email=${encodeURIComponent(accountRejection.email)}`}
                        className="inline-flex items-center gap-1.5 font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        <span>{tr("Corriger et renvoyer la demande")}</span>
                        <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  </div>
                )}

                {emailUnverified && (
                  <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <ExclamationCircleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{t("auth.emailUnverifiedTitle")}</span>
                    </div>
                    <p className="pl-6 text-slate-700 dark:text-slate-300 leading-relaxed">
                      {t("auth.emailUnverifiedDesc")}
                    </p>
                    <div className="pl-6 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        loading={resendingVerification}
                        onClick={handleResendVerification}
                      >
                        {t("auth.resendVerificationBtn")}
                      </Button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("auth.emailLabel")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border ${
                    error && !email ? "border-red-500" : "border-slate-300 dark:border-slate-700"
                  } rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600`}
                  placeholder={t("auth.emailPlaceholder")}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("auth.passwordLabel")}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    {t("auth.forgotPasswordLink")}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full ${isRtl ? "pr-3.5 pl-10" : "pl-3.5 pr-10"} py-2 text-sm bg-white dark:bg-slate-950 border ${
                      error && !password ? "border-red-500" : "border-slate-300 dark:border-slate-700"
                    } rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600`}
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                    className={`absolute inset-y-0 ${
                      isRtl ? "left-0 pl-3" : "right-0 pr-3"
                    } flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300`}
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                {loading ? t("auth.signingIn") : t("auth.signInBtn")}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t("auth.noAccountYet")}{" "}
                <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                  {t("auth.createAccountLink")}
                </Link>
              </p>
            </div>
              </>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 dark:text-slate-500 lg:hidden">
          © {new Date().getFullYear()} EduSpace · CSFT Tunisie
        </div>
      </div>
    </div>
  );
}
