"use client";

import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inscription</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Choisissez votre type de compte</p>
        </div>

        <div className="space-y-4">
          <Link href="/register/professeur" className="block w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white font-medium rounded-md text-center transition duration-200">
            Inscription Professeur
          </Link>

          <Link href="/register/responsable" className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-md text-center transition duration-200">
            Inscription Responsable Laboratoire
          </Link>

          <Link href="/register/eleve" className="block w-full py-3 px-4 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-medium rounded-md text-center transition duration-200">
            Inscription Élève
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Déjà un compte?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
