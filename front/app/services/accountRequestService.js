import axiosInstance from "../config/axios";

/**
 * Fetch paginated account requests with optional filters.
 *
 * @param {Object} params
 * @param {string} [params.status] - 'all' | 'pending' | 'approved' | 'rejected' | 'suspended'
 * @param {string} [params.requested_role] - 'enseignant' | 'responsable_laboratoire'
 * @param {string} [params.search] - search string
 * @param {string} [params.date_from] - 'YYYY-MM-DD'
 * @param {string} [params.date_to] - 'YYYY-MM-DD'
 * @param {number} [params.page=1]
 * @param {number} [params.per_page=15]
 * @param {string} [params.sort_by]
 * @param {string} [params.sort_direction]
 */
export const getAccountRequests = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/api/account-requests", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des demandes de compte" };
  }
};

/**
 * Fetch summary counts for approval requests.
 */
export const getAccountRequestCounts = async () => {
  try {
    const response = await axiosInstance.get("/api/account-requests/counts");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des statistiques" };
  }
};

/**
 * Fetch details of a single account request.
 *
 * @param {number|string} id
 */
export const getAccountRequestById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/account-requests/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération de la demande" };
  }
};

/**
 * Review an account request (approve or reject).
 *
 * @param {number|string} id
 * @param {'approved'|'rejected'} status
 */
export const reviewAccountRequest = async (id, status) => {
  try {
    const response = await axiosInstance.patch(`/api/account-requests/${id}`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la révision de la demande" };
  }
};
