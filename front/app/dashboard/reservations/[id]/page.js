"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, PageHeader } from "../../../components/ui";
import Button from "../../../components/Button";
import { ClockIcon, AcademicCapIcon, WrenchScrewdriverIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, UserCircleIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";
import toast from "../../../utils/toast";
import { getReservation, approveReservation, rejectReservation } from "../../../services/reservationService";

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
      const response = newStatus === "approved" ? await approveReservation(reservation.id) : await rejectReservation(reservation.id, rejectionReason);

      if (response.success) {
        toast.success(response.message);
        fetchReservationDetails();
        setShowRejectModal(false);
        setRejectionReason("");
      } else {
        toast.error(response.message || "Une erreur est survenue");
      }
    } catch (error) {
      console.error(`Error ${newStatus === "approved" ? "approving" : "rejecting"} reservation:`, error);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason("");
  };

  const getStatusBadgeStyle = (status) => {
    const styles = {
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      approved: "Approuvée",
      pending: "En attente",
      rejected: "Refusée",
      in_progress: "En cours",
      completed: "Terminée"
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString("fr-FR"),
      time: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const { date: startDate } = formatDateTime(reservation.start_time);
  const timeSlot = `${formatDateTime(reservation.start_time).time} - ${formatDateTime(reservation.end_time).time}`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Détails de la Réservation"
        description="Consultez et gérez les détails de la réservation"
        actions={[
          {
            children: "Retour aux réservations",
            variant: "secondary",
            onClick: () => router.push("/dashboard/reservations"),
          },
        ]}
      />

      {/* Teacher Information Card */}
      <Card>
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
          <h2 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">Informations du Demandeur</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <UserCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Nom complet</p>
                <p className="text-blue-900 dark:text-blue-100">{`${reservation.user.first_name} ${reservation.user.last_name}`}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <EnvelopeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Email</p>
                <p className="text-blue-900 dark:text-blue-100">{reservation.user.email}</p>
              </div>
            </div>
            {reservation.user.phone && (
              <div className="flex items-start space-x-3">
                <PhoneIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Téléphone</p>
                  <p className="text-blue-900 dark:text-blue-100">{reservation.user.phone}</p>
                </div>
              </div>
            )}
            {reservation.user.address && (
              <div className="flex items-start space-x-3">
                <MapPinIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Adresse</p>
                  <p className="text-blue-900 dark:text-blue-100">{reservation.user.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Reservation Details Card */}
      <Card>
        <div className="p-6 space-y-6">
          {/* Status and Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeStyle(reservation.status)}`}>{getStatusText(reservation.status)}</span>
              {reservation.approver && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Approuvé par: {reservation.approver.first_name} {reservation.approver.last_name}
                </span>
              )}
            </div>
            {reservation.status === "pending" && (
              <div className="flex gap-2">
                <Button variant="success" onClick={() => handleStatusChange("approved")} loading={isProcessing}>
                  Approuver
                </Button>
                <Button variant="danger" onClick={() => handleStatusChange("rejected")} loading={isProcessing}>
                  Refuser
                </Button>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <ClockIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Date et Heure</p>
                  <p className="text-gray-900 dark:text-gray-100">{startDate}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{timeSlot}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Salle</p>
                  <p className="text-gray-900 dark:text-gray-100">{reservation.salle.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {reservation.salle.type} - Capacité: {reservation.salle.capacity} personnes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Objectif de la réservation</h3>
            <p className="text-gray-600 dark:text-gray-400">{reservation.purpose}</p>
          </div>

          {/* Equipment */}
          {reservation.equipements && reservation.equipements.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <WrenchScrewdriverIcon className="w-5 h-5 mr-2" />
                Équipements demandés
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reservation.equipements.map((item) => (
                  <div key={item.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{item.name}</span>
                        {item.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>}
                      </div>
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">Quantité: {item.quantity_reserved}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Créée le: </span>
                <span className="text-gray-900 dark:text-gray-100">{new Date(reservation.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Dernière modification: </span>
                <span className="text-gray-900 dark:text-gray-100">{new Date(reservation.updated_at).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-dark-border px-6 py-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">Motif du rejet</h2>
              <Button variant="secondary" onClick={handleCloseRejectModal}>
                Fermer
              </Button>
            </div>
            <div className="p-6">
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-card dark:border-dark-border dark:text-white"
                rows="4"
                placeholder="Veuillez saisir le motif du rejet..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="mt-4 flex justify-end space-x-3">
                <Button variant="secondary" onClick={handleCloseRejectModal}>
                  Annuler
                </Button>
                <Button variant="danger" onClick={() => handleStatusChange("rejected")} loading={isProcessing}>
                  Confirmer le rejet
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
