"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ReservationForm from "../../components/reservation/ReservationForm";
import { getMyReservations } from "../../services/reservationService";
import toast from "../../utils/toast";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function MesReservationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      }
    >
      <MesReservationsContent />
    </Suspense>
  );
}

function MesReservationsContent() {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") setShowForm(true);
  }, [searchParams]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await getMyReservations();
      setReservations(data || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Une erreur est survenue lors du chargement des données");
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = async () => {
    if (hasFormChanges) {
      if (
        await toast.confirm(
          "Voulez-vous vraiment fermer le formulaire ? Toutes les modifications seront perdues."
        )
      ) {
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
    toast.success("Réservation créée avec succès !");
  };

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString("fr-FR"),
      time: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const getTimeSlot = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })} – ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  };

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

  const statsCards = [
    {
      title: "Mes réservations",
      value: `${(reservations?.length || 0).toLocaleString("fr-FR")}`,
      icon: CalendarDaysIcon,
    },
    {
      title: "En attente",
      value: `${(
        reservations?.filter((r) => r.status === "pending").length || 0
      ).toLocaleString("fr-FR")}`,
      icon: ClockIcon,
    },
    {
      title: "En cours",
      value: `${(
        reservations?.filter((r) => r.status === "in_progress").length || 0
      ).toLocaleString("fr-FR")}`,
      icon: ClockIcon,
    },
    {
      title: "Terminées",
      value: `${(
        reservations?.filter((r) => r.status === "completed").length || 0
      ).toLocaleString("fr-FR")}`,
      icon: CheckCircleIcon,
    },
  ];

  const columns = [
    {
      header: "Salle",
      accessor: "salle.name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <BuildingOfficeIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="block font-medium text-slate-900 dark:text-slate-100">
              {row.salle?.name || "—"}
            </span>
            {row.salle?.type && (
              <span className="block text-xs text-slate-500 dark:text-slate-400 capitalize">
                {row.salle.type}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Date et créneau",
      accessor: "start_time",
      render: (row) => {
        const { date } = formatDateTime(row.start_time);
        const timeSlot = getTimeSlot(row.start_time, row.end_time);
        return (
          <div className="font-mono tabular-nums">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{date}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{timeSlot}</div>
          </div>
        );
      },
    },
    {
      header: "Statut",
      accessor: "status",
      render: (row) => {
        const meta = statusMeta[row.status] || {
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
        <div>
          <Link href={`/dashboard/mes-reservations/${row.id}`}>
            <Button variant="secondary" size="sm">
              Consulter
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const filteredReservations = reservations.filter((reservation) =>
    [reservation.salle?.name, reservation.purpose]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes réservations"
        description="Planifiez vos séances de travaux pratiques et suivez la validation de vos demandes."
        actions={[
          {
            children: "Nouvelle réservation",
            icon: PlusIcon,
            variant: "primary",
            onClick: () => setShowForm(true),
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

      <Card title="Historique de mes réservations" subtitle="Vos réservations passées et à venir">
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
            searchPlaceholder="Rechercher par salle ou motif..."
          />
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-8">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 px-6 py-4">
              <div>
                <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                  Nouvelle demande de réservation
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complétez les 4 étapes pour soumettre votre créneau.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseForm}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <ReservationForm
                onSuccess={handleFormSuccess}
                onFormChange={() => setHasFormChanges(true)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
