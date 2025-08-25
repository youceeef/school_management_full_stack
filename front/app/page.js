import React from "react";
import Link from "next/link";
import Image from "next/image";
import { AcademicCapIcon, ArrowRightStartOnRectangleIcon, UserPlusIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "./components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950 dark:to-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          {" "}
          <div className="flex items-center">
            <Image src="/logo.png" alt="EDUSPACE Logo" width={60} height={60} className="mr-2 dark:hidden" />
            <Image src="/logo_var.png" alt="EDUSPACE Logo" width={60} height={60} className="mr-2 hidden dark:block" />
            <h2 className="text-xl font-bold text-[#1F2937] dark:text-white">EDUSPACE</h2>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
              Connexion
            </Link>
            <Link href="/register" className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white px-4 py-2 rounded-md font-medium transition">
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0 p-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">
            Gestion Scolaire <span className="text-indigo-600 dark:text-indigo-400">Simplifiée</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md">Optimisez votre établissement éducatif avec notre tableau de bord complet. Gérez les étudiants, les cours et les ressources en un seul endroit.</p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/dashboard" className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-medium py-3 px-6 rounded-md transition">
              <AcademicCapIcon className="h-5 w-5 mr-2" />
              Accéder au Tableau de Bord
            </Link>
            <Link
              href="/register"
              className="flex items-center justify-center border border-gray-300 dark:border-gray-600 hover:border-indigo-600 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-400 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-md transition"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Créer un Compte
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 p-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl">
            <div className="relative w-full aspect-video rounded overflow-hidden">
              <div className="bg-indigo-100 dark:bg-indigo-900 w-full h-full flex items-center justify-center">
                <div className="text-center text-indigo-700 dark:text-indigo-300">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-medium">Tableau de Bord de Gestion Scolaire</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités Clés */}
      <section className="bg-indigo-100 dark:bg-indigo-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">Fonctionnalités Clés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 p-6">
            {[
              {
                title: "Gestion des Salles",
                description: "Gérez efficacement les salles de classe et les espaces de votre établissement.",
                icon: "🏢",
              },
              {
                title: "Gestion des Équipements",
                description: "Suivez et gérez tous les équipements et ressources matérielles.",
                icon: "🖨️",
              },
              {
                title: "Système de Réservation",
                description: "Planifiez et organisez les réservations de salles et d'équipements.",
                icon: "📅",
              },
              {
                title: "Gestion des Documents",
                description: "Partagez et gérez facilement vos documents et ressources numériques.",
                icon: "📄",
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out hover:bg-indigo-50 dark:hover:bg-indigo-900/50 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-700 dark:bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} EDUSPACE. Tous droits réservés.</p>
          {/* <div className="mt-4">
            <Link href="/privacy" className="text-gray-300 hover:text-white mx-2">
              Politique de Confidentialité
            </Link>
            <Link href="/terms" className="text-gray-300 hover:text-white mx-2">
              Conditions d&apos;Utilisation
            </Link>
            <Link href="/contact" className="text-gray-300 hover:text-white mx-2">
              Contactez-nous
            </Link>
          </div> */}
        </div>
      </footer>
    </div>
  );
}
