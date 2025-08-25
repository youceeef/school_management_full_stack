"use client";

import React, { useEffect, useState } from "react";
import toast from "../utils/toast";
import { useAuth } from "../context/AuthContext";
import { Card, DataTable, StatsCard, PageHeader } from "../components/ui";
import { UsersIcon, BuildingOfficeIcon, ComputerDesktopIcon, DocumentIcon } from "@heroicons/react/24/outline";
import ProtectedRoute from "../components/ProtectedRoute";
import { getDashboardStats, getRecentReservations } from "../services/dashboardService";
import LoadingSpinner from "../components/LoadingSpinner"; // Make sure this component exists and is imported

export default function Dashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(true);

  const [stats, setStats] = useState([
    { title: "Utilisateurs", value: 0, icon: UsersIcon },
    { title: "Salles", value: 0, icon: BuildingOfficeIcon },
    { title: "Equipements", value: 0, icon: ComputerDesktopIcon },
    { title: "Documents", value: 0, icon: DocumentIcon },
  ]);

  const [reservations, setReservations] = useState([]);

  const columns = [
    {
      header: "Salles",
      accessor: "room",
      render: (row) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center mr-3">🏢</div>
          <span>{row.room}</span>
        </div>
      ),
    },
    {
      header: "Statut",
      accessor: "status",
      render: (row) => {
        // --- This object is now corrected to match your database statuses ---
        const statusConfig = {
          pending: { text: "En attente", className: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300" },
          approved: { text: "Approuvée", className: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300" },
          in_progress: { text: "En cours", className: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300" },
          rejected: { text: "Rejeté", className: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300" },
          completed: { text: "Terminé", className: "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-400" },
        };

        const config = statusConfig[row.status] || { text: row.status, className: "bg-gray-100 text-gray-800" };

        return <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.className}`}>{config.text}</span>;
      },
    },
    { header: "Professeur", accessor: "professor" },
    { header: "Date", accessor: "date" },
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasShownWelcome = sessionStorage.getItem("hasShownWelcomeDashboard");
      if (!hasShownWelcome) {
        toast.success("Bienvenue sur votre tableau de bord!");
        sessionStorage.setItem("hasShownWelcomeDashboard", "true");
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setReservationsLoading(true);

        const [statsData, reservationsData] = await Promise.all([getDashboardStats(), getRecentReservations(5)]);

        setStats([
          { title: "Utilisateurs", value: statsData.users.toLocaleString(), icon: UsersIcon },
          { title: "Salles", value: statsData.rooms.toLocaleString(), icon: BuildingOfficeIcon },
          { title: "Equipements", value: statsData.equipments.toLocaleString(), icon: ComputerDesktopIcon },
          { title: "Documents", value: statsData.documents.toLocaleString(), icon: DocumentIcon },
        ]);

        // --- FIX #2: Use the reservationsData directly, not reservationsData.data ---
        setReservations(reservationsData || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Erreur lors du chargement des données du tableau de bord");
      } finally {
        setLoading(false);
        setReservationsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewAll = () => {
    toast.info("Fonctionnalité à implémenter: Voir toutes les réservations");
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "eleve", "enseignant", "responsable_labo"]}>
      <div className="space-y-8">
        <PageHeader
          title={`Bonjour, ${user?.first_name} ${user?.last_name}`}
          description="Bienvenue dans votre tableau de bord"
          actions={[
            { children: "Nouvelle Réservation", variant: "primary", onClick: () => toast.info("Nouvelle réservation") },
            { children: "Voir les Statistiques", variant: "secondary", onClick: () => toast.info("Voir les statistiques") },
          ]}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => (
            <StatsCard key={index} title={stat.title} value={stat.value} icon={stat.icon} loading={loading} />
          ))}
        </div>

        {/* Main Content Sections (static for now) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Statistiques Rapides">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Réservations actives</p>
                <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">12</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Documents partagés</p>
                <p className="text-xl font-semibold text-green-600 dark:text-green-400">25</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Notifications non lues</p>
                <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">3</p>
              </div>
            </div>
          </Card>
          <Card title="Activité Récente">
            <div className="space-y-4">
              {[
                { initials: "AD", title: "Nouvelle réservation créée", time: "Il y a 2 heures", color: "blue" },
                { initials: "ML", title: "Document mis à jour", time: "Il y a 5 heures", color: "green" },
                { initials: "TM", title: "Commentaire ajouté", time: "Il y a 1 jour", color: "purple" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full bg-${activity.color}-100 dark:bg-${activity.color}-900 text-${activity.color}-600 dark:text-${activity.color}-300 flex items-center justify-center mr-3 flex-shrink-0`}>
                    <span className="text-xs">{activity.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Actions Rapides">
            <div className="space-y-3">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-lg transition-all shadow-sm hover:shadow flex items-center justify-center">
                <span className="mr-2">📝</span> Nouvelle Réservation
              </button>
              <button className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white rounded-lg transition-all shadow-sm hover:shadow flex items-center justify-center">
                <span className="mr-2">📄</span> Partager un Document
              </button>
              <button className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white rounded-lg transition-all shadow-sm hover:shadow flex items-center justify-center">
                <span className="mr-2">🔔</span> Voir les Notifications
              </button>
            </div>
          </Card>
        </div>

        {/* Reservations Table */}
        <Card title="Reservations récentes">
          {reservationsLoading ? (
            <div className="flex justify-center items-center py-16">
              <LoadingSpinner />
            </div>
          ) : (
            <DataTable columns={columns} data={reservations} searchable={true} onSearch={setSearchQuery} searchPlaceholder="Rechercher une réservation..." />
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}
