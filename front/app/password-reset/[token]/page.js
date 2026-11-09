"use client";

import { useState, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AcademicCapIcon, KeyIcon } from "@heroicons/react/24/outline";
import { resetPassword } from "../../services/authService";
import toast from "../../utils/toast";
import ThemeToggle from "../../components/ThemeToggle";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import { isStrongPassword, PASSWORD_REQUIREMENTS } from "../../utils/password";
import { useLanguage } from "../../context/LanguageContext";

export default function ResetPassword({ params }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <LoadingSpinner />
        </div>
      }
    >
      <ResetPasswordContent params={params} />
    </Suspense>
  );
}

function ResetPasswordContent({ params }) {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = use(params).token;
  const { tr } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isStrongPassword(password)) {
        throw new Error(tr(PASSWORD_REQUIREMENTS));
      }

      if (password !== passwordConfirmation) {
        throw new Error(tr("Les mots de passe ne correspondent pas"));
      }

      await resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      toast.success(tr("Votre mot de passe a été réinitialisé avec succès"));
      router.push("/login");
    } catch (error) {
      toast.error(tr(error.message || "Une erreur est survenue. Veuillez réessayer."));
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-xl max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white">
            {tr("Lien de réinitialisation invalide")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {tr("Ce lien est invalide ou a expiré. Veuillez effectuer une nouvelle demande.")}
          </p>
          <Link href="/forgot-password" className="inline-block pt-2">
            <Button variant="primary">{tr("Demander un nouveau lien")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5" />
            </div>
            <span className="text-lg font-display font-bold text-slate-900 dark:text-white">
              EduSpace
            </span>
          </Link>
          <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-200/60 dark:border-primary-900/60 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-3">
            <KeyIcon className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            {tr("Définir un nouveau mot de passe")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {tr("Compte :")} <strong className="text-slate-800 dark:text-slate-200">{email}</strong>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-xl shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {tr("Nouveau mot de passe")}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={12}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                placeholder={tr("Minimum 12 caractères")}
              />
            </div>

            <div>
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {tr("Confirmer le mot de passe")}
              </label>
              <input
                type="password"
                id="password_confirmation"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                minLength={12}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                placeholder={tr("Répétez le mot de passe")}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" loading={loading} variant="primary" className="w-full">
                {loading ? tr("Réinitialisation en cours...") : tr("Enregistrer le mot de passe")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
