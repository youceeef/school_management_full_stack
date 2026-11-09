"use client";

import React from "react";
import Link from "next/link";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckCircleIcon,
  CpuChipIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import ThemeToggle from "./components/ThemeToggle";

const capabilities = [
  {
    number: "01. Gestion des Salles & Laboratoires",
    title: "Cartographie complète des amphithéâtres, salles de cours et laboratoires spécialisés",
    description:
      "Centralisez les capacités d'accueil, les typologies d'espaces et les disponibilités en temps réel pour éliminer les conflits d'affectation entre départements.",
    meta: "Amphithéâtres · Laboratoires · Salles de TP",
    span: "lg:col-span-2",
    icon: BuildingOffice2Icon,
  },
  {
    number: "02. Planification & Réservations",
    title: "Workflow de réservation en 4 étapes avec validation par les responsables",
    description:
      "Les enseignants réservent un créneau et associent le matériel requis ; les responsables de laboratoire valident ou motivent un refus instantanément.",
    meta: "Contrôle des créneaux · Notifications temps réel",
    span: "lg:col-span-1",
    icon: CalendarDaysIcon,
  },
  {
    number: "03. Inventaire des Équipements",
    title: "Suivi unitaire du matériel pédagogique et scientifique",
    description:
      "Affectez vidéoprojecteurs, postes informatiques, oscilloscopes et kits réseaux avec décompte automatique des quantités disponibles par créneau.",
    meta: "Quantités réservables · État du stock",
    span: "lg:col-span-1",
    icon: CpuChipIcon,
  },
  {
    number: "04. Bibliothèque Pédagogique",
    title: "Diffusion structurée des supports de cours et travaux pratiques",
    description:
      "Les enseignants publient leurs fascicules PDF, présentations et schémas techniques ; les étudiants consultent et téléchargent leurs ressources en un clic.",
    meta: "Supports PDF & Images · Téléchargement direct",
    span: "lg:col-span-2",
    icon: DocumentTextIcon,
  },
];

