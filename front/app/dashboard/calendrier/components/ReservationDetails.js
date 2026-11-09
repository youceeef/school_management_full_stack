"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDaysIcon, ClockIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";

export default function ReservationDetails({ date, rooms, reservations }) {
  const filteredReservations = reservations.filter((reservation) => {
    const reservationDate = new Date(reservation.start_time);
    const selectedDate = new Date(date);

    return (
      reservationDate.getDate() === selectedDate.getDate() &&
      reservationDate.getMonth() === selectedDate.getMonth() &&
      reservationDate.getFullYear() === selectedDate.getFullYear() &&
      (rooms.length === 0 || (reservation.salle && rooms.includes(reservation.salle.id)))
    );
  });

  if (filteredReservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
          <CalendarDaysIcon className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Aucune réservation programmée
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
          {format(date, "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>
    );
  }

  const getStatusMeta = (status, label) => {
    const map = {
      approved: {
        dot: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-300",
        label: label || "Approuvée",
      },
      in_progress: {
        dot: "bg-primary-600 dark:bg-primary-400",
        text: "text-primary-700 dark:text-primary-300",
        label: label || "En cours",
      },
      completed: {
        dot: "bg-slate-400",
        text: "text-slate-600 dark:text-slate-400",
        label: label || "Terminée",
      },
    };
    return (
      map[status] || {
        dot: "bg-slate-400",
        text: "text-slate-600 dark:text-slate-400",
        label: label || status,
      }
    );
  };

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
      {filteredReservations.map((reservation) => {
        const statusMeta = getStatusMeta(reservation.status, reservation.status_label);
        return (
          <div key={reservation.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {reservation.title || reservation.purpose || "Réservation de salle"}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <BuildingOfficeIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{reservation.salle?.name || "Salle"}</span>
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium shrink-0 ${statusMeta.text}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
              <ClockIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {format(new Date(reservation.start_time), "HH:mm")} –{" "}
                {format(new Date(reservation.end_time), "HH:mm")}
              </span>
            </div>

            {reservation.equipements && reservation.equipements.length > 0 && (
              <div className="pt-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Équipements :{" "}
                  </span>
                  {reservation.equipements
                    .map((eq) => `${eq.name} (${eq.pivot?.quantity ?? 1})`)
                    .join(" · ")}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}