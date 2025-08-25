"use client";

import React, { useState, useEffect } from "react";
import toast from "../../utils/toast";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
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

  // Fetch permissions
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const permissionsData = await getPermissions();
      setPermissions(permissionsData);
    } catch (error) {
      toast.error("Erreur lors du chargement des permissions");
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const rolesData = await getRoles();
      setRoles(rolesData);
    } catch (error) {
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
      fetchPermissions(); // Refresh permissions to update the roles list
    } catch (error) {
      console.error("Error assigning permission to role:", error);
      toast.error("Erreur lors de l'assignation de la permission");
    } finally {
      setIsAssigning(false);
    }
  };

  // Stats cards data
  const statsCards = [
    {
      title: "Total des permissions",
      value: permissions.length.toString(),
      icon: ShieldCheckIcon,
    },
    {
      title: "Total des rôles",
      value: roles.length.toString(),
      icon: UserGroupIcon,
    },
  ];

  // Filter permissions based on search term
  const filteredPermissions = permissions.filter((permission) => permission.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Gestion des Permissions" description="Gérez les permissions de votre application" />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} title={stat.title} value={stat.value} icon={stat.icon} loading={loading} />
        ))}
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Liste des Permissions</h1>
          <div className="w-64">
            <input type="text" placeholder="Rechercher une permission..." className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border focus:ring-2 focus:ring-blue-500 dark:bg-dark-card dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                {filteredPermissions.length > 0 ? (
                  filteredPermissions.map((permission) => (
                    <tr key={permission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{permission.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignToRole(permission, e.target.value);
                              e.target.value = ""; // Reset select after assignment
                            }
                          }}
                          disabled={loading || isAssigning}
                        >
                          <option value="" className="dark:text-gray-300">
                            {isAssigning ? "Assignation..." : "Assigner à un rôle"}
                          </option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id} className="dark:text-white">
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Aucune permission n&apos;est disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
