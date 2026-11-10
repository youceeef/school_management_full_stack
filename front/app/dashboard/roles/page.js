"use client";

import React, { useState, useEffect } from "react";
import toast from "../../utils/toast";
import { Card, StatsCard, PageHeader } from "../../components/ui";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  UserGroupIcon,
  ShieldCheckIcon,
  UsersIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRoleToUserByName,
} from "../../services/roleService";
import { getPermissions } from "../../services/permissionService";
import { getUsers } from "../../services/userService";
import ProtectedRoute from "../../components/ProtectedRoute";
import { PERMISSIONS } from "../../constants/permissions";
import { useLanguage } from "../../context/LanguageContext";
import { getRoleLabel } from "../../utils/roleLabels";

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
  const { tr } = useLanguage();
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
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

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const rolesData = await getRoles();
      setRoles(rolesData || []);
    } catch {
      toast.error("Erreur lors du chargement des rôles");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const permissionsData = await getPermissions();
      setPermissions(permissionsData || []);
    } catch {
      toast.error("Erreur lors du chargement des permissions");
      setPermissions([]);
    }
  };

  const fetchUsers = async (search = "") => {
    try {
      const usersResponse = await getUsers({
        per_page: 50,
        search: search.trim() || undefined,
        sort_by: "name",
        sort_direction: "asc",
      });
      setUsers(usersResponse.data || []);
      setUsersTotal(usersResponse.meta?.counts?.total || usersResponse.meta?.total || 0);
    } catch {
      toast.error("Erreur lors du chargement des utilisateurs");
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(userSearch), 350);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSend = {
        role_name: formData.name,
        permissions: formData.selectedPermissions,
      };

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

      if (formData.name !== role.name) {
        dataToSend.name = formData.name;
      }

      const currentPermissions = role.permissions || [];
      const newPermissions = formData.selectedPermissions;

      if (
        JSON.stringify([...currentPermissions].sort()) !==
        JSON.stringify([...newPermissions].sort())
      ) {
        dataToSend.permissions = newPermissions;
      }

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
    if (!roleToDelete) return;

    toast.confirmDelete(
      `Êtes-vous sûr de vouloir supprimer le rôle "${getRoleLabel(roleToDelete.name, tr)}" ?`,
      async () => {
        await deleteRole(roleId);
        await fetchRoles();
      },
      {
        loading: "Suppression du rôle en cours...",
        success: `Le rôle ${roleToDelete.name} a été supprimé`,
        error: `Erreur lors de la suppression du rôle ${roleToDelete.name}`,
      }
    );
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
      fetchUsers(userSearch);
    } catch (error) {
      console.error("Error assigning role to user:", error);
      toast.error("Erreur lors de l'assignation du rôle");
    }
  };

  const statsCards = [
    {
      title: "Rôles configurés",
      value: roles.length.toLocaleString("fr-FR"),
      icon: UserGroupIcon,
    },
    {
      title: "Permissions système",
      value: permissions.length.toLocaleString("fr-FR"),
      icon: ShieldCheckIcon,
    },
    {
      title: "Utilisateurs actifs",
      value: usersTotal.toLocaleString("fr-FR"),
      icon: UsersIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rôles et habilitations"
        description="Configurez les profils d’accès et attribuez les rôles aux membres de l’établissement."
        actions={[
          {
            children: "Nouveau rôle",
            icon: PlusIcon,
            variant: "primary",
            onClick: () => {
              setSelectedRole(null);
              setFormData({ name: "", selectedPermissions: [], userId: "" });
              setIsModalOpen(true);
            },
            disabled: loading,
          },
        ]}
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

      <Card
        title="Attribuer un rôle à un utilisateur"
        subtitle="Associez rapidement un compte existant à un profil d’habilitation"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Utilisateur
            </label>
            <input
              type="search"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="mb-2 w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
            />
            <select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
            >
              <option value="">Sélectionner un utilisateur</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Rôle cible
            </label>
            <select
              value={assignRoleName}
              onChange={(e) => setAssignRoleName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
            >
              <option value="">Sélectionner un rôle</option>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {getRoleLabel(role.name, tr)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Button
              variant="primary"
              onClick={handleAssignRoleToUserUI}
              disabled={!assignUserId || !assignRoleName}
              className="w-full"
            >
              Attribuer le rôle
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Matrice des rôles" subtitle="Permissions associées à chaque rôle">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.length > 0 ? (
              roles.map((role) => (
                <div
                  key={`role-${role.id}`}
                  className="bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                      <div>
                        <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white capitalize">
                          {getRoleLabel(role.name, tr)}
                        </h3>
                        <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                          {(role.permissions || []).length} permission
                          {(role.permissions || []).length > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditRole(role)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                          disabled={loading}
                          title="Modifier ce rôle"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                          disabled={loading}
                          title="Supprimer ce rôle"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Permissions actives
                      </h4>
                      {role.permissions && role.permissions.length > 0 ? (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {role.permissions.join(" · ")}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Aucune permission assignée
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                Aucun rôle n&apos;est disponible
              </div>
            )}
          </div>
        )}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                {selectedRole ? "Modifier le rôle" : "Créer un nouveau rôle"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedRole(null);
                  setFormData({ name: "", selectedPermissions: [], userId: "" });
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedRole) {
                  handleUpdateRole(selectedRole.id);
                } else {
                  handleCreateRole(e);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  htmlFor="role-name"
                >
                  Intitulé du rôle
                </label>
                <input
                  id="role-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Permissions associées
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-1 bg-slate-50/50 dark:bg-slate-950/40">
                  {permissions.map((permission) => {
                    const permKey = permission.id || permission.name || permission;
                    const permName = permission.name || permission;
                    return (
                      <label
                        key={`modal-permission-${permKey}`}
                        className="flex items-center gap-2.5 p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 cursor-pointer text-xs text-slate-700 dark:text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedPermissions.includes(permName)}
                          onChange={(e) => {
                            const newPermissions = e.target.checked
                              ? [...formData.selectedPermissions, permName]
                              : formData.selectedPermissions.filter((p) => p !== permName);
                            setFormData({ ...formData, selectedPermissions: newPermissions });
                          }}
                          className="rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500"
                        />
                        <span>{permName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {!selectedRole && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Assigner immédiatement à un utilisateur (optionnel)
                  </label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Sélectionner un utilisateur</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedRole(null);
                    setFormData({ name: "", selectedPermissions: [], userId: "" });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" loading={isSubmitting}>
                  {selectedRole ? "Mettre à jour" : "Créer le rôle"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
