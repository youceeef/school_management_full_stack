"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import Button from "../../components/Button";
import { ClockIcon, AcademicCapIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { getReservations, approveReservation, rejectReservation } from "../../services/reservationService";
import toast from "react-hot-toast";
import { PERMISSIONS } from "../../constants/permissions";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedReservationId, setSelectedReservationId] = useState(null);

  // Fetch reservations on component mount
  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await getReservations();
      setReservations(response.data || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Une erreur est survenue lors du chargement des données");
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  // Stats cards data
  const statsCards = [
    {
      title: "Total des réservations",
      value: reservations.length.toString(),
      icon: ClockIcon,
    },
    {
      title: "En attente",
      value: reservations.filter((r) => r.status === "pending").length.toString(),
      icon: AcademicCapIcon,
    },
    {
      title: "En cours",
      value: reservations.filter((r) => r.status === "in_progress").length.toString(),
      icon: ClockIcon,
    },
    {
      title: "Terminées",
      value: reservations.filter((r) => r.status === "completed").length.toString(),
      icon: CheckCircleIcon,
    },
  ];

  // Table columns configuration
  const columns = [
    {
      header: "Date",
      accessor: "start_time",
      render: (row) => {
        const startDate = new Date(row.start_time);
        const endDate = new Date(row.end_time);
        return (
          <div>
            <div className="font-medium">{startDate.toLocaleDateString("fr-FR")}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} - {endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        );
      },
    },
    {
      header: "Salle",
      accessor: "salle",
      render: (row) => (
        <div>
          <div className="font-medium">{row.salle.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.salle.type}</div>
        </div>
      ),
    },
    {
      header: "Demandeur",
      accessor: "user",
      render: (row) => (
        <div>
          <div className="font-medium">{`${row.user.first_name} ${row.user.last_name}`}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.user.email}</div>
        </div>
      ),
    },
    {
      header: "Équipements",
      accessor: "equipements",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.equipements?.map((item) => (
            <span key={item.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              {item.name} ({item.quantity_reserved})
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Statut",
      accessor: "status",
      render: (row) => {
        const statusStyles = {
          approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
          rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
          in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
        };
        const statusText = {
          approved: "Approuvée",
          pending: "En attente",
          rejected: "Refusée",
          in_progress: "En cours",
          completed: "Terminée"
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[row.status]}`}>{statusText[row.status]}</span>;
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex justify-end space-x-2">
          {row.status === "pending" && (
            <>
              <Button variant="success" size="sm" onClick={() => handleApprove(row.id)}>
                Approuver
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleShowRejectModal(row.id)}>
                Refuser
              </Button>
            </>
          )}
          <Link href={`/dashboard/reservations/${row.id}`}>
            <Button variant="secondary" size="sm">
              Voir détails
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  // Handle reservation approval
  const handleApprove = async (id) => {
    try {
      const response = await approveReservation(id);
      if (response.success) {
        toast.success(response.message);
        fetchReservations(); // Refresh the list
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error approving reservation:", error);
      toast.error("Une erreur inattendue est survenue");
    }
  };

  // Handle showing reject modal
  const handleShowRejectModal = (id) => {
    setSelectedReservationId(id);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  // Handle closing reject modal
  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setSelectedReservationId(null);
    setRejectionReason("");
  };

  // Handle reservation rejection
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Le motif du rejet est obligatoire");
      return;
    }

    try {
      const response = await rejectReservation(selectedReservationId, rejectionReason);
      if (response.success) {
        toast.success(response.message);
        handleCloseRejectModal();
        fetchReservations(); // Refresh the list
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error rejecting reservation:", error);
      toast.error("Une erreur inattendue est survenue");
    }
  };

  // Filter reservations based on search and status
  const filteredReservations = reservations.filter((reservation) => {
    const searchMatch = reservation.salle.name.toLowerCase().includes(searchTerm.toLowerCase()) || `${reservation.user.first_name} ${reservation.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || reservation.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = filterStatus === "all" || reservation.status === filterStatus;

    return searchMatch && statusMatch;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestion des Réservations"
        description="Gérez les réservations des salles"
        actions={[
          {
            children: (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle réservation
              </span>
            ),
            variant: "primary",
            onClick: () => {
              /* TODO: Implement new reservation */
            },
            permission: PERMISSIONS.CREATE_RESERVATIONS
          }
        ]}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} title={stat.title} value={stat.value} icon={stat.icon} loading={loading} />
        ))}
      </div>

      {/* Reservations Table */}
      <Card title="Liste des Réservations">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant={filterStatus === "all" ? "primary" : "secondary"} onClick={() => setFilterStatus("all")}>
              Toutes
            </Button>
            <Button variant={filterStatus === "pending" ? "primary" : "secondary"} onClick={() => setFilterStatus("pending")}>
              En attente
            </Button>
            <Button variant={filterStatus === "approved" ? "primary" : "secondary"} onClick={() => setFilterStatus("approved")}>
              Approuvées
            </Button>
            <Button variant={filterStatus === "in_progress" ? "primary" : "secondary"} onClick={() => setFilterStatus("in_progress")}>
              En cours
            </Button>
            <Button variant={filterStatus === "completed" ? "primary" : "secondary"} onClick={() => setFilterStatus("completed")}>
              Terminées
            </Button>
            <Button variant={filterStatus === "rejected" ? "primary" : "secondary"} onClick={() => setFilterStatus("rejected")}>
              Refusées
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <DataTable columns={columns} data={filteredReservations} searchable={true} onSearch={setSearchTerm} searchPlaceholder="Rechercher une réservation..." />
          )}
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
                <Button variant="danger" onClick={handleReject}>
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
