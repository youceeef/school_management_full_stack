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
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  AcademicCapIcon,
  BeakerIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";
import LoadingSpinner from "./LoadingSpinner";
import {
  getAccountRequestById,
  reviewAccountRequest,
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
    }
  }, [isOpen, applicantId, fetchDetails]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

  const handleReview = async (status) => {
    if (!applicant) return;
    const isApproval = status === "approved";
    const roleName = getRoleLabel(applicant.requested_role);
    const applicantName = `${applicant.first_name} ${applicant.last_name}`;

    const promptText = isApproval
      ? tr(
          `Approuver la demande de ${applicantName} et lui attribuer le rôle ${roleName} ?`
        )
      : tr(
          `Refuser la demande de ${applicantName} et lui refuser l'accès au tableau de bord ?`
        );

    const confirmed = await toast.confirm(promptText);
    if (!confirmed) return;

    try {
      setReviewing(true);
      const res = await reviewAccountRequest(applicant.id, status);
      toast.success(tr(res.message));
      if (onReviewSuccess) {
        onReviewSuccess(res.data);
      }
      onClose();
    } catch (err) {
      toast.error(
        tr(err.message || "Erreur lors de la mise à jour de la demande")
      );
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
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
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {tr("Détails de la demande")}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-5">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {tr("Chargement des informations du demandeur...")}
                </p>
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <XCircleIcon className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {error}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchDetails}
                  className="mt-4"
                >
                  {tr("Réessayer")}
                </Button>
              </div>
            ) : applicant ? (
              <div className="space-y-5">
                {/* Profile card */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-lg flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-900">
                    {applicant.first_name?.[0]?.toUpperCase()}
                    {applicant.last_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {applicant.first_name} {applicant.last_name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <EnvelopeIcon className="w-3.5 h-3.5 shrink-0" />
                      <a
                        href={`mailto:${applicant.email}`}
                        className="hover:underline truncate"
                      >
                        {applicant.email}
                      </a>
                    </p>
                    {applicant.phone && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                        <PhoneIcon className="w-3.5 h-3.5 shrink-0" />
                        <a
                          href={`tel:${applicant.phone}`}
                          className="hover:underline"
                        >
                          {applicant.phone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <span className="text-slate-400 block mb-1">
                      {tr("Rôle demandé")}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                      {applicant.requested_role === "enseignant" ? (
                        <AcademicCapIcon className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <BeakerIcon className="w-4 h-4 text-teal-500" />
                      )}
                      {getRoleLabel(applicant.requested_role)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <span className="text-slate-400 block mb-1">
                      {tr("Statut actuel")}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white capitalize">
                      {applicant.approval_status === "approved"
                        ? tr("Approuvé")
                        : applicant.approval_status === "rejected"
                        ? tr("Refusé")
                        : applicant.approval_status === "suspended"
                        ? tr("Suspendu")
                        : tr("En attente")}
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

                {/* Review Metadata */}
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 text-xs space-y-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {tr("Historique de révision")}
                  </span>
                  {applicant.reviewed_by ? (
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
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
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
                      onClick={() => handleReview("approved")}
                      disabled={reviewing}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <CheckIcon className="w-4 h-4" />
                      {tr("Approuver la demande")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReview("rejected")}
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
                    onClick={() => handleReview("rejected")}
                    disabled={reviewing}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    {tr("Révoquer l'accès")}
                  </button>
                )}

                {applicant.approval_status === "rejected" && (
                  <button
                    type="button"
                    onClick={() => handleReview("approved")}
                    disabled={reviewing}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {tr("Réexaminer et approuver")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
