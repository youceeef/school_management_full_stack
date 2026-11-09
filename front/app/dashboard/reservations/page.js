"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  getReservations,
  approveReservation,
  rejectReservation,
} from "../../services/reservationService";
import toast from "../../utils/toast";
import { PERMISSIONS } from "../../constants/permissions";

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedReservationId, setSelectedReservationId] = useState(null);

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

  const statsCards = [
    {
      title: "Total des demandes",
      value: reservations.length.toLocaleString("fr-FR"),
      icon: CalendarDaysIcon,
    },
    {
      title: "En attente de validation",
      value: reservations.filter((r) => r.status === "pending").length.toLocaleString("fr-FR"),
      icon: ClockIcon,
    },
    {
      title: "Sessions en cours",
      value: reservations.filter((r) => r.status === "in_progress").length.toLocaleString("fr-FR"),
      icon: ClockIcon,
    },
    {
      title: "Sessions terminées",
      value: reservations.filter((r) => r.status === "completed").length.toLocaleString("fr-FR"),
      icon: CheckCircleIcon,
    },
  ];

  const statusConfig = {
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

  const columns = [
    {
      header: "Créneau",
      accessor: "start_time",
      render: (row) => {
        const startDate = new Date(row.start_time);
        const endDate = new Date(row.end_time);
        return (
          <div className="font-mono tabular-nums">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {startDate.toLocaleDateString("fr-FR")}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} –{" "}
              {endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
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
          <div className="font-medium text-slate-900 dark:text-slate-100">
            {row.salle?.name || "—"}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
            {row.salle?.type || "—"}
          </div>
        </div>
      ),
    },
    {
      header: "Demandeur",
      accessor: "user",
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">
            {row.user ? `${row.user.first_name} ${row.user.last_name}` : "—"}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{row.user?.email || ""}</div>
        </div>
      ),
    },
    {
      header: "Équipements",
      accessor: "equipements",
      render: (row) =>
        !row.equipements || row.equipements.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-slate-500">Aucun</span>
        ) : (
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
            {row.equipements
              .map((item) => `${item.name} (${item.quantity_reserved})`)
              .join(" · ")}
          </p>
        ),
    },
    {
      header: "Statut",
      accessor: "status",
      render: (row) => {
        const meta = statusConfig[row.status] || {
          label: row.status,
          dot: "bg-slate-400",
          text: "text-slate-600 dark:text-slate-400",
        };
        return (
          <span className={`inline-flex items-center gap-2 text-xs font-medium ${meta.text}`}>
            <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        );
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
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
              Détails
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const handleApprove = async (id) => {
    try {
      const response = await approveReservation(id);
      if (response.success) {
        toast.success(response.message);
        fetchReservations();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error approving reservation:", error);
      toast.error("Une erreur inattendue est survenue");
    }
  };

  const handleShowRejectModal = (id) => {
    setSelectedReservationId(id);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setSelectedReservationId(null);
    setRejectionReason("");
  };

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
        fetchReservations();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error rejecting reservation:", error);
      toast.error("Une erreur inattendue est survenue");
    }
  };

  const filteredReservations = reservations.filter((reservation) => {
    const query = searchTerm.toLowerCase();
    const searchMatch =
      (reservation.salle?.name || "").toLowerCase().includes(query) ||
      `${reservation.user?.first_name || ""} ${reservation.user?.last_name || ""}`
        .toLowerCase()
        .includes(query) ||
      (reservation.purpose || "").toLowerCase().includes(query);

    const statusMatch = filterStatus === "all" || reservation.status === filterStatus;

    return searchMatch && statusMatch;
  });

  const statusTabs = [
    { key: "all", label: "Toutes" },
    { key: "pending", label: "En attente" },
    { key: "approved", label: "Approuvées" },
    { key: "in_progress", label: "En cours" },
    { key: "completed", label: "Terminées" },
    { key: "rejected", label: "Refusées" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des réservations"
        description="Examinez, approuvez ou refusez les demandes de réservation d’espaces et d’équipements."
        actions={[
          {
            children: "Nouvelle réservation",
            icon: PlusIcon,
            variant: "primary",
            onClick: () => router.push("/dashboard/mes-reservations?new=1"),
            permission: PERMISSIONS.CREATE_RESERVATIONS,
          },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            loading={loading}
          />
        ))}
      </div>

      <Card title="Demandes enregistrées" subtitle="Filtrez par état d’avancement">
        <div className="space-y-4">
          <div className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
            {statusTabs.map((tab) => {
              const active = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterStatus(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    active
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredReservations}
              searchable
              onSearch={setSearchTerm}
              searchPlaceholder="Rechercher par salle, enseignant ou motif..."
            />
          )}
        </div>
      </Card>

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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Indiquez la raison du refus afin d&apos;en informer le demandeur par notification.
              </p>
              <textarea
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                rows={4}
                placeholder="Ex: Salle indisponible pour maintenance technique..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={handleCloseRejectModal}>
                  Annuler
                </Button>
                <Button variant="danger" onClick={handleReject}>
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
