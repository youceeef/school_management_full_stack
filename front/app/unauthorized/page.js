"use client";

import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/outline";

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-center">
          <LockClosedIcon className="h-16 w-16 text-red-500 dark:text-red-400" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Accès non autorisé</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Désolé, vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.</p>
        <div className="mt-6">
          <Link href="/dashboard" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition duration-150 ease-in-out">
            Retourner au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
