"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "../../utils/toast";
import LoadingSpinner from "../../components/LoadingSpinner";
import Button from "../../components/Button";
import { Card, PageHeader } from "../../components/ui";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  BeakerIcon,
  CheckIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldCheckIcon,
  EyeIcon,
  BuildingOffice2Icon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import {
  getAccountRequests,
  reviewAccountRequest,
} from "../../services/accountRequestService";
import AdminRoute from "../../components/AdminRoute";
import AccountRequestDetailsModal from "../../components/AccountRequestDetailsModal";
import { useLanguage } from "../../context/LanguageContext";

export default function AccountRequestsPage() {
  const { tr, locale, isRtl } = useLanguage();

  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
  });
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplicantId, setSelectedApplicantId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const formatRoleLabel = useCallback(
    (role) => {
      switch (role) {
        case "enseignant":
          return tr("Enseignant");
        case "responsable_laboratoire":
          return tr("Responsable de laboratoire");
        case "admin":
          return tr("Administrateur");
        case "eleve":
          return tr("Élève / Étudiant");
        default:
          return role || "—";
      }
    },
    [tr]
  );

  const formatStatusLabel = useCallback(
    (status) => {
      switch (status) {
        case "pending":
          return tr("En attente");
        case "approved":
          return tr("Approuvé");
        case "rejected":
          return tr("Refusé");
        case "suspended":
          return tr("Suspendu");
        default:
          return status || "—";
      }
    },
    [tr]
  );

  const fetchRequests = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = {
          page,
          per_page: 15,
          status: activeTab === "all" ? undefined : activeTab,
          requested_role: roleFilter || undefined,
          search: searchTerm.trim() || undefined,
        };

        const response = await getAccountRequests(params);
        setRequests(response.data || []);
        if (response.meta) {
          setMeta({
            current_page: response.meta.current_page || 1,
            last_page: response.meta.last_page || 1,
            per_page: response.meta.per_page || 15,
            total: response.meta.total || 0,
          });
          if (response.meta.counts) {
            setCounts(response.meta.counts);
          }
        }
      } catch (error) {
        console.error("Error fetching account requests:", error);
        toast.error(
          tr(error.message || "Erreur lors du chargement des demandes de compte")
        );
        setRequests([]);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, roleFilter, searchTerm, tr]
  );

  useEffect(() => {
    fetchRequests(currentPage);
  }, [fetchRequests, currentPage]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRequests(1);
  };

  const handleReview = async (applicant, status) => {
    const isApproval = status === "approved";
    const roleLabel = formatRoleLabel(applicant.requested_role);
    const applicantName = `${applicant.first_name} ${applicant.last_name}`;

    const promptText = isApproval
      ? tr(
          `Approuver la demande de ${applicantName} et lui attribuer le rôle ${roleLabel} ?`
        )
      : tr(
          `Refuser la demande de ${applicantName} et lui refuser l'accès au tableau de bord ?`
        );

    const confirmed = await toast.confirm(promptText);
    if (!confirmed) return;

    try {
      setReviewingId(applicant.id);
      const res = await reviewAccountRequest(applicant.id, status);
      toast.success(tr(res.message));
      await fetchRequests(currentPage);
    } catch (err) {
      toast.error(
        tr(err.message || "Erreur lors de la mise à jour de la demande")
      );
    } finally {
      setReviewingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale === "ar" ? "ar-TN" : locale === "en" ? "en-US" : "fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {formatStatusLabel("approved")}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {formatStatusLabel("rejected")}
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            {formatStatusLabel("suspended")}
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {formatStatusLabel("pending")}
          </span>
        );
    }
  };

  const getRoleBadge = (role) => {
    const isTeacher = role === "enseignant";
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
          isTeacher
            ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
            : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800"
        }`}
      >
        {isTeacher ? (
          <AcademicCapIcon className="w-3.5 h-3.5" />
        ) : (
          <BeakerIcon className="w-3.5 h-3.5" />
        )}
        {formatRoleLabel(role)}
      </span>
    );
  };

  const tabs = [
    {
      id: "pending",
      label: tr("En attente"),
      count: counts.pending,
      icon: ClockIcon,
      color: "amber",
    },
    {
      id: "approved",
      label: tr("Approuvés"),
      count: counts.approved,
      icon: CheckCircleIcon,
      color: "emerald",
    },
    {
      id: "rejected",
      label: tr("Refusés"),
      count: counts.rejected,
      icon: XCircleIcon,
      color: "red",
    },
    {
      id: "suspended",
      label: tr("Suspendus"),
      count: counts.suspended,
      icon: NoSymbolIcon,
      color: "slate",
    },
    {
      id: "all",
      label: tr("Toutes les demandes"),
      count: counts.all,
      icon: UserGroupIcon,
      color: "indigo",
    },
  ];

  return (
    <AdminRoute>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title={tr("Centre d'approbation des comptes")}
          description={tr(
            "Vérifiez, approuvez ou refusez les demandes d'accès des enseignants et responsables de laboratoire."
          )}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRequests(currentPage)}
              disabled={loading}
              className="gap-2"
            >
              <ArrowPathIcon
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              {tr("Actualiser")}
            </Button>
          }
        />

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => handleTabChange("pending")}
            className={`p-4 rounded-xl border text-start transition-all ${
              activeTab === "pending"
                ? "ring-2 ring-amber-500 bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {tr("En attente")}
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
                <ClockIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {counts.pending}
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("approved")}
            className={`p-4 rounded-xl border text-start transition-all ${
              activeTab === "approved"
                ? "ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {tr("Approuvés")}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {counts.approved}
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("rejected")}
            className={`p-4 rounded-xl border text-start transition-all ${
              activeTab === "rejected"
                ? "ring-2 ring-red-500 bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {tr("Refusés")}
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center">
                <XCircleIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {counts.rejected}
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("all")}
            className={`p-4 rounded-xl border text-start transition-all ${
              activeTab === "all"
                ? "ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {tr("Total demandes")}
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center">
                <UserGroupIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {counts.all}
            </p>
          </button>
        </div>

        {/* Tab Selector & Filter Bar */}
        <Card className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900"
                          : "bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <MagnifyingGlassIcon
                className={`w-5 h-5 absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                  isRtl ? "right-3" : "left-3"
                }`}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={tr("Rechercher par nom, prénom ou email...")}
                className={`w-full py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isRtl ? "pr-10 pl-3" : "pl-10 pr-3"
                }`}
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2 px-3 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{tr("Tous les rôles demandés")}</option>
              <option value="enseignant">{tr("Enseignant")}</option>
              <option value="responsable_laboratoire">
                {tr("Responsable de laboratoire")}
              </option>
            </select>

            <Button type="submit" size="sm" className="whitespace-nowrap">
              {tr("Filtrer")}
            </Button>

            {(searchTerm || roleFilter) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("");
                  setCurrentPage(1);
                }}
              >
                {tr("Réinitialiser")}
              </Button>
            )}
          </form>
        </Card>

        {/* Content Section: Desktop Table & Mobile Cards */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {tr("Chargement des demandes de compte...")}
            </p>
          </div>
        ) : requests.length === 0 ? (
          <Card className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {tr("Aucune demande trouvée")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              {activeTab === "pending"
                ? tr(
                    "Toutes les demandes de comptes ont été traitées. Les nouvelles demandes apparaîtront ici."
                  )
                : tr("Aucun compte ne correspond aux critères de filtre sélectionnés.")}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table (hidden on mobile) */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-start border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-start">{tr("Demandeur")}</th>
                    <th className="py-3.5 px-4 text-start">{tr("Rôle demandé")}</th>
                    <th className="py-3.5 px-4 text-start">{tr("Statut")}</th>
                    <th className="py-3.5 px-4 text-start">{tr("Date")}</th>
                    <th className="py-3.5 px-4 text-start">{tr("Revue par")}</th>
                    <th className="py-3.5 px-4 text-end">{tr("Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {requests.map((applicant) => {
                    const isProcessing = reviewingId === applicant.id;
                    const isPending = applicant.approval_status === "pending";
                    const isApproved = applicant.approval_status === "approved";
                    const isRejected = applicant.approval_status === "rejected";

                    return (
                      <tr
                        key={applicant.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Applicant details */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApplicantId(applicant.id);
                                setIsDetailsOpen(true);
                              }}
                              className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center shrink-0 hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
                              title={tr("Examiner")}
                            >
                              {applicant.first_name?.[0]?.toUpperCase()}
                              {applicant.last_name?.[0]?.toUpperCase()}
                            </button>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedApplicantId(applicant.id);
                                  setIsDetailsOpen(true);
                                }}
                                className="font-medium text-slate-900 dark:text-white truncate hover:text-indigo-600 dark:hover:text-indigo-400 text-start cursor-pointer"
                              >
                                {applicant.first_name} {applicant.last_name}
                              </button>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                                <EnvelopeIcon className="w-3.5 h-3.5 shrink-0" />
                                {applicant.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Requested Role & Institution */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              {getRoleBadge(applicant.requested_role)}
                              {applicant.proof_document && (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900"
                                  title={`${applicant.proof_document.name} (${applicant.proof_document.is_pdf ? 'PDF' : 'IMG'})`}
                                >
                                  <PaperClipIcon className="w-3 h-3" />
                                  {applicant.proof_document.is_pdf ? "PDF" : "IMG"}
                                </span>
                              )}
                            </div>
                            {applicant.institution && (
                              <span
                                className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 max-w-[220px] truncate"
                                title={`${applicant.institution}${applicant.department ? ' - ' + applicant.department : ''}`}
                              >
                                <BuildingOffice2Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{applicant.institution}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Approval Status */}
                        <td className="py-3.5 px-4">
                          {getStatusBadge(applicant.approval_status)}
                        </td>

                        {/* Registration Date */}
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                          <span className="flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(applicant.created_at)}
                          </span>
                        </td>

                        {/* Reviewer info */}
                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                          {applicant.reviewed_by ? (
                            <div>
                              <p className="font-medium text-slate-700 dark:text-slate-200">
                                {applicant.reviewed_by.first_name}{" "}
                                {applicant.reviewed_by.last_name}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {formatDate(applicant.reviewed_at)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApplicantId(applicant.id);
                                setIsDetailsOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                              title={tr("Examiner les détails de la demande")}
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                              {tr("Examiner")}
                            </button>

                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleReview(applicant, "approved")
                                  }
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-50"
                                >
                                  <CheckIcon className="w-3.5 h-3.5" />
                                  {tr("Approuver")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleReview(applicant, "rejected")
                                  }
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition-colors disabled:opacity-50"
                                >
                                  <XMarkIcon className="w-3.5 h-3.5" />
                                  {tr("Refuser")}
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleReview(applicant, "rejected")
                                }
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition-colors disabled:opacity-50"
                              >
                                <XMarkIcon className="w-3.5 h-3.5" />
                                {tr("Révoquer")}
                              </button>
                            )}

                            {isRejected && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleReview(applicant, "approved")
                                }
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 transition-colors disabled:opacity-50"
                              >
                                <CheckIcon className="w-3.5 h-3.5" />
                                {tr("Réexaminer")}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (visible on < md) */}
            <div className="md:hidden space-y-3">
              {requests.map((applicant) => {
                const isProcessing = reviewingId === applicant.id;
                const isPending = applicant.approval_status === "pending";
                const isApproved = applicant.approval_status === "approved";
                const isRejected = applicant.approval_status === "rejected";

                return (
                  <Card key={applicant.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center shrink-0">
                          {applicant.first_name?.[0]?.toUpperCase()}
                          {applicant.last_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {applicant.first_name} {applicant.last_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <EnvelopeIcon className="w-3.5 h-3.5" />
                            {applicant.email}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(applicant.approval_status)}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 block mb-1">
                          {tr("Rôle demandé")}
                        </span>
                        {getRoleBadge(applicant.requested_role)}
                      </div>
                      <div className="text-end">
                        <span className="text-slate-400 block mb-1">
                          {tr("Demande reçue le")}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {formatDate(applicant.created_at)}
                        </span>
                      </div>
                    </div>

                    {applicant.institution && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <BuildingOffice2Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {applicant.institution}
                          {applicant.department ? ` (${applicant.department})` : ""}
                        </span>
                      </div>
                    )}

                    {applicant.proof_document && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <PaperClipIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {applicant.proof_document.name}
                        </span>
                      </div>
                    )}

                    {applicant.phone && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <PhoneIcon className="w-3.5 h-3.5" />
                        <span>{applicant.phone}</span>
                      </div>
                    )}

                    {applicant.reviewed_by && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                        <span className="text-slate-400">{tr("Traité par")}:</span>{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {applicant.reviewed_by.first_name}{" "}
                          {applicant.reviewed_by.last_name}
                        </span>{" "}
                        ({formatDate(applicant.reviewed_at)})
                      </p>
                    )}

                    {/* Mobile Action Buttons */}
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApplicantId(applicant.id);
                          setIsDetailsOpen(true);
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                        {tr("Examiner")}
                      </button>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReview(applicant, "approved")}
                              disabled={isProcessing}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                            >
                              <CheckIcon className="w-4 h-4" />
                              {tr("Approuver")}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReview(applicant, "rejected")}
                              disabled={isProcessing}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition-colors disabled:opacity-50"
                            >
                              <XMarkIcon className="w-4 h-4" />
                              {tr("Refuser")}
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => handleReview(applicant, "rejected")}
                            disabled={isProcessing}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition-colors disabled:opacity-50"
                          >
                            <XMarkIcon className="w-4 h-4" />
                            {tr("Révoquer l'accès")}
                          </button>
                        )}

                        {isRejected && (
                          <button
                            type="button"
                            onClick={() => handleReview(applicant, "approved")}
                            disabled={isProcessing}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 transition-colors disabled:opacity-50"
                          >
                            <CheckIcon className="w-4 h-4" />
                            {tr("Réexaminer et approuver")}
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination footer */}
            {meta.last_page > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
                <p>
                  {tr("Affichage de la page")} {meta.current_page} {tr("sur")}{" "}
                  {meta.last_page} ({meta.total} {tr("demandes au total")})
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.current_page <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    {tr("Précédent")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(meta.last_page, p + 1))
                    }
                  >
                    {tr("Suivant")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account Request Details & Proof Viewer Modal */}
      <AccountRequestDetailsModal
        isOpen={isDetailsOpen}
        applicantId={selectedApplicantId}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedApplicantId(null);
        }}
        onReviewSuccess={async () => {
          await fetchRequests(currentPage);
        }}
      />
    </AdminRoute>
  );
}
