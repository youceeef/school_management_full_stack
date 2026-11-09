"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  XMarkIcon,
  CheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  UserCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  BeakerIcon,
  BuildingOffice2Icon,
  IdentificationIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  DocumentTextIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";
import LoadingSpinner from "./LoadingSpinner";
import {
  getAccountRequestById,
  reviewAccountRequest,
  previewProofDocument,
  downloadProofDocument,
} from "../services/accountRequestService";
import { useLanguage } from "../context/LanguageContext";
import toast from "../utils/toast";

export default function AccountRequestDetailsModal({
  isOpen,
  onClose,
  applicantId,
  onReviewSuccess,
}) {
  const { tr, locale, isRtl } = useLanguage();
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [reasonInputState, setReasonInputState] = useState({
    isOpen: false,
    status: null,
    reason: "",
  });

  const cleanupPreview = useCallback(() => {
    if (previewData?.url) {
      URL.revokeObjectURL(previewData.url);
      setPreviewData(null);
    }
  }, [previewData]);

  const fetchDetails = useCallback(async () => {
    if (!applicantId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getAccountRequestById(applicantId);
      setApplicant(res.data || null);
    } catch (err) {
      console.error("Error fetching account request details:", err);
      setError(
        err.message ||
          tr("Impossible de charger les détails de cette demande.")
      );
    } finally {
      setLoading(false);
    }
  }, [applicantId, tr]);

  useEffect(() => {
    if (isOpen && applicantId) {
      fetchDetails();
    } else {
      setApplicant(null);
      setError(null);
      cleanupPreview();
      setReasonInputState({ isOpen: false, status: null, reason: "" });
    }
  }, [isOpen, applicantId, fetchDetails, cleanupPreview]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        cleanupPreview();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, cleanupPreview]);

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(
        locale === "ar" ? "ar-TN" : locale === "en" ? "en-US" : "fr-FR",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Ko";
    const k = 1024;
    if (bytes < k * k) {
      return (bytes / k).toFixed(1) + " Ko";
    }
    return (bytes / (k * k)).toFixed(2) + " Mo";
  };

  const getRoleLabel = (role) => {
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
  };

  const formatReviewActionLabel = (action) => {
    switch (action) {
      case "approved":
        return tr("Demande approuvée");
      case "reactivated":
        return tr("Compte réactivé");
      case "suspended":
        return tr("Compte suspendu");
      case "rejected":
        return tr("Demande refusée");
      case "resubmitted":
        return tr("Demande corrigée et renvoyée");
      default:
        return action;
    }
  };

  const handleInitiateReviewWithReason = (status) => {
    setReasonInputState({ isOpen: true, status, reason: "" });
  };

  const handleConfirmReviewWithReason = async () => {
    if (!reasonInputState.reason || reasonInputState.reason.trim().length < 5) {
      toast.error(tr("Veuillez indiquer un motif d'au moins 5 caractères."));
      return;
    }
    await executeReview(reasonInputState.status, reasonInputState.reason.trim());
  };

  const executeReview = async (status, reason = null) => {
    if (!applicant) return;
    try {
      setReviewing(true);
      const res = await reviewAccountRequest(applicant.id, status, reason);
      toast.success(tr(res.message));
      if (onReviewSuccess) {
        onReviewSuccess(res.data);
      }
      setReasonInputState({ isOpen: false, status: null, reason: "" });
      cleanupPreview();
      onClose();
    } catch (err) {
      toast.error(
        tr(err.message || "Erreur lors de la mise à jour de la demande")
      );
    } finally {
      setReviewing(false);
    }
  };

  const handleApproveOrReactivate = async () => {
    if (!applicant) return;
    const isReactivation = applicant.approval_status === "suspended";
    const applicantName = `${applicant.first_name} ${applicant.last_name}`;
    const roleName = getRoleLabel(applicant.requested_role);

    const promptText = isReactivation
      ? tr(`Réactiver le compte de ${applicantName} et lui restituer ses accès ?`)
      : tr(`Approuver la demande de ${applicantName} et lui attribuer le rôle ${roleName} ?`);

    const confirmed = await toast.confirm(promptText);
    if (!confirmed) return;

    await executeReview("approved");
  };

  const handlePreviewProof = async () => {
    if (!applicant?.id) return;
    if (previewData) {
      cleanupPreview();
      return;
    }
    try {
      setPreviewLoading(true);
      const res = await previewProofDocument(applicant.id);
      const isPdf =
        res.contentType?.includes("pdf") ||
        applicant.proof_document?.is_pdf ||
        applicant.proof_document?.name?.toLowerCase().endsWith(".pdf");
      setPreviewData({ url: res.url, isPdf });
    } catch (err) {
      toast.error(
        tr(err.message || "Erreur lors du chargement de l'aperçu du justificatif")
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadProof = async () => {
    if (!applicant?.id) return;
    try {
      setDownloadLoading(true);
      await downloadProofDocument(
        applicant.id,
        applicant.proof_document?.name || "justificatif.pdf"
      );
    } catch (err) {
      toast.error(
        tr(err.message || "Erreur lors du téléchargement du justificatif")
      );
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          cleanupPreview();
          onClose();
        }}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-start shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-200 dark:border-slate-800 ${
            isRtl ? "text-right" : "text-left"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2">
              <UserCircleIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {tr("Détails de la demande")}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                cleanupPreview();
                onClose();
              }}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {tr("Chargement des informations du demandeur...")}
                </p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-center">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={fetchDetails}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 rounded-lg hover:bg-red-200 transition-colors"
                >
                  {tr("Réessayer")}
                </button>
              </div>
            ) : applicant ? (
              <div className="space-y-6">
                {/* Rejection / Suspension Notice Banner (P3.1 / P3.3) */}
                {applicant.rejection_reason && (
                  <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/80 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                      <span>
                        {applicant.approval_status === "suspended"
                          ? tr("Motif de suspension")
                          : tr("Motif du refus")}
                      </span>
                    </div>
                    <p className="leading-relaxed pl-5.5 text-slate-800 dark:text-slate-200">
                      {applicant.rejection_reason}
                    </p>
                  </div>
                )}

                {/* Profile Card */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  {applicant.picture ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
                      <Image
                        src={applicant.picture}
                        alt={`${applicant.first_name} ${applicant.last_name}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xl font-bold border-2 border-white dark:border-slate-800 shrink-0">
                      {applicant.first_name?.[0]?.toUpperCase()}
                      {applicant.last_name?.[0]?.toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                      {applicant.first_name} {applicant.last_name}
                    </h4>

                    {/* Role & Status */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                        {applicant.requested_role === "enseignant" ? (
                          <AcademicCapIcon className="w-3.5 h-3.5" />
                        ) : (
                          <BeakerIcon className="w-3.5 h-3.5" />
                        )}
                        {getRoleLabel(applicant.requested_role)}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          applicant.approval_status === "pending"
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : applicant.approval_status === "approved"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                        }`}
                      >
                        {applicant.approval_status === "pending"
                          ? tr("En attente")
                          : applicant.approval_status === "approved"
                          ? tr("Approuvé")
                          : tr("Refusé")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <span className="text-slate-400 block mb-1">
                      {tr("Adresse e-mail")}
                    </span>
                    <a
                      href={`mailto:${applicant.email}`}
                      className="flex items-center gap-1 font-medium text-primary-600 hover:underline truncate"
                    >
                      <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {applicant.email}
                    </a>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <span className="text-slate-400 block mb-1">
                      {tr("Téléphone")}
                    </span>
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                      <PhoneIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {applicant.phone ? (
                        <a
                          href={`tel:${applicant.phone}`}
                          className="hover:underline"
                        >
                          {applicant.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 col-span-2">
                    <span className="text-slate-400 block mb-1">
                      {tr("Date d'inscription")}
                    </span>
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(applicant.created_at)}
                    </span>
                  </div>

                  {applicant.address && (
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 col-span-2">
                      <span className="text-slate-400 block mb-1">
                        {tr("Adresse")}
                      </span>
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                        <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {applicant.address}
                      </span>
                    </div>
                  )}

                  {applicant.bio && (
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 col-span-2">
                      <span className="text-slate-400 block mb-1">
                        {tr("Présentation / Bio")}
                      </span>
                      <p className="text-slate-700 dark:text-slate-200 text-xs italic">
                        {applicant.bio}
                      </p>
                    </div>
                  )}
                </div>

                {/* Institutional Identity */}
                {(applicant.institution ||
                  applicant.staff_id ||
                  applicant.department ||
                  applicant.professional_phone) && (
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 text-xs space-y-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                      {tr("Informations professionnelles")}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                      {applicant.institution && (
                        <div className="flex items-center gap-1.5 col-span-2">
                          <BuildingOffice2Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            <strong className="text-slate-700 dark:text-slate-300">
                              {tr("Établissement")}:
                            </strong>{" "}
                            {applicant.institution}
                          </span>
                        </div>
                      )}

                      {applicant.department && (
                        <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                          <span className="text-slate-400">•</span>
                          <span>
                            <strong className="text-slate-700 dark:text-slate-300">
                              {tr("Département")}:
                            </strong>{" "}
                            {applicant.department}
                          </span>
                        </div>
                      )}

                      {applicant.staff_id && (
                        <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                          <IdentificationIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            <strong className="text-slate-700 dark:text-slate-300">
                              {tr("Matricule")}:
                            </strong>{" "}
                            <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                              {applicant.staff_id}
                            </code>
                          </span>
                        </div>
                      )}

                      {applicant.professional_phone && (
                        <div className="flex items-center gap-1.5 col-span-2">
                          <PhoneIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            <strong className="text-slate-700 dark:text-slate-300">
                              {tr("Téléphone pro")}:
                            </strong>{" "}
                            <a
                              href={`tel:${applicant.professional_phone}`}
                              className="text-primary-600 hover:underline"
                            >
                              {applicant.professional_phone}
                            </a>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Proof Document Card */}
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                      {tr("Justificatif d'identité professionnelle")}
                    </span>
                    {applicant.proof_document && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {applicant.proof_document.is_pdf ? "PDF" : "IMAGE"}
                      </span>
                    )}
                  </div>

                  {applicant.proof_document ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                          {applicant.proof_document.is_pdf ? (
                            <DocumentTextIcon className="w-5 h-5 text-red-500 shrink-0" />
                          ) : (
                            <PhotoIcon className="w-5 h-5 text-blue-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                              {applicant.proof_document.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {formatFileSize(applicant.proof_document.size)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={handlePreviewProof}
                            disabled={previewLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                            {previewLoading
                              ? tr("Chargement...")
                              : previewData
                              ? tr("Masquer")
                              : tr("Aperçu")}
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadProof}
                            disabled={downloadLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                            {downloadLoading ? tr("...") : tr("Télécharger")}
                          </button>
                        </div>
                      </div>

                      {/* Inline Preview Container */}
                      {previewData && (
                        <div className="mt-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                          {previewData.isPdf ? (
                            <iframe
                              src={previewData.url}
                              title={applicant.proof_document.name}
                              className="w-full h-80 rounded border-0"
                            />
                          ) : (
                            <div className="flex justify-center p-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={previewData.url}
                                alt={applicant.proof_document.name}
                                className="max-h-80 w-auto rounded object-contain shadow-sm"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-xs italic">
                      {tr("Aucun justificatif fourni lors de l'inscription.")}
                    </p>
                  )}
                </div>

                {/* Full Chronological Review History (P3.4) */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 text-xs space-y-3">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {tr("Historique complet des révisions")}
                  </span>

                  {applicant.reviews && applicant.reviews.length > 0 ? (
                    <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-4">
                      {applicant.reviews.map((rev) => {
                        const isPositive = rev.action === "approved" || rev.action === "reactivated";
                        const isResubmission = rev.action === "resubmitted";

                        return (
                          <div key={rev.id} className="relative">
                            <span
                              className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                                isPositive
                                  ? "bg-emerald-500"
                                  : isResubmission
                                  ? "bg-indigo-500"
                                  : "bg-red-500"
                              }`}
                            />
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {formatReviewActionLabel(rev.action)}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {formatDate(rev.created_at)}
                              </span>
                            </div>
                            {rev.reviewer ? (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {tr("Par")}: {rev.reviewer.first_name} {rev.reviewer.last_name} ({rev.reviewer.email})
                              </p>
                            ) : isResubmission ? (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {tr("Par le demandeur (nouvelle soumission)")}
                              </p>
                            ) : null}
                            {rev.reason && (
                              <p className="mt-1.5 p-2 rounded bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs italic">
                                &ldquo;{rev.reason}&rdquo;
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : applicant.reviewed_by ? (
                    <div className="space-y-1 text-slate-600 dark:text-slate-400">
                      <p>
                        <span className="text-slate-400">{tr("Traité par")}:</span>{" "}
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {applicant.reviewed_by.first_name}{" "}
                          {applicant.reviewed_by.last_name}
                        </span>{" "}
                        ({applicant.reviewed_by.email})
                      </p>
                      <p>
                        <span className="text-slate-400">
                          {tr("Date de traitement")}:
                        </span>{" "}
                        {formatDate(applicant.reviewed_at)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <ClockIcon className="w-4 h-4 text-amber-500" />
                      {tr(
                        "Cette demande est en attente de vérification par un administrateur."
                      )}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Modal Footer / Review Actions */}
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            {reasonInputState.isOpen ? (
              <div className="w-full space-y-3 p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-red-700 dark:text-red-300">
                    {reasonInputState.status === "suspended"
                      ? tr("Motif de suspension (obligatoire)")
                      : tr("Motif du refus (obligatoire)")}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setReasonInputState({ isOpen: false, status: null, reason: "" })
                    }
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {tr("Annuler")}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={reasonInputState.reason}
                  onChange={(e) =>
                    setReasonInputState((s) => ({ ...s, reason: e.target.value }))
                  }
                  placeholder={tr("Veuillez détailler le motif (minimum 5 caractères)...")}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setReasonInputState({ isOpen: false, status: null, reason: "" })
                    }
                  >
                    {tr("Annuler")}
                  </Button>
                  <button
                    type="button"
                    disabled={reviewing || reasonInputState.reason.trim().length < 5}
                    onClick={handleConfirmReviewWithReason}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {reasonInputState.status === "suspended"
                      ? tr("Confirmer la suspension")
                      : tr("Confirmer le refus")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    cleanupPreview();
                    onClose();
                  }}
                  disabled={reviewing}
                  className="w-full sm:w-auto"
                >
                  {tr("Fermer")}
                </Button>

                {applicant && (
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {applicant.approval_status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={handleApproveOrReactivate}
                          disabled={reviewing}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-sm"
                        >
                          <CheckIcon className="w-4 h-4" />
                          {tr("Approuver la demande")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInitiateReviewWithReason("rejected")}
                          disabled={reviewing}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition-colors disabled:opacity-50"
                        >
                          <XMarkIcon className="w-4 h-4" />
                          {tr("Refuser la demande")}
                        </button>
                      </>
                    )}

                    {applicant.approval_status === "approved" && (
                      <button
                        type="button"
                        onClick={() => handleInitiateReviewWithReason("suspended")}
                        disabled={reviewing}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition-colors disabled:opacity-50"
                      >
                        <NoSymbolIcon className="w-4 h-4" />
                        {tr("Suspendre le compte")}
                      </button>
                    )}

                    {applicant.approval_status === "suspended" && (
                      <button
                        type="button"
                        onClick={handleApproveOrReactivate}
                        disabled={reviewing}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-sm"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                        {tr("Réactiver le compte")}
                      </button>
                    )}

                    {applicant.approval_status === "rejected" && (
                      <button
                        type="button"
                        onClick={handleApproveOrReactivate}
                        disabled={reviewing}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-sm"
                      >
                        <CheckIcon className="w-4 h-4" />
                        {tr("Réexaminer et approuver")}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
