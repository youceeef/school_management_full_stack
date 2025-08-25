"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaPlus, FaClock, FaChalkboardTeacher, FaTools } from "react-icons/fa";
import ReservationForm from "../../components/reservation/ReservationForm";
import { getMyReservations } from "../../services/reservationService";
import toast from "react-hot-toast";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import Button from "../../components/Button";

export default function MesReservationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch reservations on component mount
  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await getMyReservations();
      setReservations(data);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Une erreur est survenue lors du chargement des données");
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    if (hasFormChanges) {
      if (window.confirm("Voulez-vous vraiment fermer le formulaire ? Toutes les modifications seront perdues.")) {
        setShowForm(false);
        setHasFormChanges(false);
      }
    } else {
      setShowForm(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setHasFormChanges(false);
    fetchReservations();
    toast.success("Réservation créée avec succès!");
  };

  // Function to format date and time
  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString("fr-FR"),
      time: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  // Function to get time slot from start and end time
  const getTimeSlot = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  // Function to get status badge style
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

  // Function to get status text in French
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

  // Stats cards data
  const statsCards = [
    {
      title: "Mes réservations",
      value: `${reservations?.length || 0}`,
      icon: FaChalkboardTeacher,
    },
    {
      title: "En attente",
      value: `${reservations?.filter((r) => r.status === "pending").length || 0}`,
      icon: FaClock,
    },
    {
      title: "En cours",
      value: `${reservations?.filter((r) => r.status === "in_progress").length || 0}`,
      icon: FaClock,
    },
    {
      title: "Terminées",
      value: `${reservations?.filter((r) => r.status === "completed").length || 0}`,
      icon: FaTools,
    },
  ];

  // Table columns
  const columns = [
    {
      header: "Salle",
      accessor: "salle.name",
      render: (row) => (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center mr-3">
            <FaChalkboardTeacher className="w-5 h-5" />
          </div>
          <span className="font-medium">{row.salle.name}</span>
        </div>
      ),
    },
    {
      header: "Date et Heure",
      accessor: "start_time",
      render: (row) => {
        const { date } = formatDateTime(row.start_time);
        const timeSlot = getTimeSlot(row.start_time, row.end_time);
        return (
          <div>
            <div className="font-medium">{date}</div>
            <div className="text-sm text-gray-500">{timeSlot}</div>
          </div>
        );
      },
    },
    {
      header: "Statut",
      accessor: "status",
      render: (row) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeStyle(row.status)}`}>{getStatusText(row.status)}</span>,
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex justify-center space-x-2">
          <Link href={`/dashboard/mes-reservations/${row.id}`}>
            <Button variant="secondary" size="sm">
              Voir les détails
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  // Filter reservations based on search
  const filteredReservations = reservations.filter((reservation) => reservation.salle.name.toLowerCase().includes(searchTerm.toLowerCase()) || reservation.purpose.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mes Réservations"
        description="Gérez vos réservations de salles et d'équipements"
        actions={[
          {
            children: "Nouvelle Réservation",
            variant: "primary",
            onClick: () => setShowForm(true),
          },
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
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredReservations} searchable={true} onSearch={setSearchTerm} searchPlaceholder="Rechercher une réservation..." />
        )}
      </Card>

      {/* Reservation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-dark-border px-6 py-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">Nouvelle Réservation</h2>
              <Button variant="secondary" onClick={handleCloseForm}>
                Fermer
              </Button>
            </div>
            <div className="p-6">
              <ReservationForm onSuccess={handleFormSuccess} onFormChange={() => setHasFormChanges(true)} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
