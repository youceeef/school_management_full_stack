import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const changePassword = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/api/change-password`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${Cookies.get('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const resendVerificationEmail = async (email) => {
  try {
    const normalizedEmail = String(email || '').trim();
    const response = await axios.post(`${API_URL}/api/email/verification-notification`, { email: normalizedEmail }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw { ...(error.response?.data || {}), status: error.response?.status };
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/api/forgot-password`, { email }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const resetPassword = async ({ token, email, password, password_confirmation }) => {
  try {
    const response = await axios.post(`${API_URL}/api/reset-password`, {
      token,
      email,
      password,
      password_confirmation
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const twoFactorChallenge = async ({ challenge_token, code, recovery_code }) => {
  try {
    const response = await axios.post(`${API_URL}/api/two-factor-challenge`, {
      challenge_token,
      code,
      recovery_code,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw { ...(error.response?.data || {}), status: error.response?.status };
  }
};

export const enableTwoFactor = async () => {
  try {
    const response = await axios.post(`${API_URL}/api/user/two-factor-authentication`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${Cookies.get('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw { ...(error.response?.data || {}), status: error.response?.status };
  }
};

export const confirmTwoFactor = async (code) => {
  try {
    const response = await axios.post(`${API_URL}/api/user/two-factor-authentication/confirm`, { code }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${Cookies.get('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw { ...(error.response?.data || {}), status: error.response?.status };
  }
};

export const getTwoFactorRecoveryCodes = async (password) => {
  try {
    const response = await axios.post(`${API_URL}/api/user/two-factor-authentication/recovery-codes`, { password }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${Cookies.get('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw { ...(error.response?.data || {}), status: error.response?.status };
  }
};

export const regenerateTwoFactorRecoveryCodes = async (password) => {
  try {
    const response = await axios.post(`${API_URL}/api/user/two-factor-authentication/recovery-codes/regenerate`, { password }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${Cookies.get('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw { ...(error.response?.data || {}), status: error.response?.status };
  }
};

export const disableTwoFactor = async (password) => {
  try {
    const response = await axios.delete(`${API_URL}/api/user/two-factor-authentication`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${Cookies.get('token')}`
      },
      data: { password }
    });
    return response.data;
  } catch (error) {
    throw { ...(error.response?.data || {}), status: error.response?.status };
  }
};
 