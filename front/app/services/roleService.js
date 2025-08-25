import axiosInstance from "../config/axios";

// Get all roles
export const getRoles = async () => {
  try {
    const response = await axiosInstance.get("/api/roles");
    if (response.data.roles) {
      return response.data.roles;
    } else if (response.data.data) {
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    console.warn("Unexpected roles response format:", response.data);
    return [];
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des rôles" };
  }
};

// Create new role
export const createRole = async (roleData) => {
  try {
    const response = await axiosInstance.post("/api/roles", roleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la création du rôle" };
  }
};

// Update role
export const updateRole = async (roleId, roleData) => {
  try {
    const response = await axiosInstance.put(`/api/roles/${roleId}`, roleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la mise à jour du rôle" };
  }
};

// Delete role
export const deleteRole = async (roleId) => {
  try {
    const response = await axiosInstance.delete(`/api/roles/${roleId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la suppression du rôle" };
  }
};

// Assign permissions to role
export const assignPermissionsToRole = async (roleId, permissions) => {
  try {
    const response = await axiosInstance.post(`/api/roles/${roleId}/permissions`, { permissions });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de l'assignation des permissions" };
  }
};

// Assign role to user
export const assignRoleToUser = async (userId, roleId) => {
  try {
    const response = await axiosInstance.post(`/api/roles/users/${userId}/roles`, { roleId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de l'assignation du rôle" };
  }
};

// Assign role to user by name
export const assignRoleToUserByName = async (userId, roleName) => {
  try {
    const response = await axiosInstance.post(`/api/roles/users/${userId}/`, {
      role_name: roleName,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de l'assignation du rôle" };
  }
};
