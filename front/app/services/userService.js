import axiosInstance from "../config/axios";

// Get a bounded, paginated user list.
export const getUsers = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/api/users", { params });
    if (Array.isArray(response.data?.data)) {
      return response.data;
    }
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: response.data.length,
          total: response.data.length,
          from: response.data.length ? 1 : null,
          to: response.data.length || null,
          counts: { total: response.data.length, admins: 0, pending: 0 },
        },
        links: { first: null, last: null, prev: null, next: null },
      };
    }
    console.warn("Unexpected users response format:", response.data);
    return { data: [], meta: null, links: null };
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

export const reviewUserApproval = async (userId, status) => {
  try {
    const response = await axiosInstance.patch(`/api/users/${userId}/approval`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la révision du compte" };
  }
};
