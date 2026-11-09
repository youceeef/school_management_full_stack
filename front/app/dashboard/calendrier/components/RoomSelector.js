"use client";

import { useState, useMemo } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function RoomSelector({ rooms, selectedRooms, onRoomSelect }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;

    const query = searchQuery.toLowerCase().trim();
    return rooms.filter(
      (room) =>
        room.name.toLowerCase().includes(query) ||
        (room.description && room.description.toLowerCase().includes(query))
    );
  }, [rooms, searchQuery]);

  return (
    <div>
      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher une salle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
        {filteredRooms.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
            Aucune salle correspondante
          </p>
        ) : (
          filteredRooms.map((room) => (
            <label
              key={room.id}
              className="flex items-start gap-2.5 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedRooms.includes(room.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onRoomSelect([...selectedRooms, room.id]);
                  } else {
                    onRoomSelect(selectedRooms.filter((id) => id !== room.id));
                  }
                }}
                className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500 dark:bg-slate-900"
              />
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {room.name}
                </span>
                {room.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {room.description}
                  </p>
                )}
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}