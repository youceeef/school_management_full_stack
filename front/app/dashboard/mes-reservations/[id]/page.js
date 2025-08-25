"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FaClock, FaChalkboardTeacher, FaTools, FaArrowLeft } from "react-icons/fa";
import { getMyreservation, cancelReservation } from "../../../services/reservationService";
import { confirmDelete } from "../../../utils/toast";
import toast from "react-hot-toast";
import Button from "../../../components/Button";

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

  // Helper function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  // Helper function to format time slot
  const formatTimeSlot = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const handleCancel = () => {
    confirmDelete(
      "Êtes-vous sûr de vouloir annuler cette réservation ?",
      async () => {
        const response = await cancelReservation(params.id);
        if (response.success) {
          router.push("/dashboard/mes-reservations"); // Redirect back to list
          return true; // Indicate success to show success toast
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-800">Réservation non trouvée</h2>
        <Link href="/dashboard/mes-reservations" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Retour aux réservations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/mes-reservations" className="flex items-center text-gray-600 hover:text-gray-800">
          <FaArrowLeft className="mr-2" />
          Retour aux réservations
        </Link>
        <div className="flex items-center gap-4">
          {reservation && reservation.status === "pending" && (
            <Button variant="danger" onClick={handleCancel}>
              Annuler la réservation
            </Button>
          )}
          {reservation && <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeStyle(reservation.status)}`}>{getStatusText(reservation.status)}</span>}
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-6">
          {/* Basic information */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center">
              <FaChalkboardTeacher className="mr-3 text-gray-600" />
              {reservation?.salle?.name || "Salle non spécifiée"}
              {reservation?.salle?.type && <span className="ml-2 text-sm text-gray-500">({reservation.salle.type})</span>}
            </h1>
            <div className="flex flex-col gap-2">
              {reservation?.user && <div className="text-gray-600">Demandeur: {`${reservation.user.first_name} ${reservation.user.last_name}`}</div>}
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center">
                  <FaClock className="mr-2" />
                  {reservation?.start_time ? formatDate(reservation.start_time) : "Date non spécifiée"}
                </div>
                <div>{reservation?.start_time && reservation?.end_time ? formatTimeSlot(reservation.start_time, reservation.end_time) : "Horaire non spécifié"}</div>
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-medium text-gray-800 mb-2">Objectif de la réservation</h2>
            <p className="text-gray-600">{reservation?.purpose || "Aucun objectif spécifié"}</p>
          </div>

          {/* Equipment */}
          {reservation?.equipements?.length > 0 && (
            <div className="border-t pt-4">
              <h2 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <FaTools className="mr-2" />
                Équipements demandés
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reservation.equipements.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <span className="text-gray-700">{item.name}</span>
                      {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Quantité: {item.quantity_reserved}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {reservation && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Créée le:</span> {reservation.created_at ? formatDate(reservation.created_at) : "Non spécifié"}
                </div>
                <div>
                  <span className="font-medium">Dernière modification:</span> {reservation.updated_at ? formatDate(reservation.updated_at) : "Non spécifié"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
