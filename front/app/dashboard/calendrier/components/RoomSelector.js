'use client';
import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function RoomSelector({ rooms, selectedRooms, onRoomSelect }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter rooms based on search query
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    
    const query = searchQuery.toLowerCase().trim();
    return rooms.filter(room => 
      room.name.toLowerCase().includes(query) ||
      (room.description && room.description.toLowerCase().includes(query))
    );
  }, [rooms, searchQuery]);

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher une salle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   placeholder-gray-500 dark:placeholder-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        )}
      </div>

      {/* Room list */}
      <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
        {filteredRooms.length === 0 ? (
          <p className="text-center py-4 text-gray-500 dark:text-gray-400">
            Aucune salle trouvée
          </p>
        ) : (
          filteredRooms.map(room => (
            <label 
              key={room.id} 
              className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedRooms.includes(room.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onRoomSelect([...selectedRooms, room.id]);
                  } else {
                    onRoomSelect(selectedRooms.filter(id => id !== room.id));
                  }
                }}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 
                         dark:border-gray-600 dark:bg-gray-700"
              />
              <div className="flex-1">
                <span className="text-gray-700 dark:text-gray-200">{room.name}</span>
                {room.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{room.description}</p>
                )}
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
} 