"use client";

import { useState, useEffect, useMemo } from "react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import RoomSelector from "./components/RoomSelector";
import ReservationDetails from "./components/ReservationDetails";
import { Card } from "../../components/ui";
import { getSallesCalendar } from "@/app/services/salleService";
import { getCalendarReservations } from "@/app/services/reservationService";
import toast from "../../utils/toast";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/styles/datepicker.css";

export default function CalendarPage() {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [isRoomSelectorOpen, setIsRoomSelectorOpen] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const response = await getSallesCalendar();
        const filteredRooms = (response.data || []).filter((room) =>
          ["laboratoire", "amphitheatre"].includes((room.type || "").toLowerCase())
        );
        setRooms(filteredRooms);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        toast.error("Erreur lors du chargement des salles");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        startDate.setDate(startDate.getDate() - 7);

        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 7);

        const response = await getCalendarReservations(
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0],
          selectedRooms
        );

        setReservations(response.data || []);
      } catch (error) {
        console.error("Error fetching reservations:", error);
        toast.error("Erreur lors du chargement des réservations");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [selectedDate, selectedRooms]);

  const getDateClassName = (date) => {
    const calendarDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const dayReservations = reservations.filter((res) => {
      const startDate = new Date(res.start_time);
      const endDate = new Date(res.end_time);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return calendarDate >= startDate && calendarDate <= endDate;
    });

    if (dayReservations.length === 0) return undefined;

    const statuses = new Set(dayReservations.map((res) => res.status));
    if (statuses.size > 1) return "has-multiple-statuses";

    const status = dayReservations[0].status;
    return `has-${status}-reservations`;
  };

  const filteredReservations = useMemo(() => {
    if (!reservations || !selectedDate) return [];

    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);
    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(23, 59, 59, 999);

    return reservations.filter((reservation) => {
      const startDate = new Date(reservation.start_time);
      const endDate = new Date(reservation.end_time);

      return (
        (startDate >= selectedDateStart && startDate <= selectedDateEnd) ||
        (endDate >= selectedDateStart && endDate <= selectedDateEnd) ||
        (startDate <= selectedDateStart && endDate >= selectedDateEnd)
      );
    });
  }, [reservations, selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
            Calendrier des réservations
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Consultez la disponibilité mensuelle des laboratoires et amphithéâtres.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRoomSelectorOpen(!isRoomSelectorOpen)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
              selectedRooms.length > 0 || isRoomSelectorOpen
                ? "bg-primary-50 dark:bg-primary-950/50 border-primary-300 dark:border-primary-800 text-primary-700 dark:text-primary-300"
                : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <FunnelIcon className="w-4 h-4 shrink-0" />
            <span>
              {selectedRooms.length > 0
                ? `${selectedRooms.length} salle${selectedRooms.length > 1 ? "s" : ""} filtrée${
                    selectedRooms.length > 1 ? "s" : ""
                  }`
                : "Filtrer par salle"}
            </span>
          </button>

          {isRoomSelectorOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 z-50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
                      Filtrer les salles
                    </h3>
                    <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedRooms.length} sur {rooms.length} sélectionnée
                      {selectedRooms.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRoomSelectorOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {loading && rooms.length === 0 ? (
                  <div className="animate-pulse space-y-2.5 py-2">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="flex items-center gap-3">
                        <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded flex-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <RoomSelector
                      rooms={rooms}
                      selectedRooms={selectedRooms}
                      onRoomSelect={setSelectedRooms}
                    />
                    {rooms.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRooms(
                              selectedRooms.length === rooms.length
                                ? []
                                : rooms.map((room) => room.id)
                            )
                          }
                          className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                        >
                          {selectedRooms.length === rooms.length
                            ? "Tout désélectionner"
                            : "Tout sélectionner"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsRoomSelectorOpen(false)}
                          className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                          Fermer
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const prevMonth = new Date(selectedDate);
                prevMonth.setMonth(prevMonth.getMonth() - 1);
                setSelectedDate(prevMonth);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Précédent</span>
            </button>

            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white capitalize">
              {format(selectedDate, "MMMM yyyy", { locale: fr })}
            </h2>

            <button
              type="button"
              onClick={() => {
                const nextMonth = new Date(selectedDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setSelectedDate(nextMonth);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <span>Suivant</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            <div className="calendar-page-calendar-container max-w-4xl mx-auto">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                inline
                locale={fr}
                showMonthYearPicker={false}
                showTimeSelect={false}
                calendarClassName="w-full"
                fixedHeight
                monthsShown={1}
                dayClassName={getDateClassName}
                renderCustomHeader={() => (
                  <div style={{ margin: 0, padding: 0, visibility: "hidden", height: 0 }} />
                )}
              />
            </div>
          </div>

          <div className="px-6 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              Disponible
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Approuvée
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
              En cours
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              Terminée
            </span>
          </div>
        </div>

        <div className="xl:col-span-4">
          <Card
            title="Créneaux du jour"
            subtitle={format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
          >
            <ReservationDetails
              date={selectedDate}
              rooms={selectedRooms}
              reservations={filteredReservations}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
