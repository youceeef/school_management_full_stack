import React from "react";

export default function StatsCard({ title, value, icon: Icon, loading = false }) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          {loading ? (
            <div className="animate-pulse mt-2">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ) : (
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          )}
        </div>
        {Icon && (
          <div className={`flex-shrink-0 rounded-full p-3 ${loading ? "bg-gray-100 dark:bg-gray-800" : "bg-blue-50 dark:bg-blue-900/20"}`}>
            <Icon className={`w-6 h-6 ${loading ? "text-gray-400 dark:text-gray-600" : "text-blue-600 dark:text-blue-400"}`} />
          </div>
        )}
      </div>
    </div>
  );
}
