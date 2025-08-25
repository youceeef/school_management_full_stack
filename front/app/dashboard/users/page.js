"use client";

import React, { useState, useEffect } from "react";
import toast from "../../utils/toast";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import Button from "../../components/Button";
import { UsersIcon, KeyIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { getUsers, removeUserRole } from "../../services/userService";
import AdminRoute from "../../components/AdminRoute";

function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error.message || "Erreur lors du chargement des utilisateurs");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Table columns configuration
  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Prénom", accessor: "first_name" },
    { header: "Nom", accessor: "last_name" },
    { header: "Email", accessor: "email" },
    {
      header: "Rôles",
      accessor: "roles",
      render: (row) => (
        <div className="flex flex-wrap justify-center items-center gap-1.5">
          {row.roles?.map((role, idx) => (
            <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {typeof role === "object" ? role.name : role}
              <button 
                onClick={() => handleRemoveRole(row.id, typeof role === "object" ? role.name : role, `${row.first_name} ${row.last_name}`)} 
                className="ml-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none"
                title="Supprimer ce rôle"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      ),
    }
  ];

  // Stats cards data
  const statsCards = [
    {
      title: "Total Utilisateurs",
      value: users.length.toString(),
      icon: UsersIcon,
      trend: "up",
      trendValue: "12%",
    },
    {
      title: "Administrateurs",
      value: users.filter((u) => u.roles && u.roles.some((role) => (typeof role === "object" ? role.name === "admin" : role === "admin"))).length.toString(),
      icon: KeyIcon,
      trend: "up",
      trendValue: "5%",
    },
    {
      title: "Utilisateurs récents",
      value: users.slice(-5).length.toString(),
      icon: SparklesIcon,
      trend: "up",
      trendValue: "8%",
    },
  ];

  const handleRemoveRole = async (userId, roleName, userName) => {
    toast.confirmDelete(
      `Êtes-vous sûr de vouloir retirer le rôle "${roleName}" de l'utilisateur "${userName}" ?`,
      async () => {
        try {
          await removeUserRole(userId, roleName);
          await fetchUsers();
          toast.success(`Le rôle "${roleName}" a été retiré avec succès`);
        } catch (error) {
          console.error("Error removing role:", error);
          toast.error(error.message || `Erreur lors du retrait du rôle`);
        }
      },
      {
        loading: "Retrait du rôle en cours...",
        success: `Le rôle a été retiré`,
        error: `Erreur lors du retrait du rôle`,
      }
    );
  };

  const filteredUsers = users.filter((user) => user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <PageHeader title="Gestion des Utilisateurs" description="Gérez les utilisateurs de votre application" />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} title={stat.title} value={stat.value} icon={stat.icon} loading={loading} />
        ))}
      </div>

      {/* Users Table */}
      <Card title="Liste des Utilisateurs">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredUsers} searchable={true} onSearch={setSearchTerm} searchPlaceholder="Rechercher un utilisateur..." />
        )}
      </Card>
    </div>
  );
}

export default function ProtectedUsersPage() {
  return (
    <AdminRoute>
      <UsersPage />
    </AdminRoute>
  );
}
