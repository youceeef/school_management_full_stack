'use client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ReservationDetails({ date, rooms, reservations }) {
  // Filter reservations for selected date and rooms
  const filteredReservations = reservations.filter(reservation => {
    const reservationDate = new Date(reservation.start_time);
    const selectedDate = new Date(date);
    
    return (
      reservationDate.getDate() === selectedDate.getDate() &&
      reservationDate.getMonth() === selectedDate.getMonth() &&
      reservationDate.getFullYear() === selectedDate.getFullYear() &&
      (rooms.length === 0 || rooms.includes(reservation.salle.id))
    );
  });

  if (filteredReservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <svg 
          className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
        <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
          Aucune réservation pour cette date
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>
    );
  }

  const getStatusStyle = (status) => {
    const styles = {
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
      </h3>
      
      <div className="space-y-4">
        {filteredReservations.map((reservation) => (
          <div
            key={reservation.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{reservation.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{reservation.salle.name}</p>
                {reservation.approved_at && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Approuvée le {format(new Date(reservation.approved_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </p>
                )}
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(reservation.status)}`}>
                {reservation.status_label}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {format(new Date(reservation.start_time), 'HH:mm')} - {format(new Date(reservation.end_time), 'HH:mm')}
            </div>
            
            {reservation.equipements && reservation.equipements.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Équipements:</p>
                <div className="flex flex-wrap gap-1">
                  {reservation.equipements.map((eq) => (
                    <span
                      key={eq.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {eq.name} ({eq.pivot.quantity})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 