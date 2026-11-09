"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, PageHeader } from "../../../components/ui";
import Button from "../../../components/Button";
import LoadingSpinner from "../../../components/LoadingSpinner";
import {
  ClockIcon,
  WrenchScrewdriverIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "../../../utils/toast";
import {
  getReservation,
  approveReservation,
  rejectReservation,
} from "../../../services/reservationService";

export default function ReservationDetail() {
  const params = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchReservationDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getReservation(params.id);

      if (response.success && response.data) {
        setReservation(response.data);
      } else {
        toast.error(response.message || "Erreur lors du chargement des détails de la réservation");
        router.push("/dashboard/reservations");
      }
    } catch (error) {
      console.error("Error fetching reservation details:", error);
      toast.error("Erreur lors du chargement des détails de la réservation");
      router.push("/dashboard/reservations");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchReservationDetails();
  }, [fetchReservationDetails]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === "rejected" && !rejectionReason.trim()) {
      setShowRejectModal(true);
      return;
    }

    try {
      setIsProcessing(true);
      const response =
        newStatus === "approved"
          ? await approveReservation(reservation.id)
          : await rejectReservation(reservation.id, rejectionReason);

      if (response.success) {
        toast.success(response.message);
        fetchReservationDetails();
        setShowRejectModal(false);
        setRejectionReason("");
      } else {
        toast.error(response.message || "Une erreur est survenue");
      }
    } catch (error) {
      console.error(
        `Error ${newStatus === "approved" ? "approving" : "rejecting"} reservation:`,
        error
      );
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason("");
  };

  const statusMeta = {
    approved: {
      label: "Approuvée",
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-300",
    },
    pending: {
      label: "En attente de décision",
      dot: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-300",
    },
    rejected: {
      label: "Refusée",
      dot: "bg-red-500",
      text: "text-red-700 dark:text-red-300",
    },
    in_progress: {
      label: "En cours",
      dot: "bg-primary-600 dark:bg-primary-400",
      text: "text-primary-700 dark:text-primary-300",
    },
    completed: {
      label: "Terminée",
      dot: "bg-slate-400",
      text: "text-slate-600 dark:text-slate-400",
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const { date: startDate } = formatDateTime(reservation.start_time);
  const timeSlot = `${formatDateTime(reservation.start_time).time} – ${
    formatDateTime(reservation.end_time).time
  }`;
  const currentStatus = statusMeta[reservation.status] || {
    label: reservation.status,
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-400",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Réservation #${reservation.id}`}
        description="Détails complets de la demande, du demandeur et des équipements associés."
        actions={[
          {
            children: "Retour aux réservations",
            icon: ArrowLeftIcon,
            variant: "secondary",
            onClick: () => router.push("/dashboard/reservations"),
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Informations de la réservation"
            headerActions={
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 text-xs font-semibold ${currentStatus.text}`}
                >
                  <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
                  {currentStatus.label}
                </span>
                {reservation.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleStatusChange("approved")}
                      loading={isProcessing}
                    >
                      Approuver
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleStatusChange("rejected")}
                      loading={isProcessing}
                    >
                      Refuser
                    </Button>
                  </div>
                )}
              </div>
            }
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                    <ClockIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Créneau horaire
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize mt-0.5">
                      {startDate}
                    </p>
                    <p className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 mt-0.5">
                      {timeSlot}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                    <BuildingOfficeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Salle attribuée
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      {reservation.salle?.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 capitalize">
                      {reservation.salle?.type} · Capacité :{" "}
                      <span className="font-mono tabular-nums">
                        {reservation.salle?.capacity}
                      </span>{" "}
                      places
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Objectif pédagogique
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {reservation.purpose || "Aucun motif renseigné."}
                </p>
              </div>

              {reservation.equipements && reservation.equipements.length > 0 && (
                <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                    <WrenchScrewdriverIcon className="w-4 h-4" />
                    Matériel réservé
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                    {reservation.equipements.map((item) => (
                      <div
                        key={item.id}
                        className="px-4 py-3 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300 shrink-0">
                          {item.quantity_reserved} unité{item.quantity_reserved > 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Créée le{" "}
                  <strong className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {new Date(reservation.created_at).toLocaleDateString("fr-FR")}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Mise à jour le{" "}
                  <strong className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {new Date(reservation.updated_at).toLocaleDateString("fr-FR")}
                  </strong>
                </span>
                {reservation.approver && (
                  <>
                    <span>·</span>
                    <span>
                      Traitée par{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {reservation.approver.first_name} {reservation.approver.last_name}
                      </strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card title="Profil du demandeur" subtitle="Coordonnées de l’enseignant">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <UserCircleIcon className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Nom complet</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {reservation.user?.first_name} {reservation.user?.last_name}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <EnvelopeIcon className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Adresse e-mail</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white break-all">
                    {reservation.user?.email}
                  </p>
                </div>
              </div>
              {reservation.user?.phone && (
                <div className="flex items-start gap-3">
                  <PhoneIcon className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Téléphone</p>
                    <p className="text-sm font-mono tabular-nums text-slate-900 dark:text-white">
                      {reservation.user.phone}
                    </p>
                  </div>
                </div>
              )}
              {reservation.user?.address && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Adresse</p>
                    <p className="text-sm text-slate-900 dark:text-white">
                      {reservation.user.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 px-6 py-4">
              <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                Motif du refus
              </h2>
              <button
                type="button"
                onClick={handleCloseRejectModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                rows={4}
                placeholder="Veuillez saisir le motif du refus..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={handleCloseRejectModal}>
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleStatusChange("rejected")}
                  loading={isProcessing}
                >
                  Confirmer le refus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
