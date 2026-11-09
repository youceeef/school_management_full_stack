"use client";

import Link from "next/link";
import { AcademicCapIcon, UserGroupIcon, BeakerIcon, ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";

export default function Register() {
  const { t, tr, isRtl } = useLanguage();

  const accountTypes = [
    {
      title: t("auth.teacherRoleTitle"),
      subtitle: tr("Planification & Pédagogie"),
      description: t("auth.teacherRoleDesc"),
      href: "/register/professeur",
      icon: AcademicCapIcon,
    },
    {
      title: t("auth.studentRoleTitle"),
      subtitle: tr("Consultation & Téléchargements"),
      description: t("auth.studentRoleDesc"),
      href: "/register/eleve",
      icon: UserGroupIcon,
    },
    {
      title: t("auth.labManagerRoleTitle"),
      subtitle: tr("Supervision & Validation"),
      description: t("auth.labManagerRoleDesc"),
      href: "/register/responsable",
      icon: BeakerIcon,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-2">
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

      <div className="max-w-4xl w-full mx-auto my-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
            {t("auth.registerHubEyebrow")}
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
            {t("auth.registerHubTitle")}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t("auth.registerHubSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accountTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Link
                key={type.href}
                href={type.href}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-500 dark:hover:border-primary-500 p-6 flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{type.subtitle}</p>
                  <h2 className="mt-1 text-lg font-bold font-display text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {type.title}
                  </h2>
                  <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {type.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400">
                  <span>{t("auth.selectProfileCta")}</span>
                  <ArrowRightIcon
                    className={`w-4 h-4 transition-transform ${
                      isRtl ? "rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {t("auth.signInBtn")}
            </Link>
          </p>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} EduSpace · CSFT Tunisie
      </div>
    </div>
  );
}
