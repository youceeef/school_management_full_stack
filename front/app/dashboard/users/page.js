"use client";

import React, { useState, useEffect } from "react";
import toast from "../../utils/toast";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import { UsersIcon, KeyIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getUsers, removeUserRole } from "../../services/userService";
import AdminRoute from "../../components/AdminRoute";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData || []);
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

  const handleRemoveRole = async (userId, roleName, userName) => {
    toast.confirmDelete(
      `Êtes-vous sûr de vouloir retirer le rôle "${roleName}" de l'utilisateur "${userName}" ?`,
      async () => {
        await removeUserRole(userId, roleName);
        await fetchUsers();
      },
      {
        loading: "Retrait du rôle en cours...",
        success: "Le rôle a été retiré",
        error: "Erreur lors du retrait du rôle",
      }
    );
  };

  const columns = [
    {
      header: "ID",
      accessor: "id",
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
          #{row.id}
        </span>
      ),
    },
    {
      header: "Utilisateur",
      accessor: "first_name",
      render: (row) => (
        <div>
          <span className="block font-medium text-slate-900 dark:text-slate-100">
            {row.first_name} {row.last_name}
          </span>
        </div>
      ),
    },
    {
      header: "Adresse e-mail",
      accessor: "email",
      render: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">{row.email}</span>
      ),
    },
    {
      header: "Rôles attribués",
      accessor: "roles",
      render: (row) =>
        !row.roles || row.roles.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-slate-500">Aucun rôle</span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {row.roles.map((role, idx) => {
              const roleName = typeof role === "object" ? role.name : role;
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                >
                  <span>{roleName}</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveRole(row.id, roleName, `${row.first_name} ${row.last_name}`)
                    }
                    className="p-0.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Retirer ce rôle"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
        ),
    },
  ];

  const adminCount = users.filter(
    (u) =>
      u.roles &&
      u.roles.some((role) => (typeof role === "object" ? role.name === "admin" : role === "admin"))
  ).length;

  const statsCards = [
    {
      title: "Comptes enregistrés",
      value: users.length.toLocaleString("fr-FR"),
      icon: UsersIcon,
    },
    {
      title: "Administrateurs",
      value: adminCount.toLocaleString("fr-FR"),
      icon: KeyIcon,
    },
    {
      title: "Dernières inscriptions",
      value: users.slice(-5).length.toLocaleString("fr-FR"),
      icon: SparklesIcon,
    },
  ];

  const filteredUsers = users.filter(
    (u) =>
      (u.first_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.last_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Annuaire des utilisateurs"
        description="Consultez les comptes inscrits et supervisez leurs rôles institutionnels."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            loading={loading}
          />
        ))}
      </div>

      <Card title="Comptes utilisateurs" subtitle="Liste complète des membres de la plateforme">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredUsers}
            searchable
            onSearch={setSearchTerm}
            searchPlaceholder="Rechercher par nom, prénom ou adresse e-mail..."
          />
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
