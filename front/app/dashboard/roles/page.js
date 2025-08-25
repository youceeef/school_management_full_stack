"use client";

import React, { useState, useEffect } from "react";
import toast from "../../utils/toast";
import { Card, DataTable, StatsCard, PageHeader } from "../../components/ui";
import { UserGroupIcon, ShieldCheckIcon, UsersIcon } from "@heroicons/react/24/outline";
import { getRoles, createRole, updateRole, deleteRole, assignRoleToUserByName, assignPermissionsToRole, assignRoleToUser } from "../../services/roleService";
import { getPermissions } from "../../services/permissionService";
import { getUsers } from "../../services/userService";
import ProtectedRoute from "../../components/ProtectedRoute";
import { PERMISSIONS } from "../../constants/permissions";

export default function ProtectedRolesPage() {
  return (
    <ProtectedRoute 
      permissions={[PERMISSIONS.LIST_ROLES, PERMISSIONS.LIST_PERMISSIONS]} 
      matchType="all"
    >
      <RolesPage />
    </ProtectedRoute>
  );
}

function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    selectedPermissions: [],
    userId: "",
  });
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRoleName, setAssignRoleName] = useState("");

  // Fetch roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const rolesData = await getRoles();
      setRoles(rolesData);
    } catch (error) {
      toast.error("Erreur lors du chargement des rôles");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions
  const fetchPermissions = async () => {
    try {
      const permissionsData = await getPermissions();
      setPermissions(permissionsData);
    } catch (error) {
      toast.error("Erreur lors du chargement des permissions");
      setPermissions([]);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      toast.error("Erreur lors du chargement des utilisateurs");
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchUsers();
  }, []);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSend = {
        role_name: formData.name,
        permissions: formData.selectedPermissions,
      };

      // Only include user_id if one is selected
      if (formData.userId) {
        dataToSend.user_id = formData.userId;
      }

      await createRole(dataToSend);
      toast.success("Rôle créé avec succès");
      setIsModalOpen(false);
      setFormData({ name: "", selectedPermissions: [], userId: "" });
      fetchRoles();
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error("Erreur lors de la création du rôle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (roleId) => {
    try {
      const role = roles.find((r) => r.id === roleId);
      const dataToSend = {};

      // Only include name if it has changed
      if (formData.name !== role.name) {
        dataToSend.name = formData.name;
      }

      // Compare permissions arrays and only include if changed
      const currentPermissions = role.permissions || [];
      const newPermissions = formData.selectedPermissions;

      if (JSON.stringify(currentPermissions.sort()) !== JSON.stringify(newPermissions.sort())) {
        dataToSend.permissions = newPermissions;
      }

      // Only send request if there are changes
      if (Object.keys(dataToSend).length > 0) {
        await updateRole(roleId, dataToSend);
        toast.success("Rôle mis à jour avec succès");
        fetchRoles();
      }

      setIsModalOpen(false);
      setSelectedRole(null);
      setFormData({ name: "", selectedPermissions: [], userId: "" });
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Erreur lors de la mise à jour du rôle");
    }
  };

  const handleDeleteRole = async (roleId) => {
    const roleToDelete = roles.find((r) => r.id === roleId);

    toast.confirmDelete(
      `Êtes-vous sûr de vouloir supprimer le rôle "${roleToDelete.name}" ?`,
      async () => {
        try {
          await deleteRole(roleId);
          await fetchRoles();
          toast.success(`Le rôle ${roleToDelete.name} a été supprimé`);
        } catch (error) {
          console.error("Error deleting role:", error);
          toast.error(`Erreur lors de la suppression du rôle ${roleToDelete.name}`);
        }
      },
      {
        loading: "Suppression du rôle en cours...",
        success: `Le rôle ${roleToDelete.name} a été supprimé`,
        error: `Erreur lors de la suppression du rôle ${roleToDelete.name}`,
      }
    );
  };

  const handleAssignPermissions = async (roleId, permissions) => {
    try {
      await assignPermissionsToRole(roleId, permissions);
      toast.success("Permissions assignées avec succès");
      fetchRoles();
    } catch (error) {
      console.error("Error assigning permissions:", error);
      toast.error("Erreur lors de l'assignation des permissions");
    }
  };

  const handleAssignRoleToUser = async (userId, roleId) => {
    try {
      await assignRoleToUser(userId, roleId);
      toast.success("Rôle assigné avec succès");
      fetchUsers();
    } catch (error) {
      console.error("Error assigning role to user:", error);
      toast.error("Erreur lors de l'assignation du rôle");
    }
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      selectedPermissions: Array.isArray(role.permissions) ? role.permissions : [],
      userId: "",
    });
    setIsModalOpen(true);
  };

  const handleAssignRoleToUserUI = async () => {
    if (!assignUserId || !assignRoleName) {
      toast.error("Veuillez sélectionner un utilisateur et un rôle.");
      return;
    }
    try {
      await assignRoleToUserByName(assignUserId, assignRoleName);
      toast.success("Rôle assigné avec succès");
      fetchUsers();
    } catch (error) {
      console.error("Error assigning role to user:", error);
      toast.error("Erreur lors de l'assignation du rôle");
    }
  };

  // Stats cards data
  const statsCards = [
    {
      title: "Total des rôles",
      value: roles.length.toString(),
      icon: UserGroupIcon,
    },
    {
      title: "Total des permissions",
      value: permissions.length.toString(),
      icon: ShieldCheckIcon,
    },
    {
      title: "Utilisateurs",
      value: users.length.toString(),
      icon: UsersIcon,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} title={stat.title} value={stat.value} icon={stat.icon} loading={loading} />
        ))}
      </div>

      {/* Assigner un rôle à un utilisateur */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col items-center mb-4 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Assigner un rôle à un utilisateur</h2>
          <p className="text-gray-600">Sélectionnez un utilisateur et un rôle à lui attribuer</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-end max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Utilisateur</label>
            <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">Sélectionner un utilisateur</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
            <select value={assignRoleName} onChange={(e) => setAssignRoleName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">Sélectionner un rôle</option>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleAssignRoleToUserUI} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 min-w-[120px] w-full md:w-auto" disabled={!assignUserId || !assignRoleName}>
            Assigner
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des Rôles</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" disabled={loading}>
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ajout...
              </>
            ) : (
              "Nouveau Rôle"
            )}
          </button>
        </div>

        {/* Liste des rôles */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.length > 0 ? (
              roles.map((role) => (
                <div key={`role-${role.id}`} className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-4 rounded-lg shadow hover:border-gray-300 dark:hover:border-dark-border/70 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{role.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditRole(role)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" disabled={loading}>
                        ✏️
                      </button>
                      <button onClick={() => handleDeleteRole(role.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" disabled={loading}>
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-200">Permissions</h4>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions && role.permissions.length > 0 ? (
                        role.permissions.map((permission, index) => (
                          <span key={`role-${role.id}-permission-${permission}-${index}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {permission}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">Aucune permission</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">Aucun rôle n&apos;est disponible</div>
            )}
          </div>
        )}
      </div>

      {/* Modal pour créer/éditer un rôle */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{selectedRole ? "Modifier le Rôle" : "Nouveau Rôle"}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedRole) {
                  handleUpdateRole(selectedRole.id);
                } else {
                  handleCreateRole(e);
                }
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="role-name">
                  Nom
                </label>
                <input id="role-name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded" required />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Permissions</label>
                <div className="max-h-48 overflow-y-auto border rounded p-2">
                  {permissions.map((permission) => (
                    <div key={`modal-permission-${permission.id || permission.name || permission}`} className="flex items-center gap-2 p-1">
                      <input
                        type="checkbox"
                        id={`modal-permission-${permission.id || permission.name || permission}`}
                        checked={formData.selectedPermissions.includes(permission.name || permission)}
                        onChange={(e) => {
                          const permName = permission.name || permission;
                          const newPermissions = e.target.checked ? [...formData.selectedPermissions, permName] : formData.selectedPermissions.filter((p) => p !== permName);
                          setFormData({ ...formData, selectedPermissions: newPermissions });
                        }}
                      />
                      <label htmlFor={`modal-permission-${permission.id || permission.name || permission}`}>{permission.name || permission}</label>
                    </div>
                  ))}
                </div>
              </div>

              {!selectedRole && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Assigner à un utilisateur (optionnel)</label>
                  <select value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })} className="w-full p-2 border rounded">
                    <option value="">Sélectionner un utilisateur</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedRole(null);
                    setFormData({ name: "", selectedPermissions: [], userId: "" });
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" disabled={loading || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {selectedRole ? "Mise à jour..." : "Création..."}
                    </>
                  ) : selectedRole ? (
                    "Mettre à jour"
                  ) : (
                    "Créer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
