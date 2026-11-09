"use client";

import Link from "next/link";
import { ExclamationTriangleIcon, ServerStackIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "../context/LanguageContext";
import { useSystemHealth } from "../context/SystemHealthContext";

export default function ApiCompatibilityBanner() {
  const { tr } = useLanguage();
  const { isAdmin, health, loading, error, compatibility } = useSystemHealth();

  if (!isAdmin || loading) return null;

  let message = null;
  let tone = "amber";
  let Icon = ExclamationTriangleIcon;

  if (error) {
    message = "Impossible de vérifier l’état de l’API.";
  } else if (compatibility.status !== "compatible") {
    message = "La version du frontend n’est pas compatible avec celle de l’API.";
    tone = "red";
  } else if (health?.status !== "ok") {
    message = "Un service requis par l’API est dégradé.";
  }

  if (!message) return null;

  if (tone === "amber" && health?.status !== "ok") {
    Icon = ServerStackIcon;
  }

  const classes =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200";

  return (
    <div role="alert" className={`border-b ${classes}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="font-medium">{tr(message)}</span>
        </div>
        <Link
          href="/dashboard/system-status"
          className="font-semibold underline underline-offset-4 whitespace-nowrap"
        >
          {tr("Voir l’état du système")}
        </Link>
      </div>
    </div>
  );
}
