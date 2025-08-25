import React from "react";
import SearchInput from "../SearchInput";

const DataTable = ({ 
  columns, 
  data, 
  searchable = true, 
  onSearch, 
  searchPlaceholder = "Rechercher...", 
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      {searchable && (
        <div className="mb-6">
          <SearchInput placeholder={searchPlaceholder} onChange={(e) => onSearch(e.target.value)} />
        </div>
      )}

      <div className="relative overflow-hidden shadow-md rounded-xl border border-gray-200 dark:border-gray-700">
        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  {columns.map((column, index) => (
                    <th 
                      key={index} 
                      scope="col" 
                      className="px-4 sm:px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap bg-opacity-75 backdrop-blur-sm sticky top-0"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-150 ease-in-out group"
                  >
                    {columns.map((column, colIndex) => (
                      <td 
                        key={`${rowIndex}-${colIndex}`} 
                        className={`px-4 sm:px-6 py-4 text-center text-sm ${
                          colIndex === 0 ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                        } ${
                          typeof column.render === 'function' ? 'max-w-xs xl:max-w-lg' : ''
                        }`}
                      >
                        <div className="break-words">
                          {column.render ? column.render(row) : row[column.accessor]}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Aucun résultat ne correspond à votre recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;