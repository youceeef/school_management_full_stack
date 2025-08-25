import axiosInstance from "../config/axios";

// Get all permissions
export const getPermissions = async () => {
  try {
    const response = await axiosInstance.get("/api/permissions");
    if (response.data.permissions) {
      return response.data.permissions;
    } else if (response.data.data) {
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    console.warn("Unexpected permissions response format:", response.data);
    return [];
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des permissions" };
  }
};

// Assign permission to role
export const assignPermissionToRole = async (roleId, permissions) => {
  try {
    const response = await axiosInstance.post(`/api/roles/${roleId}/permissions`, {
      permissions: Array.isArray(permissions) ? permissions : [permissions],
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de l'assignation de la permission" };
  }
};
