import axiosInstance from "../config/axios";

// Get all users
export const getUsers = async () => {
  try {
    const response = await axiosInstance.get("/api/users");
    // Handle different response formats
    if (response.data.data) {
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    console.warn("Unexpected users response format:", response.data);
    return [];
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des utilisateurs" };
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const response = await axiosInstance.delete(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la suppression de l'utilisateur" };
  }
};

// Remove role from user
export const removeUserRole = async (userId, roleName) => {
  try {
    const response = await axiosInstance.delete(`/api/users/${userId}/roles`, {
      data: { role_name: roleName },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors du retrait du rôle" };
  }
};
