"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "../utils/toast";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Button from "../components/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();
  const { t, tr, isRtl } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
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
      await login(email, password);
      toast.success(tr("Connexion réussie"));
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(tr(err.message || "Identifiants invalides ou serveur momentanément indisponible"));
    } finally {
      setLoading(false);
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
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 dark:text-slate-500 lg:hidden">
          © {new Date().getFullYear()} EduSpace · CSFT Tunisie
        </div>
      </div>
    </div>
  );
}
