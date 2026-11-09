"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { getMyreservation, cancelReservation } from "../../../services/reservationService";
import toast, { confirmDelete } from "../../../utils/toast";
import Button from "../../../components/Button";
import { Card, PageHeader } from "../../../components/ui";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function SingleReservationPage() {
  const params = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const response = await getMyreservation(params.id);
        setReservation(response.data);
      } catch (error) {
        console.error("Error fetching reservation:", error);
        toast.error(error.message || "Erreur lors de la récupération de la réservation");
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [params.id]);

  const statusMeta = {
    approved: {
      label: "Approuvée",
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-300",
    },
    pending: {
      label: "En attente",
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTimeSlot = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })} – ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const handleCancel = () => {
    confirmDelete(
      "Êtes-vous sûr de vouloir annuler cette réservation ?",
      async () => {
        const response = await cancelReservation(params.id);
        if (response.success) {
          router.push("/dashboard/mes-reservations");
          return true;
        } else {
          throw new Error(response.message);
        }
      },
      {
        loading: "Annulation en cours...",
        success: "La réservation a été annulée avec succès",
        error: "Erreur lors de l'annulation de la réservation",
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">
          Réservation introuvable
        </h2>
        <Link
          href="/dashboard/mes-reservations"
          className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline mt-3 inline-block"
        >
          Retour à mes réservations
        </Link>
      </div>
    );
  }

  const currentStatus = statusMeta[reservation.status] || {
    label: reservation.status,
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-400",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={reservation?.salle?.name || "Détails de la réservation"}
        description="Récapitulatif de votre demande de salle et d’équipements."
        actions={[
          {
            children: "Retour à mes réservations",
            icon: ArrowLeftIcon,
            variant: "secondary",
            onClick: () => router.push("/dashboard/mes-reservations"),
          },
        ]}
      />

      <Card
        title="Fiche récapitulative"
        headerActions={
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 text-xs font-semibold ${currentStatus.text}`}
            >
              <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
              {currentStatus.label}
            </span>
            {reservation.status === "pending" && (
              <Button variant="danger" size="sm" onClick={handleCancel}>
                Annuler la demande
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                <BuildingOfficeIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Espace réservé
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                  {reservation?.salle?.name || "Salle non spécifiée"}
                </p>
                {reservation?.salle?.type && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">
                    {reservation.salle.type}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                <ClockIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Date et horaire
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize mt-0.5">
                  {reservation?.start_time ? formatDate(reservation.start_time) : "—"}
                </p>
                <p className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 mt-0.5">
                  {reservation?.start_time && reservation?.end_time
                    ? formatTimeSlot(reservation.start_time, reservation.end_time)
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Objectif de la séance
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {reservation?.purpose || "Aucun objectif spécifié"}
            </p>
          </div>

          {reservation?.equipements?.length > 0 && (
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <WrenchScrewdriverIcon className="w-4 h-4" />
                Équipements demandés
              </h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                {reservation.equipements.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
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
                {reservation.created_at
                  ? new Date(reservation.created_at).toLocaleDateString("fr-FR")
                  : "—"}
              </strong>
            </span>
            <span>·</span>
            <span>
              Dernière mise à jour le{" "}
              <strong className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                {reservation.updated_at
                  ? new Date(reservation.updated_at).toLocaleDateString("fr-FR")
                  : "—"}
              </strong>
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
