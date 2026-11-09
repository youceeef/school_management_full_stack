"use client";

import Link from "next/link";
import { LockClosedIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import Button from "../components/Button";
import { useLanguage } from "../context/LanguageContext";

export default function UnauthorizedPage() {
  const { tr } = useLanguage();

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-md w-full text-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200/70 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
          <LockClosedIcon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            {tr("Accès restreint")}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {tr("Votre compte ne dispose pas des habilitations nécessaires pour consulter cette section.")}
          </p>
        </div>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button variant="primary" icon={ArrowLeftIcon}>
              {tr("Retourner au tableau de bord")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
