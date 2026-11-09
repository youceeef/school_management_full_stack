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
 * Review an account request (approve, reject, suspend, or reactivate).
 *
 * @param {number|string} id
 * @param {'approved'|'rejected'|'suspended'} status
 * @param {string|null} [reason]
 */
export const reviewAccountRequest = async (id, status, reason = null) => {
  try {
    const payload = { status };
    if (reason && reason.trim()) {
      payload.reason = reason.trim();
    }
    const response = await axiosInstance.patch(`/api/account-requests/${id}`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la révision de la demande" };
  }
};

/**
 * Resubmit a previously rejected account application with updated identity/proof (P3.2).
 *
 * @param {FormData} formData
 */
export const resubmitAccountRequest = async (formData) => {
  try {
    const response = await axiosInstance.post("/api/account-requests/resubmit", formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la nouvelle soumission de la demande" };
  }
};

/**
 * Fetch a blob preview URL for an applicant's proof document.
 * Returns an object URL (e.g. blob:...) that can be rendered in an iframe or image tag.
 *
 * @param {number|string} id
 */
export const previewProofDocument = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/account-requests/${id}/proof/preview`, {
      responseType: "blob",
    });
    return {
      blob: response.data,
      url: URL.createObjectURL(response.data),
      contentType: response.headers["content-type"],
    };
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors du chargement de l'aperçu du justificatif" };
  }
};

/**
 * Trigger an authenticated download for an applicant's proof document.
 *
 * @param {number|string} id
 * @param {string} fileName
 */
export const downloadProofDocument = async (id, fileName = "justificatif.pdf") => {
  try {
    const response = await axiosInstance.get(`/api/account-requests/${id}/proof/download`, {
      responseType: "blob",
    });
    const blobUrl = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors du téléchargement du justificatif" };
  }
};

/**
 * Send a test email to verify SMTP configuration and deliverability.
 *
 * @param {string|null} [email]
 */
export const sendTestEmail = async (email = null) => {
  try {
    const payload = email && email.trim() ? { email: email.trim() } : {};
    const response = await axiosInstance.post("/api/account-requests/test-email", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de l'envoi de l'email de test" };
  }
};

