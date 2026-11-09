"use client";

import React, { useState } from "react";
import SearchInput from "../SearchInput";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const DataTable = ({
  columns,
  data = [],
  searchable = true,
  onSearch,
  searchPlaceholder = "Rechercher...",
  className = "",
  emptyMessage = "Aucun résultat ne correspond à votre recherche.",
}) => {
  const [internalQuery, setInternalQuery] = useState("");

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setInternalQuery(val);
    onSearch?.(val);
  };

  const handleClearSearch = () => {
    setInternalQuery("");
    onSearch?.("");
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {searchable && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:max-w-sm">
            <SearchInput
              placeholder={searchPlaceholder}
              value={internalQuery}
              onChange={handleSearchChange}
              onClear={internalQuery ? handleClearSearch : undefined}
            />
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {data.length} {data.length > 1 ? "entrées" : "entrée"}
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      scope="col"
                      className={`px-4 sm:px-5 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 tracking-wide whitespace-nowrap ${
                        column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"
                      }`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 bg-white dark:bg-slate-900">
                {data.map((row, rowIndex) => (
                  <tr
                    key={row.id ?? rowIndex}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={`${rowIndex}-${colIndex}`}
                        className={`px-4 sm:px-5 py-3.5 text-sm align-middle ${
                          colIndex === 0
                            ? "font-medium text-slate-900 dark:text-slate-100"
                            : "text-slate-600 dark:text-slate-300"
                        } ${
                          column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"
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
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{emptyMessage}</p>
            {internalQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Réinitialiser la recherche
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
