"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  UserCircleIcon,
  BuildingOffice2Icon,
  IdentificationIcon,
  ShieldCheckIcon,
  TrashIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";
import LoadingSpinner from "./LoadingSpinner";
import { getUserById, deleteUser, removeUserRole, reviewUserApproval, assignUserRole } from "../services/userService";
import { getRoleLabel } from "../utils/roleLabels";
import { useLanguage } from "../context/LanguageContext";
import toast from "../utils/toast";

const AVAILABLE_ROLES = ["admin", "enseignant", "responsable_laboratoire", "eleve"];

export default function UserDetailsModal({
  isOpen,
  onClose,
  userId,
  currentUser,
  totalAdmins = 1,
  onUserUpdated,
}) {
  const { tr, dateLocale, isRtl } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showSuspensionForm, setShowSuspensionForm] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getUserById(userId);
      setUser(data);
    } catch (err) {
      console.error("Error fetching user details:", err);
      setError(err.message || tr("Impossible de charger les détails de l'utilisateur."));
    } finally {
      setLoading(false);
    }
  }, [userId, tr]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser();
    } else {
      setUser(null);
      setError(null);
      setSelectedNewRole("");
      setShowSuspensionForm(false);
      setSuspensionReason("");
    }
  }, [isOpen, userId, fetchUser]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !actionLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, actionLoading, onClose]);

  if (!isOpen) return null;

  const formatDate = (val) =>
    val ? new Intl.DateTimeFormat(dateLocale, { dateStyle: "long", timeStyle: "short" }).format(new Date(val)) : "—";

  const isSelf = Number(user?.id) === Number(currentUser?.id);
  const isProtectedLastAdmin = (roleName) =>
    roleName === "admin" && (isSelf || totalAdmins <= 1);

  const handleAssignRole = async () => {
    if (!selectedNewRole || !user) return;
    try {
      setActionLoading(true);
      await assignUserRole(user.id, selectedNewRole);
      toast.success(tr("Rôle attribué avec succès"));
      setSelectedNewRole("");
      await fetchUser();
      onUserUpdated?.();
    } catch (err) {
      toast.error(tr(err.message || "Erreur lors de l'attribution du rôle"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveRole = (roleName) => {
    if (!user) return;
    const userName = `${user.first_name} ${user.last_name}`.trim();
    toast.confirmDelete(
      `Êtes-vous sûr de vouloir retirer le rôle "${getRoleLabel(roleName, tr)}" de "${userName}" ?`,
      async () => {
        setActionLoading(true);
        try {
          await removeUserRole(user.id, roleName);
          toast.success(tr("Le rôle a été retiré"));
          await fetchUser();
          onUserUpdated?.();
        } catch (err) {
          toast.error(tr(err.message || "Erreur lors du retrait du rôle"));
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  const handleDeleteUser = () => {
    if (!user) return;
    const userName = `${user.first_name} ${user.last_name}`.trim();
    toast.confirmDelete(
      `Êtes-vous sûr de vouloir supprimer définitivement le compte de "${userName}" ? Cette action est irréversible.`,
      async () => {
        setActionLoading(true);
        try {
          await deleteUser(user.id);
          toast.success(tr("Utilisateur supprimé avec succès"));
          onUserUpdated?.();
          onClose();
        } catch (err) {
          toast.error(tr(err.message || "Erreur lors de la suppression"));
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  const handleStatusChange = async (status, reason = null) => {
    if (!user) return;
    try {
      setActionLoading(true);
      await reviewUserApproval(user.id, status, reason);
      toast.success(
        status === "suspended"
          ? tr("Compte suspendu avec succès")
          : tr("Compte approuvé / réactivé avec succès")
      );
      await fetchUser();
      onUserUpdated?.();
      setShowSuspensionForm(false);
      setSuspensionReason("");
    } catch (err) {
      toast.error(tr(err.message || "Erreur lors de la mise à jour du statut"));
    } finally {
      setActionLoading(false);
    }
  };

  const rolesList = user?.roles ? (Array.isArray(user.roles) ? user.roles.map(r => typeof r === "object" ? r.name : r) : []) : [];
  const unassignedRoles = AVAILABLE_ROLES.filter(r => !rolesList.includes(r));
  const canManageApprovalLifecycle = ["enseignant", "responsable_laboratoire"].includes(user?.requested_role);

  const formatReviewAction = (action) => {
    const labels = {
      approved: "Demande approuvée",
      reactivated: "Compte réactivé",
      suspended: "Compte suspendu",
      rejected: "Demande refusée",
      resubmitted: "Demande corrigée et renvoyée",
    };
    return tr(labels[action] || action);
  };

  const confirmSuspension = () => {
    const reason = suspensionReason.trim();
    if (reason.length < 5) {
      toast.error(tr("Veuillez indiquer un motif d'au moins 5 caractères."));
      return;
    }
    handleStatusChange("suspended", reason);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      dir={isRtl ? "rtl" : "ltr"}
      onClick={() => {
        if (!actionLoading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
              <UserCircleIcon className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : tr("Fiche utilisateur")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user ? user.email : tr("Chargement des informations...")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={tr("Fermer")}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              <p>{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchUser} className="mt-3">
                {tr("Réessayer")}
              </Button>
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* Top Banner: ID & Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                    ID #{user.id}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {tr("Inscrit le")} {formatDate(user.created_at)}
                  </span>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${
                      user.approval_status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                        : user.approval_status === "pending"
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900"
                        : user.approval_status === "suspended"
                        ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
                    }`}
                  >
                    {tr(
                      user.approval_status === "approved"
                        ? "Approuvé"
                        : user.approval_status === "pending"
                        ? "En attente"
                        : user.approval_status === "suspended"
                        ? "Suspendu"
                        : "Refusé"
                    )}
                  </span>
                </div>
              </div>

              {/* Roles Section */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <ShieldCheckIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    <span>{tr("Rôles attribués")}</span>
                  </h3>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {rolesList.length ? (
                    rolesList.map((rName) => {
                      const protectedRole = isProtectedLastAdmin(rName);
                      return (
                        <span
                          key={rName}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <span>{getRoleLabel(rName, tr)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRole(rName)}
                            disabled={protectedRole || actionLoading}
                            className="rounded p-0.5 text-slate-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:text-red-400"
                            title={
                              protectedRole
                                ? tr("Le dernier administrateur ou votre propre compte ne peut pas perdre le rôle administrateur.")
                                : tr("Retirer ce rôle")
                            }
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">{tr("Aucun rôle attribué")}</span>
                  )}
                </div>

                {/* Add Role Row */}
                {unassignedRoles.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <select
                      value={selectedNewRole}
                      aria-label={tr("Attribuer un nouveau rôle")}
                      onChange={(e) => setSelectedNewRole(e.target.value)}
                      disabled={actionLoading}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-primary-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">{tr("Attribuer un nouveau rôle...")}</option>
                      {unassignedRoles.map((r) => (
                        <option key={r} value={r}>
                          {getRoleLabel(r, tr)}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={PlusIcon}
                      disabled={!selectedNewRole || actionLoading}
                      onClick={handleAssignRole}
                    >
                      {tr("Attribuer")}
                    </Button>
                  </div>
                )}
              </div>

              {/* Identity & Institution Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <IdentificationIcon className="h-4 w-4" />
                    <span>{tr("Coordonnées")}</span>
                  </h4>
                  <dl className="mt-3 space-y-2 text-xs">
                    <div>
                      <dt className="text-slate-400">{tr("Email")}</dt>
                      <dd className="font-medium text-slate-900 dark:text-slate-100">
                        <a href={`mailto:${user.email}`} className="text-primary-600 dark:text-primary-400">
                          {user.email}
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">{tr("Téléphone")}</dt>
                      <dd className="font-medium text-slate-900 dark:text-slate-100">
                        {user.phone ? <a href={`tel:${user.phone}`}>{user.phone}</a> : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">{tr("Téléphone professionnel")}</dt>
                      <dd className="font-medium text-slate-900 dark:text-slate-100">
                        {user.professional_phone ? <a href={`tel:${user.professional_phone}`}>{user.professional_phone}</a> : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">{tr("Adresse")}</dt>
                      <dd className="font-medium text-slate-900 dark:text-slate-100">{user.address || "—"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <BuildingOffice2Icon className="h-4 w-4" />
                    <span>{tr("Établissement")}</span>
                  </h4>
                  <dl className="mt-3 space-y-2 text-xs">
                    <div>
                      <dt className="text-slate-400">{tr("Établissement")}</dt>
                      <dd className="font-medium text-slate-900 dark:text-slate-100">{user.institution || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">{tr("Département")}</dt>
                      <dd className="font-medium text-slate-900 dark:text-slate-100">{user.department || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">{tr("Identifiant de personnel")}</dt>
                      <dd className="font-medium text-slate-900 dark:text-slate-100">{user.staff_id || "—"}</dd>
                    </div>
                    {user.requested_role && (
                      <div>
                        <dt className="text-slate-400">{tr("Rôle demandé à l'inscription")}</dt>
                        <dd className="font-medium text-slate-900 dark:text-slate-100">{getRoleLabel(user.requested_role, tr)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Bio if exists */}
              {user.bio && (
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {tr("Biographie")}
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{user.bio}</p>
                </div>
              )}

              {/* Rejection / Suspension Notice */}
              {user.rejection_reason && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <span className="font-semibold">{tr("Motif de refus / suspension :")}</span>
                  <p className="mt-1">{user.rejection_reason}</p>
                </div>
              )}

              {/* Chronological account review history */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <ClockIcon className="h-4 w-4" />
                  <span>{tr("Historique complet des révisions")}</span>
                </h4>
                {user.reviews?.length ? (
                  <div className="mt-3 space-y-3 border-s-2 border-slate-200 ps-4 dark:border-slate-700">
                    {user.reviews.map((review) => (
                      <div key={review.id} className="text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatReviewAction(review.action)}
                          </span>
                          <span className="text-slate-400">{formatDate(review.created_at)}</span>
                        </div>
                        {review.reviewer && (
                          <p className="mt-1 text-slate-500 dark:text-slate-400">
                            {tr("Par")}: {review.reviewer.first_name} {review.reviewer.last_name}
                          </p>
                        )}
                        {review.reason && (
                          <p className="mt-1.5 rounded-lg bg-slate-50 p-2 italic text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                            &ldquo;{review.reason}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {tr("Aucun historique de révision disponible.")}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          {showSuspensionForm ? (
            <div className="w-full space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>{tr("Motif de suspension (obligatoire)")}</span>
                <textarea
                  rows={3}
                  value={suspensionReason}
                  onChange={(event) => setSuspensionReason(event.target.value)}
                  disabled={actionLoading}
                  placeholder={tr("Veuillez détailler le motif (minimum 5 caractères)...")}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => {
                    setShowSuspensionForm(false);
                    setSuspensionReason("");
                  }}
                >
                  {tr("Annuler")}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={NoSymbolIcon}
                  disabled={actionLoading || suspensionReason.trim().length < 5}
                  onClick={confirmSuspension}
                >
                  {tr("Confirmer la suspension")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                {user && !isSelf && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={TrashIcon}
                    disabled={actionLoading || (rolesList.includes("admin") && totalAdmins <= 1)}
                    onClick={handleDeleteUser}
                  >
                    {tr("Supprimer le compte")}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {user && canManageApprovalLifecycle && user.approval_status === "approved" && !isSelf && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={NoSymbolIcon}
                    disabled={actionLoading}
                    onClick={() => setShowSuspensionForm(true)}
                  >
                    {tr("Suspendre")}
                  </Button>
                )}
                {user && canManageApprovalLifecycle && user.approval_status === "suspended" && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircleIcon}
                    disabled={actionLoading}
                    onClick={() => handleStatusChange("approved")}
                  >
                    {tr("Réactiver")}
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={onClose} disabled={actionLoading}>
                  {tr("Fermer")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
