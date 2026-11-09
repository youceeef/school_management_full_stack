"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { forgotPassword } from "../services/authService";
import toast from "../utils/toast";
import ThemeToggle from "../components/ThemeToggle";
import Button from "../components/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Veuillez entrer une adresse email valide");
      }

      await forgotPassword(email);
      toast.success("Un email de réinitialisation a été envoyé à votre adresse email");
      router.push("/login");
    } catch (error) {
      toast.error(error.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Retour à la connexion
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full mx-auto my-12">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="mb-6">
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
              Mot de passe oublié
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Entrez votre adresse email académique pour recevoir un lien de réinitialisation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                placeholder="nom.prenom@etablissement.tn"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
            </Button>
          </form>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} EduSpace · CSFT Tunisie
      </div>
    </div>
  );
}
