"use client";

import {
  ArrowPathIcon,
  CheckCircleIcon,
  CircleStackIcon,
  CloudIcon,
  CodeBracketIcon,
  ExclamationTriangleIcon,
  ServerStackIcon,
} from "@heroicons/react/24/outline";
import AdminRoute from "../../components/AdminRoute";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Card, PageHeader, StatsCard } from "../../components/ui";
import { useLanguage } from "../../context/LanguageContext";
import { useSystemHealth } from "../../context/SystemHealthContext";
import { shortVersion } from "../../utils/systemCompatibility";

const STATUS_STYLES = {
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  error:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
};

function SystemStatusPage() {
  const { tr, dateLocale } = useLanguage();
  const {
    health,
    loading,
    error,
    lastCheckedAt,
    compatibility,
    frontendVersion,
    frontendBuildTime,
    expectedApiSchemaVersion,
    refresh,
  } = useSystemHealth();

  const formatDate = (value) => {
    if (!value) return "—";

    return new Intl.DateTimeFormat(dateLocale, {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(new Date(value));
  };

  const statusBadge = (status) => (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold ${
        STATUS_STYLES[status] || STATUS_STYLES.error
      }`}
    >
      {tr(status === "ok" ? "Opérationnel" : "Indisponible")}
    </span>
  );

  const checks = [
    {
      key: "database",
      label: "Base de données",
      icon: CircleStackIcon,
    },
    {
      key: "profile_storage",
      label: "Stockage des profils",
      icon: CloudIcon,
    },
    {
      key: "document_storage",
      label: "Stockage des documents",
      icon: ServerStackIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="État du système"
        description="Vérifiez la compatibilité du frontend, la version de l’API et la disponibilité des dépendances critiques."
        actions={[
          {
            children: "Actualiser",
            icon: ArrowPathIcon,
            variant: "secondary",
            onClick: refresh,
            loading,
          },
        ]}
      />

      {loading && !health ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <Card>
          <div className="flex flex-col items-center text-center py-8">
            <ExclamationTriangleIcon className="w-10 h-10 text-amber-500" />
            <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
              {tr("Impossible de vérifier l’état de l’API.")}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {tr("Réessayez après avoir vérifié le déploiement Render.")}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Compatibilité"
              value={
                compatibility.compatible
                  ? tr("Compatible")
                  : tr("Incompatible")
              }
              icon={compatibility.compatible ? CheckCircleIcon : ExclamationTriangleIcon}
              subtitle={`${tr("Schéma attendu")}: ${expectedApiSchemaVersion}`}
            />
            <StatsCard
              title="Version frontend"
              value={shortVersion(frontendVersion)}
              icon={CodeBracketIcon}
            />
            <StatsCard
              title="Version API"
              value={shortVersion(health?.version)}
              icon={ServerStackIcon}
            />
          </div>

          <Card title="Versions déployées" subtitle="Informations de compatibilité et de compilation">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-sm">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{tr("Commit frontend")}</dt>
                <dd className="mt-1 font-mono break-all text-slate-900 dark:text-slate-100">
                  {frontendVersion}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{tr("Commit API")}</dt>
                <dd className="mt-1 font-mono break-all text-slate-900 dark:text-slate-100">
                  {health?.version || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{tr("Schéma frontend attendu")}</dt>
                <dd className="mt-1 font-mono text-slate-900 dark:text-slate-100">
                  {compatibility.expected}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{tr("Schéma API déployé")}</dt>
                <dd className="mt-1 font-mono text-slate-900 dark:text-slate-100">
                  {compatibility.actual || tr("Non disponible")}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{tr("Compilation frontend")}</dt>
                <dd className="mt-1 text-slate-900 dark:text-slate-100">
                  {formatDate(frontendBuildTime)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{tr("Compilation API")}</dt>
                <dd className="mt-1 text-slate-900 dark:text-slate-100">
                  {formatDate(health?.build_time)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{tr("Dernière vérification")}</dt>
                <dd className="mt-1 text-slate-900 dark:text-slate-100">
                  {formatDate(lastCheckedAt)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Dépendances critiques" subtitle="État fourni par le point de contrôle de l’API">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {checks.map(({ key, label, icon: Icon }) => {
                const check = health?.checks?.[key];
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {tr(label)}
                        </span>
                      </div>
                      {statusBadge(check?.status)}
                    </div>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      {tr("Latence")}: {check?.latency_ms ?? "—"} ms
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default function ProtectedSystemStatusPage() {
  return (
    <AdminRoute>
      <SystemStatusPage />
    </AdminRoute>
  );
}
