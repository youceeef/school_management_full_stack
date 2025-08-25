"use client";
import { useState, useEffect, useMemo } from "react";
import DatePicker from "react-datepicker";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import RoomSelector from "./components/RoomSelector";
import ReservationDetails from "./components/ReservationDetails";
import { getSallesCalendar } from "@/app/services/salleService";
import { getCalendarReservations, getDailyReservations } from "@/app/services/reservationService";
import { toast } from "react-hot-toast";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/styles/datepicker.css";

// Get current date for mock data
const currentDate = new Date();
const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

// Mock data for reservations
const mockReservations = [
  // Today's reservations
  {
    id: "1",
    salleId: "1",
    startTime: new Date(today.setHours(9, 0)),
    endTime: new Date(today.setHours(11, 0)),
    title: "Cours de Mathématiques",
    description: "Cours de calcul différentiel",
    equipements: [
      { id: "1", name: "Projecteur", quantity: 1 },
      { id: "2", name: "Tableau Interactif", quantity: 1 },
    ],
    userId: "user1",
    status: "confirmed",
  },
  {
    id: "2",
    salleId: "1",
    startTime: new Date(today.setHours(14, 0)),
    endTime: new Date(today.setHours(16, 0)),
    title: "TP Informatique",
    description: "Travaux pratiques en programmation",
    equipements: [
      { id: "3", name: "Ordinateurs", quantity: 15 },
      { id: "4", name: "Écran", quantity: 1 },
    ],
    userId: "user2",
    status: "confirmed",
  },
  // Tomorrow's reservations
  {
    id: "3",
    salleId: "2",
    startTime: new Date(tomorrow.setHours(8, 30)),
    endTime: new Date(tomorrow.setHours(10, 30)),
    title: "Réunion Département",
    description: "Réunion mensuelle du département",
    equipements: [{ id: "5", name: "Système de visioconférence", quantity: 1 }],
    userId: "user3",
    status: "confirmed",
  },
  {
    id: "4",
    salleId: "3",
    startTime: new Date(tomorrow.setHours(11, 0)),
    endTime: new Date(tomorrow.setHours(13, 0)),
    title: "Soutenance PFE",
    description: "Présentation des projets de fin d'études",
    equipements: [
      { id: "1", name: "Projecteur", quantity: 1 },
      { id: "6", name: "Microphone", quantity: 2 },
    ],
    userId: "user4",
    status: "pending",
  },
  // Day after tomorrow
  {
    id: "5",
    salleId: "5",
    startTime: new Date(dayAfterTomorrow.setHours(9, 0)),
    endTime: new Date(dayAfterTomorrow.setHours(12, 0)),
    title: "Conférence IA",
    description: "Conférence sur l'Intelligence Artificielle",
    equipements: [
      { id: "1", name: "Projecteur", quantity: 2 },
      { id: "6", name: "Microphone", quantity: 3 },
      { id: "7", name: "Système de son", quantity: 1 },
    ],
    userId: "user5",
    status: "confirmed",
  },
  {
    id: "6",
    salleId: "4",
    startTime: new Date(dayAfterTomorrow.setHours(14, 0)),
    endTime: new Date(dayAfterTomorrow.setHours(17, 0)),
    title: "TP Chimie",
    description: "Travaux pratiques de chimie organique",
    equipements: [
      { id: "8", name: "Microscopes", quantity: 10 },
      { id: "9", name: "Kit de laboratoire", quantity: 15 },
    ],
    userId: "user6",
    status: "confirmed",
  },
  // Cancelled reservation
  {
    id: "7",
    salleId: "2",
    startTime: new Date(today.setHours(16, 30)),
    endTime: new Date(today.setHours(18, 0)),
    title: "Séminaire Annulé",
    description: "Séminaire sur le développement durable",
    equipements: [{ id: "1", name: "Projecteur", quantity: 1 }],
    userId: "user7",
    status: "cancelled",
  },
];

