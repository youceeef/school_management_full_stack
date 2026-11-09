"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CpuChipIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import ThemeToggle from "./components/ThemeToggle";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { useLanguage } from "./context/LanguageContext";

export default function Home() {
  const { t, isRtl } = useLanguage();
  const DirectionalArrow = isRtl ? ArrowLeftIcon : ArrowRightIcon;

  const capabilities = [
    {
      number: t("landing.cap1Number"),
      title: t("landing.cap1Title"),
      description: t("landing.cap1Desc"),
      meta: t("landing.cap1Meta"),
      span: "lg:col-span-2",
      icon: BuildingOffice2Icon,
    },
    {
      number: t("landing.cap2Number"),
      title: t("landing.cap2Title"),
      description: t("landing.cap2Desc"),
      meta: t("landing.cap2Meta"),
      span: "lg:col-span-1",
      icon: CalendarDaysIcon,
    },
    {
      number: t("landing.cap3Number"),
      title: t("landing.cap3Title"),
      description: t("landing.cap3Desc"),
      meta: t("landing.cap3Meta"),
      span: "lg:col-span-1",
      icon: CpuChipIcon,
    },
    {
      number: t("landing.cap4Number"),
      title: t("landing.cap4Title"),
      description: t("landing.cap4Desc"),
      meta: t("landing.cap4Meta"),
      span: "lg:col-span-2",
      icon: DocumentTextIcon,
    },
  ];

  const rolesOverview = [
    {
      role: t("landing.role1Title"),
      scope: t("landing.role1Scope"),
      description: t("landing.role1Desc"),
      metrics: t("landing.role1Metrics"),
      href: "/login",
    },
    {
      role: t("landing.role2Title"),
      scope: t("landing.role2Scope"),
      description: t("landing.role2Desc"),
      metrics: t("landing.role2Metrics"),
      href: "/register/responsable",
    },
    {
      role: t("landing.role3Title"),
      scope: t("landing.role3Scope"),
      description: t("landing.role3Desc"),
      metrics: t("landing.role3Metrics"),
      href: "/register/professeur",
    },
    {
      role: t("landing.role4Title"),
      scope: t("landing.role4Scope"),
      description: t("landing.role4Desc"),
      metrics: t("landing.role4Metrics"),
      href: "/register/eleve",
    },
  ];

  const previewSlots = [
    {
      room: t("landing.previewSlot1Room"),
      slot: "08:30 – 11:30",
      requester: t("landing.previewSlot1Req"),
      equipment: t("landing.previewSlot1Equip"),
      status: t("landing.previewSlot1Status"),
      statusColor: "text-emerald-700 dark:text-emerald-400",
    },
    {
      room: t("landing.previewSlot2Room"),
      slot: "11:30 – 13:30",
      requester: t("landing.previewSlot2Req"),
      equipment: t("landing.previewSlot2Equip"),
      status: t("landing.previewSlot2Status"),
      statusColor: "text-primary-600 dark:text-primary-400",
    },
    {
      room: t("landing.previewSlot3Room"),
      slot: "14:00 – 17:00",
      requester: t("landing.previewSlot3Req"),
      equipment: t("landing.previewSlot3Equip"),
      status: t("landing.previewSlot3Status"),
      statusColor: "text-amber-700 dark:text-amber-400",
    },
  ];

  const metrics = [
    {
      value: t("landing.metric1Value"),
      label: t("landing.metric1Label"),
      detail: t("landing.metric1Detail"),
    },
    {
      value: t("landing.metric2Value"),
      label: t("landing.metric2Label"),
      detail: t("landing.metric2Detail"),
    },
    {
      value: t("landing.metric3Value"),
      label: t("landing.metric3Label"),
      detail: t("landing.metric3Detail"),
    },
    {
      value: t("landing.metric4Value"),
      label: t("landing.metric4Label"),
      detail: t("landing.metric4Detail"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand wordmark */}
          <Link
            href="/"
            className="text-lg font-bold font-display tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            EduSpace
          </Link>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#fonctionnalites"
              className="hover:text-slate-900 dark:hover:text-white underline-offset-4 hover:underline whitespace-nowrap shrink-0"
            >
              {t("landing.navFeatures")}
            </a>
            <a
              href="#espaces-roles"
              className="hover:text-slate-900 dark:hover:text-white underline-offset-4 hover:underline whitespace-nowrap shrink-0"
            >
              {t("landing.navRoles")}
            </a>
            <a
              href="#impact"
              className="hover:text-slate-900 dark:hover:text-white underline-offset-4 hover:underline whitespace-nowrap shrink-0"
            >
              {t("landing.navImpact")}
            </a>
            <Link
              href="/register"
              className="hover:text-slate-900 dark:hover:text-white underline-offset-4 hover:underline whitespace-nowrap shrink-0"
            >
              {t("landing.navRegister")}
            </Link>
          </nav>

          {/* Zone 3: Language switcher, Theme toggle & primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {t("landing.loginCta")}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t("landing.institutionTag")}
                  </p>
                </div>

                <h1
                  className="font-display font-bold text-slate-900 dark:text-white tracking-tight text-balance leading-[1.15]"
                  style={{ fontSize: "clamp(2.25rem, 4vw, 3.75rem)" }}
                >
                  {t("landing.heroTitle")}
                </h1>

                <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  {t("landing.heroSubtitle")}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {t("landing.primaryCta")}
                    <DirectionalArrow className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {t("landing.secondaryCta")}
                  </Link>
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{t("landing.trust1")}</span>
                <span aria-hidden="true">·</span>
                <span>{t("landing.trust2")}</span>
                <span aria-hidden="true">·</span>
                <span>{t("landing.trust3")}</span>
              </div>
            </div>

            {/* Right Column: Live Architectural Workspace Preview Card */}
            <div className="lg:col-span-5 flex">
              <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t("landing.previewTag")}
                      </p>
                      <h2 className="text-base font-semibold font-display text-slate-900 dark:text-white mt-0.5">
                        {t("landing.previewTitle")}
                      </h2>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-primary-600 dark:text-primary-400 font-medium">
                      {t("landing.previewBadge")}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {previewSlots.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {item.room}
                          </span>
                          <span className={`text-xs font-medium ${item.statusColor}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          <span dir="ltr">{item.slot}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-sans">{item.requester}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {item.equipment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {t("landing.previewFooterText")}
                  </span>
                  <Link
                    href="/login"
                    className="font-semibold text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    {t("landing.previewFooterLink")}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width 4-Column Institutional Metric Strip */}
          <div
            id="impact"
            className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-8 border-t border-slate-200 dark:border-slate-800"
          >
            {metrics.map((metric, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
              >
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {metric.label}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{metric.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core Capabilities Bento Grid */}
        <section
          id="fonctionnalites"
          className="py-16 lg:py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                {t("landing.capEyebrow")}
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white text-balance">
                {t("landing.capHeading")}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                {t("landing.capSubtitle")}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {capabilities.map((cap) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={cap.number}
                    className={`${cap.span} rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-6 sm:p-8 flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                          {cap.number}
                        </span>
                        <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <h3 className="mt-4 text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white text-balance">
                        {cap.title}
                      </h3>
                      <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {cap.description}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      {cap.meta}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Role-Specific Access Section */}
        <section id="espaces-roles" className="py-16 lg:py-24 max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                {t("landing.rolesEyebrow")}
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white text-balance">
                {t("landing.rolesHeading")}
              </h2>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap shrink-0"
            >
              {t("landing.rolesCta")}
              <DirectionalArrow className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rolesOverview.map((item) => (
              <div
                key={item.role}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.scope}</p>
                  <h3 className="mt-1 text-lg font-bold font-display text-slate-900 dark:text-white">
                    {item.role}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{item.metrics}</p>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {t("landing.accessRoleSpace")}
                    <DirectionalArrow className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-bold font-display text-slate-900 dark:text-white">EduSpace</span>
            <span aria-hidden="true">·</span>
            <span>{t("landing.footerDesc")}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-white">
              {t("landing.footerLogin")}
            </Link>
            <Link href="/register" className="hover:text-slate-900 dark:hover:text-white">
              {t("common.register")}
            </Link>
            <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white">
              {t("common.dashboard")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

