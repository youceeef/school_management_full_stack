"use client";

import React, { useState, useEffect } from "react";
import toast from "../../utils/toast";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import LoadingSpinner from "../../components/LoadingSpinner";
import { ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { getPermissions, assignPermissionToRole } from "../../services/permissionService";
import { getRoles } from "../../services/roleService";
import ProtectedRoute from "../../components/ProtectedRoute";
import { PERMISSIONS } from "../../constants/permissions";

export default function PermissionsPage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.LIST_PERMISSIONS}>
      <PermissionsPageContent />
    </ProtectedRoute>
  );
}

function PermissionsPageContent() {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const permissionsData = await getPermissions();
      setPermissions(permissionsData || []);
    } catch {
      toast.error("Erreur lors du chargement des permissions");
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const rolesData = await getRoles();
      setRoles(rolesData || []);
    } catch {
      toast.error("Erreur lors du chargement des rôles");
      setRoles([]);
    }
  };

  useEffect(() => {
    fetchPermissions();
    fetchRoles();
  }, []);

  const handleAssignToRole = async (permission, roleId) => {
    setIsAssigning(true);
    try {
      await assignPermissionToRole(roleId, [permission.name]);
      toast.success("Permission assignée avec succès");
      fetchRoles();
      fetchPermissions();
    } catch (error) {
      console.error("Error assigning permission to role:", error);
      toast.error("Erreur lors de l'assignation de la permission");
    } finally {
      setIsAssigning(false);
    }
  };

  const statsCards = [
    {
      title: "Permissions définies",
      value: permissions.length.toLocaleString("fr-FR"),
      icon: ShieldCheckIcon,
    },
    {
      title: "Rôles actifs",
      value: roles.length.toLocaleString("fr-FR"),
      icon: UserGroupIcon,
    },
  ];

  const filteredPermissions = permissions.filter((permission) =>
    (permission.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: "Permission",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-4 h-4" />
          </div>
          <span className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
            {row.name}
          </span>
        </div>
      ),
    },
    {
      header: "Rattacher à un rôle",
      accessor: "assign",
      render: (row) => (
        <div className="max-w-xs">
          <select
            className="w-full py-1.5 px-3 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
            onChange={(e) => {
              if (e.target.value) {
                handleAssignToRole(row, e.target.value);
                e.target.value = "";
              }
            }}
            disabled={loading || isAssigning}
          >
            <option value="">
              {isAssigning ? "Assignation en cours..." : "Sélectionner un rôle..."}
            </option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Référentiel des permissions"
        description="Consultez les permissions atomiques du système et rattachez-les aux rôles existants."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <Card title="Permissions du système" subtitle="Contrôle d’accès granulaire (RBAC)">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredPermissions}
            searchable
            onSearch={setSearchTerm}
            searchPlaceholder="Rechercher une permission..."
          />
        )}
      </Card>
    </div>
  );
}