const rolesOverview = [
  {
    role: "Administrateur",
    scope: "Gouvernance & inventaire global",
    description:
      "Configure les salles, le catalogue d'équipements, les comptes utilisateurs et la matrice des rôles et permissions Spatie.",
    metrics: "Contrôle RBAC complet · Audit des ressources",
    href: "/login",
  },
  {
    role: "Responsable Laboratoire",
    scope: "Validation & supervision technique",
    description:
      "Examine les demandes de réservation de laboratoires et d'équipements, approuve les créneaux conformes ou notifie un motif de refus.",
    metrics: "Validation en 1 clic · Suivi du parc matériel",
    href: "/register/responsable",
  },
  {
    role: "Enseignant",
    scope: "Planification & partage pédagogique",
    description:
      "Planifie ses séances en laboratoire ou amphithéâtre, réserve les équipements nécessaires et publie ses supports de cours.",
    metrics: "Réservation guidée · Dépôt de documents",
    href: "/register/professeur",
  },
  {
    role: "Élève & Étudiant",
    scope: "Consultation & téléchargement",
    description:
      "Accède au portail de téléchargement des supports de cours partagés par les formateurs et gère son profil académique.",
    metrics: "Accès direct aux cours · Notifications",
    href: "/register/eleve",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element Brand wordmark */}
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
              Fonctionnalités
            </a>
            <a
              href="#espaces-roles"
              className="hover:text-slate-900 dark:hover:text-white underline-offset-4 hover:underline whitespace-nowrap shrink-0"
            >
              Espaces & Rôles
            </a>
            <a
              href="#impact"
              className="hover:text-slate-900 dark:hover:text-white underline-offset-4 hover:underline whitespace-nowrap shrink-0"
            >
              Impact
            </a>
            <Link
              href="/register"
              className="hover:text-slate-900 dark:hover:text-white underline-offset-4 hover:underline whitespace-nowrap shrink-0"
            >
              Inscription
            </Link>
          </nav>

          {/* Zone 3: Theme toggle & primary action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Se connecter
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
                    Centre Sectoriel de Formation en Télécommunications · CSFT Tunisie
                  </p>
                </div>

                <h1
                  className="font-display font-bold text-slate-900 dark:text-white tracking-tight text-balance leading-[1.1]"
                  style={{ fontSize: "clamp(2.25rem, 4vw, 3.75rem)" }}
                >
                  Gestion unifiée des salles, laboratoires et ressources pédagogiques.
                </h1>

                <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  EduSpace remplace les registres manuels par une plateforme institutionnelle centralisée. Planifiez vos créneaux de laboratoire, réservez le matériel scientifique et partagez vos supports de cours avec une traçabilité complète.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Accéder au tableau de bord
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Créer un compte académique
                  </Link>
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Authentification Laravel Sanctum</span>
                <span aria-hidden="true">·</span>
                <span>Contrôle d&apos;accès Spatie RBAC</span>
                <span aria-hidden="true">·</span>
                <span>Calendrier de disponibilité en temps réel</span>
              </div>
            </div>

            {/* Right Column: Live Architectural Workspace Preview Card */}
            <div className="lg:col-span-5 flex">
              <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Aperçu de l&apos;exploitation</p>
                      <h2 className="text-base font-semibold font-display text-slate-900 dark:text-white mt-0.5">
                        Planning des Laboratoires & Amphithéâtres
                      </h2>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-primary-600 dark:text-primary-400 font-medium">
                      Semaine en cours
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      {
                        room: "Laboratoire Réseaux & Fibre",
                        slot: "08:30 – 11:30",
                        requester: "Prof. Y. Kaabechi",
                        equipment: "12 Routeurs Cisco · 2 Analyseurs",
                        status: "Approuvée",
                        statusColor: "text-emerald-700 dark:text-emerald-400",
                      },
                      {
                        room: "Amphithéâtre Central A1",
                        slot: "11:30 – 13:30",
                        requester: "Soutenance PFE Multimédia",
                        equipment: "Projecteur 4K · Sonorisation",
                        status: "En cours",
                        statusColor: "text-primary-600 dark:text-primary-400",
                      },
                      {
                        room: "Laboratoire Systèmes Embarqués",
                        slot: "14:00 – 17:00",
                        requester: "TP Télécommunications",
                        equipment: "15 Kits Arduino · Oscilloscopes",
                        status: "En attente",
                        statusColor: "text-amber-700 dark:text-amber-400",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.room}</span>
                          <span className={`text-xs font-medium ${item.statusColor}`}>{item.status}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          <span>{item.slot}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-sans">{item.requester}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.equipment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Validation sans conflit d&apos;horaire ni de stock
                  </span>
                  <Link
                    href="/login"
                    className="font-semibold text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    Consulter le calendrier →
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
            {[
              {
                value: "4 Rôles",
                label: "Architecture RBAC dédiée",
                detail: "Admin · Responsable · Enseignant · Élève",
              },
              {
                value: "≤ 4h00",
                label: "Plafond par créneau réservé",
                detail: "Rotation optimale des laboratoires",
              },
              {
                value: "100%",
                label: "Vérification de disponibilité",
                detail: "Contrôle simultané salle + équipements",
              },
              {
                value: "24/7",
                label: "Accès aux supports de cours",
                detail: "Portail numérique pour les étudiants",
              },
            ].map((metric, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
              >
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{metric.label}</p>
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
                Architecture Fonctionnelle
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white text-balance">
                Conçu pour les exigences opérationnelles de l&apos;enseignement supérieur et technique.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Chaque module répond à un besoin précis du cycle académique : de la préparation matérielle des travaux pratiques jusqu&apos;à la distribution des supports de révision.
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
                Permissions & Espaces Dédiés
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white text-balance">
                Un environnement adapté à chaque acteur de l&apos;établissement.
              </h2>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap shrink-0"
            >
              Choisir un profil d&apos;inscription
              <ArrowRightIcon className="w-4 h-4" />
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
                    Accéder à cet espace
                    <ArrowRightIcon className="w-3.5 h-3.5" />
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
            <span>Système de Gestion des Ressources Éducatives (CSFT / TSE Consultant INT)</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-white">
              Connexion
            </Link>
            <Link href="/register" className="hover:text-slate-900 dark:hover:text-white">
              Inscription
            </Link>
            <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white">
              Tableau de bord
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