export default function CalendarPage() {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [isRoomSelectorOpen, setIsRoomSelectorOpen] = useState(false);
  const [datesWithReservations, setDatesWithReservations] = useState([]);

  // Fetch rooms and filter by type
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const response = await getSallesCalendar();
        // Filter rooms to only include laboratoire and amphitheatre
        const filteredRooms = response.data.filter((room) => ["laboratoire", "amphitheatre"].includes(room.type.toLowerCase()));
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

  // Fetch reservations when date or selected rooms change
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        // Commencer par les derniers jours du mois précédent
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        startDate.setDate(startDate.getDate() - 7); // Include last week of previous month

        // Terminer quelques jours dans le mois prochain
        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 7);

        const response = await getCalendarReservations(startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0], selectedRooms);

        setReservations(response.data);

        // Mettre à jour les dates avec des réservations pour la mise en évidence du calendrier
        const dates = new Set();
        response.data.forEach((res) => {
          const start = new Date(res.start_time);
          const end = new Date(res.end_time);

          // Ajouter toutes les dates entre le début et la fin
          for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            dates.add(date.toISOString().split("T")[0]);
          }
        });
        setDatesWithReservations(Array.from(dates));
      } catch (error) {
        console.error("Error fetching reservations:", error);
        toast.error("Erreur lors du chargement des réservations");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [selectedDate, selectedRooms]);

  // Handle room selection
  const handleRoomSelection = async (selectedRoomIds) => {
    setSelectedRooms(selectedRoomIds);
  };

  // Function to highlight dates with reservations
  const getDateClassName = (date) => {
    // Convert the calendar date to start of day in local timezone
    const calendarDate = new Date(date.setHours(0, 0, 0, 0));

    // Find reservations for this date
    const dayReservations = reservations.filter((res) => {
      const startDate = new Date(res.start_time);
      const endDate = new Date(res.end_time);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Check if the calendar date falls within the reservation period
      return calendarDate >= startDate && calendarDate <= endDate;
    });

    if (dayReservations.length === 0) return undefined;

    const statuses = new Set(dayReservations.map((res) => res.status));

    if (statuses.size > 1) return "has-multiple-statuses";

    const status = dayReservations[0].status;
    return `has-${status}-reservations`;
  };

  // Also update the ReservationDetails filtering
  const filteredReservations = useMemo(() => {
    if (!reservations || !selectedDate) return [];

    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);
    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(23, 59, 59, 999);

    return reservations.filter((reservation) => {
      const startDate = new Date(reservation.start_time);
      const endDate = new Date(reservation.end_time);

      // Show reservation if:
      // 1. It starts on the selected date
      // 2. It ends on the selected date
      // 3. It spans across the selected date
      return (startDate >= selectedDateStart && startDate <= selectedDateEnd) || (endDate >= selectedDateStart && endDate <= selectedDateEnd) || (startDate <= selectedDateStart && endDate >= selectedDateEnd);
    });
  }, [reservations, selectedDate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header Section with integrated room selector */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Calendrier des Réservations</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Consultez les disponibilités des salles</p>
          </div>

          {/* Enhanced Room Selector Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsRoomSelectorOpen(!isRoomSelectorOpen)}
              className={`
                inline-flex items-center px-4 py-2.5 
                bg-white dark:bg-gray-800 
                border border-gray-200 dark:border-gray-700 
                rounded-lg shadow-sm 
                hover:bg-gray-50 dark:hover:bg-gray-700 
                transition-all duration-200
                ${isRoomSelectorOpen ? "ring-2 ring-indigo-500 border-transparent" : ""}
              `}
            >
              <svg className={`w-5 h-5 mr-2 transition-colors duration-200 ${selectedRooms.length > 0 ? "text-indigo-500 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className={`font-medium transition-colors duration-200 ${selectedRooms.length > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-200"}`}>
                {selectedRooms.length > 0 ? `${selectedRooms.length} salle${selectedRooms.length > 1 ? "s" : ""} sélectionnée${selectedRooms.length > 1 ? "s" : ""}` : "Filtrer les salles"}
              </span>
              <svg className={`w-5 h-5 ml-2 transition-all duration-200 ${selectedRooms.length > 0 ? "text-indigo-500 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"} ${isRoomSelectorOpen ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Enhanced Dropdown Panel with animation */}
            {isRoomSelectorOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 transform opacity-100 scale-100 transition-all duration-200 origin-top">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sélectionner les salles</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {selectedRooms.length} sur {rooms.length} sélectionnée{selectedRooms.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <button onClick={() => setIsRoomSelectorOpen(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {loading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="flex items-center space-x-3">
                          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        <RoomSelector rooms={rooms} selectedRooms={selectedRooms} onRoomSelect={setSelectedRooms} />
                      </div>
                      {rooms.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => {
                              setSelectedRooms(selectedRooms.length === rooms.length ? [] : rooms.map((room) => room.id));
                            }}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
                          >
                            {selectedRooms.length === rooms.length ? "Désélectionner tout" : "Sélectionner tout"}
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
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Calendar Section with improved layout */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  const prevMonth = new Date(selectedDate);
                  prevMonth.setMonth(prevMonth.getMonth() - 1);
                  setSelectedDate(prevMonth);
                }}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Mois précédent
              </button>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white capitalize">{format(selectedDate, "MMMM yyyy", { locale: fr })}</h2>
              <button
                onClick={() => {
                  const nextMonth = new Date(selectedDate);
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setSelectedDate(nextMonth);
                }}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Mois suivant
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            <div className="calendar-page-calendar-container max-w-5xl mx-auto">
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
                renderCustomHeader={({ date }) => <div style={{ margin: 0, padding: 0, visibility: "hidden", height: 0 }} />}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="px-6 pb-4 flex items-center justify-center gap-6 text-sm flex-wrap">
            <div className="flex items-center bg-white dark:bg-gray-750 p-2 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 mr-2"></div>
              <span className="text-gray-700 dark:text-gray-300">Dates disponibles</span>
            </div>
            <div className="flex items-center bg-white dark:bg-gray-750 p-2 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span className="text-gray-700 dark:text-gray-300">Réservations approuvées</span>
            </div>
            <div className="flex items-center bg-white dark:bg-gray-750 p-2 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-gray-700 dark:text-gray-300">Réservations en cours</span>
            </div>
            <div className="flex items-center bg-white dark:bg-gray-750 p-2 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded-full bg-gray-500 mr-2"></div>
              <span className="text-gray-700 dark:text-gray-300">Réservations terminées</span>
            </div>
            <div className="flex items-center bg-white dark:bg-gray-750 p-2 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded-full bg-indigo-500 mr-2"></div>
              <span className="text-gray-700 dark:text-gray-300">Date sélectionnée</span>
            </div>
          </div>
        </div>

        {/* Reservation Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Détails des Réservations</h2>
          <ReservationDetails date={selectedDate} rooms={selectedRooms} reservations={filteredReservations} />
        </div>
      </div>
    </div>
  );
}
